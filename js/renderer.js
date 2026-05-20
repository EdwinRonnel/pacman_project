import { TILE_SIZE, COLS, ROWS, TILE, GAME_STATE } from './constants.js';
import { tileToPixel } from './utils.js';

export class Renderer {
  constructor(canvas, maze, pacman, ghosts, score) {
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._maze = maze;
    this._pacman = pacman;
    this._ghosts = ghosts;
    this._score = score;
  }

  render(state, dyingProgress) {
    const ctx = this._ctx;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

    this._drawMaze();
    this._drawDots();

    if (state === GAME_STATE.PLAYING || state === GAME_STATE.DYING || state === GAME_STATE.LEVEL_CLEAR) {
      if (state === GAME_STATE.DYING) {
        this._drawDyingPacman(dyingProgress);
      } else {
        this._drawPacman();
      }
      for (const g of this._ghosts) this._drawGhost(g);
    }

    this._drawHUD();

    if (state === GAME_STATE.TITLE)       this._drawOverlay('PACMAN', 'Press ENTER to Start', '#FFD700');
    if (state === GAME_STATE.GAME_OVER)   this._drawOverlay('GAME OVER', 'Press ENTER to Restart', '#FF0000');
    if (state === GAME_STATE.WIN)         this._drawOverlay('YOU WIN!', 'Press ENTER to Play Again', '#00FF00');
    if (state === GAME_STATE.LEVEL_CLEAR) this._drawOverlay('LEVEL CLEAR!', '', '#FFD700');
  }

  _drawMaze() {
    const ctx = this._ctx;
    ctx.fillStyle = '#1a1aff';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this._maze.isWall(c, r)) {
          ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }
    // inner border highlight
    ctx.strokeStyle = '#4444ff';
    ctx.lineWidth = 1;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this._maze.isWall(c, r)) {
          ctx.strokeRect(c * TILE_SIZE + 0.5, r * TILE_SIZE + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        }
      }
    }
  }

  _drawDots() {
    const ctx = this._ctx;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = this._maze.getTile(c, r);
        const p = tileToPixel(c, r);
        if (t === TILE.DOT) {
          ctx.fillStyle = '#ffb8ae';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (t === TILE.PELLET) {
          if (Math.floor(Date.now() / 250) % 2 === 0) {
            ctx.fillStyle = '#ffb8ae';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }

  _drawPacman() {
    const ctx = this._ctx;
    const x = this._pacman.x, y = this._pacman.y;
    const r = TILE_SIZE / 2 - 1;
    const angle = this._pacman.mouthAngle;
    const rot = { RIGHT: 0, DOWN: Math.PI/2, LEFT: Math.PI, UP: -Math.PI/2 }[this._pacman.direction] ?? 0;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, angle, Math.PI * 2 - angle);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _drawDyingPacman(progress) {
    const ctx = this._ctx;
    const x = this._pacman.x, y = this._pacman.y;
    const r = TILE_SIZE / 2 - 1;
    const angle = Math.PI * progress; // mouth opens to full circle

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, angle, Math.PI * 2 - angle);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _drawGhost(ghost) {
    if (ghost.isEaten) {
      this._drawGhostEyes(ghost);
      return;
    }
    const ctx = this._ctx;
    const x = ghost.x, y = ghost.y;
    const r = TILE_SIZE / 2 - 1;
    const top = y - r, left = x - r;
    const w = r * 2, h = r * 2;

    let bodyColor;
    if (ghost.isFrightened) {
      bodyColor = ghost.isFlashing && Math.floor(Date.now() / 200) % 2 ? '#fff' : '#0000cc';
    } else {
      bodyColor = ghost.color;
    }

    ctx.fillStyle = bodyColor;
    // body: semicircle top + rectangle
    ctx.beginPath();
    ctx.arc(x, top + r, r, Math.PI, 0);
    ctx.lineTo(left + w, top + h);
    // scalloped bottom
    const scW = w / 3;
    ctx.arc(left + w - scW/2, top + h, scW/2, 0, Math.PI);
    ctx.arc(left + scW + scW/2, top + h, scW/2, 0, Math.PI);
    ctx.arc(left + scW/2, top + h, scW/2, 0, Math.PI);
    ctx.lineTo(left, top + r);
    ctx.closePath();
    ctx.fill();

    if (ghost.isFrightened) {
      // eyes (dots)
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x - r/3, y - r/4, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + r/3, y - r/4, 2, 0, Math.PI*2); ctx.fill();
      // wavy mouth
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - r/2, y + r/4);
      for (let i = 0; i <= 4; i++) {
        const wx = x - r/2 + (r * i / 4);
        const wy = y + r/4 + (i % 2 === 0 ? 2 : -2);
        ctx.lineTo(wx, wy);
      }
      ctx.stroke();
    } else {
      this._drawGhostEyes(ghost);
    }
  }

  _drawGhostEyes(ghost) {
    const ctx = this._ctx;
    const x = ghost.x, y = ghost.y;
    const r = TILE_SIZE / 2 - 1;
    const eyeOff = r / 3;
    const eyeR = r / 3;
    const irisOff = { UP:[0,-1], DOWN:[0,1], LEFT:[-1,0], RIGHT:[1,0] }[ghost.direction] ?? [0,0];

    for (const ex of [x - eyeOff, x + eyeOff]) {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ex, y - r/4, eyeR, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#00f';
      ctx.beginPath(); ctx.arc(ex + irisOff[0]*2, y - r/4 + irisOff[1]*2, eyeR/2, 0, Math.PI*2); ctx.fill();
    }
  }

  _drawHUD() {
    const ctx = this._ctx;
    const bottom = ROWS * TILE_SIZE + 14;
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(`SCORE: ${this._score.score}`, 4, bottom);
    ctx.fillText(`HI: ${this._score.highScore}`, 120, bottom);
    ctx.fillText(`LVL: ${this._score.level}`, 220, bottom);

    // lives as small Pacman icons
    for (let i = 0; i < this._score.lives - 1; i++) {
      const lx = 290 + i * 20, ly = bottom - 5;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.arc(lx, ly, 6, 0.3, Math.PI * 2 - 0.3);
      ctx.closePath();
      ctx.fill();
    }
  }

  _drawOverlay(title, sub, color) {
    const ctx = this._ctx;
    const cw = this._canvas.width, ch = this._canvas.height;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = color;
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(title, cw/2, ch/2 - 10);
    if (sub) {
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText(sub, cw/2, ch/2 + 20);
    }
    ctx.textAlign = 'left';
  }
}
