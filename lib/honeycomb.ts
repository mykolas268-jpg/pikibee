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
  /**
   * Where this cell sits once the comb has become the gel packet. Every cell
   * keeps its identity through the morph — the field of comb re-forms into the
   * sachet rather than cross-fading with a second model.
   */
  gel: GelPose;
}

export interface GelPose {
  x: number;
  z: number;
  height: number;
  /** Cell circumradius on the packet. Zero for cells the layout does not use. */
  radius: number;
  /** Crimped seal band at either end of the sachet. */
  seal: boolean;
  /** Printed band across the middle. */
  label: boolean;
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
  /**
   * Half-extents of the plate once the comb has become the packet. The packet
   * is a long rectangle, so the plate stops being square and the camera fit
   * stops being driven by one number.
   */
  gelPlate: { halfX: number; halfZ: number };
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
        // Overwritten by assignGelPoses once the drawn set is known.
        gel: { x: 0, z: 0, height: 0, radius: 0, seal: false, label: false },
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

  const drawn = cells.filter((_, index) => !fillIndices.has(index));
  const extent = Math.max(width, depth) / 2 + R;

  return {
    cells: drawn,
    markers,
    fills,
    extent,
    gelPlate: assignGelPoses(drawn, extent),
  };
}

/** Length-to-width ratio of the sachet, seals included. */
const GEL_ASPECT = 1.8;
/** Packet length as a multiple of the comb's half-extent. */
const GEL_LENGTH = 1.12;
/** Share of the length taken by the crimped seal at each end. */
const GEL_SEAL = 0.12;
/** Margin the plate leaves around the packet, per axis. */
const GEL_PLATE_MARGIN = { x: 1.24, z: 1.7 };

/**
 * Lay the same cells out again as a gel sachet: a pillowed rectangle with a
 * flat crimped seal at each end and a printed band across the middle.
 *
 * Cells are assigned row-major, so scrolling reads as the comb field folding
 * itself into the packet rather than a swarm scrambling. Any cells the
 * rectangle cannot use shrink to nothing.
 *
 * Returns the packet's half-extent, for the camera fit at the far end of the
 * morph.
 */
function assignGelPoses(
  cells: Cell[],
  combExtent: number,
): { halfX: number; halfZ: number } {
  const count = cells.length;
  const rows = Math.max(3, Math.round(Math.sqrt(count / GEL_ASPECT)));
  const cols = Math.floor(count / rows);

  // Hex packing is wider than it is deep, so derive the cell radius from the
  // target length and let the width fall out of it.
  const spanFactor = (cols - 1) * Math.sqrt(3) + Math.sqrt(3) / 2;
  const length = combExtent * GEL_LENGTH;
  const R = length / spanFactor;
  const stepX = Math.sqrt(3) * R;
  const stepZ = 1.5 * R;
  const depth = (rows - 1) * stepZ;
  const originX = -length / 2;
  const originZ = -depth / 2;

  for (let index = 0; index < count; index += 1) {
    const cell = cells[index];
    const col = index % cols;
    const row = Math.floor(index / cols);

    if (row >= rows) {
      cell.gel = { x: 0, z: 0, height: 0, radius: 0, seal: false, label: false };
      continue;
    }

    const u = cols > 1 ? col / (cols - 1) : 0.5;
    const v = rows > 1 ? row / (rows - 1) : 0.5;
    const seal = u < GEL_SEAL || u > 1 - GEL_SEAL;

    // Pillow: fattest down the centre line, tapering to the side seams and
    // flat where the ends are crimped.
    let height = 0.05;
    if (!seal) {
      const span = (u - GEL_SEAL) / (1 - 2 * GEL_SEAL);
      height =
        0.07 +
        0.85 *
          Math.pow(Math.sin(Math.PI * span), 0.7) *
          Math.pow(Math.sin(Math.PI * v), 0.6);
    }

    cell.gel = {
      x: originX + col * stepX + (row % 2) * (stepX / 2),
      z: originZ + row * stepZ,
      height,
      radius: R,
      seal,
      label: u > 0.4 && u < 0.6,
    };
  }

  const width = (cols - 1) * stepX + stepX / 2;
  return {
    halfX: (width / 2 + R) * GEL_PLATE_MARGIN.x,
    halfZ: (depth / 2 + R) * GEL_PLATE_MARGIN.z,
  };
}

const HEX_ANGLES = [0, 1, 2, 3, 4, 5].map((k) => (k * Math.PI) / 3);
/** Baked key direction. Not a light — the shade is written into vertex colors. */
const KEY = new THREE.Vector3(0.86, 0.2, 0.47).normalize();

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Vertices per cell: 6 top triangles + 6 side quads. */
const VERTS_PER_CELL = 54;
/** Edge segments per cell: top ring, verticals, bottom ring. */
const EDGES_PER_CELL = 18;

/**
 * One merged, non-indexed BufferGeometry for the whole comb, plus a matching
 * line buffer for its outlines: 2 draw calls for ~225 cells instead of 450.
 *
 * The buffers are rewritten in place as the comb morphs into the packet, so
 * the outlines are built by hand rather than with EdgesGeometry — the edge
 * topology never changes, only the positions, and re-deriving edges every
 * frame would cost far more than writing them.
 *
 * Bottom faces are omitted — never visible from an isometric camera on a plate.
 */
