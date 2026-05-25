(() => {
  'use strict';

  const STORAGE_KEY = 'dpq-best-score';
  const ROUND_TIME = 15;
  const MAX_LIVES = 3;
  const SCORE_PER_CORRECT = 10;

  const PATTERNS = {
    singleton: { name: '单例模式', tag: '全局唯一', color: '#ffd84d', desc: '用于全局唯一实例，如 GameManager、AudioManager。' },
    factory: { name: '工厂模式', tag: '对象创建', color: '#7cff6b', desc: '把创建逻辑从业务中拆出来，适合敌人、子弹、道具生成。' },
    strategy: { name: '策略模式', tag: '行为可换', color: '#7dd3fc', desc: '把可变算法独立出来，适合 AI、攻击方式、移动方式切换。' },
    observer: { name: '观察者模式', tag: '事件订阅', color: '#fca5a5', desc: '状态变化自动通知 UI、血条、分数和任务系统。' },
    state: { name: '状态模式', tag: '状态切换', color: '#c4b5fd', desc: '把角色/游戏的不同状态拆开，减少 if/else。' },
    command: { name: '命令模式', tag: '输入映射', color: '#fdba74', desc: '把输入封装成命令，方便回放、撤销和组合操作。' },
    decorator: { name: '装饰器模式', tag: '动态增强', color: '#f9a8d4', desc: '在不修改原类的情况下叠加 buff、武器效果、附魔。' },
    composite: { name: '组合模式', tag: '树形结构', color: '#86efac', desc: '统一处理单个对象和对象集合，适合关卡树、UI 树。' },
    template: { name: '模板方法模式', tag: '固定流程', color: '#fde68a', desc: '定义固定流程，把差异步骤交给子类或配置。' },
    adapter: { name: '适配器模式', tag: '接口转换', color: '#93c5fd', desc: '把不同接口包装成统一接口，适合第三方设备或旧系统。' },
  };

  const QUESTIONS = [
    {
      title: '敌人类型越来越多，需要统一创建逻辑',
      prompt: '你的塔防游戏里有普通怪、飞行怪、Boss，创建代码到处散落。最适合用哪个模式？',
      options: ['singleton', 'factory', 'observer', 'adapter'],
      answer: 'factory',
      explain: '敌人创建应交给工厂，业务代码只管“要什么”，不关心“怎么造”。',
    },
    {
      title: '血量、分数变化时 UI 要自动更新',
      prompt: '玩家受伤后，血条、数字、提示框都要同步刷新。最适合用哪个模式？',
      options: ['strategy', 'observer', 'state', 'decorator'],
      answer: 'observer',
      explain: '状态变化通过观察者广播，UI 订阅后自动更新，解耦最明显。',
    },
    {
      title: '同一个角色有巡逻、追击、攻击三种 AI',
      prompt: '敌人逻辑经常切换，而且以后还会继续加行为。最适合用哪个模式？',
      options: ['command', 'state', 'factory', 'singleton'],
      answer: 'state',
      explain: '状态模式非常适合“当前处于什么状态就执行什么逻辑”的场景。',
    },
    {
      title: '玩家可以切换近战、远程、范围攻击',
      prompt: '攻击方式需要随时更换，而且不同模式下算法不同。最适合用哪个模式？',
      options: ['strategy', 'composite', 'adapter', 'template'],
      answer: 'strategy',
      explain: '策略模式把攻击行为独立出来，切换武器/技能非常自然。',
    },
    {
      title: '键盘按键映射成角色动作',
      prompt: 'WASD、空格、Q 键分别对应移动、跳跃、技能，未来还要支持回放。最适合用哪个模式？',
      options: ['command', 'observer', 'singleton', 'decorator'],
      answer: 'command',
      explain: '命令模式把输入封装成对象，便于记录、重放和组合。',
    },
    {
      title: '给基础子弹叠加火焰、穿透、冰冻效果',
      prompt: '不想改原子弹类，但希望动态增加效果。最适合用哪个模式？',
      options: ['decorator', 'factory', 'adapter', 'composite'],
      answer: 'decorator',
      explain: '装饰器可以在不改原类的情况下给对象叠加额外功能。',
    },
    {
      title: '管理菜单、关卡、任务树',
      prompt: '这些都是层级结构，要同时处理“单个”和“集合”。最适合用哪个模式？',
      options: ['composite', 'strategy', 'observer', 'singleton'],
      answer: 'composite',
      explain: '组合模式将叶子节点和容器节点统一对待，非常适合树结构。',
    },
    {
      title: '统一关卡流程，但每关细节不同',
      prompt: '开始关卡、生成敌人、结算奖励流程固定，只有细节步骤不同。最适合用哪个模式？',
      options: ['template', 'adapter', 'factory', 'state'],
      answer: 'template',
      explain: '模板方法定义骨架，子类或配置只负责差异步骤。',
    },
    {
      title: '接入手柄，但现有系统只认键盘指令',
      prompt: '你需要把外部手柄输入转换成游戏内统一命令。最适合用哪个模式？',
      options: ['adapter', 'observer', 'strategy', 'singleton'],
      answer: 'adapter',
      explain: '适配器负责把不同接口包装成统一入口，兼容旧系统和外部设备。',
    },
    {
      title: '全局游戏管理器只允许一个实例',
      prompt: '场景切换、音效播放、全局状态都要统一管理。最适合用哪个模式？',
      options: ['observer', 'singleton', 'composite', 'command'],
      answer: 'singleton',
      explain: '单例保证全局只有一个管理器实例，最常用于游戏总控。',
    },
    {
      title: '关卡流程固定，但每关细节不同',
      prompt: '一套关卡都要经过初始化、生成敌人、结算奖励这几个步骤，只是每关参数不同。最适合用哪个模式？',
      options: ['template', 'factory', 'state', 'decorator'],
      answer: 'template',
      explain: '模板方法把流程骨架固定下来，把可变步骤交给子类或配置。',
    },
    {
      title: '道具系统需要给基础效果叠加额外能力',
      prompt: '基础回血道具可以再叠加护盾、加速、吸血等效果，而且要支持动态组合。最适合用哪个模式？',
      options: ['decorator', 'observer', 'adapter', 'singleton'],
      answer: 'decorator',
      explain: '装饰器适合给对象动态叠加职责，且不改原始类。',
    },
    {
      title: '外接手柄要接入现有键盘控制系统',
      prompt: '你已经有一套键盘命令系统，现在要把手柄按键转换成同样的动作。最适合用哪个模式？',
      options: ['adapter', 'strategy', 'command', 'composite'],
      answer: 'adapter',
      explain: '适配器负责把不同输入接口转换为统一命令接口。',
    },
    {
      title: '敌人进入不同状态后表现完全不同',
      prompt: '同一个敌人会在巡逻、追击、受伤、狂暴之间切换，每种状态下行为都不一样。最适合用哪个模式？',
      options: ['state', 'observer', 'factory', 'template'],
      answer: 'state',
      explain: '状态模式适合把不同状态的行为拆分，避免大量 if/else。',
    },
    {
      title: '分数、血量、任务进度需要同步刷新',
      prompt: '玩家做出一次操作后，多个界面模块都要响应变化。最适合用哪个模式？',
      options: ['observer', 'command', 'singleton', 'decorator'],
      answer: 'observer',
      explain: '观察者模式让状态变化自动通知所有订阅者。',
    },
  ];

  const state = {
    score: 0,
    bestScore: 0,
    lives: MAX_LIVES,
    roundIndex: 0,
    timeLeft: ROUND_TIME,
    streak: 0,
    roundOrder: [],
    timerId: null,
    locked: false,
    finished: false,
  };

  let scoreEl;
  let bestScoreEl;
  let livesEl;
  let roundEl;
  let streakEl;
  let timeEl;
  let progressFillEl;
  let roundTitleEl;
  let roundPromptEl;
  let roundHintEl;
  let optionListEl;
  let feedbackEl;
  let startBtnEl;
  let restartBtnEl;
  let playAgainBtnEl;
  let resultOverlayEl;
  let resultTitleEl;
  let resultTextEl;
  let resultEmojiEl;
  let summaryEl;
  let patternCardsEl;
  let statusPillEl;

  function initDom() {
    scoreEl = document.getElementById('scoreValue');
    bestScoreEl = document.getElementById('bestScoreValue');
    livesEl = document.getElementById('livesValue');
    roundEl = document.getElementById('roundValue');
    streakEl = document.getElementById('streakValue');
    timeEl = document.getElementById('timeValue');
    progressFillEl = document.getElementById('timeFill');
    roundTitleEl = document.getElementById('roundTitle');
    roundPromptEl = document.getElementById('roundPrompt');
    roundHintEl = document.getElementById('roundHint');
    optionListEl = document.getElementById('optionList');
    feedbackEl = document.getElementById('feedbackBox');
    startBtnEl = document.getElementById('startBtn');
    restartBtnEl = document.getElementById('restartBtn');
    playAgainBtnEl = document.getElementById('playAgainBtn');
    resultOverlayEl = document.getElementById('resultOverlay');
    resultTitleEl = document.getElementById('resultTitle');
    resultTextEl = document.getElementById('resultText');
    resultEmojiEl = document.getElementById('resultEmoji');
    summaryEl = document.getElementById('summaryBox');
    patternCardsEl = document.getElementById('patternCards');
    statusPillEl = document.getElementById('statusPill');

    const stored = Number(localStorage.getItem(STORAGE_KEY) || '0');
    state.bestScore = Number.isFinite(stored) ? stored : 0;
  }

  function bindEvents() {
    startBtnEl.addEventListener('click', startGame);
    restartBtnEl.addEventListener('click', restartGame);
    playAgainBtnEl.addEventListener('click', () => {
      hideResult();
      startGame();
    });
  }

  function startGame() {
    resetGame();
    state.roundOrder = shuffle(QUESTIONS.map((_, index) => index));
    state.roundIndex = 0;
    state.lives = MAX_LIVES;
    state.score = 0;
    state.streak = 0;
    state.locked = false;
    state.finished = false;
    renderRound();
    startTimer();
    updateUI();
    hideResult();
    setStatus('任务开始：识别模式并做出选择');
  }

  function restartGame() {
    stopTimer();
    startGame();
  }

  function resetGame() {
    stopTimer();
    clearOptionButtons();
    feedbackEl.textContent = '点击开始按钮，进入设计模式试炼。';
  }

  function renderRound() {
    const question = QUESTIONS[state.roundOrder[state.roundIndex]];
    const roundNo = state.roundIndex + 1;
    roundTitleEl.textContent = `第 ${roundNo} 关`;
    roundPromptEl.textContent = question.prompt;
    roundHintEl.textContent = question.title;
    feedbackEl.textContent = '请选择最合适的设计模式。';
    state.timeLeft = ROUND_TIME;
    state.locked = false;
    renderOptions(question.options);
    renderPatternCards(question);
    updateUI();
  }

  function renderOptions(options) {
    optionListEl.innerHTML = '';
    options.forEach((key) => {
      const pattern = PATTERNS[key];
      const button = document.createElement('button');
      button.className = 'dpq-option';
      button.type = 'button';
      button.dataset.pattern = key;
      button.innerHTML = `<span class="dpq-option-name">${pattern.name}</span><span class="dpq-option-tag">${pattern.tag}</span>`;
      button.addEventListener('click', () => answerQuestion(key, button));
      optionListEl.appendChild(button);
    });
  }

  function renderPatternCards(question) {
    const keys = Array.from(new Set([...question.options, question.answer]));
    patternCardsEl.innerHTML = keys.map((key) => {
      const pattern = PATTERNS[key];
      return `
        <article class="dpq-card" style="--card-color:${pattern.color}">
          <div class="dpq-card-title">${pattern.name}</div>
          <div class="dpq-card-tag">${pattern.tag}</div>
          <p>${pattern.desc}</p>
        </article>
      `;
    }).join('');
  }

  function answerQuestion(selectedKey, buttonEl) {
    if (state.locked || state.finished) return;
    state.locked = true;
    stopTimer();

    const question = QUESTIONS[state.roundOrder[state.roundIndex]];
    const isCorrect = selectedKey === question.answer;
    const correctPattern = PATTERNS[question.answer];

    Array.from(optionListEl.querySelectorAll('.dpq-option')).forEach((btn) => {
      const isRight = btn.dataset.pattern === question.answer;
      const isPicked = btn === buttonEl;
      btn.classList.add('disabled');
      if (isRight) btn.classList.add('correct');
      if (isPicked && !isCorrect) btn.classList.add('wrong');
    });

    if (isCorrect) {
      state.streak += 1;
      const bonus = Math.min(5, state.streak);
      state.score += SCORE_PER_CORRECT + bonus;
      feedbackEl.textContent = `正确！${correctPattern.name} +${SCORE_PER_CORRECT + bonus} 分。${question.explain}`;
      setStatus('命中目标，继续推进');
    } else {
      state.lives -= 1;
      state.streak = 0;
      feedbackEl.textContent = `答错了。正确答案是 ${correctPattern.name}。${question.explain}`;
      setStatus('本回合失误，扣除一条生命');
    }

    updateUI();

    window.setTimeout(() => {
      if (state.finished) return;
      if (state.lives <= 0) {
        endGame(false);
        return;
      }
      state.roundIndex += 1;
      if (state.roundIndex >= QUESTIONS.length) {
        endGame(true);
        return;
      }
      renderRound();
      startTimer();
    }, 1100);
  }

  function startTimer() {
    stopTimer();
    updateProgress();

    state.timerId = window.setInterval(() => {
      if (state.finished || state.locked) return;
      state.timeLeft -= 1;
      updateProgress();
      if (state.timeLeft <= 0) {
        state.lives -= 1;
        state.streak = 0;
        feedbackEl.textContent = '时间到！本题判定失败。';
        updateUI();
        Array.from(optionListEl.querySelectorAll('.dpq-option')).forEach((btn) => {
          btn.classList.add('disabled');
        });
        stopTimer();

        window.setTimeout(() => {
          if (state.lives <= 0) {
            endGame(false);
            return;
          }
          state.roundIndex += 1;
          if (state.roundIndex >= QUESTIONS.length) {
            endGame(true);
            return;
          }
          renderRound();
          startTimer();
        }, 900);
      }
    }, 1000);
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function endGame(completed) {
    stopTimer();
    state.finished = true;
    state.locked = true;

    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      localStorage.setItem(STORAGE_KEY, String(state.bestScore));
    }

    updateUI();

    const total = QUESTIONS.length;
    const passed = state.roundIndex + (completed ? 1 : 0);
    const accuracy = Math.max(0, Math.min(100, Math.round((passed / total) * 100)));

    if (completed) {
      resultEmojiEl.textContent = '🏆';
      resultTitleEl.textContent = '通关成功';
      resultTextEl.textContent = `你完成了全部试炼，最终得分 ${state.score}，答对率约 ${accuracy}%。`;
    } else {
      resultEmojiEl.textContent = '💥';
      resultTitleEl.textContent = '试炼失败';
      resultTextEl.textContent = `你在第 ${state.roundIndex + 1} 关止步，最终得分 ${state.score}。`;
    }

    summaryEl.innerHTML = buildSummary();
    showResult();
    setStatus(completed ? '全部模式识别完成' : '需要重新训练模式识别能力');
  }

  function buildSummary() {
    const groups = [
      ['singleton', '单例'],
      ['factory', '工厂'],
      ['strategy', '策略'],
      ['observer', '观察者'],
      ['state', '状态'],
      ['command', '命令'],
      ['decorator', '装饰器'],
      ['composite', '组合'],
      ['template', '模板方法'],
      ['adapter', '适配器'],
    ];

    return `
      <div class="dpq-summary-grid">
        ${groups.map(([key, label]) => {
          const count = QUESTIONS.filter((q) => q.answer === key).length;
          return `<div class="dpq-summary-item"><strong>${label}</strong><span>${count} 题</span></div>`;
        }).join('')}
      </div>
    `;
  }

  function clearOptionButtons() {
    optionListEl.innerHTML = '';
  }

  function showResult() {
    resultOverlayEl.classList.add('show');
    resultOverlayEl.setAttribute('aria-hidden', 'false');
  }

  function hideResult() {
    resultOverlayEl.classList.remove('show');
    resultOverlayEl.setAttribute('aria-hidden', 'true');
  }

  function updateUI() {
    scoreEl.textContent = String(state.score);
    bestScoreEl.textContent = String(state.bestScore);
    livesEl.textContent = String(Math.max(0, state.lives));
    roundEl.textContent = String(Math.min(state.roundIndex + 1, QUESTIONS.length));
    streakEl.textContent = String(state.streak);
    timeEl.textContent = String(Math.max(0, state.timeLeft));
    updateProgress();

    if (state.lives <= 1) {
      livesEl.parentElement.classList.add('danger');
    } else {
      livesEl.parentElement.classList.remove('danger');
    }
  }

  function updateProgress() {
    const percent = Math.max(0, Math.min(100, Math.round((state.timeLeft / ROUND_TIME) * 100)));
    progressFillEl.style.width = `${percent}%`;
  }

  function setStatus(text) {
    statusPillEl.textContent = text;
  }

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function init() {
    initDom();
    bindEvents();
    updateUI();
    setStatus('等待开始');
    summaryEl.innerHTML = buildSummary();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
