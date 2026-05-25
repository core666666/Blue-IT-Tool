(() => {
  'use strict';

  const GAME_DURATION = 60;
  const HOLE_COUNT = 9;
  const STORAGE_KEY = 'wam-best-score';

  const DIFFICULTY_CONFIG = {
    normal: {
      name: '普通',
      spawnMin: 850,
      spawnMax: 1300,
      moleVisibleMin: 900,
      moleVisibleMax: 1250,
      hitBonus: 0,
    },
    fast: {
      name: '快速',
      spawnMin: 650,
      spawnMax: 1000,
      moleVisibleMin: 750,
      moleVisibleMax: 1050,
      hitBonus: 2,
    },
    crazy: {
      name: '疯狂',
      spawnMin: 430,
      spawnMax: 760,
      moleVisibleMin: 600,
      moleVisibleMax: 850,
      hitBonus: 4,
    },
  };

  const LEVEL_CONFIG = [
    { name: '第 1 关', targetScore: 80, spawnBoost: 0, visibilityBoost: 0, specialBias: 0.02, comboCap: 20, timeBonus: 4 },
    { name: '第 2 关', targetScore: 140, spawnBoost: -70, visibilityBoost: -60, specialBias: 0.04, comboCap: 24, timeBonus: 5 },
    { name: '第 3 关', targetScore: 210, spawnBoost: -120, visibilityBoost: -120, specialBias: 0.06, comboCap: 28, timeBonus: 6 },
    { name: '第 4 关', targetScore: 290, spawnBoost: -170, visibilityBoost: -170, specialBias: 0.08, comboCap: 32, timeBonus: 7 },
    { name: '第 5 关', targetScore: 380, spawnBoost: -230, visibilityBoost: -220, specialBias: 0.10, comboCap: 36, timeBonus: 0 },
  ];

  const MOLE_TYPES = {
    normal: {
      label: '普通地鼠',
      score: 10,
      className: 'normal',
      effect: '',
      image: '../assets/images/whack_a_mole/normal.png',
    },
    double: {
      label: '双倍分',
      score: 20,
      className: 'double',
      effect: '双倍分！',
      image: '../assets/images/whack_a_mole/double.svg',
    },
    freeze: {
      label: '冰冻地鼠',
      score: 15,
      className: 'freeze',
      effect: '全场冻结！',
      image: '../assets/images/whack_a_mole/freeze.svg',
    },
    bomb: {
      label: '炸弹地鼠',
      score: 25,
      className: 'bomb',
      effect: '爆炸清场！',
      image: '../assets/images/whack_a_mole/bomb.svg',
    },
  };

  const state = {
    running: false,
    ended: false,
    score: 0,
    bestScore: 0,
    timeLeft: GAME_DURATION,
    combo: 0,
    lastHitAt: 0,
    difficulty: 'normal',
    level: 1,
    levelScore: 0,
    levelTarget: LEVEL_CONFIG[0].targetScore,
    levelLabel: LEVEL_CONFIG[0].name,
    spawnTimer: null,
    countdownTimer: null,
    currentMoles: new Map(),
    freezeUntil: 0,
    doubleUntil: 0,
    lastSpawnAt: 0,
    completed: false,
  };

  let boardEl;
  let scoreEl;
  let timeLeftEl;
  let comboEl;
  let bestScoreEl;
  let levelEl;
  let progressEl;
  let effectTextEl;
  let resultOverlayEl;
  let resultTextEl;
  let startBtnEl;
  let restartBtnEl;
  let playAgainBtnEl;
  let closeResultBtnEl;
  let chipEls = [];

  function initDom() {
    boardEl = document.getElementById('board');
    scoreEl = document.getElementById('score');
    timeLeftEl = document.getElementById('timeLeft');
    comboEl = document.getElementById('combo');
    bestScoreEl = document.getElementById('bestScore');
    levelEl = document.getElementById('level');
    progressEl = document.getElementById('progress');
    effectTextEl = document.getElementById('effectText');
    resultOverlayEl = document.getElementById('resultOverlay');
    resultTextEl = document.getElementById('resultText');
    startBtnEl = document.getElementById('startBtn');
    restartBtnEl = document.getElementById('restartBtn');
    playAgainBtnEl = document.getElementById('playAgainBtn');
    closeResultBtnEl = document.getElementById('closeResultBtn');
    chipEls = Array.from(document.querySelectorAll('.wam-chip'));

    const storedBest = Number(localStorage.getItem(STORAGE_KEY) || '0');
    state.bestScore = Number.isFinite(storedBest) ? storedBest : 0;
    bestScoreEl.textContent = String(state.bestScore);
    updateLevelUI();
    updateProgressUI();
  }

  function bindEvents() {
    startBtnEl.addEventListener('click', startGame);
    restartBtnEl.addEventListener('click', restartGame);
    playAgainBtnEl.addEventListener('click', () => {
      hideResult();
      startGame();
    });
    closeResultBtnEl.addEventListener('click', hideResult);

    chipEls.forEach((chip) => {
      chip.addEventListener('click', () => {
        if (state.running) {
          toast('游戏中不能切换难度，先重开一局');
          return;
        }

        chipEls.forEach((el) => el.classList.remove('active'));
        chip.classList.add('active');
        state.difficulty = chip.dataset.speed || 'normal';
        effectTextEl.textContent = `已切换为 ${DIFFICULTY_CONFIG[state.difficulty].name}`;
      });
    });

    boardEl.querySelectorAll('.hole').forEach((hole) => {
      hole.addEventListener('click', () => handleHoleClick(hole));
    });

    window.addEventListener('visibilitychange', () => {
      if (document.hidden && state.running) {
        pauseTimers();
      } else if (!document.hidden && state.running) {
        resumeTimers();
      }
    });
  }

  function startGame() {
    resetState();
    state.running = true;
    state.ended = false;
    state.completed = false;
    state.timeLeft = GAME_DURATION;
    state.score = 0;
    state.level = 1;
    state.levelScore = 0;
    state.levelTarget = LEVEL_CONFIG[0].targetScore;
    state.levelLabel = LEVEL_CONFIG[0].name;
    state.combo = 0;
    state.lastHitAt = 0;
    state.freezeUntil = 0;
    state.doubleUntil = 0;
    state.currentMoles.clear();

    updateUI();
    hideResult();
    clearBoard();
    effectTextEl.textContent = '游戏开始！快点地鼠！';
    updateLevelUI();
    updateProgressUI();

    startCountdown();
    startSpawning();
  }

  function restartGame() {
    stopTimers();
    clearBoard();
    startGame();
  }

  function resetState() {
    stopTimers();
    state.currentMoles.forEach((mole) => clearTimeout(mole.hideTimer));
    state.currentMoles.clear();
  }

  function pauseTimers() {
    stopTimers();
    state.running = false;
    effectTextEl.textContent = '游戏已暂停';
  }

  function resumeTimers() {
    if (state.timeLeft <= 0 || state.ended || state.completed) return;
    state.running = true;
    startCountdown();
    startSpawning();
    effectTextEl.textContent = '继续游戏';
    setTimeout(() => {
      if (state.running) {
        effectTextEl.textContent = '快点地鼠！';
      }
    }, 700);
  }

  function stopTimers() {
    if (state.spawnTimer) {
      clearInterval(state.spawnTimer);
      state.spawnTimer = null;
    }
    if (state.countdownTimer) {
      clearInterval(state.countdownTimer);
      state.countdownTimer = null;
    }
  }

  function startCountdown() {
    if (state.countdownTimer) clearInterval(state.countdownTimer);

    state.countdownTimer = setInterval(() => {
      if (!state.running) return;

      state.timeLeft -= 1;
      updateUI();

      if (state.timeLeft <= 0) {
        endGame(false);
      }
    }, 1000);
  }

  function startSpawning() {
    if (state.spawnTimer) clearInterval(state.spawnTimer);

    const tick = () => {
      if (!state.running || state.timeLeft <= 0 || state.completed) return;

      const now = Date.now();
      if (now < state.freezeUntil) {
        effectTextEl.textContent = '全场冻结中...';
        return;
      }

      const spawnDelay = getSpawnDelay();
      if (now - state.lastSpawnAt < spawnDelay) return;

      spawnRandomMole();
      state.lastSpawnAt = now;
    };

    state.spawnTimer = setInterval(tick, 120);
  }

  function getCurrentLevelConfig() {
    return LEVEL_CONFIG[Math.min(state.level - 1, LEVEL_CONFIG.length - 1)];
  }

  function getSpawnDelay() {
    const difficulty = DIFFICULTY_CONFIG[state.difficulty];
    const levelConfig = getCurrentLevelConfig();

    const minDelay = Math.max(280, difficulty.spawnMin + levelConfig.spawnBoost);
    const maxDelay = Math.max(minDelay + 120, difficulty.spawnMax + levelConfig.spawnBoost);
    return randomBetween(minDelay, maxDelay);
  }

  function getVisibleTime() {
    const difficulty = DIFFICULTY_CONFIG[state.difficulty];
    const levelConfig = getCurrentLevelConfig();

    const minTime = Math.max(350, difficulty.moleVisibleMin + levelConfig.visibilityBoost);
    const maxTime = Math.max(minTime + 120, difficulty.moleVisibleMax + levelConfig.visibilityBoost);
    return randomBetween(minTime, maxTime);
  }

  function spawnRandomMole() {
    const availableHoles = getAvailableHoles();
    if (availableHoles.length === 0) return;

    const hole = availableHoles[Math.floor(Math.random() * availableHoles.length)];
    const type = chooseMoleType();

    showMole(hole, type);
  }

  function getAvailableHoles() {
    return Array.from(boardEl.querySelectorAll('.hole')).filter((hole) => {
      return !hole.classList.contains('up') && !hole.classList.contains('hit');
    });
  }

  function chooseMoleType() {
    const levelConfig = getCurrentLevelConfig();
    const roll = Math.random();
    const specialBias = levelConfig.specialBias;
    const difficultyBoost = state.difficulty === 'crazy' ? 0.03 : state.difficulty === 'fast' ? 0.015 : 0;

    if (roll < 0.06 + specialBias + difficultyBoost) return 'bomb';
    if (roll < 0.18 + specialBias + difficultyBoost) return 'freeze';
    if (roll < 0.34 + specialBias) return 'double';
    return 'normal';
  }

  function showMole(hole, type) {
    const moleInfo = MOLE_TYPES[type];
    const mole = document.createElement('img');
    mole.className = `mole ${moleInfo.className}`;
    mole.src = moleInfo.image;
    mole.alt = moleInfo.label;
    mole.decoding = 'async';
    mole.loading = 'eager';
    mole.draggable = false;
    mole.dataset.type = type;
    hole.dataset.moleType = type;

    hole.appendChild(mole);
    hole.classList.add('up');
    applyHoleStyle(hole, type);

    const hideTimer = setTimeout(() => hideMole(hole, false), getVisibleTime());
    state.currentMoles.set(hole, {
      mole,
      type,
      hideTimer,
      appearedAt: Date.now(),
    });
  }

  function hideMole(hole, hit) {
    const moleState = state.currentMoles.get(hole);
    if (!moleState) return;

    clearTimeout(moleState.hideTimer);
    if (moleState.mole && moleState.mole.parentNode) {
      moleState.mole.remove();
    }

    hole.classList.remove('up');
    hole.classList.remove('hit');
    clearHoleStyle(hole);

    state.currentMoles.delete(hole);

    if (!hit && state.running) {
      breakCombo();
    }
  }

  function handleHoleClick(hole) {
    if (!state.running || state.timeLeft <= 0 || state.completed) return;
    if (!hole.classList.contains('up')) return;

    const moleState = state.currentMoles.get(hole);
    if (!moleState) return;

    const moleType = moleState.type;
    const moleInfo = MOLE_TYPES[moleType];

    clearTimeout(moleState.hideTimer);
    hole.classList.add('hit');

    const isDoubleActive = Date.now() < state.doubleUntil;
    const levelConfig = getCurrentLevelConfig();
    const baseScore = moleInfo.score + DIFFICULTY_CONFIG[state.difficulty].hitBonus;
    const comboBonus = Math.min(state.combo * 2, levelConfig.comboCap);
    const earnedScore = Math.max(1, baseScore + comboBonus) * (isDoubleActive ? 2 : 1);

    state.score += earnedScore;
    state.levelScore += earnedScore;
    state.combo += 1;
    state.lastHitAt = Date.now();

    effectTextEl.textContent = moleInfo.effect || (isDoubleActive ? '双倍得分！' : `+${earnedScore}`);

    if (moleType === 'freeze') {
      activateFreeze();
    } else if (moleType === 'double') {
      activateDoubleScore();
    } else if (moleType === 'bomb') {
      triggerBomb(hole);
    }

    updateUI();
    updateProgressUI();
    toast(`命中 ${moleInfo.label} +${earnedScore}`);

    setTimeout(() => hideMole(hole, true), 160);
    spawnReplacementAfterHit();
    checkLevelAdvance();
  }

  function spawnReplacementAfterHit() {
    if (!state.running || state.timeLeft <= 0 || state.completed) return;
    setTimeout(() => {
      if (state.running && Date.now() >= state.freezeUntil) {
        spawnRandomMole();
      }
    }, randomBetween(140, 300));
  }

  function activateFreeze() {
    state.freezeUntil = Date.now() + 4000;
    effectTextEl.textContent = '❄️ 全场冻结 4 秒！';

    boardEl.querySelectorAll('.hole').forEach((hole) => {
      if (hole.classList.contains('up')) {
        hole.classList.add('freeze');
      }
    });

    setTimeout(() => {
      boardEl.querySelectorAll('.hole.freeze').forEach((hole) => hole.classList.remove('freeze'));
    }, 4000);
  }

  function activateDoubleScore() {
    state.doubleUntil = Date.now() + 5000;
    effectTextEl.textContent = '✨ 双倍分数 5 秒！';

    boardEl.querySelectorAll('.hole').forEach((hole) => {
      if (hole.classList.contains('up')) {
        hole.classList.add('double');
      }
    });

    setTimeout(() => {
      boardEl.querySelectorAll('.hole.double').forEach((hole) => hole.classList.remove('double'));
    }, 5000);
  }

  function triggerBomb(hole) {
    const holeIndex = Number(hole.dataset.hole);
    const neighbours = getNeighbourHoles(holeIndex);
    effectTextEl.textContent = '💣 炸弹清场！';

    [holeIndex, ...neighbours].forEach((index) => {
      const targetHole = getHoleByIndex(index);
      if (!targetHole || !targetHole.classList.contains('up')) return;

      const moleState = state.currentMoles.get(targetHole);
      if (!moleState) return;

      clearTimeout(moleState.hideTimer);
      if (targetHole !== hole) {
        state.score += 5;
        state.levelScore += 5;
      }
      setTimeout(() => hideMole(targetHole, true), 100);
    });

    updateUI();
    updateProgressUI();
    checkLevelAdvance();
  }

  function getNeighbourHoles(index) {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const neighbours = [];

    for (let r = row - 1; r <= row + 1; r += 1) {
      for (let c = col - 1; c <= col + 1; c += 1) {
        if (r === row && c === col) continue;
        if (r < 0 || r > 2 || c < 0 || c > 2) continue;
        neighbours.push(r * 3 + c);
      }
    }

    return neighbours;
  }

  function getHoleByIndex(index) {
    return boardEl.querySelector(`.hole[data-hole="${index}"]`);
  }

  function applyHoleStyle(hole, type) {
    hole.classList.remove('freeze', 'bomb', 'double');
    if (type === 'freeze') hole.classList.add('freeze');
    if (type === 'bomb') hole.classList.add('bomb');
    if (type === 'double') hole.classList.add('double');
  }

  function clearHoleStyle(hole) {
    hole.classList.remove('freeze', 'bomb', 'double');
    delete hole.dataset.moleType;
  }

  function clearBoard() {
    boardEl.querySelectorAll('.hole').forEach((hole) => {
      hole.classList.remove('up', 'hit', 'freeze', 'bomb', 'double');
      hole.innerHTML = '';
      delete hole.dataset.moleType;
    });
  }

  function breakCombo() {
    if (state.combo > 0) {
      state.combo = 0;
      updateUI();
    }
  }

  function checkLevelAdvance() {
    while (state.levelScore >= state.levelTarget && state.level < LEVEL_CONFIG.length && state.running && !state.completed) {
      advanceLevel();
    }

    if (state.levelScore >= state.levelTarget && state.level >= LEVEL_CONFIG.length && state.running && !state.completed) {
      finishChallenge();
    }
  }

  function advanceLevel() {
    const currentIndex = state.level - 1;
    const currentConfig = LEVEL_CONFIG[currentIndex];
    state.level += 1;
    state.levelScore = 0;
    state.levelTarget = LEVEL_CONFIG[state.level - 1].targetScore;

    const bonus = currentConfig.timeBonus || 0;
    if (bonus > 0) {
      state.timeLeft = Math.min(99, state.timeLeft + bonus);
    }

    effectTextEl.textContent = `${currentConfig.name} 通过！进入 ${LEVEL_CONFIG[state.level - 1].name}`;
    updateLevelUI();
    updateProgressUI();
    updateUI();
    toast(`${currentConfig.name} 通过！+${bonus}秒`);
  }

  function finishChallenge() {
    state.completed = true;
    endGame(true);
  }

  function endGame(completed = false) {
    if (state.ended) return;

    state.ended = true;
    state.running = false;
    stopTimers();

    state.currentMoles.forEach((mole) => clearTimeout(mole.hideTimer));
    state.currentMoles.clear();

    clearBoard();
    updateUI();
    updateProgressUI();

    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      localStorage.setItem(STORAGE_KEY, String(state.bestScore));
      bestScoreEl.textContent = String(state.bestScore);
    }

    if (completed) {
      resultTextEl.textContent = `恭喜通关！你完成了全部 ${LEVEL_CONFIG.length} 关，最终得分 ${state.score}。${state.score === state.bestScore ? '并刷新了最佳记录！' : ''}`;
      effectTextEl.textContent = '挑战完成！';
    } else {
      resultTextEl.textContent = `你的得分是 ${state.score}${state.score === state.bestScore ? '，刷新了最佳记录！' : ''}`;
    }

    showResult();
  }

  function showResult() {
    resultOverlayEl.classList.add('show');
    resultOverlayEl.setAttribute('aria-hidden', 'false');
  }

  function hideResult() {
    resultOverlayEl.classList.remove('show');
    resultOverlayEl.setAttribute('aria-hidden', 'true');
  }

  function updateLevelUI() {
    if (levelEl) {
      levelEl.textContent = String(state.level);
    }

    if (progressEl) {
      const levelName = LEVEL_CONFIG[Math.min(state.level - 1, LEVEL_CONFIG.length - 1)].name;
      progressEl.textContent = `${levelName} / ${state.levelScore}/${state.levelTarget}`;
    }
  }

  function updateProgressUI() {
    if (!progressEl) return;
    const progressPercent = Math.min(100, Math.round((state.levelScore / state.levelTarget) * 100));
    const levelName = LEVEL_CONFIG[Math.min(state.level - 1, LEVEL_CONFIG.length - 1)].name;
    progressEl.textContent = `${levelName} ${progressPercent}% (${state.levelScore}/${state.levelTarget})`;
  }

  function updateUI() {
    scoreEl.textContent = String(state.score);
    timeLeftEl.textContent = String(Math.max(0, state.timeLeft));
    comboEl.textContent = String(state.combo);
    bestScoreEl.textContent = String(state.bestScore);
    updateLevelUI();
  }

  function toast(message) {
    let toastEl = document.querySelector('.wam-toast');
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'wam-toast';
      document.body.appendChild(toastEl);
    }

    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastEl._hideTimer);
    toastEl._hideTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 1400);
  }

  function randomBetween(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
  }

  function init() {
    initDom();
    bindEvents();
    effectTextEl.textContent = '准备开始';
    updateUI();
    updateProgressUI();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
