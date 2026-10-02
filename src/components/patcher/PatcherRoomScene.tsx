/**
 * PatcherRoomScene — the WebGL half of the patcher room.
 *
 * A built room rather than a backdrop: panelled walls on a skirting, a coffered
 * ceiling with recessed light coves, a panelled floor with a darker central
 * walkway, and three physical console bays — plinth, tapered pedestal and a
 * swivelling head — that the page's own DOM cards sit inside as their screens.
 * Real perspective camera, a small material palette and one soft-shadow key
 * light. This module is lazily imported so three.js never lands in another
 * page's bundle.
 *
 * Every frame it drives the page's station cards: each card is ordinary DOM in
 * the page's own tree, positioned by projecting its console anchor through the
 * live camera and scaling it by true perspective, so the UI stays crisp,
 * clickable and keyboard-accessible while the room around it is genuinely 3D.
 *
 * The room follows the page theme: dark and low-key by default, the same
 * architecture in cool daylight greys in light mode. Only material values and
 * fill levels change — geometry, camera and station lighting are identical.
 */
import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  EYE,
  FADE_END,
  FADE_START,
  FOV,
  REF_DIST,
  ROOM,
  ROOM_CAM,
  STATIONS,
  TONE,
  bearingOf,
  nearestStation,
  normalise,
  type RoomStationId,
  type RoomTone,
} from "./roomLayout";

export type SceneProps = {
  mounts: Record<RoomStationId, RefObject<HTMLDivElement | null>>;
  tones: Record<RoomStationId, RoomTone>;
  reduced: boolean;
  settleRef: RefObject<((id: RoomStationId) => void) | undefined>;
  /** Day (light) theme — the room swaps to its daylight material values. */
  day: boolean;
};

/* ------------------------------------------------------------- dimensions */

/** Metres of console frame around each screen (bezel, face panel, housing). */
const HEAD_PAD = 0.24;
/** The plinth each console stands on. */
const PLINTH = { h: 0.16, w: 1.96, d: 1.56 };
/** Ceiling coves (z positions) — shared by the fixtures and their lights. */
const COVES = [-3.85, -0.35] as const;

/* ------------------------------------------------------------ the palette */

/**
 * One shared material per surface, built for the active theme.
 *
 * Deliberately small: the large architectural surfaces stay matte (high
 * roughness, metalness ~0) so they read as painted board instead of plastic,
 * only trims, consoles and bezels carry a real specular, and the red is a dim
 * emissive accent rather than a glow. Signature:
 * `make(color, roughness, metalness, emissive?, emissiveIntensity?)`.
 */
function useSurfaces(day: boolean) {
  return useMemo(() => {
    const make = (
      color: number,
      roughness: number,
      metalness: number,
      emissive = 0x000000,
      emissiveIntensity = 0
    ) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity });

    const surfaces = {
      /* --- architecture: matte, high roughness, barely any metalness --- */
      wall: make(day ? 0xa8b2c2 : 0x0d0f16, 0.95, 0.02),
      panel: make(day ? 0xb8c1d0 : 0x131722, 0.86, 0.09),
      ceiling: make(day ? 0xc3cad7 : 0x08090e, 0.96, 0),
      floor: make(day ? 0x9aa4b5 : 0x101320, 0.7, 0.14),
      runner: make(day ? 0x8c96a7 : 0x0b0e16, 0.78, 0.08),
      seam: make(day ? 0x6d7785 : 0x04060b, 0.9, 0.05),
      skirt: make(day ? 0x7c8694 : 0x05070c, 0.6, 0.35),
      /* --- metalwork: the only surfaces allowed a real specular --- */
      trim: make(day ? 0x565f6e : 0x1a1f2b, 0.38, 0.85),
      post: make(day ? 0x6b7482 : 0x232a3a, 0.34, 0.9),
      console: make(day ? 0x99a2b1 : 0x1c2230, 0.42, 0.72),
      body: make(day ? 0x828b99 : 0x11151f, 0.55, 0.55),
      bezel: make(day ? 0x2b313c : 0x05070b, 0.5, 0.4),
      screen: make(day ? 0xdfe5ee : 0x020306, 0.92, 0.1),
      /* --- restrained accents: dim emissives, never a neon wash --- */
      accent: make(0x2a0c11, 0.55, 0.2, 0x8f1c26, day ? 0.16 : 0.32),
      cove: make(day ? 0xf4f1e6 : 0x2a2c33, 0.9, 0, day ? 0xfff2d9 : 0x8f96a8, day ? 0.9 : 0.55),
      contact: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: day ? 0.16 : 0.42 }),
    };
    return surfaces;
  }, [day]);
}

