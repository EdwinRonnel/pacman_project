import { TILE_SIZE, SPEEDS } from './constants.js';
import { tileToPixel, pixelToTile, wrapCol, neighborTile } from './utils.js';

const START_COL = 14, START_ROW = 23;

export class Pacman {
  constructor(maze, input) {
    this._maze = maze;
    this._input = input;
    this._dir = 'LEFT';
    this._nextDir = null;
    this._mouthTimer = 0;
    this._dead = false;
    this._deathTimer = 0;
    this.reset();
  }

  reset() {
    const p = tileToPixel(START_COL, START_ROW);
    this._x = p.x;
    this._y = p.y;
    this._dir = 'LEFT';
    this._nextDir = null;
    this._dead = false;
    this._deathTimer = 0;
  }

  update(dt) {
    if (this._dead) {
      this._deathTimer += dt;
      return;
    }

    const sec = dt / 1000;
    const speed = SPEEDS.PACMAN;

    const buffered = this._input.getNextDirection();
    if (buffered) this._nextDir = buffered;

    const { col, row } = pixelToTile(this._x, this._y);
    const cx = col * TILE_SIZE + TILE_SIZE / 2;
    const cy = row * TILE_SIZE + TILE_SIZE / 2;
    const dist = Math.abs(this._x - cx) + Math.abs(this._y - cy);

    if (dist < speed * sec + 1) {
      // snap to center before turning
      if (this._nextDir) {
        const nb = neighborTile(col, row, this._nextDir);
        if (this._maze.isWalkable(nb.col, nb.row)) {
          this._x = cx; this._y = cy;
          this._dir = this._nextDir;
          this._nextDir = null;
          this._input.consumeNextDirection();
        }
      }
    }

    const nb = neighborTile(col, row, this._dir);
    const canMove = this._maze.isWalkable(wrapCol(nb.col), nb.row);

    if (canMove) {
      const dirVec = { UP:[0,-1], DOWN:[0,1], LEFT:[-1,0], RIGHT:[1,0] }[this._dir];
      this._x += dirVec[0] * speed * sec;
      this._y += dirVec[1] * speed * sec;

      // tunnel wrap
      const totalW = 28 * TILE_SIZE;
      if (this._x < 0) this._x += totalW;
      if (this._x >= totalW) this._x -= totalW;
    }

    this._mouthTimer += dt;
  }

  die() { this._dead = true; this._deathTimer = 0; }

  get x() { return this._x; }
  get y() { return this._y; }
  get tilePosition() { return pixelToTile(this._x, this._y); }
  get direction() { return this._dir; }
  get mouthAngle() {
    return 0.05 + 0.35 * (0.5 + 0.5 * Math.sin(this._mouthTimer / 150));
  }
  get dead() { return this._dead; }
  get deathTimer() { return this._deathTimer; }
}
