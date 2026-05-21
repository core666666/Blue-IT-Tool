(() => {
  'use strict';

  const BOARD_WIDTH = 6;
  const BOARD_HEIGHT = 6;
  const START_POS = { x: 0, y: 5 };
  const REWIND_STEPS = 3;
  const MAX_FOLDS = 2;
  const ECHO_TTL = 15000;

  const MAP = {
    start: START_POS,
    plateA: { x: 1, y: 3 },
    plateB: { x: 3, y: 4 },
    door: { x: 4, y: 1 },
    exit: { x: 5, y: 0 },
    walls: new Set([
      '2,1',
      '2,2',
      '2,3',
    ]),
  };

  const state = {
    running: false,
    won: false,
    player: { ...START_POS },
    path: [{ ...START_POS }],
    foldCount: MAX_FOLDS,
    stepCount: 0,
    echoes: [],
    nextEchoId: 1,
    doorOpen: false,
    cellEls: new Map(),
    echoTimers: new Map(),
  };

  let boardEl;
  let foldCountEl;
  let echoCountEl;
  let stepCountEl;
  let stateTextEl;
  let statusTextEl;
  let startBtnEl;
  let resetBtnEl;
  let foldBtnEl;
  let foldQuickBtnEl;
  let playAgainBtnEl;
  let closeResultBtnEl;
  let resultOverlayEl;
  let resultEmojiEl;
  let resultTitleEl;
  let resultTextEl;
  let padButtons = [];

  function initDom() {
    boardEl = document.getElementById('board');
    foldCountEl = document.getElementById('foldCount');
    echoCountEl = document.getElementById('echoCount');
    stepCountEl = document.getElementById('stepCount');
    stateTextEl = document.getElementById('stateText');
    statusTextEl = document.getElementById('statusText');
    startBtnEl = document.getElementById('startBtn');
    resetBtnEl = document.getElementById('resetBtn');
    foldBtnEl = document.getElementById('foldBtn');
    foldQuickBtnEl = document.getElementById('foldQuickBtn');
    playAgainBtnEl = document.getElementById('playAgainBtn');
    closeResultBtnEl = document.getElementById('closeResultBtn');
    resultOverlayEl = document.getElementById('resultOverlay');
    resultEmojiEl = document.getElementById('resultEmoji');
    resultTitleEl = document.getElementById('resultTitle');
    resultTextEl = document.getElementById('resultText');
    padButtons = Array.from(document.querySelectorAll('.tf-pad-btn[data-dir]'));

    buildBoard();
  }

  function buildBoard() {
    boardEl.innerHTML = '';
    state.cellEls.clear();

    for (let y = 0; y < BOARD_HEIGHT; y += 1) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        const cell = document.createElement('div');
        cell.className = 'tf-cell';
        cell.dataset.x = String(x);
        cell.dataset.y = String(y);
        boardEl.appendChild(cell);
        state.cellEls.set(keyOf(x, y), cell);
      }
    }
  }

  function bindEvents() {
    startBtnEl.addEventListener('click', startGame);
    resetBtnEl.addEventListener('click', resetGame);
    foldBtnEl.addEventListener('click', foldTime);
    foldQuickBtnEl.addEventListener('click', foldTime);
    playAgainBtnEl.addEventListener('click', () => {
      hideResult();
      startGame();
    });
    closeResultBtnEl.addEventListener('click', hideResult);

    padButtons.forEach((button) => {
      button.addEventListener('click', () => {
        movePlayer(button.dataset.dir);
      });
    });

    window.addEventListener('keydown', handleKeydown);
  }

  function handleKeydown(event) {
    const key = event.key.toLowerCase();
    const directions = {
      arrowup: 'up',
      w: 'up',
      arrowdown: 'down',
      s: 'down',
      arrowleft: 'left',
      a: 'left',
      arrowright: 'right',
      d: 'right',
    };

    if (key in directions) {
      event.preventDefault();
      movePlayer(directions[key]);
      return;
    }

    if (key === ' ' || key === 'enter') {
      event.preventDefault();
      foldTime();
    }
  }

  function startGame() {
    clearAllEchoTimers();
    state.running = true;
    state.won = false;
    state.player = { ...START_POS };
    state.path = [{ ...START_POS }];
    state.foldCount = MAX_FOLDS;
    state.stepCount = 0;
    state.echoes = [];
    state.nextEchoId = 1;
    state.doorOpen = false;
    hideResult();
    updateDoorState();
    updateUI();
    renderBoard();
    statusTextEl.textContent = '出发吧，先踩亮机关，再折叠时间';
    stateTextEl.textContent = '进行中';
  }

  function resetGame() {
    clearAllEchoTimers();
    state.running = false;
    state.won = false;
    state.player = { ...START_POS };
    state.path = [{ ...START_POS }];
    state.foldCount = MAX_FOLDS;
    state.stepCount = 0;
    state.echoes = [];
    state.nextEchoId = 1;
    state.doorOpen = false;
    hideResult();
    updateUI();
    renderBoard();
    statusTextEl.textContent = '已重置，按开始挑战重新来';
    stateTextEl.textContent = '准备开始';
  }

  function movePlayer(direction) {
    if (!state.running || state.won) return;

    const delta = getDelta(direction);
    if (!delta) return;

    const next = {
      x: state.player.x + delta.x,
      y: state.player.y + delta.y,
    };

    if (!isInside(next.x, next.y)) {
      flashStatus('走不出去，边界挡住了');
      return;
    }

    if (isWall(next.x, next.y)) {
      flashStatus('前方是墙，换条路');
      return;
    }

    if (isDoor(next.x, next.y) && !state.doorOpen) {
      flashStatus('门还没打开，需要两个机关同时压住');
      return;
    }

    state.player = next;
    state.path.push({ ...next });
    state.stepCount += 1;
    updateDoorState();
    updateUI();
    renderBoard();

    if (isExit(next.x, next.y) && state.doorOpen) {
      winGame();
      return;
    }

    if (isPlate(next.x, next.y)) {
      flashStatus('机关被压住了，试试折叠时间');
    } else if (isDoor(next.x, next.y)) {
      flashStatus('门已经打开，继续向终点前进');
    } else {
      flashStatus('继续移动，寻找机关');
    }
  }

  function foldTime() {
    if (!state.running || state.won) return;
    if (state.foldCount <= 0) {
      flashStatus('折叠次数已经用完了');
      return;
    }

    if (state.path.length <= 1) {
      flashStatus('至少先走一步再折叠');
      return;
    }

    const origin = { ...state.player };
    createEcho(origin);
    state.foldCount -= 1;

    const targetIndex = Math.max(0, state.path.length - 1 - REWIND_STEPS);
    const targetPos = state.path[targetIndex];
    state.path = state.path.slice(0, targetIndex + 1);
    state.player = { ...targetPos };
    state.stepCount += 1;

    updateDoorState();
    updateUI();
    renderBoard();

    flashStatus(`时间折叠！回退 ${Math.min(REWIND_STEPS, state.path.length - 1)} 步`);
    if (state.doorOpen) {
      stateTextEl.textContent = '门已打开，趁回声还在快过去';
    }

    if (isExit(state.player.x, state.player.y) && state.doorOpen) {
      winGame();
    }
  }

  function createEcho(position) {
    const echo = {
      id: state.nextEchoId,
      x: position.x,
      y: position.y,
    };

    state.nextEchoId += 1;
    state.echoes.push(echo);
    const timerId = window.setTimeout(() => {
      removeEcho(echo.id);
    }, ECHO_TTL);

    state.echoTimers.set(echo.id, timerId);
  }

  function removeEcho(echoId) {
    const timerId = state.echoTimers.get(echoId);
    if (timerId) {
      clearTimeout(timerId);
      state.echoTimers.delete(echoId);
    }

    state.echoes = state.echoes.filter((echo) => echo.id !== echoId);
    updateDoorState();
    updateUI();
    renderBoard();

    if (state.running && !state.won) {
      flashStatus('一个时间回声散掉了');
    }
  }

  function updateDoorState() {
    const plateAHit = isOccupied(MAP.plateA.x, MAP.plateA.y);
    const plateBHit = isOccupied(MAP.plateB.x, MAP.plateB.y);
    state.doorOpen = plateAHit && plateBHit;
  }

  function isOccupied(x, y) {
    const playerOnCell = state.player.x === x && state.player.y === y;
    const echoOnCell = state.echoes.some((echo) => echo.x === x && echo.y === y);
    return playerOnCell || echoOnCell;
  }

  function renderBoard() {
    state.cellEls.forEach((cell, key) => {
      const [x, y] = key.split(',').map(Number);
      const classes = ['tf-cell'];

      if (isWall(x, y)) classes.push('wall');
      if (isPlate(x, y)) classes.push('plate');
      if (isDoor(x, y)) classes.push('door', state.doorOpen ? 'open' : 'closed');
      if (isExit(x, y)) classes.push('exit');
      if (isStart(x, y)) classes.push('start');

      if (isTrail(x, y)) classes.push('trail');
      if (state.echoes.some((echo) => echo.x === x && echo.y === y)) classes.push('echo');
      if (state.player.x === x && state.player.y === y) classes.push('player');

      cell.className = classes.join(' ');
      cell.innerHTML = getCellLabel(x, y);
    });

    highlightObjective();
  }

  function getCellLabel(x, y) {
    if (isStart(x, y)) return '<span>起</span>';
    if (isPlate(x, y)) return '<span>机</span>';
    if (isDoor(x, y)) return `<span>${state.doorOpen ? '门开' : '门锁'}</span>`;
    if (isExit(x, y)) return '<span>终</span>';
    if (isWall(x, y)) return '<span></span>';
    return '';
  }

  function highlightObjective() {
    const plateACell = state.cellEls.get(keyOf(MAP.plateA.x, MAP.plateA.y));
    const plateBCell = state.cellEls.get(keyOf(MAP.plateB.x, MAP.plateB.y));
    if (plateACell && !state.doorOpen) plateACell.classList.add('pulse');
    if (plateBCell && !state.doorOpen) plateBCell.classList.add('pulse');
  }

  function isTrail(x, y) {
    return state.path.slice(0, -1).some((pos) => pos.x === x && pos.y === y);
  }

  function winGame() {
    state.won = true;
    state.running = false;
    clearAllEchoTimers();
    updateUI();
    renderBoard();
    stateTextEl.textContent = '时间稳定，出口已抵达';
    showResult(
      '🕒',
      '时间折叠成功',
      `你用 ${state.stepCount} 步完成了挑战，剩余折叠 ${state.foldCount} 次。`
    );
  }

  function clearAllEchoTimers() {
    state.echoTimers.forEach((timerId) => clearTimeout(timerId));
    state.echoTimers.clear();
  }

  function updateUI() {
    foldCountEl.textContent = String(state.foldCount);
    echoCountEl.textContent = String(state.echoes.length);
    stepCountEl.textContent = String(state.stepCount);
    stateTextEl.textContent = state.won ? '已完成' : (state.running ? (state.doorOpen ? '门已打开' : '折叠待命') : '准备开始');
  }

  function flashStatus(message) {
    statusTextEl.textContent = message;
    window.clearTimeout(statusTextEl._timer);
    statusTextEl._timer = window.setTimeout(() => {
      if (!state.running) {
        statusTextEl.textContent = state.won ? '时间稳定，出口已抵达' : '先开始，然后去试试折叠时间';
        return;
      }

      statusTextEl.textContent = state.doorOpen ? '门已打开，冲向出口' : '去找到两个机关，制造时间回声';
    }, 1800);
  }

  function showResult(emoji, title, text) {
    resultEmojiEl.textContent = emoji;
    resultTitleEl.textContent = title;
    resultTextEl.textContent = text;
    resultOverlayEl.classList.add('show');
    resultOverlayEl.setAttribute('aria-hidden', 'false');
  }

  function hideResult() {
    resultOverlayEl.classList.remove('show');
    resultOverlayEl.setAttribute('aria-hidden', 'true');
  }

  function getDelta(direction) {
    switch (direction) {
      case 'up':
        return { x: 0, y: -1 };
      case 'down':
        return { x: 0, y: 1 };
      case 'left':
        return { x: -1, y: 0 };
      case 'right':
        return { x: 1, y: 0 };
      default:
        return null;
    }
  }

  function isInside(x, y) {
    return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT;
  }

  function isWall(x, y) {
    return MAP.walls.has(keyOf(x, y));
  }

  function isPlate(x, y) {
    return keyOf(x, y) === keyOf(MAP.plateA.x, MAP.plateA.y) || keyOf(x, y) === keyOf(MAP.plateB.x, MAP.plateB.y);
  }

  function isDoor(x, y) {
    return keyOf(x, y) === keyOf(MAP.door.x, MAP.door.y);
  }

  function isExit(x, y) {
    return keyOf(x, y) === keyOf(MAP.exit.x, MAP.exit.y);
  }

  function isStart(x, y) {
    return keyOf(x, y) === keyOf(MAP.start.x, MAP.start.y);
  }

  function keyOf(x, y) {
    return `${x},${y}`;
  }

  function init() {
    initDom();
    bindEvents();
    renderBoard();
    updateUI();
    stateTextEl.textContent = '准备开始';
    statusTextEl.textContent = '先开始，然后去试试折叠时间';
  }

  document.addEventListener('DOMContentLoaded', init);
})();
