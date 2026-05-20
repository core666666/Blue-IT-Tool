(() => {
  'use strict';

  const STORAGE_KEY = 'memory-light-records';
  const BOARD_SIZE = 9;

  const MODE_CONFIG = {
    easy: {
      name: '简单',
      startLength: 3,
      flashOn: 520,
      flashOff: 220,
      inputTimeout: 3500,
      scorePerStep: 8,
    },
    normal: {
      name: '普通',
      startLength: 4,
      flashOn: 420,
      flashOff: 180,
      inputTimeout: 3000,
      scorePerStep: 10,
    },
    hard: {
      name: '困难',
      startLength: 5,
      flashOn: 320,
      flashOff: 140,
      inputTimeout: 2600,
      scorePerStep: 12,
    },
  };

  const state = {
    mode: 'easy',
    level: 1,
    score: 0,
    bestLevel: 1,
    bestScore: 0,
    sequence: [],
    inputIndex: 0,
    phase: 'idle', // idle | showing | input | over
    timeoutId: null,
    inputTimerId: null,
    hideResultTimerId: null,
  };

  let boardEl;
  let startBtnEl;
  let restartBtnEl;
  let playAgainBtnEl;
  let closeResultBtnEl;
  let statusTextEl;
  let levelValueEl;
  let scoreValueEl;
  let bestLevelValueEl;
  let bestScoreValueEl;
  let resultOverlayEl;
  let resultEmojiEl;
  let resultTitleEl;
  let resultTextEl;
  let chipEls = [];
  let cellEls = [];

  function initDom() {
    boardEl = document.getElementById('board');
    startBtnEl = document.getElementById('startBtn');
    restartBtnEl = document.getElementById('restartBtn');
    playAgainBtnEl = document.getElementById('playAgainBtn');
    closeResultBtnEl = document.getElementById('closeResultBtn');
    statusTextEl = document.getElementById('statusText');
    levelValueEl = document.getElementById('levelValue');
    scoreValueEl = document.getElementById('scoreValue');
    bestLevelValueEl = document.getElementById('bestLevelValue');
    bestScoreValueEl = document.getElementById('bestScoreValue');
    resultOverlayEl = document.getElementById('resultOverlay');
    resultEmojiEl = document.getElementById('resultEmoji');
    resultTitleEl = document.getElementById('resultTitle');
    resultTextEl = document.getElementById('resultText');
    chipEls = Array.from(document.querySelectorAll('.ml-chip'));
    cellEls = Array.from(document.querySelectorAll('.ml-cell'));

    const saved = loadRecords();
    state.bestLevel = saved.bestLevel;
    state.bestScore = saved.bestScore;
    updateRecordsUI();
    updateStatsUI();
  }

  function bindEvents() {
    startBtnEl.addEventListener('click', () => startGame());
    restartBtnEl.addEventListener('click', () => restartGame());
    playAgainBtnEl.addEventListener('click', () => {
      hideResult();
      startGame();
    });
    closeResultBtnEl.addEventListener('click', hideResult);

    chipEls.forEach((chip) => {
      chip.addEventListener('click', () => {
        if (state.phase === 'showing' || state.phase === 'input') {
          toast('游戏进行中，先完成这一局再切换难度');
          return;
        }

        chipEls.forEach((el) => el.classList.remove('active'));
        chip.classList.add('active');
        state.mode = chip.dataset.mode || 'easy';
        state.level = 1;
        state.score = 0;
        state.sequence = [];
        state.inputIndex = 0;
        state.phase = 'idle';
        updateStatsUI();
        statusTextEl.textContent = `已切换到 ${MODE_CONFIG[state.mode].name} 模式`;
      });
    });

    cellEls.forEach((cell) => {
      cell.addEventListener('click', () => handleCellClick(Number(cell.dataset.index)));
    });

    window.addEventListener('resize', () => {
      syncBoardGrid();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && state.phase === 'showing') {
        clearTimers();
        state.phase = 'idle';
        statusTextEl.textContent = '页面已离开，展示已暂停';
      }
    });
  }

  function loadRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { bestLevel: 1, bestScore: 0 };
      }

      const parsed = JSON.parse(raw);
      return {
        bestLevel: Number(parsed.bestLevel) || 1,
        bestScore: Number(parsed.bestScore) || 0,
      };
    } catch (error) {
      return { bestLevel: 1, bestScore: 0 };
    }
  }

  function saveRecords() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          bestLevel: state.bestLevel,
          bestScore: state.bestScore,
        })
      );
    } catch (error) {
      // ignore
    }
  }

  function updateRecordsUI() {
    bestLevelValueEl.textContent = String(state.bestLevel);
    bestScoreValueEl.textContent = String(state.bestScore);
  }

  function updateStatsUI() {
    levelValueEl.textContent = String(state.level);
    scoreValueEl.textContent = String(state.score);
    bestLevelValueEl.textContent = String(state.bestLevel);
    bestScoreValueEl.textContent = String(state.bestScore);
  }

  function syncBoardGrid() {
    const size = Math.min(Math.floor((boardEl.getBoundingClientRect().width - 16) / 3), 140);
    boardEl.style.setProperty('--cell-size', `${Math.max(72, size)}px`);
  }

  function startGame() {
    clearTimers();
    hideResult();
    resetBoard();
    state.level = 1;
    state.score = 0;
    state.sequence = [];
    state.inputIndex = 0;
    state.phase = 'idle';
    updateStatsUI();
    statusTextEl.textContent = '准备好了，马上开始！';
    syncBoardGrid();

    setTimeout(() => nextRound(), 500);
  }

  function restartGame() {
    clearTimers();
    hideResult();
    resetBoard();
    state.level = 1;
    state.score = 0;
    state.sequence = [];
    state.inputIndex = 0;
    state.phase = 'idle';
    updateStatsUI();
    statusTextEl.textContent = '已重新开始';
  }

  function nextRound() {
    state.phase = 'showing';
    state.inputIndex = 0;
    const cfg = MODE_CONFIG[state.mode];
    const roundLength = cfg.startLength + state.level - 1;
    state.sequence = buildSequence(roundLength);

    statusTextEl.textContent = `第 ${state.level} 关：观察顺序`;
    disableCells(true);
    showSequence();
  }

  function buildSequence(length) {
    const sequence = [];
    let previous = -1;

    for (let i = 0; i < length; i += 1) {
      let index = getRandomIndex();
      while (index === previous) {
        index = getRandomIndex();
      }
      sequence.push(index);
      previous = index;
    }

    return sequence;
  }

  function getRandomIndex() {
    return Math.floor(Math.random() * BOARD_SIZE);
  }

  function showSequence() {
    const cfg = MODE_CONFIG[state.mode];
    const sequence = [...state.sequence];
    let current = 0;

    const playNext = () => {
      if (current >= sequence.length) {
        state.phase = 'input';
        statusTextEl.textContent = '轮到你了，按顺序点击！';
        disableCells(false);
        startInputTimeout();
        return;
      }

      const index = sequence[current];
      flashCell(index, true);
      current += 1;

      state.timeoutId = window.setTimeout(() => {
        flashCell(index, false);
        state.timeoutId = window.setTimeout(playNext, cfg.flashOff);
      }, cfg.flashOn);
    };

    playNext();
  }

  function flashCell(index, active) {
    const cell = cellEls[index];
    if (!cell) return;

    cell.classList.toggle('active', active);
    if (active) {
      cell.classList.add('glow');
    } else {
      window.setTimeout(() => cell.classList.remove('glow'), 80);
    }
  }

  function handleCellClick(index) {
    if (state.phase !== 'input') return;

    const expectedIndex = state.sequence[state.inputIndex];
    flashCell(index, true);
    window.setTimeout(() => flashCell(index, false), 160);

    if (index !== expectedIndex) {
      failRound(index, expectedIndex);
      return;
    }

    state.inputIndex += 1;
    state.score += MODE_CONFIG[state.mode].scorePerStep;
    updateStatsUI();
    restartInputTimeout();

    if (state.inputIndex >= state.sequence.length) {
      completeRound();
    } else {
      statusTextEl.textContent = `很好，还剩 ${state.sequence.length - state.inputIndex} 步`;
    }
  }

  function failRound(clickedIndex, expectedIndex) {
    clearTimers();
    state.phase = 'over';
    disableCells(true);

    const wrongCell = cellEls[clickedIndex];
    const expectedCell = cellEls[expectedIndex];
    if (wrongCell) wrongCell.classList.add('wrong');
    if (expectedCell) expectedCell.classList.add('hint');

    state.bestLevel = Math.max(state.bestLevel, state.level);
    state.bestScore = Math.max(state.bestScore, state.score);
    saveRecords();
    updateRecordsUI();

    statusTextEl.textContent = '点错了，挑战结束！';
    showResult(
      '😵',
      '挑战失败',
      `你停在第 ${state.level} 关，得分 ${state.score}。再试一次吧！`
    );

    state.hideResultTimerId = window.setTimeout(() => {
      if (wrongCell) wrongCell.classList.remove('wrong');
      if (expectedCell) expectedCell.classList.remove('hint');
    }, 1000);
  }

  function completeRound() {
    clearTimers();
    disableCells(true);

    state.bestLevel = Math.max(state.bestLevel, state.level);
    state.bestScore = Math.max(state.bestScore, state.score);
    saveRecords();
    updateRecordsUI();
    updateStatsUI();

    const reachedLevel = state.level;
    statusTextEl.textContent = `第 ${reachedLevel} 关完成！准备下一关`;

    showResult(
      '🎉',
      '本关通过',
      `你成功完成第 ${reachedLevel} 关，已获得 ${state.score} 分！`
    );

    state.level += 1;
    updateStatsUI();

    window.setTimeout(() => {
      hideResult();
      resetCellsState();
      nextRound();
    }, 1200);
  }

  function startInputTimeout() {
    clearInputTimeout();
    const timeout = MODE_CONFIG[state.mode].inputTimeout;

    state.inputTimerId = window.setTimeout(() => {
      if (state.phase !== 'input') return;
      state.bestLevel = Math.max(state.bestLevel, state.level);
      state.bestScore = Math.max(state.bestScore, state.score);
      saveRecords();
      updateRecordsUI();
      state.phase = 'over';
      disableCells(true);
      statusTextEl.textContent = '超时了，挑战结束！';
      showResult(
        '⏳',
        '时间到了',
        `你停在第 ${state.level} 关，得分 ${state.score}。`
      );
    }, timeout);
  }

  function restartInputTimeout() {
    if (state.phase !== 'input') return;
    startInputTimeout();
  }

  function clearTimers() {
    if (state.timeoutId) {
      clearTimeout(state.timeoutId);
      state.timeoutId = null;
    }
    clearInputTimeout();
    if (state.hideResultTimerId) {
      clearTimeout(state.hideResultTimerId);
      state.hideResultTimerId = null;
    }
  }

  function clearInputTimeout() {
    if (state.inputTimerId) {
      clearTimeout(state.inputTimerId);
      state.inputTimerId = null;
    }
  }

  function disableCells(disabled) {
    cellEls.forEach((cell) => {
      cell.disabled = disabled;
      if (disabled) {
        cell.classList.add('disabled');
      } else {
        cell.classList.remove('disabled');
      }
    });
  }

  function resetCellsState() {
    cellEls.forEach((cell) => {
      cell.classList.remove('active', 'glow', 'wrong', 'hint');
    });
  }

  function resetBoard() {
    resetCellsState();
    disableCells(true);
    hideResult();
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

  function toast(message) {
    let toastEl = document.querySelector('.ml-toast');
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'ml-toast';
      document.body.appendChild(toastEl);
    }

    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastEl._hideTimer);
    toastEl._hideTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 1400);
  }

  function init() {
    initDom();
    bindEvents();
    syncBoardGrid();
    statusTextEl.textContent = '准备开始';
    disableCells(true);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
