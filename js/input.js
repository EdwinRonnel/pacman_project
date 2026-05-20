export class InputHandler {
  constructor() {
    this._next = null;
    this._enter = false;
    this._onKey = this._onKey.bind(this);
    window.addEventListener('keydown', this._onKey);
  }

  _onKey(e) {
    const map = {
      ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
      w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
    };
    if (map[e.key]) { this._next = map[e.key]; e.preventDefault(); }
    if (e.key === 'Enter' || e.key === ' ') { this._enter = true; e.preventDefault(); }
  }

  getNextDirection() { return this._next; }
  consumeNextDirection() { this._next = null; }

  isEnterPressed() {
    if (this._enter) { this._enter = false; return true; }
    return false;
  }

  destroy() { window.removeEventListener('keydown', this._onKey); }
}
