'use client';

import { forwardRef, useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { AdaptiveDpr, OrthographicCamera } from '@react-three/drei';
import type { MotionValue } from 'framer-motion';
import * as THREE from 'three';
import {
  PALETTE,
  buildFillCapGeometry,
  buildFillTubeGeometry,
  buildLattice,
  buildMarkerGeometry,
  createCombGeometry,
  createEdgeGeometry,
  writeCombGeometry,
  type FillCell,
  type Lattice,
} from '@/lib/honeycomb';

const SEED = 20260904;
const FILL_DURATION = 4;
const FILL_PAUSE = 1.2;

/**
 * Where the comb sits inside the canvas, in fractions of the canvas box:
 * `cx`/`cy` is the centre, `w`/`h` the share of the box it fits into.
 *
 * Framing lives here rather than in a CSS transform on the canvas: scaling the
 * canvas element makes R3F re-measure and reallocate its drawing buffer on
 * every scroll frame, and downsamples the render on top of it.
 */
export interface Frame {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

export interface HoneycombMapProps {
  /**
   * Sawtooth 0 -> 1 per hero section. Read inside useFrame only: this drives
   * the camera dolly without a single React re-render per scroll tick.
   */
  progress: MotionValue<number>;
  cols?: number;
  rows?: number;
  /** Fill animation is dropped on mobile. */
  fills?: boolean;
  /** Slow idle drift, so the comb reads as live even when nobody scrolls. */
  drift?: boolean;
  /** Stop the render loop when the tab is hidden. */
  active?: boolean;
  /** Framing while the heroes are on screen. */
  home: Frame;
  /** Framing once the comb has retired to its corner. */
  docked: Frame;
  /** 0 -> 1 across the handover between the two framings. */
  dock: MotionValue<number>;
  className?: string;
}

/* ------------------------------------------------------------------ */

/**
 * Isometric projection turns the square plate into a diamond that is much wider
 * than it is tall: a plate of half-extent E projects to 2*sqrt(2)*E across and
 * roughly 1.5*E down at this camera elevation. Fitting on min(width, height)
 * clips the corners, so fit each axis on its own projected extent.
 */
const PROJECTED_WIDTH = 2 * Math.SQRT2;
const PROJECTED_HEIGHT = 1.75;
const MARGIN = 1.07;

/** Screen basis of the fixed isometric camera, precomputed once. */
const RIGHT = new THREE.Vector3(14, 12, 14)
  .clone()
  .normalize()
  .cross(new THREE.Vector3(0, 1, 0))
  .normalize()
  .multiplyScalar(-1);
const UP = new THREE.Vector3(14, 12, 14).clone().normalize().cross(RIGHT).normalize();

function Rig() {
  // Zoom is driven per frame from the current framing, so the value here is
  // only a starting point.
  return (
    <OrthographicCamera
      makeDefault
      position={[14, 12, 14]}
      near={-200}
      far={200}
      zoom={40}
      onUpdate={(camera) => camera.lookAt(0, 0, 0)}
    />
  );
}

function Comb({
  solid,
  edges,
}: {
  solid: THREE.BufferGeometry;
  edges: THREE.BufferGeometry;
}) {
  return (
    <group>
      <mesh geometry={solid} frustumCulled={false}>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </mesh>
      <lineSegments geometry={edges} frustumCulled={false}>
        <lineBasicMaterial color={PALETTE.amberDeep} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

const Plate = forwardRef<THREE.Group, { extent: number }>(function Plate(
  { extent },
  ref,
) {
  const size = extent * 2 * 1.04;
  const geometry = useMemo(
    () => new THREE.BoxGeometry(size, 0.24, size),
    [size],
  );
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      edges.dispose();
    };
  }, [geometry, edges]);

  return (
    <group ref={ref} position={[0, -0.12, 0]}>
      <mesh geometry={geometry}>
        <meshBasicMaterial color={PALETTE.plate} toneMapped={false} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={PALETTE.amberDeep} toneMapped={false} />
      </lineSegments>
    </group>
  );
});

const dummy = new THREE.Object3D();
const scratchColor = new THREE.Color();

function Markers({
  lattice,
  morph,
}: {
  lattice: Lattice;
  morph: MutableRefObject<number>;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => buildMarkerGeometry(), []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.getElapsedTime();
    // The bees belong to the comb, not to the packet.
    const away = 1 - THREE.MathUtils.clamp(morph.current / 0.45, 0, 1);
    mesh.visible = away > 0.01;
    if (!mesh.visible) return;

    for (let i = 0; i < lattice.markers.length; i += 1) {
      const marker = lattice.markers[i];
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.5 + marker.phase);
      dummy.position.set(marker.x, marker.y, marker.z);
      dummy.rotation.set(0, marker.rotation, 0);
      dummy.scale.setScalar((0.72 + pulse * 0.55) * away);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, scratchColor.setScalar(0.32 + pulse * 0.68));
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, undefined, lattice.markers.length]}
      frustumCulled={false}
    >
      <meshBasicMaterial
        color={PALETTE.bone}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/** One open comb cell with a hex cap climbing it — honey filling the comb. */
