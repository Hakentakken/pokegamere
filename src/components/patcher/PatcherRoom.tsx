/**
 * PatcherRoom — the room shell: camera input and the flat fallback layout.
 *
 * The 3D scene itself is lazily imported (PatcherRoomScene) so three.js is only
 * fetched when this page is visited. The station cards stay ordinary DOM owned by
 * the page and are mounted exactly once, whether or not WebGL is available —
 * nothing here ever remounts them, so the patch engine's element ids, refs and
 * drag/drop wiring are untouched.
 *
 * Interaction is click-and-drag (mouse) or finger-drag (touch): horizontal
 * movement turns the view with the pointer, like turning your head — drag
 * right and you look right, drag left and you look left — around a viewer
 * who never moves. The gesture is only claimed once it is clearly horizontal,
 * so vertical page scrolling and ordinary clicks on the controls are never
 * disturbed.
 */
import {
  Component,
  forwardRef,
  lazy,
  Suspense,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  MAX_YAW,
  ROOM_CAM,
  bearingOf,
  supportsWebGL,
  type RoomStationId,
  type RoomTone,
} from "./roomLayout";
import { useTheme } from "../../lib/theme";

const PatcherRoomScene = lazy(() => import("./PatcherRoomScene"));

export type PatcherRoomHandle = {
  /** Rotate the camera to face a station (smooth unless `instant`). */
  lookAt: (id: RoomStationId, instant?: boolean) => void;
  /**
   * Which layout actually rendered. Only the flat fallback needs its stations
   * scrolled into view: in 3D the cards are projected inside a clipped,
   * `overflow: hidden` viewport, where `scrollIntoView` would scroll that room
   * (and the page with it) rather than reveal anything.
   */
  mode: "3d" | "flat";
};

type Props = {
  /** The page's station mounts: left / center / right. */
  mounts: Record<RoomStationId, RefObject<HTMLDivElement | null>>;
  /** Per-station lighting tone, derived from existing patcher state. */
  tones: Record<RoomStationId, RoomTone>;
  /** `prefers-reduced-motion` — direct, unsmoothed camera. */
  reduced: boolean;
  /** Fired once the camera settles on a station, so the page can sync chips. */
  onSettle?: (id: RoomStationId) => void;
  children?: ReactNode;
};

/** Keeps a WebGL failure from ever blanking the page. */
class RoomBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const PatcherRoom = forwardRef<PatcherRoomHandle, Props>(function PatcherRoom(
  { mounts, tones, reduced, onSettle, children },
  ref
) {
  const settleRef = useRef<((id: RoomStationId) => void) | undefined>(undefined);
  const { isDark } = useTheme();
  const [mode] = useState<"3d" | "flat">(() =>
    typeof document === "undefined" ? "flat" : supportsWebGL() ? "3d" : "flat"
  );
  const [dragging, setDragging] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef({ armed: false, x0: 0, y0: 0, base: 0, id: -1 });

  useEffect(() => {
    settleRef.current = onSettle;
  }, [onSettle]);

  useEffect(() => {
    // Start the view facing the front (patch) station.
    ROOM_CAM.yaw = 0;
    ROOM_CAM.target = 0;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      lookAt(id, instant) {
        ROOM_CAM.target = bearingOf(id);
        if (instant || reduced) ROOM_CAM.yaw = ROOM_CAM.target;
      },
      mode,
    }),
    [reduced, mode]
  );

  /* Radian per pixel: a drag across ~62% of the room's width covers the whole
     look range, so a few pixels never swing the room and a full sweep is easy. */
  const sensitivity = () => {
    const w = wrapRef.current?.getBoundingClientRect().width ?? window.innerWidth;
    return MAX_YAW / Math.max(240, w * 0.62);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary || e.button !== 0) return;
    drag.current = {
      armed: false,
      x0: e.clientX,
      y0: e.clientY,
      base: ROOM_CAM.target,
      id: e.pointerId,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.armed) {
      /* Only a clearly horizontal gesture takes the camera, so vertical page
         scrolling and ordinary clicks are never disturbed. */
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      d.armed = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* capture is best-effort */
      }
      setDragging(true);
    }
    if (e.cancelable) e.preventDefault();
    /* Head-turn mapping: dragging RIGHT turns the view RIGHT.
       `bearingOf` is `atan2(-(x - EYE.x), -(z - EYE.z))`, so the left-hand
       station measures a POSITIVE yaw and the right-hand one a negative yaw,
       and with `rotation.y = yaw` the camera's forward vector is
       `(-sin yaw, 0, -cos yaw)` — increasing yaw swings the view LEFT
       (forward.x goes negative) and decreasing yaw swings it RIGHT
       (forward.x goes positive). A rightward drag (dx > 0) therefore has to
       SUBTRACT from the yaw it started from: drag right, the view turns
       right toward the right-hand wall; drag left, the view turns left.
       Verified: dx=+100px → target decreases → yaw negative → forward.x =
       -sin(neg) > 0 → looking RIGHT. */
    ROOM_CAM.target = Math.max(-MAX_YAW, Math.min(MAX_YAW, d.base - dx * sensitivity()));
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d.id !== e.pointerId) return;
    if (d.armed) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      setDragging(false);
    }
    drag.current = { armed: false, x0: 0, y0: 0, base: 0, id: -1 };
  };

  return (
    <div
      ref={wrapRef}
      className="patcher-room"
      data-mode={mode}
      data-dragging={dragging ? "true" : "false"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {mode === "3d" && (
        <RoomBoundary>
          <Suspense fallback={null}>
            <PatcherRoomScene
              mounts={mounts}
              tones={tones}
              reduced={reduced}
              settleRef={settleRef}
              day={!isDark}
            />
          </Suspense>
        </RoomBoundary>
      )}
      <div className="patcher-room-stage">{children}</div>
    </div>
  );
});

export default PatcherRoom;