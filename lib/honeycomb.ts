import * as THREE from 'three';
import { mulberry32 } from './random';

/**
 * Procedural honeycomb lattice.
 *
 * Everything here is pure + seeded: same seed in, same comb out, on every
 * reload and on the server. No assets, no textures, no loaders.
 *
 * Orientation: hexagons lie in the XZ plane, extruded along +Y.
 * A hex of circumradius R has vertices at (R*sin(k*60deg), 0, R*cos(k*60deg)),
 * i.e. flat sides facing +/-X and points facing +/-Z. That gives a row/column
 * packing of sqrt(3)*R across X and 1.5*R along Z with odd rows offset by half.
 */

export const CELL_RADIUS = 0.5;
/** Shrink factor so neighbouring cells leave a hairline seam instead of z-fighting. */
const CELL_INSET = 0.955;

export const PALETTE = {
  amber: new THREE.Color('#C9962A'),
  amberDeep: new THREE.Color('#7A5A16'),
  honey: new THREE.Color('#E8B23C'),
  bone: new THREE.Color('#F5F5F5'),
  plate: new THREE.Color('#0B0B0B'),
};

export interface Cell {
  x: number;
  z: number;
  /** Extruded height. Flat cells get a token thickness so they still read. */
  height: number;
  /** ~15% of cells are left unextruded for texture. */
  flat: boolean;
}

export interface Marker {
  x: number;
  y: number;
  z: number;
  /** Per-marker phase offset so the pulse never syncs up. */
  phase: number;
  rotation: number;
}

export interface FillCell {
  x: number;
  z: number;
  height: number;
  /** Stagger offset, in seconds, into the fill loop. */
  delay: number;
}

export interface Lattice {
  cells: Cell[];
  markers: Marker[];
  fills: FillCell[];
  /** Half-extent of the lattice footprint, used to size the plate + camera. */
  extent: number;
}

export interface LatticeOptions {
  cols: number;
  rows: number;
  seed: number;
  markerCount: number;
  fillCount: number;
}

export function buildLattice({
  cols,
  rows,
  seed,
  markerCount,
  fillCount,
}: LatticeOptions): Lattice {
  const rand = mulberry32(seed);
  const R = CELL_RADIUS;
  const stepX = Math.sqrt(3) * R;
  const stepZ = 1.5 * R;

  const width = (cols - 1) * stepX + stepX / 2;
  const depth = (rows - 1) * stepZ;
  const originX = -width / 2;
  const originZ = -depth / 2;

  const cells: Cell[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const flat = rand() < 0.15;
      // Kept shallow relative to CELL_RADIUS on purpose: extrude much past
      // ~1.5x the radius and the lattice reads as a skyline, not a comb.
      const r = rand();
      const height = flat ? 0.06 : 0.16 + Math.pow(r, 1.6) * 0.62;
      cells.push({
        x: originX + col * stepX + (row % 2) * (stepX / 2),
        z: originZ + row * stepZ,
        height,
        flat,
      });
    }
  }

  // Markers park on extruded cells only — a bee on a flat cell reads as a
  // floating dot.
  const standing = cells
    .map((cell, index) => ({ cell, index }))
    .filter(({ cell }) => !cell.flat);

  const markers: Marker[] = [];
  const usedForMarkers = new Set<number>();
  let guard = 0;
  while (markers.length < markerCount && guard < markerCount * 40) {
    guard += 1;
    const pick = standing[Math.floor(rand() * standing.length)];
    if (!pick || usedForMarkers.has(pick.index)) continue;
    usedForMarkers.add(pick.index);
    markers.push({
      x: pick.cell.x,
      y: pick.cell.height + 0.012,
      z: pick.cell.z,
      phase: rand() * Math.PI * 2,
      rotation: Math.floor(rand() * 6) * (Math.PI / 3),
    });
  }

  // Fill cells are rendered as open tubes so the rising cap is actually
  // visible from an isometric camera. They are removed from the solid mesh.
  const fills: FillCell[] = [];
  const fillIndices = new Set<number>();
  guard = 0;
  const candidates = standing.filter(
    ({ cell, index }) => cell.height > 0.42 && !usedForMarkers.has(index),
  );
  while (fills.length < fillCount && guard < fillCount * 60) {
    guard += 1;
    const pick = candidates[Math.floor(rand() * candidates.length)];
    if (!pick || fillIndices.has(pick.index)) continue;
    fillIndices.add(pick.index);
    fills.push({
      x: pick.cell.x,
      z: pick.cell.z,
      height: pick.cell.height,
      delay: fills.length * 0.8,
    });
  }

  return {
    cells: cells.filter((_, index) => !fillIndices.has(index)),
    markers,
    fills,
    extent: Math.max(width, depth) / 2 + R,
  };
}

