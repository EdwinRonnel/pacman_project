import { GAME_STATE, MODE_SCHEDULE, GHOST_COLORS, TILE } from './constants.js';
import { Maze } from './maze.js';
import { Pacman } from './pacman.js';
import { Ghost } from './ghost.js';
import { ScoreManager } from './score.js';
import { InputHandler } from './input.js';
import { Renderer } from './renderer.js';
import { clamp } from './utils.js';

const DYING_DURATION = 2000;
const LEVEL_CLEAR_DURATION = 2000;

export class Game {
  constructor(canvas) {
    this._canvas = canvas;
    this._state = GAME_STATE.TITLE;
    this._input = new InputHandler();
    this._score = new ScoreManager();
    this._maze = new Maze();

    this._pacman = new Pacman(this._maze, this._input);
    this._ghosts = [
      new Ghost('Blinky', GHOST_COLORS.Blinky, this._maze),
      new Ghost('Pinky',  GHOST_COLORS.Pinky,  this._maze),
      new Ghost('Inky',   GHOST_COLORS.Inky,   this._maze),
      new Ghost('Clyde',  GHOST_COLORS.Clyde,  this._maze),
    ];

    this._renderer = new Renderer(canvas, this._maze, this._pacman, this._ghosts, this._score);

    this._modeIndex = 0;
    this._modeTimer = 0;
    this._dyingTimer = 0;
    this._levelClearTimer = 0;
    this._ghostCombo = 0;
    this._lastTime = null;

    this._loop = this._loop.bind(this);
  }

  start() { requestAnimationFrame(this._loop); }

  _loop(ts) {
    if (this._lastTime === null) this._lastTime = ts;
    const dt = clamp(ts - this._lastTime, 0, 50);
    this._lastTime = ts;

    this._update(dt);
    this._renderer.render(this._state, this._dyingProgress());

    requestAnimationFrame(this._loop);
  }

  _update(dt) {
    switch (this._state) {
      case GAME_STATE.TITLE:
        if (this._input.isEnterPressed()) { this._score.reset(); this._startLevel(); }
        break;

      case GAME_STATE.PLAYING:
        this._stepModeSchedule(dt);
        this._pacman.update(dt);
        const blinky = this._ghosts[0];
        for (const g of this._ghosts) g.update(dt, this._pacman, blinky);
        this._checkDotCollect();
        this._checkGhostCollision();
        if (this._maze.remainingDots() === 0) this._setState(GAME_STATE.LEVEL_CLEAR);
        break;

      case GAME_STATE.DYING:
        this._dyingTimer += dt;
        if (this._dyingTimer >= DYING_DURATION) {
          const alive = this._score.loseLife();
          if (alive) { this._resetEntities(); this._setState(GAME_STATE.PLAYING); }
          else        { this._setState(GAME_STATE.GAME_OVER); }
        }
        break;

      case GAME_STATE.LEVEL_CLEAR:
        this._levelClearTimer += dt;
        if (this._levelClearTimer >= LEVEL_CLEAR_DURATION) {
          this._score.nextLevel();
          this._maze.reset();
          this._resetEntities();
          this._setState(GAME_STATE.PLAYING);
        }
        break;

      case GAME_STATE.GAME_OVER:
      case GAME_STATE.WIN:
        if (this._input.isEnterPressed()) this._setState(GAME_STATE.TITLE);
        break;
    }
  }

  _checkDotCollect() {
    const { col, row } = this._pacman.tilePosition;
    const t = this._maze.getTile(col, row);
    if (t === TILE.DOT || t === TILE.PELLET) {
      const pts = this._maze.eatDot(col, row);
      this._score.addPoints(pts);
      if (t === TILE.PELLET) {
        this._ghostCombo = 0;
        for (const g of this._ghosts) g.frighten();
      }
    }
  }

  _checkGhostCollision() {
    const px = this._pacman.x, py = this._pacman.y;
    const threshold = 12;
    for (const g of this._ghosts) {
      const dx = g.x - px, dy = g.y - py;
      if (Math.sqrt(dx*dx + dy*dy) > threshold) continue;
      if (g.isEaten) continue;
      if (g.isFrightened) {
        g.eat();
        const pts = this._score.addGhostPoints(this._ghostCombo);
        this._ghostCombo++;
      } else {
        this._pacman.die();
        this._setState(GAME_STATE.DYING);
        return;
      }
    }
  }

  _stepModeSchedule(dt) {
    if (this._modeIndex >= MODE_SCHEDULE.length - 1) return;
    const sched = MODE_SCHEDULE[this._modeIndex];
    if (sched.duration === Infinity) return;
    this._modeTimer += dt;
    if (this._modeTimer >= sched.duration) {
      this._modeTimer = 0;
      this._modeIndex++;
      const next = MODE_SCHEDULE[this._modeIndex].mode;
      for (const g of this._ghosts) g.setGlobalMode(next);
    }
  }

  _setState(s) {
    this._state = s;
    if (s === GAME_STATE.DYING) { this._dyingTimer = 0; }
    if (s === GAME_STATE.LEVEL_CLEAR) { this._levelClearTimer = 0; }
  }

  _startLevel() {
    this._maze.reset();
    this._resetEntities();
    this._modeIndex = 0;
    this._modeTimer = 0;
    this._setState(GAME_STATE.PLAYING);
  }

  _resetEntities() {
    this._pacman.reset();
    for (const g of this._ghosts) g.reset();
    this._ghostCombo = 0;
  }

  _dyingProgress() {
    return this._state === GAME_STATE.DYING ? Math.min(this._dyingTimer / DYING_DURATION, 1) : 0;
  }
}
