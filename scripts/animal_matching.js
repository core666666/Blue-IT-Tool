/**
 * 动物配对游戏 - Animal Matching Memory Game
 * 适合 3-8 岁小朋友的翻牌记忆游戏
 */
(function () {
  'use strict';

  /* ---- 游戏配置 -------------------------------------------- */

  const ALL_ANIMALS = [
    { emoji: '🐼', name: '熊猫' },
    { emoji: '🐶', name: '小狗' },
    { emoji: '🐱', name: '小猫' },
    { emoji: '🐸', name: '青蛙' },
    { emoji: '🐯', name: '老虎' },
    { emoji: '🦊', name: '狐狸' },
    { emoji: '🐰', name: '兔子' },
    { emoji: '🦁', name: '狮子' },
    { emoji: '🐨', name: '考拉' },
    { emoji: '🐮', name: '奶牛' },
  ];

  // pairs: 配对数量, cols: 列数, rows: 行数
  // cardSize: 默认卡牌像素大小, emojiSize: emoji大小
  // starThresholds: [3星上限, 2星上限] (翻牌次数)
  const MODES = {
    easy:   { pairs: 6,  cols: 4, rows: 3, cardSize: 100, emojiSize: 54, starThresholds: [10, 16] },
    normal: { pairs: 8,  cols: 4, rows: 4, cardSize: 95,  emojiSize: 50, starThresholds: [14, 22] },
    hard:   { pairs: 10, cols: 5, rows: 4, cardSize: 88,  emojiSize: 44, starThresholds: [18, 28] },
  };

  /* ---- 状态 ------------------------------------------------- */
  const state = {
    mode: 'easy',
    cards: [],          // 所有卡牌对象
    flippedCards: [],   // 当前翻开的卡片（最多2张）
    attempts: 0,        // 翻牌次数（每次选2张算1次）
    matchedPairs: 0,
    elapsedSeconds: 0,
    timerInterval: null,
    locked: false,      // 翻牌锁，防止快速多点
    started: false,
  };

  /* ---- DOM 引用 --------------------------------------------- */
  let boardEl, timerEl, attemptsEl;
  let winOverlayEl, winStarsEl, winTimeEl, winAttemptsEl, winNewRecordEl;
  let startOverlayEl, startBtn, playAgainBtn, changeModeBtn;
  let diffBtns;

  let jsConfetti = null;

  /* ---- 工具函数 --------------------------------------------- */

  /** Fisher-Yates 洗牌 */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** 秒数 -> MM:SS */
  function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /** 根据翻牌次数计算星级 */
  function calcStars(mode, attempts) {
    const t = MODES[mode].starThresholds;
    if (attempts <= t[0]) return 3;
    if (attempts <= t[1]) return 2;
    return 1;
  }

  /** 星级数字 -> emoji字符串 */
  function starsToEmoji(stars) {
    return '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  }

  /* ---- localStorage 最佳记录 -------------------------------- */

  function getBestRecord(mode) {
    try {
      const raw = localStorage.getItem(`am-best-${mode}`);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function setBestRecord(mode, data) {
    try {
      localStorage.setItem(`am-best-${mode}`, JSON.stringify(data));
    } catch (_) { /* ignore */ }
  }

  function updateRecordDisplay() {
    ['easy', 'normal', 'hard'].forEach(function (m) {
      const el = document.getElementById('am-record-' + m);
      if (!el) return;
      const rec = getBestRecord(m);
      if (rec) {
        el.textContent = starsToEmoji(rec.stars) + '  ' + formatTime(rec.time) + '  ' + rec.attempts + '次';
      } else {
        el.textContent = '暂无记录';
      }
    });
  }

  /* ---- 计时器 ----------------------------------------------- */

  function startTimer() {
    clearInterval(state.timerInterval);
    state.elapsedSeconds = 0;
    timerEl.textContent = '00:00';
    state.timerInterval = setInterval(function () {
      state.elapsedSeconds++;
      timerEl.textContent = formatTime(state.elapsedSeconds);
    }, 1000);
  }

  function stopTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }

  /* ---- 卡牌大小自适应 --------------------------------------- */

  /** 根据当前窗口宽度自适应计算卡牌尺寸，防止在小屏上溢出 */
  function calcResponsiveCardSize(mode) {
    const cfg = MODES[mode];
    // 可用宽度 = 窗口宽度 - 侧边栏 - 页面内边距
    const sidebarW = document.body.classList.contains('sidebar-open') ? 260 : 0;
    const availW = window.innerWidth - sidebarW - 80; // 80px for board padding + page padding
    const maxByWidth = Math.floor((availW - (cfg.cols - 1) * 10) / cfg.cols);
    const cardSize = Math.min(cfg.cardSize, Math.max(60, maxByWidth));
    const emojiSize = Math.round(cardSize * 0.54);
    return { cardSize, emojiSize };
  }

  /* ---- 构建卡牌数据 ----------------------------------------- */

  function buildCards(mode) {
    const cfg = MODES[mode];
    const selected = shuffle(ALL_ANIMALS).slice(0, cfg.pairs);
    const pairs = [...selected, ...selected];
    return shuffle(pairs).map(function (animal, idx) {
      return { id: idx, emoji: animal.emoji, name: animal.name, flipped: false, matched: false, el: null };
    });
  }

  /* ---- 渲染游戏板 ------------------------------------------- */

  function renderBoard(mode) {
    const cfg = MODES[mode];
    const { cardSize, emojiSize } = calcResponsiveCardSize(mode);

    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = 'repeat(' + cfg.cols + ', ' + cardSize + 'px)';
    boardEl.style.setProperty('--am-card-size', cardSize + 'px');
    boardEl.style.setProperty('--am-emoji-size', emojiSize + 'px');

    state.cards.forEach(function (card) {
      const cardEl = document.createElement('div');
      cardEl.className = 'am-card';
      cardEl.setAttribute('role', 'button');
      cardEl.setAttribute('aria-label', '翻开卡片');
      cardEl.innerHTML = [
        '<div class="am-card-inner">',
        '  <div class="am-card-front">❓</div>',
        '  <div class="am-card-back">' + card.emoji + '</div>',
        '</div>',
      ].join('');

      cardEl.addEventListener('click', function () { onCardClick(card); });
      card.el = cardEl;
      boardEl.appendChild(cardEl);
    });
  }

  /* ---- 翻牌逻辑 --------------------------------------------- */

  function onCardClick(card) {
    if (!state.started) return;
    if (state.locked) return;
    if (card.flipped || card.matched) return;
    if (state.flippedCards.length >= 2) return;

    card.flipped = true;
    card.el.classList.add('flipped');
    state.flippedCards.push(card);

    if (state.flippedCards.length === 2) {
      state.attempts++;
      attemptsEl.textContent = state.attempts;
      state.locked = true;
      checkMatch();
    }
  }

  function checkMatch() {
    const c1 = state.flippedCards[0];
    const c2 = state.flippedCards[1];

    if (c1.emoji === c2.emoji) {
      // 配对成功
      setTimeout(function () {
        c1.matched = true;
        c2.matched = true;
        c1.el.classList.remove('flipped');
        c2.el.classList.remove('flipped');
        c1.el.classList.add('matched');
        c2.el.classList.add('matched');
        c1.el.setAttribute('aria-label', c1.name + ' - 已配对');
        c2.el.setAttribute('aria-label', c2.name + ' - 已配对');
        state.matchedPairs++;
        state.flippedCards = [];
        state.locked = false;

        if (state.matchedPairs === MODES[state.mode].pairs) {
          onGameWin();
        }
      }, 300);
    } else {
      // 配对失败，抖动后翻回
      c1.el.classList.add('wrong');
      c2.el.classList.add('wrong');
      setTimeout(function () {
        c1.el.classList.remove('wrong', 'flipped');
        c2.el.classList.remove('wrong', 'flipped');
        c1.flipped = false;
        c2.flipped = false;
        state.flippedCards = [];
        state.locked = false;
      }, 900);
    }
  }

  /* ---- 游戏胜利 --------------------------------------------- */

  function onGameWin() {
    stopTimer();
    state.started = false;

    const stars = calcStars(state.mode, state.attempts);
    const rec = getBestRecord(state.mode);
    let isNewRecord = false;

    if (!rec || stars > rec.stars || (stars === rec.stars && state.elapsedSeconds < rec.time)) {
      setBestRecord(state.mode, { stars: stars, time: state.elapsedSeconds, attempts: state.attempts });
      isNewRecord = true;
      updateRecordDisplay();
    }

    // 填写弹窗数据
    winStarsEl.textContent = starsToEmoji(stars);
    winTimeEl.textContent = formatTime(state.elapsedSeconds);
    winAttemptsEl.textContent = state.attempts + ' 次';
    winNewRecordEl.classList.toggle('show', isNewRecord);

    // 根据星级决定 emoji
    const emojiEl = winOverlayEl.querySelector('.am-win-emoji');
    if (stars === 3) emojiEl.textContent = '🏆';
    else if (stars === 2) emojiEl.textContent = '🎉';
    else emojiEl.textContent = '😊';

    // 显示弹窗
    setTimeout(function () {
      winOverlayEl.classList.add('show');
      if (jsConfetti) {
        if (stars === 3) {
          jsConfetti.addConfetti({
            emojis: ['🎉', '⭐', '🌟', '🐼', '🐶', '🐱', '🦁'],
            emojiSize: 40,
            confettiNumber: 90,
          });
        } else {
          jsConfetti.addConfetti({ confettiNumber: 50 });
        }
      }
    }, 500);
  }

  /* ---- 开始/重置游戏 ---------------------------------------- */

  function startGame(mode) {
    state.mode = mode || state.mode;
    state.cards = buildCards(state.mode);
    state.flippedCards = [];
    state.attempts = 0;
    state.matchedPairs = 0;
    state.locked = false;
    state.started = true;

    attemptsEl.textContent = '0';
    startOverlayEl.style.display = 'none';
    winOverlayEl.classList.remove('show');

    renderBoard(state.mode);
    startTimer();
  }

  function returnToStart() {
    winOverlayEl.classList.remove('show');
    stopTimer();
    state.started = false;
    boardEl.innerHTML = '';
    startOverlayEl.style.display = 'flex';
  }

  /* ---- 初始化 ----------------------------------------------- */

  function init() {
    boardEl        = document.getElementById('am-board');
    timerEl        = document.getElementById('am-timer');
    attemptsEl     = document.getElementById('am-attempts');
    winOverlayEl   = document.getElementById('am-win-overlay');
    winStarsEl     = document.getElementById('am-win-stars');
    winTimeEl      = document.getElementById('am-win-time');
    winAttemptsEl  = document.getElementById('am-win-attempts');
    winNewRecordEl = document.getElementById('am-new-record');
    startOverlayEl = document.getElementById('am-start-overlay');
    startBtn       = document.getElementById('am-start-btn');
    playAgainBtn   = document.getElementById('am-play-again');
    changeModeBtn  = document.getElementById('am-change-mode');
    diffBtns       = document.querySelectorAll('.am-diff-btn');

    // 初始化 confetti（如果已加载）
    if (typeof JSConfetti !== 'undefined') {
      jsConfetti = new JSConfetti();
    }

    // 难度按钮
    diffBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        diffBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.mode = btn.dataset.mode;
        // 若游戏正在进行，提示玩家切换后需重新开始
        if (state.started) {
          returnToStart();
        }
      });
    });

    // 开始游戏
    startBtn.addEventListener('click', function () {
      startGame(state.mode);
    });

    // 再玩一次（相同难度）
    playAgainBtn.addEventListener('click', function () {
      startGame(state.mode);
    });

    // 换难度（返回选择界面）
    changeModeBtn.addEventListener('click', returnToStart);

    // 初始化最佳记录显示
    updateRecordDisplay();

    // 窗口大小改变时重新适配（如果游戏进行中则重绘）
    window.addEventListener('resize', function () {
      if (state.started && state.cards.length > 0) {
        const { cardSize, emojiSize } = calcResponsiveCardSize(state.mode);
        const cfg = MODES[state.mode];
        boardEl.style.gridTemplateColumns = 'repeat(' + cfg.cols + ', ' + cardSize + 'px)';
        boardEl.style.setProperty('--am-card-size', cardSize + 'px');
        boardEl.style.setProperty('--am-emoji-size', emojiSize + 'px');
      }
    });
  }

  /* ---- 入口 ------------------------------------------------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
