(() => {
  'use strict';

  const STORAGE_KEY = 'dpq-best-score';
  const ROUND_TIME = 15;
  const MAX_LIVES = 3;
  const SCORE_PER_CORRECT = 10;
  const HINT_CHARGES = 2;
  const FREEZE_CHARGES = 1;
  const SHIELD_CHARGES = 1;
  const DOUBLE_CHARGES = 1;
  const FREEZE_DURATION = 3000;
  const BOSS_INTERVAL = 5;
  const BOSS_BONUS = 15;
  const BOSS_LIFE_PENALTY = 2;

  const STREAK_REWARDS = [
    { threshold: 3, type: 'hint', amount: 1, label: '3 连胜奖励：提示卡 +1' },
    { threshold: 5, type: 'shield', amount: 1, label: '5 连胜奖励：护盾卡 +1' },
    { threshold: 8, type: 'double', amount: 1, label: '8 连胜奖励：双倍分 +1' },
    { threshold: 10, type: 'freeze', amount: 1, label: '10 连胜奖励：冻结卡 +1' },
  ];

  const PATTERNS = {
    simple_factory: {
      name: '简单工厂模式',
      group: '补充',
      tag: '集中创建',
      color: '#ffd84d',
      desc: '把对象创建集中到一个工厂里，调用者只关心要什么对象。'
    },
    factory_method: {
      name: '工厂方法模式',
      group: '创建型',
      tag: '延迟到子类',
      color: '#7cff6b',
      desc: '把对象创建交给子类决定，便于扩展不同产品。'
    },
    abstract_factory: {
      name: '抽象工厂模式',
      group: '创建型',
      tag: '产品族',
      color: '#7dd3fc',
      desc: '一次创建一组相关对象，保证风格一致。'
    },
    builder: {
      name: '建造者模式',
      group: '创建型',
      tag: '分步构建',
      color: '#fca5a5',
      desc: '把复杂对象的构建流程拆开，适合一步步装配。'
    },
    prototype: {
      name: '原型模式',
      group: '创建型',
      tag: '克隆复制',
      color: '#c4b5fd',
      desc: '通过克隆已有对象快速创建，适合模板复制。'
    },
    singleton: {
      name: '单例模式',
      group: '创建型',
      tag: '全局唯一',
      color: '#ffe66d',
      desc: '保证一个类只有一个实例，适合全局配置、总控。'
    },
    adapter: {
      name: '适配器模式',
      group: '结构型',
      tag: '接口转换',
      color: '#93c5fd',
      desc: '把不同接口包装成统一接口，兼容旧系统或外部设备。'
    },
    bridge: {
      name: '桥接模式',
      group: '结构型',
      tag: '抽象与实现分离',
      color: '#a7f3d0',
      desc: '将抽象和实现分离，让两者可以独立变化。'
    },
    composite: {
      name: '组合模式',
      group: '结构型',
      tag: '树形结构',
      color: '#86efac',
      desc: '统一处理单个对象和对象集合，适合树形层级。'
    },
    decorator: {
      name: '装饰器模式',
      group: '结构型',
      tag: '动态增强',
      color: '#f9a8d4',
      desc: '在不修改原类的情况下叠加额外职责。'
    },
    facade: {
      name: '外观模式',
      group: '结构型',
      tag: '统一入口',
      color: '#fcd34d',
      desc: '给复杂子系统提供一个简单统一的入口。'
    },
    flyweight: {
      name: '享元模式',
      group: '结构型',
      tag: '共享对象',
      color: '#67e8f9',
      desc: '通过共享可复用对象来减少内存消耗。'
    },
    proxy: {
      name: '代理模式',
      group: '结构型',
      tag: '中间代理',
      color: '#fda4af',
      desc: '通过代理控制访问、缓存、懒加载或远程调用。'
    },
    chain_of_responsibility: {
      name: '职责链模式',
      group: '行为型',
      tag: '逐级处理',
      color: '#fde68a',
      desc: '将请求沿链传递，直到某个处理者处理为止。'
    },
    command: {
      name: '命令模式',
      group: '行为型',
      tag: '请求封装',
      color: '#fdba74',
      desc: '把动作封装成对象，便于撤销、重做和回放。'
    },
    interpreter: {
      name: '解释器模式',
      group: '行为型',
      tag: '规则解析',
      color: '#c084fc',
      desc: '为简单语言或规则定义解释执行逻辑。'
    },
    iterator: {
      name: '迭代器模式',
      group: '行为型',
      tag: '遍历集合',
      color: '#60a5fa',
      desc: '提供统一方式遍历聚合对象，而不暴露内部结构。'
    },
    mediator: {
      name: '中介者模式',
      group: '行为型',
      tag: '集中协调',
      color: '#fb7185',
      desc: '通过中介对象协调多个对象之间的交互。'
    },
    memento: {
      name: '备忘录模式',
      group: '行为型',
      tag: '状态快照',
      color: '#f472b6',
      desc: '保存对象状态快照，支持撤销、回滚和恢复。'
    },
    observer: {
      name: '观察者模式',
      group: '行为型',
      tag: '事件订阅',
      color: '#fca5a5',
      desc: '状态变化时自动通知订阅者，适合联动刷新。'
    },
    state: {
      name: '状态模式',
      group: '行为型',
      tag: '状态切换',
      color: '#c4b5fd',
      desc: '把对象在不同状态下的行为拆开，减少 if/else。'
    },
    strategy: {
      name: '策略模式',
      group: '行为型',
      tag: '算法可换',
      color: '#7dd3fc',
      desc: '把可变算法独立出来，方便切换不同策略。'
    },
    template_method: {
      name: '模板方法模式',
      group: '行为型',
      tag: '固定流程',
      color: '#fde68a',
      desc: '定义流程骨架，把差异步骤交给子类或配置。'
    },
    visitor: {
      name: '访问者模式',
      group: '行为型',
      tag: '操作分离',
      color: '#a5b4fc',
      desc: '把对对象结构的操作从对象本身分离出来。'
    },
  };

  const QUESTIONS = [
    {
      title: '根据编号直接创建不同敌人',
      prompt: '关卡配置里写着敌人编号 1、2、3，游戏要直接返回对应类型的敌人对象。最适合用哪个模式？',
      options: ['simple_factory', 'factory_method', 'observer', 'adapter'],
      answer: 'simple_factory',
      explain: '简单工厂把创建逻辑集中在一个入口，调用者不用关心具体类。'
    },
    {
      title: '不同关卡由不同生成器负责造怪',
      prompt: '普通关卡、Boss 关卡、限时关卡都需要生成敌人，但具体怎么生成由子类决定。最适合用哪个模式？',
      options: ['factory_method', 'builder', 'prototype', 'singleton'],
      answer: 'factory_method',
      explain: '工厂方法把对象创建延迟到子类，便于扩展新产品。'
    },
    {
      title: '同时创建一整套风格统一的界面组件',
      prompt: '你要为“古风主题”和“科幻主题”分别创建按钮、面板、字体等组件，且它们要风格一致。最适合用哪个模式？',
      options: ['abstract_factory', 'adapter', 'facade', 'decorator'],
      answer: 'abstract_factory',
      explain: '抽象工厂用于创建相互关联的一组对象，特别适合产品族。'
    },
    {
      title: '逐步拼装一个复杂角色对象',
      prompt: '角色需要先选职业，再加装备，再配置技能，最后才能生成完整对象。最适合用哪个模式？',
      options: ['builder', 'prototype', 'observer', 'strategy'],
      answer: 'builder',
      explain: '建造者模式适合分步骤构建复杂对象，并控制构建过程。'
    },
    {
      title: '复制已有地图模板快速生成新关卡',
      prompt: '你已经调好一张标准关卡模板，希望直接复制后再做少量修改。最适合用哪个模式？',
      options: ['prototype', 'factory_method', 'template_method', 'adapter'],
      answer: 'prototype',
      explain: '原型模式通过克隆已有对象来快速创建新对象。'
    },
    {
      title: '全局配置和资源管理只保留一个实例',
      prompt: '音频管理器、全局配置、游戏总控都必须全局唯一。最适合用哪个模式？',
      options: ['singleton', 'mediator', 'observer', 'bridge'],
      answer: 'singleton',
      explain: '单例模式保证类只有一个实例，常用于全局管理对象。'
    },
    {
      title: '把手柄输入转换成游戏统一指令',
      prompt: '现有系统只认识“移动、跳跃、攻击”这些统一命令，但新接入的手柄接口完全不同。最适合用哪个模式？',
      options: ['adapter', 'proxy', 'iterator', 'state'],
      answer: 'adapter',
      explain: '适配器把不同接口转换为统一接口，方便现有系统使用。'
    },
    {
      title: '图形渲染与底层平台独立变化',
      prompt: '你希望“图形类型”和“渲染平台”可以各自扩展，而不会彼此绑死。最适合用哪个模式？',
      options: ['bridge', 'composite', 'facade', 'decorator'],
      answer: 'bridge',
      explain: '桥接模式把抽象和实现分离，让二者可以独立演化。'
    },
    {
      title: '技能树既有分支也有叶子节点',
      prompt: '技能树里有“技能组”和“单个技能”，你希望统一对待它们。最适合用哪个模式？',
      options: ['composite', 'iterator', 'visitor', 'proxy'],
      answer: 'composite',
      explain: '组合模式统一处理树中的容器节点和叶子节点。'
    },
    {
      title: '给子弹叠加火焰、穿透和冰冻效果',
      prompt: '不想改原子弹类，但希望动态增加多个效果，并且能叠加。最适合用哪个模式？',
      options: ['decorator', 'flyweight', 'template_method', 'state'],
      answer: 'decorator',
      explain: '装饰器模式可以在不修改原对象的前提下动态扩展职责。'
    },
    {
      title: '一键进入游戏需要做很多初始化',
      prompt: '进入游戏前要先加载资源、登录、建房、拉取配置，你只希望上层调用一个简单入口。最适合用哪个模式？',
      options: ['facade', 'proxy', 'builder', 'observer'],
      answer: 'facade',
      explain: '外观模式为复杂子系统提供统一简单入口。'
    },
    {
      title: '大量地图砖块共享相同外形数据',
      prompt: '地图上有成千上万个相同的砖块，如果每个都保存一份完整数据会很浪费内存。最适合用哪个模式？',
      options: ['flyweight', 'prototype', 'command', 'chain_of_responsibility'],
      answer: 'flyweight',
      explain: '享元模式通过共享内部状态来节省大量内存。'
    },
    {
      title: '图片列表先显示占位图，真正使用时再加载',
      prompt: '你希望访问图片时先通过一个代理控制，必要时再去真正加载资源。最适合用哪个模式？',
      options: ['proxy', 'facade', 'observer', 'bridge'],
      answer: 'proxy',
      explain: '代理模式可以控制访问、懒加载、缓存或远程调用。'
    },
    {
      title: '审批流按级别逐层流转',
      prompt: '请假、报销、采购都要先经过班长、主管、经理逐级审批。最适合用哪个模式？',
      options: ['chain_of_responsibility', 'mediator', 'observer', 'iterator'],
      answer: 'chain_of_responsibility',
      explain: '职责链模式让请求沿着链逐级传递，直到被处理。'
    },
    {
      title: '把按钮点击封装成可撤销的动作',
      prompt: 'WASD、空格、Q 键都要对应具体游戏动作，而且要支持回放和撤销。最适合用哪个模式？',
      options: ['command', 'memento', 'strategy', 'state'],
      answer: 'command',
      explain: '命令模式把请求封装成对象，便于记录、撤销和重做。'
    },
    {
      title: '解析一个非常简单的规则语言',
      prompt: '你有一串类似“移动 3 步、攻击 2 次”的小规则，希望程序能按语法解释执行。最适合用哪个模式？',
      options: ['interpreter', 'visitor', 'template_method', 'facade'],
      answer: 'interpreter',
      explain: '解释器模式用于定义简单语言的文法并进行解释执行。'
    },
    {
      title: '遍历背包里的所有道具',
      prompt: '你不想暴露背包内部结构，只想统一地从第一个道具遍历到最后一个。最适合用哪个模式？',
      options: ['iterator', 'observer', 'prototype', 'mediator'],
      answer: 'iterator',
      explain: '迭代器模式提供统一遍历方式，隐藏内部实现。'
    },
    {
      title: '聊天室里多个对象互相协作',
      prompt: '玩家、聊天窗口、通知面板之间交互复杂，你希望它们通过一个中介统一协调。最适合用哪个模式？',
      options: ['mediator', 'observer', 'command', 'proxy'],
      answer: 'mediator',
      explain: '中介者模式用一个对象集中协调多个对象之间的交互。'
    },
    {
      title: '关卡编辑器支持撤销和回滚',
      prompt: '编辑地图时每次拖动、删除、复制都要保存快照，方便撤销到上一步。最适合用哪个模式？',
      options: ['memento', 'command', 'factory_method', 'state'],
      answer: 'memento',
      explain: '备忘录模式保存对象状态快照，特别适合撤销和恢复。'
    },
    {
      title: '血量变化后界面自动刷新',
      prompt: '玩家受伤后，血条、数值、提示框都要同步更新，而且以后可能继续加新的界面模块。最适合用哪个模式？',
      options: ['observer', 'decorator', 'builder', 'adapter'],
      answer: 'observer',
      explain: '观察者模式适合“一处变化，多处响应”的事件通知场景。'
    },
    {
      title: '同一个敌人在不同状态下表现完全不同',
      prompt: '敌人会在巡逻、追击、受伤、狂暴之间切换，每种状态都要执行不同逻辑。最适合用哪个模式？',
      options: ['state', 'strategy', 'chain_of_responsibility', 'proxy'],
      answer: 'state',
      explain: '状态模式把不同状态下的行为拆开，避免大量条件分支。'
    },
    {
      title: '暴击、闪避、吸血规则可自由切换',
      prompt: '同一套攻击流程下，你希望按玩法切换不同结算算法。最适合用哪个模式？',
      options: ['strategy', 'state', 'command', 'interpreter'],
      answer: 'strategy',
      explain: '策略模式把算法独立封装，便于替换和扩展。'
    },
    {
      title: '所有关卡流程都遵循固定骨架',
      prompt: '每一关都要先初始化、再生成敌人、再结算奖励，只是细节步骤不同。最适合用哪个模式？',
      options: ['template_method', 'factory_method', 'facade', 'mediator'],
      answer: 'template_method',
      explain: '模板方法固定流程骨架，把差异步骤交给子类实现。'
    },
    {
      title: '对地图中的元素做多种不同操作',
      prompt: '你希望对“墙、怪物、道具”等对象执行“导出统计、检查碰撞、生成报表”等操作，但不想把这些逻辑写进对象本身。最适合用哪个模式？',
      options: ['visitor', 'iterator', 'observer', 'decorator'],
      answer: 'visitor',
      explain: '访问者模式把对对象结构的操作分离出来，便于增加新操作。'
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
    mistakes: [],
    timerId: null,
    freezeTimeoutId: null,
    locked: false,
    finished: false,
    hintCharges: HINT_CHARGES,
    freezeCharges: FREEZE_CHARGES,
    shieldCharges: SHIELD_CHARGES,
    doubleCharges: DOUBLE_CHARGES,
    shieldActive: false,
    doubleActive: false,
    hintUsedThisRound: false,
    rewardedMilestones: new Set(),
    bossCleared: 0,
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
  let hintBtnEl;
  let freezeBtnEl;
  let shieldBtnEl;
  let doubleBtnEl;
  let playAgainBtnEl;
  let resultOverlayEl;
  let resultTitleEl;
  let resultTextEl;
  let resultEmojiEl;
  let summaryEl;
  let reviewBoxEl;
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
    hintBtnEl = document.getElementById('hintBtn');
    freezeBtnEl = document.getElementById('freezeBtn');
    shieldBtnEl = document.getElementById('shieldBtn');
    doubleBtnEl = document.getElementById('doubleBtn');
    playAgainBtnEl = document.getElementById('playAgainBtn');
    resultOverlayEl = document.getElementById('resultOverlay');
    resultTitleEl = document.getElementById('resultTitle');
    resultTextEl = document.getElementById('resultText');
    resultEmojiEl = document.getElementById('resultEmoji');
    summaryEl = document.getElementById('summaryBox');
    reviewBoxEl = document.getElementById('reviewBox');
    patternCardsEl = document.getElementById('patternCards');
    statusPillEl = document.getElementById('statusPill');

    const stored = Number(localStorage.getItem(STORAGE_KEY) || '0');
    state.bestScore = Number.isFinite(stored) ? stored : 0;
  }

  function bindEvents() {
    startBtnEl.addEventListener('click', startGame);
    restartBtnEl.addEventListener('click', restartGame);
    hintBtnEl.addEventListener('click', useHint);
    freezeBtnEl.addEventListener('click', useFreeze);
    shieldBtnEl.addEventListener('click', activateShield);
    doubleBtnEl.addEventListener('click', activateDouble);
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
    state.mistakes = [];
    state.locked = false;
    state.finished = false;
    state.hintCharges = HINT_CHARGES;
    state.freezeCharges = FREEZE_CHARGES;
    state.shieldCharges = SHIELD_CHARGES;
    state.doubleCharges = DOUBLE_CHARGES;
    state.shieldActive = false;
    state.doubleActive = false;
    state.hintUsedThisRound = false;
    state.rewardedMilestones = new Set();
    state.bossCleared = 0;
    renderRound();
    startTimer();
    updateUI();
    hideResult();
    setStatus('设计模式试炼已开始');
  }

  function restartGame() {
    stopTimer();
    clearFreezeTimeout();
    startGame();
  }

  function resetGame() {
    stopTimer();
    clearFreezeTimeout();
    clearOptionButtons();
    feedbackEl.textContent = '点击开始按钮，进入设计模式软考单选题试炼。';
  }

  function isBossRound(roundNumber) {
    return roundNumber > 0 && roundNumber % BOSS_INTERVAL === 0;
  }

  function getCurrentQuestion() {
    return QUESTIONS[state.roundOrder[state.roundIndex]];
  }

  function getRoundNumber() {
    return state.roundIndex + 1;
  }

  function renderRound() {
    const question = getCurrentQuestion();
    const roundNo = getRoundNumber();
    const bossRound = isBossRound(roundNo);

    roundTitleEl.textContent = bossRound ? `Boss 试炼 · 第 ${roundNo} 关` : `第 ${roundNo} 关 · 软考单选题`;
    roundPromptEl.innerHTML = `
      <span class="dpq-exam-chip ${bossRound ? 'boss' : ''}">${bossRound ? 'BOSS 试炼' : '单选题'}</span>
      <strong class="dpq-exam-title">${question.title}</strong>
      <span class="dpq-exam-stem">${question.prompt}</span>
      <span class="dpq-exam-note">${bossRound ? 'Boss 题奖励更高，失误惩罚更重。' : '请从 4 个选项中选出最符合题意的一项。'}</span>
    `;
    roundHintEl.textContent = bossRound ? 'Boss 试炼：高奖励高风险' : '考点：设计模式场景判断';
    feedbackEl.textContent = bossRound
      ? 'Boss 试炼已开启，答对会获得额外奖励。'
      : '请先抓住题干里的场景关键词，再选择最符合题意的模式。';
    state.timeLeft = ROUND_TIME;
    state.locked = false;
    state.hintUsedThisRound = false;
    renderOptions(question.options);
    renderPatternCards(question, bossRound);
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
      button.innerHTML = `<span class="dpq-option-name">${pattern.name}</span><span class="dpq-option-tag">${pattern.group} · ${pattern.tag}</span>`;
      button.addEventListener('click', () => answerQuestion(key, button));
      optionListEl.appendChild(button);
    });
  }

  function renderPatternCards(question, bossRound) {
    const keys = Array.from(new Set([...question.options, question.answer]));
    const cards = bossRound
      ? [{ name: 'Boss 试炼', group: '机制', tag: '奖励更高', color: '#111', desc: 'Boss 关会放大你的收益，也会放大你的失误。' }]
      : [];

    cards.push(...keys.map((key) => {
      const pattern = PATTERNS[key];
      return {
        name: pattern.name,
        group: pattern.group,
        tag: pattern.tag,
        color: pattern.color,
        desc: pattern.desc,
      };
    }));

    patternCardsEl.innerHTML = cards.map((card) => `
      <article class="dpq-card ${card.name === 'Boss 试炼' ? 'boss-card' : ''}" style="--card-color:${card.color}">
        <div class="dpq-card-title">${card.name}</div>
        <div class="dpq-card-tag">${card.group} · ${card.tag}</div>
        <p>${card.desc}</p>
      </article>
    `).join('');
  }

  function answerQuestion(selectedKey, buttonEl) {
    if (state.locked || state.finished) return;
    state.locked = true;
    stopTimer();
    clearFreezeTimeout();

    const question = getCurrentQuestion();
    const roundNo = getRoundNumber();
    const bossRound = isBossRound(roundNo);
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
      if (bossRound) state.bossCleared += 1;

      const rewardMessages = grantStreakRewards();
      const comboBonus = Math.min(5, state.streak);
      const bossBonus = bossRound ? BOSS_BONUS + state.streak : 0;
      let points = SCORE_PER_CORRECT + comboBonus + bossBonus;

      if (state.doubleActive) {
        points *= 2;
        state.doubleActive = false;
      }

      state.score += points;
      const rewardText = rewardMessages.length > 0 ? ` ${rewardMessages.join(' ')}` : '';
      const doubleText = bossRound ? ` Boss 奖励 +${bossBonus} 分。` : '';
      const comboText = comboBonus > 0 ? ` 连击加成 +${comboBonus} 分。` : '';

      feedbackEl.textContent = `正确！${correctPattern.name} +${points} 分。${doubleText}${comboText}${question.explain}${rewardText}`;
      setStatus(bossRound ? 'Boss 试炼：通关成功' : '软考单选题：作答正确');
    } else {
      handleWrongAnswer(question, selectedKey, correctPattern, bossRound);
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

  function handleWrongAnswer(question, selectedKey, correctPattern, bossRound) {
    const shieldProtected = consumeShield();

    if (!shieldProtected) {
      const penalty = bossRound ? BOSS_LIFE_PENALTY : 1;
      state.lives -= penalty;
      state.streak = 0;
      state.mistakes.push({
        title: question.title,
        prompt: question.prompt,
        selected: PATTERNS[selectedKey] ? PATTERNS[selectedKey].name : '未作答',
        correct: correctPattern.name,
        explain: question.explain,
        reason: bossRound ? `Boss 失误 -${penalty} 生命` : '答错'
      });
      feedbackEl.textContent = `答错了。正确答案是 ${correctPattern.name}。${question.explain}`;
      setStatus(bossRound ? 'Boss 试炼：失误受罚' : '软考单选题：本题作答错误');
      return;
    }

    feedbackEl.textContent = `护盾生效！本次失误没有扣命，连击也被保留。正确答案是 ${correctPattern.name}。${question.explain}`;
    setStatus('护盾已触发');
  }

  function grantStreakRewards() {
    const messages = [];

    STREAK_REWARDS.forEach((reward) => {
      if (state.streak >= reward.threshold && !state.rewardedMilestones.has(reward.threshold)) {
        state.rewardedMilestones.add(reward.threshold);
        if (reward.type === 'hint') state.hintCharges += reward.amount;
        if (reward.type === 'shield') state.shieldCharges += reward.amount;
        if (reward.type === 'double') state.doubleCharges += reward.amount;
        if (reward.type === 'freeze') state.freezeCharges += reward.amount;
        messages.push(reward.label);
      }
    });

    return messages;
  }

  function useHint() {
    if (state.locked || state.finished || state.hintCharges <= 0 || state.hintUsedThisRound) return;

    const question = getCurrentQuestion();
    const candidates = Array.from(optionListEl.querySelectorAll('.dpq-option'))
      .filter((btn) => btn.dataset.pattern !== question.answer && !btn.disabled);

    if (candidates.length === 0) return;

    const target = candidates[Math.floor(Math.random() * candidates.length)];
    target.disabled = true;
    target.classList.add('disabled', 'hinted');
    state.hintCharges -= 1;
    state.hintUsedThisRound = true;

    feedbackEl.textContent = `提示已使用：已排除一个干扰项。抓住关键词“${PATTERNS[question.answer].tag}”来判断答案。`;
    setStatus('提示卡已触发');
    updateUI();
  }

  function useFreeze() {
    if (state.locked || state.finished || state.freezeCharges <= 0) return;

    state.freezeCharges -= 1;
    clearFreezeTimeout();
    stopTimer();
    feedbackEl.textContent = '冻结卡已发动：倒计时暂停 3 秒。';
    setStatus('冻结中');
    updateUI();

    state.freezeTimeoutId = window.setTimeout(() => {
      state.freezeTimeoutId = null;
      if (!state.finished && !state.locked) {
        setStatus('冻结结束');
        startTimer();
      }
    }, FREEZE_DURATION);
  }

  function activateShield() {
    if (state.locked || state.finished || state.shieldActive || state.shieldCharges <= 0) return;

    state.shieldCharges -= 1;
    state.shieldActive = true;
    feedbackEl.textContent = '护盾已激活：下一次失误将被抵消。';
    setStatus('护盾已激活');
    updateUI();
  }

  function activateDouble() {
    if (state.locked || state.finished || state.doubleActive || state.doubleCharges <= 0) return;

    state.doubleCharges -= 1;
    state.doubleActive = true;
    feedbackEl.textContent = '双倍分已激活：下一次答对将获得双倍收益。';
    setStatus('双倍分已激活');
    updateUI();
  }

  function consumeShield() {
    if (!state.shieldActive) return false;
    state.shieldActive = false;
    return true;
  }

  function startTimer() {
    stopTimer();
    updateProgress();

    state.timerId = window.setInterval(() => {
      if (state.finished || state.locked) return;
      state.timeLeft -= 1;
      updateProgress();
      if (state.timeLeft <= 0) {
        handleTimeout();
      }
    }, 1000);
  }

  function handleTimeout() {
    clearFreezeTimeout();
    const question = getCurrentQuestion();
    const correctPattern = PATTERNS[question.answer];
    const roundNo = getRoundNumber();
    const bossRound = isBossRound(roundNo);
    const shieldProtected = consumeShield();

    if (!shieldProtected) {
      const penalty = bossRound ? BOSS_LIFE_PENALTY : 1;
      state.lives -= penalty;
      state.streak = 0;
      state.mistakes.push({
        title: question.title,
        prompt: question.prompt,
        selected: '超时未作答',
        correct: correctPattern.name,
        explain: question.explain,
        reason: bossRound ? `Boss 超时 -${penalty} 生命` : '超时'
      });
      feedbackEl.textContent = '时间到！本题判定失败。';
      setStatus(bossRound ? 'Boss 试炼：超时失误' : '软考单选题：超时');
    } else {
      feedbackEl.textContent = `护盾生效！本次超时没有扣命。正确答案是 ${correctPattern.name}。`;
      setStatus('护盾已触发');
    }

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

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function clearFreezeTimeout() {
    if (state.freezeTimeoutId) {
      clearTimeout(state.freezeTimeoutId);
      state.freezeTimeoutId = null;
    }
  }

  function endGame(completed) {
    stopTimer();
    clearFreezeTimeout();
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
      resultTitleEl.textContent = '学习完成';
      resultTextEl.textContent = `你完成了全部 ${total} 题练习，最终得分 ${state.score}，完成率约 ${accuracy}%。Boss 关击破 ${state.bossCleared} 次。`;
    } else {
      resultEmojiEl.textContent = '💥';
      resultTitleEl.textContent = '本轮结束';
      resultTextEl.textContent = `你在第 ${state.roundIndex + 1} 关止步，最终得分 ${state.score}，已击破 Boss ${state.bossCleared} 次。`;
    }

    summaryEl.innerHTML = buildSummary();
    reviewBoxEl.innerHTML = buildReviewList();
    showResult();
    setStatus(completed ? '设计模式试炼已全部覆盖' : '可以重新开始继续学习');
  }

  function buildSummary() {
    const groupOrder = ['补充', '创建型', '结构型', '行为型'];
    const bossRounds = Math.floor(QUESTIONS.length / BOSS_INTERVAL);

    return `
      <div class="dpq-summary-grid">
        ${groupOrder.map((group) => {
          const count = QUESTIONS.filter((q) => PATTERNS[q.answer].group === group).length;
          return `<div class="dpq-summary-item"><strong>${group}</strong><span>${count} 题</span></div>`;
        }).join('')}
      </div>
      <div class="dpq-summary-grid dpq-summary-grid-secondary">
        <div class="dpq-summary-item"><strong>Boss 关</strong><span>${bossRounds} 个</span></div>
        <div class="dpq-summary-item"><strong>提示卡</strong><span>${state.hintCharges} 张</span></div>
        <div class="dpq-summary-item"><strong>冻结卡</strong><span>${state.freezeCharges} 张</span></div>
        <div class="dpq-summary-item"><strong>护盾/双倍</strong><span>${state.shieldCharges}/${state.doubleCharges}</span></div>
      </div>
    `;
  }

  function buildReviewList() {
    if (!state.mistakes.length) {
      return '<div class="dpq-review-empty">这局没有错题，太强了，直接满分通关！</div>';
    }

    return `
      <div class="dpq-review-grid">
        ${state.mistakes.map((item, index) => `
          <article class="dpq-review-item">
            <div class="dpq-review-top">
              <strong>错题 ${index + 1}</strong>
              <span>${item.reason}</span>
            </div>
            <h4>${item.title}</h4>
            <p class="dpq-review-prompt">${item.prompt}</p>
            <div class="dpq-review-meta">
              <div><b>你的答案</b><span>${item.selected}</span></div>
              <div><b>正确答案</b><span>${item.correct}</span></div>
            </div>
            <p class="dpq-review-explain">${item.explain}</p>
          </article>
        `).join('')}
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
    updatePowerupButtons();

    if (state.lives <= 1) {
      livesEl.parentElement.classList.add('danger');
    } else {
      livesEl.parentElement.classList.remove('danger');
    }
  }

  function updatePowerupButtons() {
    hintBtnEl.textContent = state.hintCharges > 0 ? `提示卡（${state.hintCharges}）` : '提示卡已用完';
    freezeBtnEl.textContent = state.freezeCharges > 0 ? `冻结卡（${state.freezeCharges}）` : '冻结卡已用完';
    shieldBtnEl.textContent = state.shieldActive ? '护盾卡（生效中）' : (state.shieldCharges > 0 ? `护盾卡（${state.shieldCharges}）` : '护盾卡已用完');
    doubleBtnEl.textContent = state.doubleActive ? '双倍分（生效中）' : (state.doubleCharges > 0 ? `双倍分（${state.doubleCharges}）` : '双倍分已用完');

    hintBtnEl.disabled = state.hintCharges <= 0 || state.locked || state.finished;
    freezeBtnEl.disabled = state.freezeCharges <= 0 || state.locked || state.finished;
    shieldBtnEl.disabled = state.shieldCharges <= 0 || state.locked || state.finished || state.shieldActive;
    doubleBtnEl.disabled = state.doubleCharges <= 0 || state.locked || state.finished || state.doubleActive;

    hintBtnEl.classList.toggle('ready', state.hintCharges > 0 && !state.locked && !state.finished);
    freezeBtnEl.classList.toggle('ready', state.freezeCharges > 0 && !state.locked && !state.finished);
    shieldBtnEl.classList.toggle('active', state.shieldActive);
    shieldBtnEl.classList.toggle('ready', state.shieldCharges > 0 && !state.locked && !state.finished && !state.shieldActive);
    doubleBtnEl.classList.toggle('active', state.doubleActive);
    doubleBtnEl.classList.toggle('ready', state.doubleCharges > 0 && !state.locked && !state.finished && !state.doubleActive);
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
    reviewBoxEl.innerHTML = buildReviewList();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