/** The shared-material object built by `useSurfaces`. */
type Surfaces = ReturnType<typeof useSurfaces>;


/**
 * Per-station accent materials. The tone (idle / ready / done) comes from the
 * patcher's own state, so each console lights its status strip and indicator in
 * that station's colour — restrained, and only where a real console would have
 * an indicator.
 */
function useAccents(toneKey: string, day: boolean) {
  return useMemo(
    () =>
      toneKey.split("|").map((tone) => {
        const color = new THREE.Color(TONE[tone as RoomTone]);
        const on = tone !== "idle";
        return {
          strip: new THREE.MeshStandardMaterial({
            color: 0x141821,
            roughness: 0.5,
            metalness: 0.35,
            emissive: color,
            emissiveIntensity: on ? 0.95 : day ? 0.2 : 0.35,
          }),
          led: new THREE.MeshStandardMaterial({
            color: 0x0b0d13,
            roughness: 0.35,
            metalness: 0.2,
            emissive: color,
            emissiveIntensity: on ? 1.5 : 0.5,
          }),
        };
      }),
    [toneKey, day]
  );
}

/* ---------------------------------------------------------- the architecture */

/**
 * Panelled floor: a lighter slab, shallow dark seams between large panels, a
 * darker central walking area, and a skirting that carries the wall-base accent
 * line. No glowing grid — the divisions are geometry catching light.
 */
