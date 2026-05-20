import { POINTS } from './constants.js';

export class ScoreManager {
  constructor() {
    this._score = 0;
    this._lives = 3;
    this._level = 1;
    this._high = parseInt(localStorage.getItem('pacmanHighScore') || '0', 10);
  }

  addPoints(pts) {
    this._score += pts;
    if (this._score > this._high) {
      this._high = this._score;
      localStorage.setItem('pacmanHighScore', this._high);
    }
  }

  addGhostPoints(comboIndex) {
    const pts = POINTS.GHOST[Math.min(comboIndex, 3)];
    this.addPoints(pts);
    return pts;
  }

  loseLife() {
    this._lives--;
    return this._lives > 0;
  }

  nextLevel() { this._level++; }

  reset() { this._score = 0; this._lives = 3; this._level = 1; }

  get score() { return this._score; }
  get lives() { return this._lives; }
  get level() { return this._level; }
  get highScore() { return this._high; }
}