export function createCombGeometry(cells: Cell[]): THREE.BufferGeometry {
  const positions = new Float32Array(cells.length * VERTS_PER_CELL * 3);
  const colors = new Float32Array(cells.length * VERTS_PER_CELL * 3);

  // Wall shading is baked from a fixed key direction and never changes, so it
  // is written once here and left alone by the per-frame writer.
  const shade = new THREE.Color();
  const normal = new THREE.Vector3();
  for (let c = 0; c < cells.length; c += 1) {
    let at = (c * VERTS_PER_CELL + 18) * 3;
    for (let i = 0; i < 6; i += 1) {
      const mid = HEX_ANGLES[i] + Math.PI / 6;
      normal.set(Math.sin(mid), 0, Math.cos(mid));
      const k = Math.max(0, normal.dot(KEY));
      shade.copy(PALETTE.amber).multiplyScalar(0.24 + 0.34 * k);
      for (let v = 0; v < 6; v += 1) {
        colors[at++] = shade.r;
        colors[at++] = shade.g;
        colors[at++] = shade.b;
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

export function createEdgeGeometry(cells: Cell[]): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(
      new Float32Array(cells.length * EDGES_PER_CELL * 2 * 3),
      3,
    ),
  );
  return geometry;
}

const ringX = new Float32Array(6);
const ringZ = new Float32Array(6);
const topColor = new THREE.Color();
const combTop = new THREE.Color();
const gelTop = new THREE.Color();

/**
 * Write both buffers for a given morph: 0 is the honeycomb, 1 is the gel
 * packet. Call it only when the morph actually moves — it is the whole cost of
 * the transition, and it is zero while the value sits at either end.
 */
export function writeCombGeometry(
  solid: THREE.BufferGeometry,
  edges: THREE.BufferGeometry,
  cells: Cell[],
  morph: number,
): void {
  const positions = solid.getAttribute('position').array as Float32Array;
  const colors = solid.getAttribute('color').array as Float32Array;
  const lines = edges.getAttribute('position').array as Float32Array;

  let p = 0;
  let c = 0;
  let l = 0;

  for (const cell of cells) {
    const gel = cell.gel;
    const x = mix(cell.x, gel.x, morph);
    const z = mix(cell.z, gel.z, morph);
    const height = mix(cell.height, gel.height, morph);
    const radius =
      mix(CELL_RADIUS, gel.radius, morph) * CELL_INSET;

    for (let i = 0; i < 6; i += 1) {
      ringX[i] = Math.sin(HEX_ANGLES[i]) * radius;
      ringZ[i] = Math.cos(HEX_ANGLES[i]) * radius;
    }

    // Empty comb cells read dim; on the packet the seal is dull and the
    // printed band is bright.
    combTop.copy(PALETTE.amber);
    if (cell.flat) combTop.multiplyScalar(0.34);
    gelTop.copy(PALETTE.amber);
    if (gel.label) gelTop.lerp(PALETTE.bone, 0.78);
    if (gel.seal) gelTop.multiplyScalar(0.45);
    topColor.copy(combTop).lerp(gelTop, morph);

    // Top face, wound counter-clockwise seen from +Y so it is not culled.
    for (let i = 0; i < 6; i += 1) {
      const j = (i + 1) % 6;
      positions[p++] = x;
      positions[p++] = height;
      positions[p++] = z;
      positions[p++] = x + ringX[i];
      positions[p++] = height;
      positions[p++] = z + ringZ[i];
      positions[p++] = x + ringX[j];
      positions[p++] = height;
      positions[p++] = z + ringZ[j];
      for (let v = 0; v < 3; v += 1) {
        colors[c++] = topColor.r;
        colors[c++] = topColor.g;
        colors[c++] = topColor.b;
      }
    }

    // Side walls. Colors were written once at creation.
    c += 36 * 3;
    for (let i = 0; i < 6; i += 1) {
      const j = (i + 1) % 6;
      positions[p++] = x + ringX[i];
      positions[p++] = 0;
      positions[p++] = z + ringZ[i];
      positions[p++] = x + ringX[j];
      positions[p++] = 0;
      positions[p++] = z + ringZ[j];
      positions[p++] = x + ringX[j];
      positions[p++] = height;
      positions[p++] = z + ringZ[j];

      positions[p++] = x + ringX[i];
      positions[p++] = 0;
      positions[p++] = z + ringZ[i];
      positions[p++] = x + ringX[j];
      positions[p++] = height;
      positions[p++] = z + ringZ[j];
      positions[p++] = x + ringX[i];
      positions[p++] = height;
      positions[p++] = z + ringZ[i];
    }

    // Outlines: top ring, verticals, bottom ring.
    for (let i = 0; i < 6; i += 1) {
      const j = (i + 1) % 6;
      lines[l++] = x + ringX[i];
      lines[l++] = height;
      lines[l++] = z + ringZ[i];
      lines[l++] = x + ringX[j];
      lines[l++] = height;
      lines[l++] = z + ringZ[j];

      lines[l++] = x + ringX[i];
      lines[l++] = 0;
      lines[l++] = z + ringZ[i];
      lines[l++] = x + ringX[i];
      lines[l++] = height;
      lines[l++] = z + ringZ[i];

      lines[l++] = x + ringX[i];
      lines[l++] = 0;
      lines[l++] = z + ringZ[i];
      lines[l++] = x + ringX[j];
      lines[l++] = 0;
      lines[l++] = z + ringZ[j];
    }
  }

  solid.getAttribute('position').needsUpdate = true;
  solid.getAttribute('color').needsUpdate = true;
  edges.getAttribute('position').needsUpdate = true;
  solid.computeBoundingSphere();
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