function Floor({ s }: { s: Surfaces }) {
  const { halfW, front, back } = ROOM;
  const midZ = (back + front) / 2;
  const spanZ = back - front;
  const crossZ = [-6.3, -3.7, -1.1, 1.5];
  const alongX = [-2.6, 2.6];
  const skirtH = 0.18;
  const skirtD = 0.16;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, midZ]} material={s.floor} receiveShadow>
        <planeGeometry args={[halfW * 2, spanZ]} />
      </mesh>
      {/* the walking area between the consoles sits a shade darker */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.006, midZ - 0.3]}
        material={s.runner}
        receiveShadow
      >
        <planeGeometry args={[3.4, spanZ - 0.8]} />
      </mesh>
      {crossZ.map((z) => (
        <mesh key={`cross${z}`} position={[0, 0.012, z]} material={s.seam}>
          <boxGeometry args={[halfW * 2 - 0.3, 0.012, 0.05]} />
        </mesh>
      ))}
      {alongX.map((x) => (
        <mesh key={`along${x}`} position={[x, 0.012, midZ]} material={s.seam}>
          <boxGeometry args={[0.05, 0.012, spanZ - 0.3]} />
        </mesh>
      ))}

      {/* skirting — the floor/wall junction, so the walls land on something */}
      <mesh position={[0, skirtH / 2, front + skirtD / 2]} material={s.skirt} receiveShadow>
        <boxGeometry args={[halfW * 2, skirtH, skirtD]} />
      </mesh>
      <mesh position={[0, skirtH / 2, back - skirtD / 2]} material={s.skirt} receiveShadow>
        <boxGeometry args={[halfW * 2, skirtH, skirtD]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={`skirt${side}`}
          position={[side * (halfW - skirtD / 2), skirtH / 2, midZ]}
          material={s.skirt}
          receiveShadow
        >
          <boxGeometry args={[skirtD, skirtH, spanZ]} />
        </mesh>
      ))}

      {/* the accent line: a dim red groove in the skirting, all four walls */}
      <mesh position={[0, skirtH - 0.04, front + skirtD + 0.008]} material={s.accent}>
        <boxGeometry args={[halfW * 2 - 0.8, 0.022, 0.02]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={`accent${side}`}
          position={[side * (halfW - skirtD + 0.008), skirtH - 0.04, midZ]}
          material={s.accent}
        >
          <boxGeometry args={[0.02, 0.022, spanZ - 0.8]} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * The four walls, built up rather than left as planes: a wainscot band with a
 * capping trim, a field of large panels set proud of the wall (the gaps between
 * them read as seams), structural pilasters, and a cornice that closes the
 * wall/ceiling junction.
 */
function Walls({ s }: { s: Surfaces }) {
  const { halfW, front, back, ceil } = ROOM;
  const midZ = (back + front) / 2;
  const spanZ = back - front;
  const rows = [1.78, 2.82];
  const frontCols = [-3.55, -1.2, 1.2, 3.55];
  const sideCols = [-3.25, 0, 3.25];
  const wainH = 1.05;
  const wainY = wainH / 2 + 0.06;
  const trimY = wainH + 0.09;

  return (
    <group>
      {/* --- front wall: the patch station's wall --- */}
      <mesh position={[0, ceil / 2, front]} material={s.wall} receiveShadow>
        <planeGeometry args={[halfW * 2, ceil]} />
      </mesh>
      <mesh position={[0, wainY, front + 0.06]} material={s.panel} receiveShadow>
        <boxGeometry args={[halfW * 2 - 0.36, wainH, 0.12]} />
      </mesh>
      <mesh position={[0, trimY, front + 0.08]} material={s.trim} receiveShadow>
        <boxGeometry args={[halfW * 2 - 0.3, 0.06, 0.16]} />
      </mesh>
      {rows.map((y) =>
        frontCols.map((x) => (
          <mesh key={`f${x}:${y}`} position={[x, y, front + 0.035]} material={s.panel} receiveShadow>
            <boxGeometry args={[2.2, 0.98, 0.07]} />
          </mesh>
        ))
      )}
      {[-2.35, 2.35].map((x) => (
        <mesh
          key={`fp${x}`}
          position={[x, (ceil - 0.3) / 2 + 0.1, front + 0.14]}
          material={s.trim}
          receiveShadow
        >
          <boxGeometry args={[0.26, ceil - 0.3, 0.28]} />
        </mesh>
      ))}
      <mesh position={[0, ceil - 0.09, front + 0.11]} material={s.trim} receiveShadow>
        <boxGeometry args={[halfW * 2, 0.18, 0.22]} />
      </mesh>

      {/* --- side walls: the ROM and apply stations' walls --- */}
      {[-1, 1].map((side) => (
        <group key={`side${side}`}>
          <mesh
            position={[side * halfW, ceil / 2, midZ]}
            rotation={[0, (-side * Math.PI) / 2, 0]}
            material={s.wall}
            receiveShadow
          >
            <planeGeometry args={[spanZ, ceil]} />
          </mesh>
          <mesh
            position={[side * (halfW - 0.06), wainY, midZ]}
            material={s.panel}
            receiveShadow
          >
            <boxGeometry args={[0.12, wainH, spanZ - 0.36]} />
          </mesh>
          <mesh position={[side * (halfW - 0.08), trimY, midZ]} material={s.trim} receiveShadow>
            <boxGeometry args={[0.16, 0.06, spanZ - 0.3]} />
          </mesh>
          {rows.map((y) =>
            sideCols.map((z) => (
              <mesh
                key={`s${z}:${y}`}
                position={[side * (halfW - 0.035), y, midZ + z]}
                material={s.panel}
                receiveShadow
              >
                <boxGeometry args={[0.07, 0.98, 2.9]} />
              </mesh>
            ))
          )}
          <mesh position={[side * (halfW - 0.11), ceil - 0.09, midZ]} material={s.trim} receiveShadow>
            <boxGeometry args={[0.22, 0.18, spanZ]} />
          </mesh>
        </group>
      ))}

      {/* --- back wall, so the room stays closed behind the viewer --- */}
      <mesh position={[0, ceil / 2, back]} rotation={[0, Math.PI, 0]} material={s.wall} receiveShadow>
        <planeGeometry args={[halfW * 2, ceil]} />
      </mesh>
      <mesh position={[0, ceil - 0.09, back - 0.11]} material={s.trim} receiveShadow>
        <boxGeometry args={[halfW * 2, 0.18, 0.22]} />
      </mesh>

      {/* --- corner pilasters: they carry the corners and frame the room --- */}
      {[-1, 1].map((sx) => (
        <group key={`corner${sx}`}>
          <mesh position={[sx * (halfW - 0.18), ceil / 2, front + 0.18]} material={s.panel} receiveShadow>
            <boxGeometry args={[0.36, ceil, 0.36]} />
          </mesh>
          <mesh position={[sx * (halfW - 0.18), ceil / 2, back - 0.18]} material={s.panel} receiveShadow>
            <boxGeometry args={[0.36, ceil, 0.36]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * The ceiling: a grid of structural beams that leaves shallow coffers between
 * them, and a recessed cove fixture in the two central bays — a dark housing
 * with a thin cool strip inside it, i.e. indirect light rather than a bare
 * glowing bar. Its point lights live with the rest of the lighting rig.
 */
function CeilingRig({ s }: { s: Surfaces }) {
  const { halfW, front, back, ceil } = ROOM;
  const midZ = (back + front) / 2;
  const spanZ = back - front;
  const beamsX = [-5.6, -2.1, 1.4];
  const beamsZ = [-2.5, 2.5];

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ceil, midZ]} material={s.ceiling} receiveShadow>
        <planeGeometry args={[halfW * 2, spanZ]} />
      </mesh>
      {beamsX.map((z) => (
        <mesh key={`bx${z}`} position={[0, ceil - 0.12, z]} material={s.trim} receiveShadow>
          <boxGeometry args={[halfW * 2, 0.24, 0.3]} />
        </mesh>
      ))}
      {beamsZ.map((x) => (
        <mesh key={`bz${x}`} position={[x, ceil - 0.12, midZ]} material={s.trim} receiveShadow>
          <boxGeometry args={[0.3, 0.24, spanZ]} />
        </mesh>
      ))}
      {COVES.map((z) => (
        <group key={`cove${z}`}>
          <mesh position={[0, ceil - 0.06, z]} material={s.trim} receiveShadow>
            <boxGeometry args={[2.6, 0.1, 0.34]} />
          </mesh>
          <mesh position={[0, ceil - 0.115, z]} material={s.cove}>
            <boxGeometry args={[2.3, 0.03, 0.16]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* --------------------------------------------------------------- 3D scene */

function RoomScene({ mounts, tones, reduced, settleRef, day }: SceneProps) {
  const size = useThree((s) => s.size);
  const threeCamera = useThree((s) => s.camera);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const surfaces = useSurfaces(day);
  /* The tone prop is a fresh object on every page render, so the accent
     materials key off the tones themselves — they are rebuilt only when a
     station actually changes state. */
  const toneKey = STATIONS.map((st) => tones[st.id]).join("|");
  const accents = useAccents(toneKey, day);

  const heads = useRef<(THREE.Group | null)[]>([]);
  const posts = useRef<(THREE.Mesh | null)[]>([]);
  const collars = useRef<(THREE.Mesh | null)[]>([]);
  const px = useRef<{ w: number; h: number }[]>(STATIONS.map(() => ({ w: 400, h: 330 })));
  const settled = useRef<RoomStationId>(nearestStation(0));

  const scratch = useMemo(() => ({ p: new THREE.Vector3() }), []);

  /* The pedestal: a four-sided prism with its origin at the base, so the render
     loop only has to stretch it up to the underside of the console. */
  const postGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.17, 0.3, 1, 4, 1);
    g.translate(0, 0.5, 0);
    g.rotateY(Math.PI / 4);
    return g;
  }, []);

  /* Everything built here is ours to release when the room goes away. */
  useEffect(
    () => () => {
      Object.values(surfaces).forEach((material) => material.dispose());
    },
    [surfaces]
  );
  useEffect(
    () => () => {
      accents.forEach((accent) => {
        accent.strip.dispose();
        accent.led.dispose();
      });
    },
    [accents]
  );
  useEffect(() => () => postGeo.dispose(), [postGeo]);

  /* The console is sized from the real card, so the 3D frame and the HTML screen
     coincide exactly at every distance. */
  const measure = useCallback(() => {
    for (let i = 0; i < STATIONS.length; i++) {
      const el = mounts[STATIONS[i].id]?.current;
      if (!el) continue;
      px.current[i] = { w: el.offsetWidth || 400, h: el.offsetHeight || 330 };
    }
  }, [mounts]);

  useEffect(() => {
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => measure()) : null;
    const nodes = STATIONS.map((s) => mounts[s.id]?.current).filter(Boolean) as HTMLElement[];
    nodes.forEach((n) => ro?.observe(n));
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, mounts]);

  /* Grab the live camera once, through a ref, so the render loop can drive it
     without the linter treating the value as immutable React state. Field of
     view, near/far and the eye position come from the Canvas camera prop. */
  useEffect(() => {
    cameraRef.current = threeCamera as THREE.PerspectiveCamera;
  }, [threeCamera]);

  /* Resolve the page's DOM nodes once. The render loop then only ever writes to
     these local elements, never back into props. */
  const els = useRef<(HTMLElement | null)[]>(STATIONS.map(() => null));
  useEffect(() => {
    els.current = STATIONS.map((s) => mounts[s.id]?.current ?? null);
  }, [mounts]);

  useFrame((_, dt) => {
    /* --- camera: damped yaw, fixed position, no auto-rotation --- */
    const cam = cameraRef.current;
    if (!cam) return;
    const step = reduced ? 1 : 1 - Math.pow(0.0016, Math.min(dt, 0.05));
    ROOM_CAM.yaw += (ROOM_CAM.target - ROOM_CAM.yaw) * step;
    if (Math.abs(ROOM_CAM.target - ROOM_CAM.yaw) < 0.0008) {
      ROOM_CAM.yaw = ROOM_CAM.target;
    }
    /* Yaw only: the viewer never moves, they just turn their head. The pitch and
       roll are pinned to 0 every frame: R3F aims any camera created without an
       explicit `rotation` at the world origin (see the `camera` prop below), and
       a leftover down-pitch would push every projected station above the
       viewport and leave the DOM cards stranded outside the room. */
    cam.rotation.order = "YXZ";
    cam.rotation.set(0, ROOM_CAM.yaw, 0);
    cam.position.set(EYE.x, EYE.y, EYE.z);
    cam.updateMatrixWorld();

    /* --- one pass per station: build the console, then drive its DOM mount --- */
    const focal = size.height / 2 / Math.tan((FOV * Math.PI) / 360);

    for (let i = 0; i < STATIONS.length; i++) {
      const st = STATIONS[i];
      const el = els.current[i];

      scratch.p.set(st.anchor[0], st.anchor[1], st.anchor[2]);
      const dist = scratch.p.distanceTo(EYE);
      const worldW = (px.current[i].w * REF_DIST) / focal;
      const worldH = (px.current[i].h * REF_DIST) / focal;

      /* The console head — housing, face panel, bezel, screen recess, status
         strip — swivels to face the viewer, so the screen stays square-on and
         the HTML overlay lines up pixel-for-pixel with the frame behind it. */
      const head = heads.current[i];
      if (head) {
        head.position.set(st.anchor[0], st.anchor[1], st.anchor[2]);
        head.rotation.y = ROOM_CAM.yaw;
        head.scale.set(worldW + HEAD_PAD, worldH + HEAD_PAD, 1);
      }
      /* The pedestal is bolted to the room, so it keeps its own parallax: it
         stretches to meet the console's underside, and the collar rides up
         with it so the swivel joint always closes. */
      const legH = Math.max(0.35, st.anchor[1] - (worldH + HEAD_PAD) / 2);
      const post = posts.current[i];
      if (post) post.scale.y = Math.max(0.16, legH - PLINTH.h - 0.09);
      const collar = collars.current[i];
      if (collar) collar.position.y = legH - 0.08;

      if (!el) continue;

      scratch.p.project(cam);
      const behind = scratch.p.z > 1;
      const off = Math.abs(normalise(bearingOf(st.id) - ROOM_CAM.yaw));
      let opacity = behind || off >= FADE_END ? 0 : (FADE_END - off) / (FADE_END - FADE_START);
      opacity = Math.min(1, Math.max(0, opacity));

      // Pure perspective scaling: the DOM card shrinks and grows exactly like a
      // real plane at that depth would, which is what sells the distance.
      let k = REF_DIST / dist;
      k = Math.max(0.28, Math.min(k, (size.height * 0.92) / px.current[i].h));

      const x = (scratch.p.x * 0.5 + 0.5) * size.width;
      const y = (-scratch.p.y * 0.5 + 0.5) * size.height;

      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${k.toFixed(4)})`;
      el.style.opacity = opacity.toFixed(2);
      el.style.visibility = opacity < 0.02 ? "hidden" : "visible";
      // A peripheral glimpse must never intercept clicks meant for the
      // station you are actually looking at.
      el.dataset.dim = opacity < 0.5 ? "true" : "false";
      el.style.zIndex = String(500 - Math.round(dist * 10));
    }

    if (ROOM_CAM.yaw === ROOM_CAM.target) {
      const near = nearestStation(ROOM_CAM.yaw);
      if (near !== settled.current) {
        settled.current = near;
        settleRef.current?.(near);
      }
    }
  });

  return (
    <>
      {/* ---- lighting hierarchy: soft fill, one key with a soft shadow, cool
           ceiling coves, and a small pool of light per console so the stations
           are what the eye lands on. ---- */}
      <ambientLight intensity={day ? 0.5 : 0.3} color={day ? "#c9d3e6" : "#93a4cc"} />
      <hemisphereLight
        args={[day ? "#e2e8f2" : "#48557a", day ? "#aeb7c6" : "#08090d", day ? 0.8 : 0.5]}
      />
      <directionalLight
        position={[-3.6, 4.2, -1.1]}
        intensity={day ? 1.3 : 1.7}
        color={day ? "#eef2f8" : "#c6d2ea"}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={0.5}
        shadow-camera-far={26}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      >
        {/* aims the key at the front wall, so the room reads as lit from the
            front-left and the consoles pick up form rather than flat light */}
        <object3D attach="target" position={[0, 1.3, ROOM.front]} />
      </directionalLight>
      {COVES.map((z) => (
        <pointLight
          key={`cove-light${z}`}
          position={[0, ROOM.ceil - 0.5, z]}
          color={day ? "#d3dbec" : "#8ea0cc"}
          intensity={day ? 5 : 4.5}
          distance={9}
          decay={2}
        />
      ))}
      {STATIONS.map((st) => (
        <pointLight
          key={`station-light-${st.id}`}
          position={[st.anchor[0], st.anchor[1] + 0.6, st.anchor[2] + 0.85]}
          color={TONE[tones[st.id]]}
          intensity={tones[st.id] === "idle" ? (day ? 1.4 : 2.2) : day ? 3 : 4.6}
          distance={5.5}
          decay={2}
        />
      ))}

      <Floor s={surfaces} />
      <Walls s={surfaces} />
      <CeilingRig s={surfaces} />

      {/* ---- the three console bays: a plinth and pedestal bolted to the room,
           under a head that swivels to keep its screen square to the viewer ---- */}
      {STATIONS.map((st, i) => (
        <group key={st.id}>
          <group position={[st.anchor[0], 0, st.anchor[2]]} rotation={[0, st.yaw, 0]}>
            {/* plinth, with a proud cap so it reads as a capping stone */}
            <mesh position={[0, PLINTH.h / 2, 0]} material={surfaces.body} castShadow receiveShadow>
              <boxGeometry args={[PLINTH.w - 0.12, PLINTH.h, PLINTH.d - 0.12]} />
            </mesh>
            <mesh position={[0, PLINTH.h + 0.02, 0]} material={surfaces.trim} receiveShadow>
              <boxGeometry args={[PLINTH.w, 0.04, PLINTH.d]} />
            </mesh>
            {/* contact darkening where the mount meets the plinth */}
            <mesh position={[0, PLINTH.h + 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.7, 24]} />
              <primitive object={surfaces.contact} attach="material" dispose={null} />
            </mesh>
            {/* base plate, tapered post, collar at the swivel */}
            <mesh position={[0, PLINTH.h + 0.085, 0]} material={surfaces.trim} castShadow receiveShadow>
              <boxGeometry args={[0.76, 0.07, 0.6]} />
            </mesh>
            <mesh
              ref={(m) => {
                posts.current[i] = m;
              }}
              position={[0, PLINTH.h + 0.12, 0]}
              geometry={postGeo}
              material={surfaces.post}
              castShadow
            />
            <mesh
              ref={(m) => {
                collars.current[i] = m;
              }}
              material={surfaces.trim}
              castShadow
            >
              <boxGeometry args={[0.44, 0.16, 0.38]} />
            </mesh>
          </group>

          {/* the head: housing, face panel, bezel, screen recess, status lights */}
          <group
            ref={(g) => {
              heads.current[i] = g;
            }}
          >
            <mesh position={[0, 0, -0.27]} material={surfaces.body} castShadow receiveShadow>
              <boxGeometry args={[1.16, 1.2, 0.26]} />
            </mesh>
            <mesh position={[0, 0, -0.13]} material={surfaces.console} castShadow receiveShadow>
              <boxGeometry args={[1.05, 1.09, 0.14]} />
            </mesh>
            <mesh position={[0, 0, -0.045]} material={surfaces.trim}>
              <boxGeometry args={[0.955, 0.975, 0.06]} />
            </mesh>
            <mesh position={[0, 0, -0.016]} material={surfaces.screen}>
              <boxGeometry args={[0.885, 0.905, 0.03]} />
            </mesh>
            {/* status strip and indicator, lit in that station's own colour */}
            <mesh position={[0.28, -0.5, 0.012]} material={accents[i].strip}>
              <boxGeometry args={[0.22, 0.02, 0.02]} />
            </mesh>
            <mesh position={[-0.3, -0.5, 0.012]} material={accents[i].led}>
              <boxGeometry args={[0.032, 0.032, 0.02]} />
            </mesh>
          </group>
        </group>
      ))}
    </>
  );
}

/* ------------------------------------------------------------- the canvas */

export default function PatcherRoomScene(props: SceneProps) {
  /* `rotation` is passed explicitly (rather than left off) because R3F aims a
     camera created without one at the world origin; an explicit level rotation
     keeps the horizon flat and the stations inside the frustum. `shadows` turns
     on the key light's soft shadow map. */
  return (
    <Canvas
      className="patcher-room-canvas"
      dpr={[1, 1.6]}
      frameloop="always"
      shadows
      camera={{
        fov: FOV,
        near: 0.05,
        far: 40,
        position: [EYE.x, EYE.y, EYE.z],
        rotation: [0, 0, 0],
      }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <RoomScene {...props} />
    </Canvas>
  );
}