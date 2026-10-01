/**
 * Shared room layout. Imported by both the (eagerly loaded) room shell and the
 * (lazily loaded) WebGL scene, so nothing here pulls three.js into other pages.
 */

export type RoomStationId = "left" | "center" | "right";
export type RoomTone = "idle" | "ready" | "done";

/** Console anchors in world space (metres), spaced well apart in a large room. */
export const STATIONS: readonly {
  id: RoomStationId;
  anchor: readonly [number, number, number];
  yaw: number;
}[] = [
  { id: "left", anchor: [-2.8, 1.58, -1.5], yaw: 0.735 },
  { id: "center", anchor: [0, 1.58, -1.9], yaw: 0 },
  { id: "right", anchor: [2.8, 1.58, -1.5], yaw: -0.735 },
];

export const EYE = { x: 0, y: 1.62, z: 1.6 };
export const FOV = 46;
/** Distance at which a station renders at its natural pixel size. */
export const REF_DIST = Math.abs(EYE.z - STATIONS[1].anchor[2]);
/** Look limit, so the viewer can face any wall but never spin. */
export const MAX_YAW = 0.98;
/** Fade window: full strength while you face a station, a faint peripheral
    glimpse once you are 45°+ away, gone past that. */
export const FADE_START = 0.3;
export const FADE_END = 0.86;

export const ROOM = { halfW: 5, front: -7.4, back: 3.2, ceil: 3.5 };

export const TONE: Record<RoomTone, string> = {
  idle: "#7a2230",
  ready: "#1f6b4f",
  done: "#8a2733",
};

/* Camera state. Exactly one room exists per page, so it lives in a plain module
   object rather than a ref: the shell writes `target` from pointer input and the
   render loop eases `yaw` toward it, with no React re-render in between. */
export const ROOM_CAM = { yaw: 0, target: 0 };

export function normalise(angle: number) {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/** Yaw that makes the camera face a station. */
export function bearingOf(id: RoomStationId) {
  const s = STATIONS.find((x) => x.id === id) ?? STATIONS[1];
  return Math.atan2(-(s.anchor[0] - EYE.x), -(s.anchor[2] - EYE.z));
}

export function nearestStation(yaw: number): RoomStationId {
  let best: RoomStationId = "center";
  let bestD = Infinity;
  for (const s of STATIONS) {
    const d = Math.abs(normalise(bearingOf(s.id) - yaw));
    if (d < bestD) {
      bestD = d;
      best = s.id;
    }
  }
  return best;
}

export function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}