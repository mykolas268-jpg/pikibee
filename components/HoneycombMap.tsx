'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveDpr, OrthographicCamera } from '@react-three/drei';
import type { MotionValue } from 'framer-motion';
import * as THREE from 'three';
import {
  PALETTE,
  buildCombGeometry,
  buildFillCapGeometry,
  buildFillTubeGeometry,
  buildLattice,
  buildMarkerGeometry,
  type FillCell,
  type Lattice,
} from '@/lib/honeycomb';

const SEED = 20260904;
const FILL_DURATION = 4;
const FILL_PAUSE = 1.2;

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
  /** Stop the render loop when the stage has scrolled away. */
  active?: boolean;
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

function Rig({ extent }: { extent: number }) {
  const size = useThree((state) => state.size);
  // Ortho zoom is pixels-per-world-unit, so it has to come off the canvas box
  // or the comb changes size with the window.
  const zoom = Math.min(
    size.width / (PROJECTED_WIDTH * extent * MARGIN),
    size.height / (PROJECTED_HEIGHT * extent * MARGIN),
  );

  return (
    <OrthographicCamera
      makeDefault
      position={[14, 12, 14]}
      near={-200}
      far={200}
      zoom={zoom}
      onUpdate={(camera) => camera.lookAt(0, 0, 0)}
    />
  );
}

function Comb({ lattice }: { lattice: Lattice }) {
  const geometry = useMemo(() => buildCombGeometry(lattice.cells), [lattice]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 1), [geometry]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      edges.dispose();
    };
  }, [geometry, edges]);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={PALETTE.amberDeep} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

function Plate({ extent }: { extent: number }) {
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
    <group position={[0, -0.12, 0]}>
      <mesh geometry={geometry}>
        <meshBasicMaterial color={PALETTE.plate} toneMapped={false} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={PALETTE.amberDeep} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

const dummy = new THREE.Object3D();
const scratchColor = new THREE.Color();

function Markers({ lattice }: { lattice: Lattice }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => buildMarkerGeometry(), []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.getElapsedTime();

    for (let i = 0; i < lattice.markers.length; i += 1) {
      const marker = lattice.markers[i];
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.5 + marker.phase);
      dummy.position.set(marker.x, marker.y, marker.z);
      dummy.rotation.set(0, marker.rotation, 0);
      dummy.scale.setScalar(0.72 + pulse * 0.55);
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
function Fill({ cell }: { cell: FillCell }) {
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
    if (!cap.current) return;
    const cycle = FILL_DURATION + FILL_PAUSE;
    const t = (state.clock.getElapsedTime() + cell.delay) % cycle;
    const k = THREE.MathUtils.clamp(t / FILL_DURATION, 0, 1);
    const eased = k * k * (3 - 2 * k);
    cap.current.position.y = 0.03 + eased * (cell.height - 0.06);
  });

  return (
    <group position={[cell.x, 0, cell.z]}>
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

function Stage({
  lattice,
  progress,
  fills,
}: {
  lattice: Lattice;
  progress: MotionValue<number>;
  fills: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const eased = useRef(0);

  useFrame((state, delta) => {
    const node = group.current;
    if (!node) return;

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
    node.scale.setScalar(1 + p * 1.45);
    node.rotation.y = p * 0.3;
    node.position.y =
      -p * 0.25 + Math.sin(state.clock.getElapsedTime() * 0.35) * 0.05;
    node.position.x = -p * 0.12;
  });

  return (
    <group ref={group}>
      <Plate extent={lattice.extent} />
      <Comb lattice={lattice} />
      <Markers lattice={lattice} />
      {fills && lattice.fills.map((cell, i) => <Fill key={i} cell={cell} />)}
    </group>
  );
}

/* ------------------------------------------------------------------ */

export default function HoneycombMap({
  progress,
  cols = 15,
  rows = 15,
  fills = true,
  active = true,
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
        <Rig extent={lattice.extent} />
        <AdaptiveDpr pixelated={false} />
        <Stage lattice={lattice} progress={progress} fills={fills} />
      </Canvas>
    </div>
  );
}
