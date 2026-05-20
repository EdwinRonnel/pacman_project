import { TILE_SIZE, COLS, ROWS } from './constants.js';

export function tileToPixel(col, row) {
  return { x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2 };
}

export function pixelToTile(x, y) {
  return { col: Math.floor(x / TILE_SIZE), row: Math.floor(y / TILE_SIZE) };
}

export function euclidean(a, b) {
  const dc = a.col - b.col, dr = a.row - b.row;
  return Math.sqrt(dc * dc + dr * dr);
}

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

export function wrapCol(col) {
  if (col < 0) return COLS - 1;
  if (col >= COLS) return 0;
  return col;
}

export function neighborTile(col, row, dirName) {
  const map = { UP: [0,-1], DOWN: [0,1], LEFT: [-1,0], RIGHT: [1,0] };
  const [dc, dr] = map[dirName];
  return { col: col + dc, row: row + dr };
}

export function dirAngle(dirName) {
  return { RIGHT: 0, DOWN: Math.PI / 2, LEFT: Math.PI, UP: -Math.PI / 2 }[dirName] ?? 0;
}