function Fill({
  cell,
  morph,
}: {
  cell: FillCell;
  morph: MutableRefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const cap = useRef<THREE.Mesh>(null);
  const tube = useMemo(() => buildFillTubeGeometry(cell.height), [cell.height]);
  const capGeometry = useMemo(() => buildFillCapGeometry(), []);
  const edges = useMemo(() => new THREE.EdgesGeometry(tube, 1), [tube]);

  useEffect(() => {
    return () => {
      tube.dispose();
      capGeometry.dispose();
      edges.dispose();
    };
  }, [tube, capGeometry, edges]);

  useFrame((state) => {
    if (!cap.current || !group.current) return;
    const away = 1 - THREE.MathUtils.clamp(morph.current / 0.4, 0, 1);
    group.current.visible = away > 0.01;
    group.current.scale.setScalar(away);
    if (!group.current.visible) return;
    const cycle = FILL_DURATION + FILL_PAUSE;
    const t = (state.clock.getElapsedTime() + cell.delay) % cycle;
    const k = THREE.MathUtils.clamp(t / FILL_DURATION, 0, 1);
    const eased = k * k * (3 - 2 * k);
    cap.current.position.y = 0.03 + eased * (cell.height - 0.06);
  });

  return (
    <group ref={group} position={[cell.x, 0, cell.z]}>
      <mesh geometry={tube} position={[0, cell.height / 2, 0]}>
        <meshBasicMaterial
          color={PALETTE.amberDeep}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <lineSegments geometry={edges} position={[0, cell.height / 2, 0]}>
        <lineBasicMaterial color={PALETTE.amber} toneMapped={false} />
      </lineSegments>
      <mesh ref={cap} geometry={capGeometry}>
        <meshBasicMaterial
          color={PALETTE.honey}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const offset = new THREE.Vector3();

function Stage({
  lattice,
  progress,
  fills,
  drift,
  home,
  docked,
  dock,
}: {
  lattice: Lattice;
  progress: MotionValue<number>;
  fills: boolean;
  drift: boolean;
  home: Frame;
  docked: Frame;
  dock: MotionValue<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const plate = useRef<THREE.Group>(null);
  const eased = useRef(0);
  const easedDock = useRef(0);
  /** Shared with the children, which read it in their own useFrame. */
  const morph = useRef(0);
  const written = useRef(-1);

  const solid = useMemo(() => createCombGeometry(lattice.cells), [lattice]);
  const edges = useMemo(() => createEdgeGeometry(lattice.cells), [lattice]);

  useEffect(() => {
    return () => {
      solid.dispose();
      edges.dispose();
    };
  }, [solid, edges]);

  useFrame((state, delta) => {
    const node = group.current;
    if (!node) return;

    // --- framing -------------------------------------------------------
    easedDock.current = THREE.MathUtils.damp(
      easedDock.current,
      dock.get(),
      6,
      delta,
    );
    const d = easedDock.current;
    morph.current = d;
    const size = state.size;
    const camera = state.camera as THREE.OrthographicCamera;

    // --- morph ---------------------------------------------------------
    // The comb folds itself into the gel sachet. Rewriting the buffers is the
    // whole cost of the transition, so skip it while the value is parked at
    // either end — which is the entire page apart from the handover.
    if (Math.abs(d - written.current) > 0.0005) {
      writeCombGeometry(solid, edges, lattice.cells, d);
      written.current = d;
    }

    // The plate follows the object so the packet is not marooned on a square
    // field sized for the comb.
    const halfX = mix(lattice.extent, lattice.gelPlate.halfX, d);
    const halfZ = mix(lattice.extent, lattice.gelPlate.halfZ, d);
    if (plate.current) {
      plate.current.scale.set(
        halfX / lattice.extent,
        1,
        halfZ / lattice.extent,
      );
    }

    // Isometric projects a rectangle of half-sizes (a, c) to sqrt(2)*(a+c)
    // across, so the fit is driven by their mean, not by the larger of them.
    const extent = (halfX + halfZ) / 2;

    const boxW = mix(home.w, docked.w, d) * size.width;
    const boxH = mix(home.h, docked.h, d) * size.height;
    // Isometric turns the square plate into a diamond far wider than tall, so
    // fit each axis against its own projected extent.
    const zoom = Math.min(
      boxW / (PROJECTED_WIDTH * extent * MARGIN),
      boxH / (PROJECTED_HEIGHT * extent * MARGIN),
    );
    if (camera.zoom !== zoom) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }

    const px = (mix(home.cx, docked.cx, d) - 0.5) * size.width;
    const py = (mix(home.cy, docked.cy, d) - 0.5) * size.height;
    offset
      .copy(RIGHT)
      .multiplyScalar(px / zoom)
      .addScaledVector(UP, -py / zoom);

    // --- dolly ---------------------------------------------------------
    // Damped follow. The MotionValue is a hard sawtooth — it snaps to 0 at each
    // section boundary — and the damping turns that snap into a fast pull-back
    // instead of a one-frame cut.
    eased.current = THREE.MathUtils.damp(
      eased.current,
      progress.get(),
      6,
      delta,
    );
    const p = eased.current;

    // End of the dolly is a full-bleed macro crop of the comb: the lattice
    // overflows the canvas on every side, so there is no floating-object gap.
    const t = state.clock.getElapsedTime();

    // A slow oscillation rather than a spin: the comb never leaves the page
    // now, and a static isometric plate parked in the corner reads as a dead
    // image. +/- 7 degrees keeps the isometric read intact.
    const idle = drift ? Math.sin(t * 0.11) * 0.12 : 0;

    node.scale.setScalar(1 + p * 1.45);
    node.rotation.y = p * 0.3 + idle;
    node.position.set(
      offset.x - p * 0.12,
      offset.y - p * 0.25 + Math.sin(t * 0.35) * 0.05,
      offset.z,
    );
  });

  return (
    <group ref={group}>
      <Plate ref={plate} extent={lattice.extent} />
      <Comb solid={solid} edges={edges} />
      <Markers lattice={lattice} morph={morph} />
      {fills &&
        lattice.fills.map((cell, i) => (
          <Fill key={i} cell={cell} morph={morph} />
        ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */

export default function HoneycombMap({
  progress,
  cols = 15,
  rows = 15,
  fills = true,
  drift = true,
  active = true,
  home,
  docked,
  dock,
  className = '',
}: HoneycombMapProps) {
  const lattice = useMemo(
    () =>
      buildLattice({
        cols,
        rows,
        seed: SEED,
        markerCount: cols >= 12 ? 20 : 9,
        fillCount: fills ? 5 : 0,
      }),
    [cols, rows, fills],
  );

  return (
    <div className={className}>
      <Canvas
        dpr={[1, 1.75]}
        frameloop={active ? 'always' : 'never'}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <Rig />
        <AdaptiveDpr pixelated={false} />
        <Stage
          lattice={lattice}
          progress={progress}
          fills={fills}
          drift={drift}
          home={home}
          docked={docked}
          dock={dock}
        />
      </Canvas>
    </div>
  );
}
