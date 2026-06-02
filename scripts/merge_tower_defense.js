(() => {
  'use strict';

  const STORAGE_KEY = 'mtd-best-score';
  const BOARD_ROWS = 5;
  const BOARD_COLS = 5;
  const BASE_HP = 20;
  const START_GOLD = 180;
  const MAX_WAVES = 12;
  const WAVE_CLEAR_BONUS = 35;
  const AUTO_WAVE_DELAY = 2200;
  const MANUAL_UPGRADE_COST_RATE = 0.75;
  const SELL_REFUND_RATE = 0.55;
  const BOARD_GAP = 6;

  const MAPS = [
    {
      name: '折线路径',
      path: [
        [0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 3], [2, 4], [3, 4], [4, 4],
      ],
    },
    {
      name: '蛇形通道',
      path: [
        [0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [4, 4],
      ],
    },
    {
      name: '边境回廊',
      path: [
        [0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2], [3, 3], [2, 3], [1, 3], [1, 4], [2, 4], [3, 4], [4, 4],
      ],
    },
    {
      name: '中心穿插',
      path: [
        [4, 0], [3, 0], [3, 1], [2, 1], [1, 1], [1, 2], [2, 2], [3, 2], [3, 3], [2, 3], [1, 3], [1, 4], [2, 4], [3, 4], [4, 4],
      ],
    },
  ];

  const TOWER_CONFIG = {
    cannon: {
      label: '炮塔',
      emoji: '🟠',
      cost: 50,
      damage: 16,
      range: 1.75,
      cooldown: 920,
      projectileSpeed: 0.28,
      color: '#ff8f3f',
      text: '均衡输出',
    },
    slow: {
      label: '冰冻塔',
      emoji: '❄️',
      cost: 70,
      damage: 8,
      range: 1.95,
      cooldown: 1100,
      projectileSpeed: 0.24,
      color: '#58bfff',
      slowFactor: 0.58,
      text: '减速控场',
    },
    burst: {
      label: '爆裂塔',
      emoji: '💥',
      cost: 90,
      damage: 12,
      range: 1.55,
      cooldown: 1320,
      projectileSpeed: 0.22,
      color: '#ff5d6c',
      splash: 0.8,
      text: '范围爆发',
    },
  };

  const ENEMY_BASE = {
    grunt: { label: '小怪', emoji: '👾', hp: 42, speed: 0.78, reward: 10, color: '#ff8c42', scale: 1 },
    swift: { label: '迅捷怪', emoji: '⚡', hp: 28, speed: 1.12, reward: 12, color: '#ffd54f', scale: 0.92 },
    tank: { label: '重甲怪', emoji: '🛡️', hp: 96, speed: 0.56, reward: 16, color: '#8bc34a', scale: 1.12 },
    elite: { label: '精英怪', emoji: '👹', hp: 165, speed: 0.72, reward: 28, color: '#ff5d6c', scale: 1.1 },
    splitter: { label: '分裂怪', emoji: '🧬', hp: 74, speed: 0.74, reward: 18, color: '#b388ff', scale: 1 },
    regen: { label: '恢复怪', emoji: '💚', hp: 88, speed: 0.66, reward: 20, color: '#4ade80', scale: 1.04, regen: 3.2 },
    ghost: { label: '幽灵怪', emoji: '👻', hp: 52, speed: 0.98, reward: 22, color: '#9ee7ff', scale: 0.98, dodge: 0.18 },
    boss: { label: '首领', emoji: '🐲', hp: 360, speed: 0.48, reward: 60, color: '#f97316', scale: 1.35, regen: 2.5 },
  };

  const state = {
    running: false,
    gameOver: false,
    wave: 1,
    mapIndex: 0,
    maxWave: MAX_WAVES,
    gold: START_GOLD,
    baseHp: BASE_HP,
    score: 0,
    bestScore: Number(localStorage.getItem(STORAGE_KEY) || '0') || 0,
    selectedBuild: 'cannon',
    towers: [],
    enemies: [],
    projectiles: [],
    spawnRemaining: 0,
    spawnTimer: 0,
    spawnInterval: 900,
    waveActive: false,
    waveClearedAt: 0,
    lastFrameAt: 0,
    nextId: 1,
    nextWaveDelayUntil: 0,
    selectedTowerId: null,
    pausedByVisibility: false,
    pausedByUser: false,
    speedMultiplier: 1,
    kills: 0,
    builtCount: 0,
    mergeCount: 0,
    highestTowerLevel: 0,
    rerollsLeft: 0,
    draggingTowerId: null,
  };

  let boardEl;
  let goldTextEl;
  let waveTextEl;
  let baseHpTextEl;
  let scoreTextEl;
  let bestScoreTextEl;
  let modeTextEl;
  let startBtnEl;
  let restartBtnEl;
  let nextWaveBtnEl;
  let pauseBtnEl;
  let speedBtnEl;
  let resultOverlayEl;
  let resultTitleEl;
  let resultTextEl;
  let resultStatsEl;
  let playAgainBtnEl;
  let closeResultBtnEl;
  let selectedTowerTextEl;
  let upgradeTowerBtnEl;
  let sellTowerBtnEl;
  let waveIntelTextEl;
  let waveIntelTagsEl;
  let chipEls = [];

  let boardMetrics = {
    cellSize: 0,
    boardSize: 0,
    originX: 0,
    originY: 0,
    centers: [],
  };

  let animationFrameId = null;

  function initDom() {
    boardEl = document.getElementById('board');
    goldTextEl = document.getElementById('goldText');
    waveTextEl = document.getElementById('waveText');
    baseHpTextEl = document.getElementById('baseHpText');
    scoreTextEl = document.getElementById('scoreText');
    bestScoreTextEl = document.getElementById('bestScoreText');
    modeTextEl = document.getElementById('modeText');
    startBtnEl = document.getElementById('startBtn');
    restartBtnEl = document.getElementById('restartBtn');
    nextWaveBtnEl = document.getElementById('nextWaveBtn');
    pauseBtnEl = document.getElementById('pauseBtn');
    speedBtnEl = document.getElementById('speedBtn');
    resultOverlayEl = document.getElementById('resultOverlay');
    resultTitleEl = document.getElementById('resultTitle');
    resultTextEl = document.getElementById('resultText');
    resultStatsEl = document.getElementById('resultStats');
    playAgainBtnEl = document.getElementById('playAgainBtn');
    closeResultBtnEl = document.getElementById('closeResultBtn');
    selectedTowerTextEl = document.getElementById('selectedTowerText');
    upgradeTowerBtnEl = document.getElementById('upgradeTowerBtn');
    sellTowerBtnEl = document.getElementById('sellTowerBtn');
    waveIntelTextEl = document.getElementById('waveIntelText');
    waveIntelTagsEl = document.getElementById('waveIntelTags');
    chipEls = Array.from(document.querySelectorAll('.mtd-chip'));
  }

  function bindEvents() {
    startBtnEl.addEventListener('click', startGame);
    restartBtnEl.addEventListener('click', restartGame);
    nextWaveBtnEl.addEventListener('click', startWaveIfReady);
    pauseBtnEl.addEventListener('click', togglePause);
    speedBtnEl.addEventListener('click', toggleSpeed);
    upgradeTowerBtnEl.addEventListener('click', upgradeSelectedTower);
    sellTowerBtnEl.addEventListener('click', sellSelectedTower);
    playAgainBtnEl.addEventListener('click', () => {
      hideResult();
      startGame();
    });
    closeResultBtnEl.addEventListener('click', hideResult);

    chipEls.forEach((chip) => {
      chip.addEventListener('click', () => {
        chipEls.forEach((item) => item.classList.remove('active'));
        chip.classList.add('active');
        state.selectedBuild = chip.dataset.build || 'cannon';
        updateModeText();
      });
    });

    window.addEventListener('resize', () => {
      renderBoard();
      renderEntities();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && state.running) {
        state.running = false;
        state.pausedByVisibility = true;
        stopLoop();
        toast('页面已切出，游戏暂停');
        return;
      }

      if (!document.hidden && state.pausedByVisibility && !state.gameOver) {
        state.pausedByVisibility = false;
        if (state.pausedByUser) return;
        state.running = true;
        startLoop();
        toast('页面已恢复，继续游戏');
      }
    });
  }

  function createBoard() {
    boardEl.innerHTML = '';
    boardEl.classList.add('mtd-board-root');
    boardEl.style.setProperty('--board-rows', String(BOARD_ROWS));
    boardEl.style.setProperty('--board-cols', String(BOARD_COLS));

    const grid = document.createElement('div');
    grid.className = 'mtd-grid';
    boardEl.appendChild(grid);

    for (let row = 0; row < BOARD_ROWS; row += 1) {
      for (let col = 0; col < BOARD_COLS; col += 1) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'mtd-cell';
        cell.dataset.row = String(row);
        cell.dataset.col = String(col);

        if (isPathCell(row, col)) {
          cell.classList.add('path');
        } else if (isBaseCell(row, col)) {
          cell.classList.add('base');
        } else {
          cell.classList.add('slot');
        }

        cell.addEventListener('click', () => handleCellClick(row, col));
        cell.addEventListener('dragover', handleCellDragOver);
        cell.addEventListener('drop', (event) => handleCellDrop(event, row, col));
        grid.appendChild(cell);
      }
    }

    const towerLayer = document.createElement('div');
    towerLayer.className = 'mtd-layer mtd-tower-layer';
    towerLayer.id = 'towerLayer';

    const enemyLayer = document.createElement('div');
    enemyLayer.className = 'mtd-layer mtd-enemy-layer';
    enemyLayer.id = 'enemyLayer';

    const projectileLayer = document.createElement('div');
    projectileLayer.className = 'mtd-layer mtd-projectile-layer';
    projectileLayer.id = 'projectileLayer';

    const effectLayer = document.createElement('div');
    effectLayer.className = 'mtd-layer mtd-effect-layer';
    effectLayer.id = 'effectLayer';

    boardEl.appendChild(towerLayer);
    boardEl.appendChild(enemyLayer);
    boardEl.appendChild(projectileLayer);
    boardEl.appendChild(effectLayer);

    recalcBoardMetrics();
    renderBoard();
  }

  function recalcBoardMetrics() {
    const rect = boardEl.getBoundingClientRect();
    const availableWidth = rect.width || 0;
    const cellSize = Math.floor((availableWidth - BOARD_GAP * (BOARD_COLS - 1)) / BOARD_COLS);
    const boardSize = cellSize * BOARD_COLS + BOARD_GAP * (BOARD_COLS - 1);
    const originX = Math.max(0, Math.floor((availableWidth - boardSize) / 2));
    const originY = 0;
    const centers = [];

    for (let row = 0; row < BOARD_ROWS; row += 1) {
      centers[row] = [];
      for (let col = 0; col < BOARD_COLS; col += 1) {
        centers[row][col] = {
          x: originX + col * (cellSize + BOARD_GAP) + cellSize / 2,
          y: originY + row * (cellSize + BOARD_GAP) + cellSize / 2,
        };
      }
    }

    boardMetrics = { cellSize, boardSize, originX, originY, centers };
    boardEl.style.setProperty('--mtd-cell-size', `${cellSize}px`);
    boardEl.style.setProperty('--mtd-board-size', `${boardSize}px`);
  }

  function renderBoard() {
    recalcBoardMetrics();

    const cells = Array.from(boardEl.querySelectorAll('.mtd-cell'));
    cells.forEach((cell) => {
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);
      const tower = getTowerAt(row, col);

      cell.classList.remove('path', 'slot', 'base');
      if (isBaseCell(row, col)) {
        cell.classList.add('base');
      } else if (isPathCell(row, col)) {
        cell.classList.add('path');
      } else {
        cell.classList.add('slot');
      }

      cell.classList.toggle('occupied', Boolean(tower));
      cell.classList.toggle('selected', Boolean(tower && tower.id === state.selectedTowerId));
      cell.classList.toggle('drop-ready', Boolean(state.draggingTowerId && !tower && !isPathCell(row, col)));
      cell.innerHTML = '';

      const badge = document.createElement('div');
      badge.className = 'mtd-cell-badge';

      if (isPathCell(row, col)) {
        badge.textContent = isBaseCell(row, col) ? '🏰' : '路';
      } else if (tower) {
        badge.innerHTML = `<span class="tower-emoji">${TOWER_CONFIG[tower.type].emoji}</span><span class="tower-level">Lv.${tower.level}</span>`;
        cell.draggable = canRepositionTower();
        cell.addEventListener('dragstart', (event) => handleTowerDragStart(event, tower.id));
        cell.addEventListener('dragend', handleTowerDragEnd);
        cell.appendChild(badge);
        return;
      } else {
        cell.draggable = false;
        badge.textContent = '＋';
      }

      cell.appendChild(badge);
    });

    renderEntities();
  }

  function renderEntities() {
    const enemyLayer = document.getElementById('enemyLayer');
    const projectileLayer = document.getElementById('projectileLayer');
    const effectLayer = document.getElementById('effectLayer');
    const towerLayer = document.getElementById('towerLayer');

    if (!enemyLayer || !projectileLayer || !effectLayer || !towerLayer) return;

    enemyLayer.innerHTML = '';
    projectileLayer.innerHTML = '';
    effectLayer.innerHTML = '';
    towerLayer.innerHTML = '';

    state.towers.forEach((tower) => {
      const pos = getCellCenter(tower.row, tower.col);
      if (!pos) return;

      const tierClass = getTowerTierClass(tower.level);
      const stageText = getTowerStageText(tower);
      const el = document.createElement('div');
      el.className = `mtd-tower type-${tower.type} tier-${tierClass}${tower.id === state.selectedTowerId ? ' selected' : ''}`;
      el.style.left = `${pos.x}px`;
      el.style.top = `${pos.y}px`;
      el.innerHTML = `
        <div class="mtd-tower-core">${getTowerEmojiByTier(tower)}</div>
        <div class="mtd-tower-stage">${stageText}</div>
        <div class="mtd-tower-lv">Lv.${tower.level}</div>
        <div class="mtd-tower-ring"></div>
      `;
      towerLayer.appendChild(el);
    });

    state.enemies.forEach((enemy) => {
      const pos = getEnemyPosition(enemy);
      const el = document.createElement('div');
      el.className = `mtd-enemy type-${enemy.type}`;
      el.style.left = `${pos.x}px`;
      el.style.top = `${pos.y}px`;
      el.style.setProperty('--enemy-scale', `${enemy.scale || 1}`);
      el.innerHTML = `
        <div class="mtd-enemy-icon">${enemy.emoji}</div>
        <div class="mtd-hpbar"><span style="width:${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%"></span></div>
      `;
      enemyLayer.appendChild(el);
    });

    state.projectiles.forEach((projectile) => {
      const el = document.createElement('div');
      el.className = `mtd-projectile type-${projectile.type}`;
      el.style.left = `${projectile.x}px`;
      el.style.top = `${projectile.y}px`;
      projectileLayer.appendChild(el);
    });
  }

  function startGame() {
    stopLoop();
    state.running = true;
    state.gameOver = false;
    state.pausedByVisibility = false;
    state.wave = 1;
    state.mapIndex = Math.floor(Math.random() * MAPS.length);
    state.gold = START_GOLD;
    state.baseHp = BASE_HP;
    state.score = 0;
    state.towers = [];
    state.enemies = [];
    state.projectiles = [];
    state.spawnRemaining = 0;
    state.spawnTimer = 0;
    state.waveActive = false;
    state.waveClearedAt = 0;
    state.nextWaveDelayUntil = 0;
    state.selectedTowerId = null;
    state.pausedByUser = false;
    state.speedMultiplier = 1;
    state.kills = 0;
    state.builtCount = 0;
    state.mergeCount = 0;
    state.highestTowerLevel = 0;
    state.rerollsLeft = 1;
    state.draggingTowerId = null;
    hideResult();
    resetBoardOccupancy();
    updateModeText();
    updateHud();
    updateWaveIntel();
    updateControlButtons();
    renderBoard();
    startWave();
    startLoop();
    toast('游戏开始');
  }

  function restartGame() {
    stopLoop();
    startGame();
  }

  function stopLoop() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function startWaveIfReady() {
    if (!state.running || state.waveActive || state.gameOver) return;
    if (state.enemies.length > 0) return;

    state.nextWaveDelayUntil = 0;
    advanceWave();
  }

  function startWave() {
    if (state.wave > state.maxWave) {
      winGame();
      return;
    }

    state.waveActive = true;
    state.spawnRemaining = 6 + state.wave * 2 + Math.floor(state.wave / 3);
    state.spawnTimer = 0;
    state.spawnInterval = Math.max(360, 980 - state.wave * 42);
    state.nextWaveDelayUntil = 0;
    state.rerollsLeft = 1;
    if (state.wave % 6 === 0) showBossAlert();
    toast(`第 ${state.wave} 波来了`);
    updateWaveIntel();
    updateHud();
  }

  function spawnEnemy() {
    const type = pickEnemyType();
    const base = ENEMY_BASE[type];
    const hpScale = 1 + (state.wave - 1) * 0.18;
    const speedScale = 1 + (state.wave - 1) * 0.03;

    state.enemies.push({
      id: state.nextId += 1,
      type,
      emoji: base.emoji,
      label: base.label,
      hp: Math.round(base.hp * hpScale),
      maxHp: Math.round(base.hp * hpScale),
      speed: base.speed * speedScale,
      reward: base.reward + Math.floor(state.wave * 1.2),
      pathIndex: 0,
      progress: 0,
      slowUntil: 0,
      slowFactor: 1,
      scale: base.scale || 1,
      color: base.color,
      regen: base.regen || 0,
      dodge: base.dodge || 0,
    });
  }

  function pickEnemyType() {
    if (state.wave % 6 === 0 && state.spawnRemaining === 1) return 'boss';

    const pool = ['grunt', 'grunt', 'swift'];
    if (state.wave >= 3) pool.push('tank');
    if (state.wave >= 4) pool.push('splitter');
    if (state.wave >= 5) pool.push('regen');
    if (state.wave >= 7) pool.push('ghost');
    if (state.wave >= 9) pool.push('elite', 'elite');

    return pool[Math.floor(Math.random() * pool.length)];
  }

  function update(delta) {
    if (!state.running || state.gameOver) return;

    handleWaveProgress(delta);
    updateEnemies(delta);
    updateProjectiles(delta);
    updateTowers(delta);
    handleAutoWave();
    checkLossCondition();
    updateHud();
    updateTowerPanel();
    updateWaveIntel();
    renderEntities();
  }

  function handleWaveProgress(delta) {
    if (!state.waveActive || state.spawnRemaining <= 0) return;

    state.spawnTimer += delta;
    if (state.spawnTimer >= state.spawnInterval) {
      state.spawnTimer = 0;
      state.spawnRemaining -= 1;
      spawnEnemy();
    }
  }

  function handleAutoWave() {
    if (state.waveActive && state.spawnRemaining <= 0 && state.enemies.length === 0) {
      state.waveActive = false;
      state.projectiles = [];

      if (state.wave >= state.maxWave) {
        winGame();
        return;
      }

      if (state.nextWaveDelayUntil === 0) {
        state.waveClearedAt = performance.now();
        state.nextWaveDelayUntil = state.waveClearedAt + AUTO_WAVE_DELAY;
        state.gold += WAVE_CLEAR_BONUS;
        addGoldFloat(WAVE_CLEAR_BONUS);
        toast(`第 ${state.wave} 波清理完成，奖励 +${WAVE_CLEAR_BONUS} 金币，可重排 1 次`);
        updateHud();
      }
    }

    if (state.waveActive || state.gameOver) return;

    if (state.nextWaveDelayUntil > 0 && performance.now() >= state.nextWaveDelayUntil) {
      state.nextWaveDelayUntil = 0;
      advanceWave();
    }
  }

  function updateEnemies(delta) {
    const now = performance.now();
    const pathCells = getCurrentPathCells();

    for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = state.enemies[i];
      const baseSpeed = now < enemy.slowUntil ? enemy.speed * enemy.slowFactor : enemy.speed;

      if (enemy.regen) {
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.regen * (delta / 1000));
      }

      enemy.progress += (delta / 1000) * baseSpeed;

      while (enemy.progress >= 1) {
        enemy.progress -= 1;
        enemy.pathIndex += 1;
      }

      if (enemy.pathIndex >= pathCells.length - 1) {
        state.baseHp -= enemy.type === 'boss' ? 3 : 1;
        state.enemies.splice(i, 1);
        flashEffect('base-hit');
        continue;
      }
    }
  }

  function updateProjectiles(delta) {
    for (let i = state.projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = state.projectiles[i];
      projectile.life -= delta;

      if (projectile.life <= 0) {
        state.projectiles.splice(i, 1);
        continue;
      }

      const target = state.enemies.find((enemy) => enemy.id === projectile.targetId);
      if (!target) {
        state.projectiles.splice(i, 1);
        continue;
      }

      const targetPos = getEnemyPosition(target);
      const dx = targetPos.x - projectile.x;
      const dy = targetPos.y - projectile.y;
      const distance = Math.hypot(dx, dy);
      const speed = Math.hypot(projectile.vx, projectile.vy);
      const step = speed * delta;
      const hitRadius = Math.max(18, boardMetrics.cellSize * 0.22);

      if (distance <= step + hitRadius) {
        applyProjectileHit(projectile, target);
        state.projectiles.splice(i, 1);
        continue;
      }

      projectile.x += (dx / distance) * step;
      projectile.y += (dy / distance) * step;
    }
  }

  function updateTowers(delta) {
    const now = performance.now();

    state.towers.forEach((tower) => {
      tower.cooldownRemaining = Math.max(0, (tower.cooldownRemaining || 0) - delta);

      if (tower.cooldownRemaining > 0) return;

      const target = findTargetForTower(tower);
      if (!target) return;

      fireTower(tower, target, now);
      tower.cooldownRemaining = getTowerStats(tower).cooldown;
    });
  }

  function findTargetForTower(tower) {
    const stats = getTowerStats(tower);
    const towerPos = getCellCenter(tower.row, tower.col);
    if (!towerPos) return null;

    let chosen = null;
    let bestDistance = Infinity;

    state.enemies.forEach((enemy) => {
      const pos = getEnemyPosition(enemy);
      const distance = Math.hypot(pos.x - towerPos.x, pos.y - towerPos.y);
      if (distance <= stats.rangePx && distance < bestDistance) {
        bestDistance = distance;
        chosen = enemy;
      }
    });

    return chosen;
  }

  function fireTower(tower, target, now) {
    const stats = getTowerStats(tower);
    const towerPos = getCellCenter(tower.row, tower.col);
    const targetPos = getEnemyPosition(target);
    if (!towerPos || !targetPos) return;

    const dx = targetPos.x - towerPos.x;
    const dy = targetPos.y - towerPos.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = stats.projectileSpeedPx;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    state.projectiles.push({
      id: state.nextId += 1,
      type: tower.type,
      x: towerPos.x,
      y: towerPos.y,
      vx,
      vy,
      targetId: target.id,
      damage: stats.damage,
      splash: stats.splashPx,
      slowFactor: stats.slowFactor,
      life: 1200,
    });

    addFloatingPulse(towerPos.x, towerPos.y, stats.color);
  }

  function applyProjectileHit(projectile, enemy) {
    if (enemy.dodge && Math.random() < enemy.dodge) {
      addFloatingPulse(projectile.x, projectile.y, '#9ee7ff');
      return;
    }

    enemy.hp -= projectile.damage;

    if (projectile.type === 'slow') {
      enemy.slowUntil = performance.now() + 1600;
      enemy.slowFactor = projectile.slowFactor || 0.58;
    }

    if (projectile.type === 'burst') {
      const origin = getEnemyPosition(enemy);
      state.enemies.forEach((other) => {
        if (other.id === enemy.id) return;
        const pos = getEnemyPosition(other);
        const distance = Math.hypot(pos.x - origin.x, pos.y - origin.y);
        if (distance <= (projectile.splash || 0)) {
          other.hp -= Math.max(4, Math.floor(projectile.damage * 0.55));
        }
      });
      addFloatingPulse(origin.x, origin.y, '#ff5d6c');
    }

    cleanupDeadEnemies();
  }

  function onEnemyKilled(enemy) {
    const reward = enemy.reward;
    state.gold += reward;
    state.score += reward + state.wave;
    const pos = getEnemyPosition(enemy);
    addGoldFloat(reward, pos);
    state.kills += 1;
    toast(`击杀 ${enemy.label} +${reward} 金币`);
    state.enemies = state.enemies.filter((item) => item.id !== enemy.id);

    addFloatingPulse(pos.x, pos.y, '#ffd54f');

    if (enemy.type === 'splitter') {
      spawnSplitEnemies(enemy, pos);
    }
  }

  function spawnSplitEnemies(enemy, pos) {
    const base = ENEMY_BASE.swift;
    for (let i = 0; i < 2; i += 1) {
      state.enemies.push({
        id: state.nextId += 1,
        type: 'swift',
        emoji: base.emoji,
        label: '分裂小怪',
        hp: Math.max(12, Math.round(enemy.maxHp * 0.26)),
        maxHp: Math.max(12, Math.round(enemy.maxHp * 0.26)),
        speed: base.speed * 1.08,
        reward: Math.max(4, Math.floor(enemy.reward * 0.28)),
        pathIndex: enemy.pathIndex,
        progress: Math.min(0.95, enemy.progress + i * 0.08),
        slowUntil: 0,
        slowFactor: 1,
        scale: 0.78,
        color: base.color,
        regen: 0,
        dodge: 0,
      });
    }
    addFloatingPulse(pos.x, pos.y, '#b388ff');
  }

  function cleanupDeadEnemies() {
    const deadEnemies = state.enemies.filter((enemy) => enemy.hp <= 0);
    deadEnemies.forEach((enemy) => onEnemyKilled(enemy));
  }

  function addFloatingPulse(x, y, color) {
    const effectLayer = document.getElementById('effectLayer');
    if (!effectLayer) return;

    const el = document.createElement('div');
    el.className = 'mtd-pulse';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.borderColor = color;
    effectLayer.appendChild(el);

    setTimeout(() => {
      el.remove();
    }, 360);
  }

  function flashEffect(className) {
    boardEl.classList.remove('flash-base');
    void boardEl.offsetWidth;
    boardEl.classList.add('flash-base');

    setTimeout(() => {
      boardEl.classList.remove('flash-base');
    }, 250);
  }

  function checkLossCondition() {
    if (state.baseHp > 0) return;
    failGame();
  }

  function failGame() {
    if (state.gameOver) return;
    state.running = false;
    state.gameOver = true;
    stopLoop();

    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      localStorage.setItem(STORAGE_KEY, String(state.bestScore));
    }

    resultTitleEl.textContent = '基地失守';
    resultTextEl.textContent = `你坚持到了第 ${state.wave} 波，战力 ${state.score}。再试一次，看看能不能守到更高波次。`;
    renderResultStats();
    showResult();
    updateHud();
  }

  function winGame() {
    if (state.gameOver) return;
    state.running = false;
    state.gameOver = true;
    stopLoop();

    state.score += Math.max(60, state.baseHp * 10);

    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      localStorage.setItem(STORAGE_KEY, String(state.bestScore));
    }

    resultTitleEl.textContent = '完美通关';
    resultTextEl.textContent = `你守住了全部 ${state.maxWave} 波，最终战力 ${state.score}。`;
    renderResultStats();
    showResult();
    updateHud();
  }

  function showResult() {
    resultOverlayEl.classList.add('show');
    resultOverlayEl.setAttribute('aria-hidden', 'false');
  }

  function hideResult() {
    resultOverlayEl.classList.remove('show');
    resultOverlayEl.setAttribute('aria-hidden', 'true');
  }

  function handleCellClick(row, col) {
    if (!state.running || state.gameOver) {
      toast('请先开始游戏');
      return;
    }

    if (isPathCell(row, col)) {
      toast('这里是路径，不能建造');
      return;
    }

    const existing = getTowerAt(row, col);
    if (existing) {
      state.selectedTowerId = existing.id;
      toast(`已选择 ${TOWER_CONFIG[existing.type].label} Lv.${existing.level}`);
      renderBoard();
      updateTowerPanel();
      return;
    }

    const config = TOWER_CONFIG[state.selectedBuild];
    if (!config) return;

    if (state.gold < config.cost) {
      toast('金币不足');
      return;
    }

    state.gold -= config.cost;
    state.builtCount += 1;
    state.highestTowerLevel = Math.max(state.highestTowerLevel, 1);
    const towerId = state.nextId += 1;
    state.towers.push({
      id: towerId,
      row,
      col,
      type: state.selectedBuild,
      level: 1,
      cooldownRemaining: 0,
    });

    const mergedTower = autoMergeAround(row, col);
    state.selectedTowerId = mergedTower ? mergedTower.id : towerId;
    toast(`放置 ${config.label}`);
    renderBoard();
    updateHud();
    updateTowerPanel();
  }

  function canRepositionTower() {
    return state.running && !state.gameOver && !state.waveActive && state.enemies.length === 0 && state.rerollsLeft > 0;
  }

  function handleTowerDragStart(event, towerId) {
    if (!canRepositionTower()) {
      event.preventDefault();
      toast('只能在波间重排 1 次防御塔');
      return;
    }
    state.draggingTowerId = towerId;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(towerId));
    renderBoard();
  }

  function handleTowerDragEnd() {
    state.draggingTowerId = null;
    renderBoard();
  }

  function handleCellDragOver(event) {
    if (!state.draggingTowerId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function handleCellDrop(event, row, col) {
    if (!state.draggingTowerId) return;
    event.preventDefault();
    const tower = state.towers.find((item) => item.id === state.draggingTowerId);
    state.draggingTowerId = null;
    if (!tower) return;
    if (!canRepositionTower()) {
      toast('当前不能重排防御塔');
      renderBoard();
      return;
    }
    if (isPathCell(row, col) || getTowerAt(row, col)) {
      toast('只能拖到空白建造位');
      renderBoard();
      return;
    }
    tower.row = row;
    tower.col = col;
    tower.cooldownRemaining = 0;
    state.rerollsLeft -= 1;
    const mergedTower = autoMergeAround(row, col) || tower;
    state.selectedTowerId = mergedTower.id;
    const pos = getCellCenter(mergedTower.row, mergedTower.col);
    if (pos) addFloatingText(pos.x, pos.y, '重排完成', 'upgrade');
    toast('防御塔已重排，本波机会已用完');
    renderBoard();
    updateTowerPanel();
  }

  function autoMergeAround(row, col) {
    const anchor = getTowerAt(row, col);
    if (!anchor) return null;

    let merged = false;
    let changed = true;

    while (changed) {
      changed = false;

      for (let i = 0; i < state.towers.length; i += 1) {
        const other = state.towers[i];
        if (other.id === anchor.id) continue;
        if (other.type !== anchor.type || other.level !== anchor.level) continue;
        if (!areAdjacent(anchor, other)) continue;

        anchor.level += 1;
        state.mergeCount += 1;
        state.highestTowerLevel = Math.max(state.highestTowerLevel, anchor.level);
        anchor.cooldownRemaining = 0;
        state.towers.splice(i, 1);
        changed = true;
        merged = true;

        const pos = getCellCenter(anchor.row, anchor.col);
        if (pos) {
          addFloatingPulse(pos.x, pos.y, '#7cff6b');
          addFloatingText(pos.x, pos.y, `合成 Lv.${anchor.level}!`, 'merge');
        }
        toast(`${TOWER_CONFIG[anchor.type].label} 合成到 Lv.${anchor.level}`);
        break;
      }
    }

    if (merged) {
      applyTowerMergeBonus(anchor);
    }

    return merged ? anchor : null;
  }

  function areAdjacent(a, b) {
    const dr = Math.abs(a.row - b.row);
    const dc = Math.abs(a.col - b.col);
    return dr + dc === 1;
  }

  function getTowerStats(tower) {
    const base = TOWER_CONFIG[tower.type];
    const level = Math.max(1, tower.level);
    const levelMultiplier = 1 + (level - 1) * 0.46;
    const mergeBonus = Math.floor((level - 1) / 2);
    const tierBonus = level >= 5 ? 0.18 : level >= 3 ? 0.1 : 0;
    const rangeBoostMultiplier = tower.rangeBoost ? 1.18 : 1;
    const overdriveMultiplier = tower.overdrive ? 1.18 : 1;

    return {
      damage: Math.round(base.damage * levelMultiplier * (1 + mergeBonus * 0.12) * overdriveMultiplier),
      rangePx: Math.round((base.range + tierBonus) * boardMetrics.cellSize * rangeBoostMultiplier + (level - 1) * 15),
      cooldown: Math.max(220, Math.round(base.cooldown * Math.pow(0.91, level - 1 - mergeBonus * 0.25) * (tower.overdrive ? 0.9 : 1))),
      projectileSpeedPx: base.projectileSpeed * boardMetrics.cellSize * (1 + tierBonus * 0.5) * (tower.overdrive ? 1.08 : 1),
      splashPx: base.splash ? base.splash * boardMetrics.cellSize * (1 + mergeBonus * 0.08) * (tower.overdrive ? 1.12 : 1) : 0,
      slowFactor: base.slowFactor || 1,
      color: base.color,
    };
  }

  function getCurrentMap() {
    return MAPS[state.mapIndex % MAPS.length] || MAPS[0];
  }

  function getCurrentPathCells() {
    return getCurrentMap().path;
  }

  function getCellCenter(row, col) {
    if (!boardMetrics.centers[row]) return null;
    return boardMetrics.centers[row][col] || null;
  }

  function getEnemyPosition(enemy) {
    const pathCells = getCurrentPathCells();
    const current = pathCells[enemy.pathIndex];
    const next = pathCells[Math.min(enemy.pathIndex + 1, pathCells.length - 1)];

    if (!current) {
      const base = getCellCenter(4, 4);
      return base || { x: 0, y: 0 };
    }

    const currentPos = getCellCenter(current[0], current[1]);
    const nextPos = getCellCenter(next[0], next[1]) || currentPos;
    const x = currentPos.x + (nextPos.x - currentPos.x) * enemy.progress;
    const y = currentPos.y + (nextPos.y - currentPos.y) * enemy.progress;

    return { x, y };
  }

  function getTowerAt(row, col) {
    return state.towers.find((tower) => tower.row === row && tower.col === col) || null;
  }

  function isPathCell(row, col) {
    return getCurrentPathCells().some(([r, c]) => r === row && c === col);
  }

  function isBaseCell(row, col) {
    const pathCells = getCurrentPathCells();
    const base = pathCells[pathCells.length - 1];
    return Boolean(base && base[0] === row && base[1] === col);
  }

  function resetBoardOccupancy() {
    const cells = Array.from(boardEl.querySelectorAll('.mtd-cell'));
    cells.forEach((cell) => {
      cell.classList.remove('occupied');
    });
  }

  function updateHud() {
    goldTextEl.textContent = String(state.gold);
    waveTextEl.textContent = String(state.wave);
    baseHpTextEl.textContent = String(Math.max(0, state.baseHp));
    scoreTextEl.textContent = String(state.score);
    if (bestScoreTextEl) bestScoreTextEl.textContent = String(Math.max(state.bestScore, state.score));
  }

  function getSelectedTower() {
    return state.towers.find((tower) => tower.id === state.selectedTowerId) || null;
  }

  function getTowerUpgradeCost(tower) {
    const base = TOWER_CONFIG[tower.type];
    return Math.ceil(base.cost * (tower.level + 1) * MANUAL_UPGRADE_COST_RATE);
  }

  function getTowerSellValue(tower) {
    const base = TOWER_CONFIG[tower.type];
    return Math.max(1, Math.floor(base.cost * tower.level * SELL_REFUND_RATE));
  }

  function upgradeSelectedTower() {
    const tower = getSelectedTower();
    if (!tower || state.gameOver) {
      toast('请先选择一个防御塔');
      return;
    }

    const cost = getTowerUpgradeCost(tower);
    if (state.gold < cost) {
      toast(`金币不足，升级需要 ${cost}`);
      return;
    }

    state.gold -= cost;
    tower.level += 1;
    state.highestTowerLevel = Math.max(state.highestTowerLevel, tower.level);
    tower.cooldownRemaining = 0;

    applyTowerMergeBonus(tower);

    const mergedTower = autoMergeAround(tower.row, tower.col) || tower;
    toast(`${TOWER_CONFIG[mergedTower.type].label} 升到 Lv.${mergedTower.level}`);
    const pos = getCellCenter(mergedTower.row, mergedTower.col);
    if (pos) {
      addFloatingPulse(pos.x, pos.y, '#7cff6b');
      addFloatingText(pos.x, pos.y, `升级 Lv.${mergedTower.level}`, 'upgrade');
    }
    renderBoard();
    updateHud();
    updateTowerPanel();
  }

  function sellSelectedTower() {
    const tower = getSelectedTower();
    if (!tower || state.gameOver) {
      toast('请先选择一个防御塔');
      return;
    }

    const refund = getTowerSellValue(tower);
    state.gold += refund;
    state.towers = state.towers.filter((item) => item.id !== tower.id);
    state.selectedTowerId = null;
    toast(`销毁防御塔，返还 ${refund} 金币`);
    renderBoard();
    updateHud();
    updateTowerPanel();
  }

  function updateTowerPanel() {
    if (!selectedTowerTextEl || !upgradeTowerBtnEl || !sellTowerBtnEl) return;

    const tower = getSelectedTower();
    if (!tower) {
      selectedTowerTextEl.textContent = '未选择防御塔。点击已建好的塔可以查看、升级或销毁。';
      upgradeTowerBtnEl.disabled = true;
      sellTowerBtnEl.disabled = true;
      upgradeTowerBtnEl.textContent = '升级';
      sellTowerBtnEl.textContent = '销毁';
      return;
    }

    const config = TOWER_CONFIG[tower.type];
    const stats = getTowerStats(tower);
    const upgradeCost = getTowerUpgradeCost(tower);
    const sellValue = getTowerSellValue(tower);
    selectedTowerTextEl.textContent = `${config.label} Lv.${tower.level} · 伤害 ${stats.damage} · 射程 ${Math.round(stats.rangePx)} · 攻速 ${Math.round(1000 / stats.cooldown * 10) / 10}/秒 · ${getTowerStageText(tower)}`;
    upgradeTowerBtnEl.disabled = state.gold < upgradeCost || state.gameOver;
    sellTowerBtnEl.disabled = state.gameOver;
    upgradeTowerBtnEl.textContent = `升级 -${upgradeCost}`;
    sellTowerBtnEl.textContent = `销毁 +${sellValue}`;
  }
  function updateModeText() {
    const config = TOWER_CONFIG[state.selectedBuild];
    modeTextEl.textContent = `当前选择：${config.label} · ${config.text} · 花费 ${config.cost} 金币`;
  }

  function getTowerTierClass(level) {
    if (level >= 5) return 'omega';
    if (level >= 3) return 'alpha';
    if (level >= 2) return 'beta';
    return 'base';
  }

  function getTowerStageText(tower) {
    const level = Math.max(1, tower.level);
    if (level >= 5) return '终极形态';
    if (level >= 3) return '进化形态';
    if (level >= 2) return '强化形态';
    return '基础形态';
  }

  function getTowerEmojiByTier(tower) {
    const base = TOWER_CONFIG[tower.type].emoji;
    const tier = getTowerTierClass(tower.level);
    if (tier === 'omega') return base + '✨';
    if (tier === 'alpha') return base + '★';
    if (tier === 'beta') return base;
    return base;
  }

  function applyTowerMergeBonus(tower) {
    if (!tower) return;
    if (tower.level >= 3) {
      tower.rangeBoost = true;
    }
    if (tower.level >= 5) {
      tower.overdrive = true;
    }
  }

  function startLoop() {
    stopLoop();
    state.running = true;
    state.lastFrameAt = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function gameLoop(now) {
    if (!state.running) return;

    const delta = Math.min(32, now - state.lastFrameAt || 16) * state.speedMultiplier;
    state.lastFrameAt = now;

    update(delta);
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function advanceWave() {
    state.wave += 1;
    startWave();
  }

  function startWaveIfNeeded() {
    if (!state.running || state.waveActive || state.gameOver) return;
    advanceWave();
  }


  function togglePause() {
    if (state.gameOver) return;
    if (!state.running && !state.pausedByUser) {
      toast('请先开始游戏');
      return;
    }

    if (state.running) {
      state.running = false;
      state.pausedByUser = true;
      stopLoop();
      toast('游戏已暂停');
    } else {
      state.running = true;
      state.pausedByUser = false;
      startLoop();
      toast('继续防守');
    }
    updateControlButtons();
  }

  function toggleSpeed() {
    state.speedMultiplier = state.speedMultiplier === 1 ? 2 : 1;
    updateControlButtons();
    toast(`当前速度 x${state.speedMultiplier}`);
  }

  function updateControlButtons() {
    if (pauseBtnEl) pauseBtnEl.textContent = state.pausedByUser ? '继续' : '暂停';
    if (speedBtnEl) speedBtnEl.textContent = `倍速 x${state.speedMultiplier}`;
  }

  function getEnemyTypesForWave(wave) {
    const types = ['grunt', 'swift'];
    if (wave >= 3) types.push('tank');
    if (wave >= 4) types.push('splitter');
    if (wave >= 5) types.push('regen');
    if (wave >= 7) types.push('ghost');
    if (wave >= 9) types.push('elite');
    if (wave % 6 === 0) types.push('boss');
    return types;
  }

  function getWaveAdvice(types) {
    if (types.includes('boss')) return '首领会造成 3 点基地伤害，优先补冰冻塔和高等级单体火力。';
    if (types.includes('ghost')) return '幽灵怪有闪避，建议增加多座炮塔提高命中覆盖。';
    if (types.includes('regen')) return '恢复怪会回血，集中升级核心输出塔更稳。';
    if (types.includes('splitter')) return '分裂怪会变成小怪，爆裂塔可以更好清场。';
    if (types.includes('tank')) return '重甲怪血量高，建议至少保留一座持续输出塔。';
    return '前期以铺炮塔为主，尽快制造相邻同级塔触发合成。';
  }

  function updateWaveIntel() {
    if (!waveIntelTextEl || !waveIntelTagsEl) return;
    const nextWave = state.waveActive ? state.wave : Math.min(state.wave + 1, state.maxWave);
    const types = getEnemyTypesForWave(nextWave);
    const count = 6 + nextWave * 2 + Math.floor(nextWave / 3);
    const rerollHint = canRepositionTower() ? `波间可拖拽重排 ${state.rerollsLeft} 次。` : '';
    waveIntelTextEl.textContent = `第 ${nextWave} 波预计 ${count} 个敌人。${rerollHint}${getWaveAdvice(types)}`;
    waveIntelTagsEl.innerHTML = types.map((type) => {
      const enemy = ENEMY_BASE[type];
      return `<span class="mtd-intel-tag">${enemy.emoji} ${enemy.label}</span>`;
    }).join('');
  }

  function getBoardFloatingPoint() {
    return { x: boardMetrics.originX + boardMetrics.boardSize / 2, y: Math.max(28, boardMetrics.cellSize * 0.32) };
  }

  function addGoldFloat(amount, pos = null) {
    const point = pos || getBoardFloatingPoint();
    addFloatingText(point.x, point.y, `+${amount} 金币`, 'gold');
  }

  function showBossAlert() {
    const point = getBoardFloatingPoint();
    addFloatingText(point.x, point.y + boardMetrics.cellSize * 1.9, '首领来袭!', 'boss');
    boardEl.classList.remove('boss-alert');
    void boardEl.offsetWidth;
    boardEl.classList.add('boss-alert');
    setTimeout(() => boardEl.classList.remove('boss-alert'), 950);
  }

  function addFloatingText(x, y, message, type = 'normal') {
    const effectLayer = document.getElementById('effectLayer');
    if (!effectLayer) return;

    const el = document.createElement('div');
    el.className = `mtd-float-text ${type}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.textContent = message;
    effectLayer.appendChild(el);

    setTimeout(() => {
      el.remove();
    }, 820);
  }

  function renderResultStats() {
    if (!resultStatsEl) return;
    resultStatsEl.innerHTML = `
      <div><span>最高战力</span><strong>${Math.max(state.bestScore, state.score)}</strong></div>
      <div><span>击杀</span><strong>${state.kills}</strong></div>
      <div><span>建塔</span><strong>${state.builtCount}</strong></div>
      <div><span>合成</span><strong>${state.mergeCount}</strong></div>
      <div><span>最高塔</span><strong>Lv.${state.highestTowerLevel}</strong></div>
      <div><span>剩余基地</span><strong>${Math.max(0, state.baseHp)}</strong></div>
    `;
  }
  function toast(message) {
    let toastEl = document.querySelector('.mtd-toast');
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'mtd-toast';
      document.body.appendChild(toastEl);
    }

    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastEl._hideTimer);
    toastEl._hideTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 1300);
  }

  function init() {
    initDom();
    bindEvents();
    createBoard();
    updateModeText();
    updateHud();
    updateWaveIntel();
    updateControlButtons();
    renderBoard();
    hideResult();
    state.running = false;
  }

  document.addEventListener('DOMContentLoaded', init);
})();




