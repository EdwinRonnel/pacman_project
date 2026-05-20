import { SCATTER_TARGETS, GHOST_HOUSE_ENTRANCE, DIR } from './constants.js';
import { pixelToTile, neighborTile, euclidean } from './utils.js';

function aheadOf(pacman, steps) {
  const { col, row } = pacman.tilePosition;
  const d = { UP:[0,-1], DOWN:[0,1], LEFT:[-1,0], RIGHT:[1,0] }[pacman.direction];
  return { col: col + d[0] * steps, row: row + d[1] * steps };
}

export function getTargetTile(ghost, mode, pacman, blinky, maze) {
  if (mode === 'SCATTER') return SCATTER_TARGETS[ghost.name];
  if (mode === 'FRIGHTENED') return _randomTarget(ghost, maze);
  if (mode === 'EATEN') return GHOST_HOUSE_ENTRANCE;

  // CHASE
  switch (ghost.name) {
    case 'Blinky': return pacman.tilePosition;
    case 'Pinky':  return aheadOf(pacman, 4);
    case 'Inky': {
      const pivot = aheadOf(pacman, 2);
      const bt = blinky.tilePosition;
      return { col: pivot.col * 2 - bt.col, row: pivot.row * 2 - bt.row };
    }
    case 'Clyde': {
      const dist = euclidean(ghost.tilePosition, pacman.tilePosition);
      return dist > 8 ? pacman.tilePosition : SCATTER_TARGETS['Clyde'];
    }
  }
  return pacman.tilePosition;
}

function _randomTarget(ghost, maze) {
  const dirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  const { col, row } = ghost.tilePosition;
  const valid = dirs.filter(d => {
    const nb = neighborTile(col, row, d);
    return maze.isGhostWalkable(nb.col, nb.row);
  });
  const pick = valid[Math.floor(Math.random() * valid.length)] || 'UP';
  const nb = neighborTile(col, row, pick);
  return nb;
}