const HEX_ANGLES = [0, 1, 2, 3, 4, 5].map((k) => (k * Math.PI) / 3);
/** Baked key direction. Not a light — the shade is written into vertex colors. */
const KEY = new THREE.Vector3(0.86, 0.2, 0.47).normalize();

/**
 * One merged, non-indexed BufferGeometry for the whole comb: top faces + side
 * walls, with flat per-face colors baked in. 2 draw calls total for ~225 cells
 * (this mesh + its edge overlay) instead of 450.
 *
 * Bottom faces are omitted — they are never visible from an isometric camera
 * sitting on a plate.
 */
export function buildCombGeometry(cells: Cell[]): THREE.BufferGeometry {
  const R = CELL_RADIUS * CELL_INSET;
  const ring = HEX_ANGLES.map((a) => [Math.sin(a) * R, Math.cos(a) * R] as const);

  // 6 top triangles + 6 side quads (12 triangles) = 18 triangles = 54 vertices.
  const vertsPerCell = 54;
  const positions = new Float32Array(cells.length * vertsPerCell * 3);
  const colors = new Float32Array(cells.length * vertsPerCell * 3);

  const shade = new THREE.Color();
  const normal = new THREE.Vector3();
  let p = 0;
  let c = 0;

  const push = (x: number, y: number, z: number, col: THREE.Color) => {
    positions[p++] = x;
    positions[p++] = y;
    positions[p++] = z;
    colors[c++] = col.r;
    colors[c++] = col.g;
    colors[c++] = col.b;
  };

  for (const cell of cells) {
    const { x, z, height, flat } = cell;

    // Top face. Flat cells are dimmed so empty comb reads as empty.
    const top = flat
      ? shade.copy(PALETTE.amber).multiplyScalar(0.34).clone()
      : PALETTE.amber;
    for (let i = 0; i < 6; i += 1) {
      const [ax, az] = ring[i];
      const [bx, bz] = ring[(i + 1) % 6];
      push(x, height, z, top);
      push(x + ax, height, z + az, top);
      push(x + bx, height, z + bz, top);
    }

    // Side walls, one flat color per wall from a baked key direction.
    for (let i = 0; i < 6; i += 1) {
      const [ax, az] = ring[i];
      const [bx, bz] = ring[(i + 1) % 6];
      const mid = HEX_ANGLES[i] + Math.PI / 6;
      normal.set(Math.sin(mid), 0, Math.cos(mid));
      const k = Math.max(0, normal.dot(KEY));
      const wall = shade
        .copy(PALETTE.amber)
        .multiplyScalar(0.24 + 0.34 * k)
        .clone();

      push(x + ax, 0, z + az, wall);
      push(x + bx, 0, z + bz, wall);
      push(x + bx, height, z + bz, wall);

      push(x + ax, 0, z + az, wall);
      push(x + bx, height, z + bz, wall);
      push(x + ax, height, z + az, wall);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

/** A flat 3-vertex chevron lying in XZ, pointing +Z. Reads as a bee from above. */
export function buildMarkerGeometry(size = 0.16): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(
      new Float32Array([
        0, 0, size,
        -size * 0.62, 0, -size * 0.55,
        size * 0.62, 0, -size * 0.55,
      ]),
      3,
    ),
  );
  return geometry;
}

/** The hex cap that climbs a fill cell. Rotated to match lattice orientation. */
export function buildFillCapGeometry(): THREE.BufferGeometry {
  const cap = new THREE.CircleGeometry(CELL_RADIUS * CELL_INSET * 0.97, 6);
  cap.rotateX(-Math.PI / 2);
  cap.rotateY(-Math.PI / 6);
  return cap;
}

/** Open-ended hex tube for a fill cell, so the cap is visible inside it. */
export function buildFillTubeGeometry(height: number): THREE.BufferGeometry {
  const r = CELL_RADIUS * CELL_INSET;
  return new THREE.CylinderGeometry(r, r, height, 6, 1, true);
}
