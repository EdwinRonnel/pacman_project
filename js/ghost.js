import { TILE_SIZE, SPEEDS, FRIGHTENED_DURATION, FRIGHTENED_FLASH_START, GHOST_START, GHOST_HOUSE_ENTRANCE } from './constants.js';
import { tileToPixel, pixelToTile, neighborTile, euclidean, wrapCol } from './utils.js';
import { getTargetTile } from './ai.js';

const DIRS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
const OPP  = { UP:'DOWN', DOWN:'UP', LEFT:'RIGHT', RIGHT:'LEFT' };

export class Ghost {
  constructor(name, color, maze) {
    this.name = name;
    this.color = color;
    this._maze = maze;
    this._mode = 'HOUSE';
    this._globalMode = 'SCATTER';
    this._frightenedTimer = 0;
    this._houseTimer = { Blinky: 0, Pinky: 500, Inky: 3000, Clyde: 6000 }[name];
    this._dir = 'UP';
    this._justReversed = false;
    this.reset();
  }

  reset() {
    const start = GHOST_START[this.name];
    const p = tileToPixel(start.col, start.row);
    this._x = p.x;
    this._y = p.y;
    this._mode = this.name === 'Blinky' ? 'LEAVING' : 'HOUSE';
    this._frightenedTimer = 0;
    this._dir = 'UP';
  }

  setGlobalMode(mode) {
    if (this._mode === 'FRIGHTENED' || this._mode === 'EATEN' || this._mode === 'HOUSE' || this._mode === 'LEAVING') return;
    this._globalMode = mode;
    this._mode = mode;
    this._justReversed = true;
  }

  frighten() {
    if (this._mode === 'EATEN' || this._mode === 'HOUSE' || this._mode === 'LEAVING') return;
    this._mode = 'FRIGHTENED';
    this._frightenedTimer = FRIGHTENED_DURATION;
    this._justReversed = true;
  }

  eat() {
    this._mode = 'EATEN';
    this._frightenedTimer = 0;
  }

  update(dt, pacman, blinky) {
    if (this._mode === 'HOUSE') {
      this._houseTimer -= dt;
      if (this._houseTimer <= 0) this._mode = 'LEAVING';
      return;
    }

    if (this._mode === 'FRIGHTENED') {
      this._frightenedTimer -= dt;
      if (this._frightenedTimer <= 0) {
        this._mode = this._globalMode;
      }
    }

    if (this._mode === 'LEAVING') {
      this._moveToEntrance(dt);
      return;
    }

    const speed = this._speed();
    const sec = dt / 1000;
    const { col, row } = pixelToTile(this._x, this._y);
    const cx = col * TILE_SIZE + TILE_SIZE / 2;
    const cy = row * TILE_SIZE + TILE_SIZE / 2;
    const dist = Math.abs(this._x - cx) + Math.abs(this._y - cy);

    if (dist < speed * sec + 0.5) {
      this._x = cx; this._y = cy;
      const target = getTargetTile(this, this._mode, pacman, blinky, this._maze);
      this._dir = this._chooseDir(col, row, target);
    }

    const d = { UP:[0,-1], DOWN:[0,1], LEFT:[-1,0], RIGHT:[1,0] }[this._dir];
    this._x += d[0] * speed * sec;
    this._y += d[1] * speed * sec;

    const totalW = 28 * TILE_SIZE;
    if (this._x < 0) this._x += totalW;
    if (this._x >= totalW) this._x -= totalW;
  }

  _moveToEntrance(dt) {
    const entrance = tileToPixel(GHOST_HOUSE_ENTRANCE.col, GHOST_HOUSE_ENTRANCE.row);
    const speed = SPEEDS.GHOST_NORMAL;
    const sec = dt / 1000;
    const dx = entrance.x - this._x, dy = entrance.y - this._y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < speed * sec + 1) {
      this._x = entrance.x; this._y = entrance.y;
      this._mode = this._globalMode;
    } else {
      this._x += (dx / dist) * speed * sec;
      this._y += (dy / dist) * speed * sec;
    }
  }

  _chooseDir(col, row, target) {
    const opp = this._justReversed ? null : OPP[this._dir];
    this._justReversed = false;

    let best = null, bestDist = Infinity;
    for (const d of DIRS) {
      if (d === opp) continue;
      const nb = neighborTile(col, row, d);
      const nc = wrapCol(nb.col);
      if (!this._maze.isGhostWalkable(nc, nb.row)) continue;
      if (this._mode !== 'EATEN' && this._maze.getTile(nc, nb.row) === 4) continue;
      const dist = euclidean({ col: nc, row: nb.row }, target);
      if (dist < bestDist) { bestDist = dist; best = d; }
    }
    return best || this._dir;
  }

  _speed() {
    if (this._mode === 'EATEN') return SPEEDS.GHOST_EATEN;
    if (this._mode === 'FRIGHTENED') return SPEEDS.GHOST_FRIGHTENED;
    return SPEEDS.GHOST_NORMAL;
  }

  get x() { return this._x; }
  get y() { return this._y; }
  get tilePosition() { return pixelToTile(this._x, this._y); }
  get direction() { return this._dir; }
  get mode() { return this._mode; }
  get isFrightened() { return this._mode === 'FRIGHTENED'; }
  get isEaten() { return this._mode === 'EATEN'; }
  get isFlashing() {
    return this._mode === 'FRIGHTENED' && this._frightenedTimer < FRIGHTENED_FLASH_START;
  }
}
