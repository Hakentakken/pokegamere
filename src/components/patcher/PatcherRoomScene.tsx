/**
 * PatcherRoomScene — the WebGL half of the patcher room.
 *
 * Real 3D geometry (floor, ceiling, four walls, seams, pilasters, accent strips
 * and three console pylons) drawn with a real perspective camera. This module is
 * lazily imported so three.js never lands in another page's bundle.
 *
 * Every frame it drives the page's station cards: each card is ordinary DOM in
 * the page's own tree, positioned by projecting its console anchor through the
 * live camera and scaling it by true perspective, so the UI stays crisp, clickable
 * and keyboard-accessible while the room around it is genuinely 3D.
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
};
/* --------------------------------------------------------------- 3D scene */

function RoomScene({
  mounts,
  tones,
  reduced,
  settleRef,
}: SceneProps) {
  const size = useThree((s) => s.size);
  const threeCamera = useThree((s) => s.camera);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const bezels = useRef<(THREE.Mesh | null)[]>([]);
  const glows = useRef<(THREE.Mesh | null)[]>([]);
  const stems = useRef<(THREE.Group | null)[]>([]);
  const shades = useRef<(THREE.Mesh | null)[]>([]);
  const px = useRef<{ w: number; h: number }[]>(STATIONS.map(() => ({ w: 400, h: 330 })));
  const settled = useRef<RoomStationId>(nearestStation(0));

  const scratch = useMemo(() => ({ p: new THREE.Vector3() }), []);

  /* The bezel is sized from the real card, so the 3D frame and the HTML screen
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

    /* --- one pass per station: project, scale, and drive its DOM mount --- */
    const focal = size.height / 2 / Math.tan((FOV * Math.PI) / 360);

    for (let i = 0; i < STATIONS.length; i++) {
      const st = STATIONS[i];
      const el = els.current[i];

      scratch.p.set(st.anchor[0], st.anchor[1], st.anchor[2]);
      const dist = scratch.p.distanceTo(EYE);
      const worldW = (px.current[i].w * REF_DIST) / focal;
      const worldH = (px.current[i].h * REF_DIST) / focal;

      // Console head swivels to face the viewer, so the screen is square-on and
      // the HTML overlay lines up pixel-for-pixel with the frame behind it.
      const bezel = bezels.current[i];
      if (bezel) {
        bezel.position.set(st.anchor[0], st.anchor[1], st.anchor[2]);
        bezel.rotation.y = ROOM_CAM.yaw;
        bezel.scale.set(worldW + 0.34, worldH + 0.34, 1);
      }
      const glow = glows.current[i];
      if (glow) {
        glow.position.set(st.anchor[0], st.anchor[1], st.anchor[2]);
        glow.rotation.y = ROOM_CAM.yaw;
        glow.scale.set(worldW + 1.6, worldH + 1.6, 1);
      }
      // The pylon stays fixed to the room, so it keeps its own parallax.
      const legH = Math.max(0.2, st.anchor[1] - worldH / 2 - 0.06);
      const stem = stems.current[i];
      if (stem) {
        stem.position.set(st.anchor[0], 0, st.anchor[2]);
        stem.rotation.y = st.yaw;
        stem.scale.set(1, legH, 1);
      }
      const shade = shades.current[i];
      if (shade) {
        shade.position.set(st.anchor[0], 0.007, st.anchor[2]);
        shade.rotation.set(-Math.PI / 2, 0, st.yaw);
        shade.scale.set(worldW * 0.95, worldW * 0.95, 1);
      }

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

  /* ------------------------------------------------------------ the geometry */

  const { halfW, front, back, ceil } = ROOM;
  const midZ = (back + front) / 2;
  const spanZ = back - front;
  const mat = (color: string, rough: number, metal: number) => (
    <meshStandardMaterial color={color} roughness={rough} metalness={metal} />
  );

  return (
    <>
      <ambientLight intensity={0.7} color="#8ea0c8" />
      <hemisphereLight args={["#5a6a92", "#0a0a10", 0.55]} />

      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, midZ]}>
        <planeGeometry args={[halfW * 2, spanZ]} />
        {mat("#0c0d13", 0.6, 0.3)}
      </mesh>
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ceil, midZ]}>
        <planeGeometry args={[halfW * 2, spanZ]} />
        {mat("#08090e", 0.95, 0)}
      </mesh>
      {/* front wall — the patch station's wall */}
      <mesh position={[0, ceil / 2, front]}>
        <planeGeometry args={[halfW * 2, ceil]} />
        {mat("#0d0e15", 0.9, 0.06)}
      </mesh>
      {/* side walls — the ROM and apply stations' walls */}
      <mesh position={[-halfW, ceil / 2, midZ]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[spanZ, ceil]} />
        {mat("#0b0c12", 0.92, 0.06)}
      </mesh>
      <mesh position={[halfW, ceil / 2, midZ]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[spanZ, ceil]} />
        {mat("#0b0c12", 0.92, 0.06)}
      </mesh>
      {/* back wall, so the room stays closed at the yaw limit */}
      <mesh position={[0, ceil / 2, back]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[halfW * 2, ceil]} />
        {mat("#090a10", 0.95, 0)}
      </mesh>

      {/* architectural seams: shallow proud strips so grazing light finds them */}
      {[1.05, 2.25].map((y) => (
        <group key={`seam${y}`}>
          <mesh position={[0, y, front + 0.03]}>
            <boxGeometry args={[halfW * 2, 0.04, 0.05]} />
            {mat("#191b26", 0.65, 0.45)}
          </mesh>
          <mesh position={[-halfW + 0.03, y, midZ]}>
            <boxGeometry args={[0.05, 0.04, spanZ]} />
            {mat("#191b26", 0.65, 0.45)}
          </mesh>
          <mesh position={[halfW - 0.03, y, midZ]}>
            <boxGeometry args={[0.05, 0.04, spanZ]} />
            {mat("#191b26", 0.65, 0.45)}
          </mesh>
        </group>
      ))}
      {/* front-wall pilasters */}
      {[-3.2, 3.2].map((x) => (
        <mesh key={x} position={[x, ceil / 2, front + 0.1]}>
          <boxGeometry args={[0.26, ceil, 0.2]} />
          {mat("#111320", 0.85, 0.16)}
        </mesh>
      ))}

      {/* restrained red accent strips along the wall bases */}
      <mesh position={[0, 0.075, front + 0.06]}>
        <boxGeometry args={[halfW * 2 - 0.5, 0.03, 0.03]} />
        <meshBasicMaterial color="#6d1a22" />
      </mesh>
      <mesh position={[-halfW + 0.06, 0.075, midZ]}>
        <boxGeometry args={[0.03, 0.03, spanZ - 0.8]} />
        <meshBasicMaterial color="#5a151d" />
      </mesh>
      <mesh position={[halfW - 0.06, 0.075, midZ]}>
        <boxGeometry args={[0.03, 0.03, spanZ - 0.8]} />
        <meshBasicMaterial color="#5a151d" />
      </mesh>
      {/* cool cove light along the front ceiling */}
      <mesh position={[0, ceil - 0.1, front + 0.8]}>
        <boxGeometry args={[halfW * 1.5, 0.05, 0.18]} />
        <meshBasicMaterial color="#39405a" />
      </mesh>

      {/* cool fill from the front ceiling cove, so the walls read as surfaces */}
      <pointLight position={[0, ceil - 0.4, front + 1.3]} color="#8492b8" intensity={16} distance={14} decay={2} />

      {/* one soft pool of light per console, tinted by that station's state */}
      {STATIONS.map((st) => (
        <pointLight
          key={st.id}
          position={[st.anchor[0], st.anchor[1] + 0.55, st.anchor[2] + 0.8]}
          color={TONE[tones[st.id]]}
          intensity={tones[st.id] === "idle" ? 9 : 15}
          distance={10}
          decay={2}
        />
      ))}

      {/* consoles: light spill, bezel frame, fixed pylon, contact shadow */}
      {STATIONS.map((st, i) => (
        <group key={st.id}>
          <mesh
            ref={(m) => {
              glows.current[i] = m;
            }}
            position={[st.anchor[0], st.anchor[1], st.anchor[2] - 0.08]}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              color={TONE[tones[st.id]]}
              transparent
              opacity={0.14}
              depthWrite={false}
            />
          </mesh>
          <mesh
            ref={(m) => {
              bezels.current[i] = m;
            }}
            position={[st.anchor[0], st.anchor[1], st.anchor[2]]}
          >
            <boxGeometry args={[1, 1, 0.1]} />
            {mat("#171922", 0.45, 0.7)}
          </mesh>
          <group
            ref={(g) => {
              stems.current[i] = g;
            }}
            position={[st.anchor[0], 0, st.anchor[2]]}
          >
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[0.36, 1, 0.3]} />
              {mat("#0f1017", 0.7, 0.45)}
            </mesh>
            <mesh position={[0, 0.014, 0]}>
              <boxGeometry args={[1.1, 0.028, 0.75]} />
              {mat("#0d0e14", 0.8, 0.3)}
            </mesh>
          </group>
          <mesh
            ref={(m) => {
              shades.current[i] = m;
            }}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[0.5, 28]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.45} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/* ------------------------------------------------------------- the canvas */

export default function PatcherRoomScene(props: SceneProps) {
  return (
    <Canvas
      className="patcher-room-canvas"
      dpr={[1, 1.6]}
      frameloop="always"
      /* `rotation` is passed explicitly (rather than left off) because R3F aims
         a camera created without one at the world origin; an explicit level
         rotation keeps the horizon flat and the stations inside the frustum. */
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
