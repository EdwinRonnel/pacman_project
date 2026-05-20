import { MAP_DATA, TILE, COLS, ROWS } from './constants.js';

export class Maze {
  constructor() {
    this._original = MAP_DATA.map(row => [...row]);
    this._tiles = MAP_DATA.map(row => [...row]);
  }

  getTile(col, row) {
    if (row < 0 || row >= ROWS) return TILE.WALL;
    if (col < 0 || col >= COLS) return TILE.TUNNEL;
    return this._tiles[row][col];
  }

  isWall(col, row) {
    return this.getTile(col, row) === TILE.WALL;
  }

  isWalkable(col, row) {
    const t = this.getTile(col, row);
    return t !== TILE.WALL && t !== TILE.GHOST_HOUSE;
  }

  isGhostWalkable(col, row) {
    return this.getTile(col, row) !== TILE.WALL;
  }

  hasDot(col, row) {
    const t = this.getTile(col, row);
    return t === TILE.DOT || t === TILE.PELLET;
  }

  hasPellet(col, row) {
    return this.getTile(col, row) === TILE.PELLET;
  }

  eatDot(col, row) {
    const t = this.getTile(col, row);
    if (t === TILE.DOT) { this._tiles[row][col] = TILE.EMPTY; return 10; }
    if (t === TILE.PELLET) { this._tiles[row][col] = TILE.EMPTY; return 50; }
    return 0;
  }

  remainingDots() {
    let count = 0;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const t = this._tiles[r][c];
        if (t === TILE.DOT || t === TILE.PELLET) count++;
      }
    return count;
  }

  reset() {
    this._tiles = this._original.map(row => [...row]);
  }
}
