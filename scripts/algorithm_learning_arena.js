(() => {
  'use strict';

  const STORAGE_KEY = 'ala-best-score';
  const ROUND_TIME = 18;
  const MAX_LIVES = 3;
  const SCORE_PER_CORRECT = 10;
  const HINT_CHARGES = 3;
  const SPEED_BONUS_THRESHOLD = 10;
  const SPEED_BONUS_SCORE = 5;

  const ALGORITHMS = {
    complexity: {
      name: '时间复杂度',
      group: '基础理解',
      tag: '效率判断',
      color: '#ffe66d',
      desc: '判断代码执行效率，常见有 O(1)、O(n)、O(log n)、O(n log n)、O(n²)。'
    },
    array: {
      name: '数组',
      group: '基础结构',
      tag: '连续存储',
      color: '#7dd3fc',
      desc: '适合按下标访问，查找快，插入删除中间元素相对麻烦。'
    },
    linked_list: {
      name: '链表',
      group: '基础结构',
      tag: '节点串联',
      color: '#86efac',
      desc: '通过指针把节点串起来，插入删除灵活，但随机访问慢。'
    },
    stack: {
      name: '栈',
      group: '基础结构',
      tag: '后进先出',
      color: '#fca5a5',
      desc: '适合递归调用、表达式求值、括号匹配等后进先出场景。'
    },
    queue: {
      name: '队列',
      group: '基础结构',
      tag: '先进先出',
      color: '#c4b5fd',
      desc: '适合任务排队、缓冲区、广度优先搜索等先进先出场景。'
    },
    sort: {
      name: '排序',
      group: '常见算法',
      tag: '重新排列',
      color: '#fdba74',
      desc: '把元素按顺序排列，常考比较排序、稳定性和时间复杂度。'
    },
    binary_search: {
      name: '二分查找',
      group: '常见算法',
      tag: '每次折半',
      color: '#7cff6b',
      desc: '在有序序列中每次排除一半范围，复杂度是 O(log n)。'
    },
    recursion: {
      name: '递归',
      group: '算法思想',
      tag: '自己调用自己',
      color: '#f9a8d4',
      desc: '把问题拆成相同的子问题，先写出口，再处理当前层。'
    },
    divide_conquer: {
      name: '分治',
      group: '算法思想',
      tag: '拆分再合并',
      color: '#a5b4fc',
      desc: '把大问题分成多个小问题分别解决，最后合并结果。'
    },
    greedy: {
      name: '贪心',
      group: '算法思想',
      tag: '局部最优',
      color: '#fde68a',
      desc: '每一步都做当前看起来最优的选择，适合某些特殊问题。'
    },
    dynamic_programming: {
      name: '动态规划',
      group: '算法思想',
      tag: '记录状态',
      color: '#93c5fd',
      desc: '通过保存中间状态避免重复计算，核心是状态和转移。'
    },
    graph_bfs: {
      name: 'BFS',
      group: '图算法',
      tag: '按层遍历',
      color: '#67e8f9',
      desc: '广度优先搜索，适合找最短层数、最少步数和连通扩展。'
    },
    graph_dfs: {
      name: 'DFS',
      group: '图算法',
      tag: '一路深入',
      color: '#fda4af',
      desc: '深度优先搜索，适合树遍历、路径搜索和回溯基础。'
    },
    shortest_path: {
      name: '最短路径',
      group: '图算法',
      tag: '最短路线',
      color: '#c084fc',
      desc: '在图中寻找从起点到终点的最小代价路径，常见于地图与网络。'
    },
    topological_sort: {
      name: '拓扑排序',
      group: '图算法',
      tag: '依赖顺序',
      color: '#60a5fa',
      desc: '用于有向无环图中的依赖关系排序，例如任务执行顺序。'
    },
    hashing: {
      name: '哈希',
      group: '高效查找',
      tag: '快速定位',
      color: '#fca5a5',
      desc: '用哈希表将键映射到位置，平均查找效率高。'
    },
    kmp: {
      name: 'KMP',
      group: '字符串',
      tag: '模式匹配',
      color: '#7dd3fc',
      desc: '字符串模式匹配算法，失配时利用前缀信息减少重复比较。'
    },
    backtracking: {
      name: '回溯',
      group: '搜索',
      tag: '试错撤销',
      color: '#ffe66d',
      desc: '通过尝试、判断、回退来搜索所有可能解，适合排列组合。'
    },
    tree_traversal: {
      name: '树遍历',
      group: '图与树',
      tag: '先中后序',
      color: '#86efac',
      desc: '访问树中所有节点，常考前序、中序、后序和层次遍历。'
    },
    matrix: {
      name: '二维数组',
      group: '基础结构',
      tag: '表格数据',
      color: '#fcd34d',
      desc: '适合表示矩阵和表格，常与路径、动态规划表结合出现。'
    },
    prefix_suffix: {
      name: '前缀后缀',
      group: '字符串',
      tag: '相同边界',
      color: '#f472b6',
      desc: '用于理解字符串中的相同开头和结尾，也是 KMP 的重要基础。'
    },
    complexity_compare: {
      name: '复杂度对比',
      group: '基础理解',
      tag: '选更优方案',
      color: '#c4b5fd',
      desc: '比较不同方案的时间和空间开销，考试常考选择更优解。'
    },
    binary_tree: {
      name: '二叉树',
      group: '图与树',
      tag: '左右分支',
      color: '#fb7185',
      desc: '常用于递归、树遍历、查找路径和层次分析。'
    },
  };

  const ALGORITHM_ORDER = [
    'complexity',
    'complexity_compare',
    'array',
    'linked_list',
    'stack',
    'queue',
    'sort',
    'binary_search',
    'recursion',
    'divide_conquer',
    'greedy',
    'dynamic_programming',
    'graph_bfs',
    'graph_dfs',
    'shortest_path',
    'topological_sort',
    'hashing',
    'kmp',
    'backtracking',
    'tree_traversal',
    'matrix',
    'prefix_suffix',
    'binary_tree',
  ];

  const QUESTIONS = [
    {
      title: '看代码规模判断快慢',
      prompt: '题目要求你判断一段算法是 O(n) 还是 O(n²)，重点不在代码细节，而在比较执行次数。最适合学习哪个知识点？',
      options: ['complexity', 'sort', 'stack', 'queue'],
      answer: 'complexity',
      explain: '时间复杂度就是用来衡量算法执行效率的。'
    },
    {
      title: '比较两个方案谁更优',
      prompt: '你在面试中需要比较“暴力枚举”和“优化查表”两种方案，判断哪一个更省时省空间。最适合学习哪个知识点？',
      options: ['complexity_compare', 'hashing', 'matrix', 'array'],
      answer: 'complexity_compare',
      explain: '很多题不是直接考复杂度公式，而是考你能否选出更优方案。'
    },
    {
      title: '按下标快速访问元素',
      prompt: '在一个成绩表里，你要根据第 5 行第 3 列直接读出数据。最适合用哪个基础结构？',
      options: ['array', 'linked_list', 'queue', 'stack'],
      answer: 'array',
      explain: '数组连续存储，按下标访问非常快。'
    },
    {
      title: '频繁插入删除中间节点',
      prompt: '你维护一个待办列表，插入和删除经常发生在中间位置，而且不太需要随机访问。最适合用哪个基础结构？',
      options: ['linked_list', 'array', 'matrix', 'binary_tree'],
      answer: 'linked_list',
      explain: '链表适合频繁插入删除，但随机访问较慢。'
    },
    {
      title: '函数调用的返回顺序',
      prompt: '程序执行时，最后调用的函数最先返回，适合模拟调用栈。最适合学习哪个结构？',
      options: ['stack', 'queue', 'array', 'tree_traversal'],
      answer: 'stack',
      explain: '栈是后进先出，和递归调用非常接近。'
    },
    {
      title: '任务排队处理',
      prompt: '打印任务、消息处理、BFS 遍历都要先到先处理。最适合学习哪个结构？',
      options: ['queue', 'stack', 'linked_list', 'matrix'],
      answer: 'queue',
      explain: '队列是先进先出，适合排队和层次遍历。'
    },
    {
      title: '把一组数重新排序',
      prompt: '你需要把一组乱序数字排成从小到大，考试里常常还会让你判断稳定性和时间复杂度。最适合学习哪个知识点？',
      options: ['sort', 'hashing', 'kmp', 'tree_traversal'],
      answer: 'sort',
      explain: '排序是软考算法部分的常考主题。'
    },
    {
      title: '在有序数组里找目标值',
      prompt: '你已经知道数据是从小到大排好的，现在要快速找到某个数字，不能一个一个试。最适合用哪个算法？',
      options: ['binary_search', 'queue', 'recursion', 'backtracking'],
      answer: 'binary_search',
      explain: '二分查找专门用于有序数据，每次排除一半范围。'
    },
    {
      title: '问题可以继续拆成同类子问题',
      prompt: '汉诺塔、斐波那契、树遍历这些题都有一个共同点：函数自己调用自己。最适合学习哪个知识点？',
      options: ['recursion', 'greedy', 'hashing', 'matrix'],
      answer: 'recursion',
      explain: '递归就是把大问题拆成规模更小、形式相同的子问题。'
    },
    {
      title: '拆成若干小块分别解决再合并',
      prompt: '你想先把大数组分成两半，各自处理完再合并结果。最适合用哪个思想？',
      options: ['divide_conquer', 'dynamic_programming', 'queue', 'stack'],
      answer: 'divide_conquer',
      explain: '分治的核心就是拆分、解决、合并。'
    },
    {
      title: '每一步都选当前最划算的',
      prompt: '在活动安排或零钱找零这类题里，你每次只考虑当前最优选择，而不是回头重算全部情况。最适合学习哪个思想？',
      options: ['greedy', 'backtracking', 'dynamic_programming', 'graph_dfs'],
      answer: 'greedy',
      explain: '贪心强调局部最优，适合某些特定问题。'
    },
    {
      title: '保存中间结果避免重复计算',
      prompt: '背包问题、最长公共子序列这类题需要记录子问题结果，再用它们推出大问题答案。最适合学习哪个思想？',
      options: ['dynamic_programming', 'greedy', 'sort', 'hashing'],
      answer: 'dynamic_programming',
      explain: '动态规划靠状态和状态转移，能减少大量重复计算。'
    },
    {
      title: '从起点一层一层扩展',
      prompt: '在迷宫、最少步数、最短层数这类题中，你希望先访问离起点最近的点。最适合哪个图算法？',
      options: ['graph_bfs', 'graph_dfs', 'topological_sort', 'kmp'],
      answer: 'graph_bfs',
      explain: 'BFS 按层扩展，非常适合最短步数问题。'
    },
    {
      title: '一路深入直到走不动',
      prompt: '你要遍历树或者在图里沿着一条路径一直往下搜，走到尽头后再回退。最适合哪个图算法？',
      options: ['graph_dfs', 'graph_bfs', 'queue', 'binary_search'],
      answer: 'graph_dfs',
      explain: 'DFS 适合深度优先搜索、树遍历和回溯基础。'
    },
    {
      title: '地图上找最省路程',
      prompt: '城市道路图里，每条边都有权重，你想找从 A 到 B 的最短路径。最适合学习哪个知识点？',
      options: ['shortest_path', 'topological_sort', 'kmp', 'array'],
      answer: 'shortest_path',
      explain: '最短路径是图算法中的经典考点。'
    },
    {
      title: '任务有前后依赖关系',
      prompt: '编译、课程安排、项目模块构建都要按依赖顺序执行。最适合学习哪个图算法？',
      options: ['topological_sort', 'graph_bfs', 'hashing', 'tree_traversal'],
      answer: 'topological_sort',
      explain: '拓扑排序用于有向无环图中的依赖关系排序。'
    },
    {
      title: '用键快速定位值',
      prompt: '你要根据名字快速找到对应数据，不想每次都从头找。最适合学习哪个方法？',
      options: ['hashing', 'array', 'sort', 'queue'],
      answer: 'hashing',
      explain: '哈希表通过键值映射提高查找效率。'
    },
    {
      title: '字符串匹配减少重复比较',
      prompt: '你要在一段文本中找模式串，失配后不想回头重复比太多次。最适合学习哪个算法？',
      options: ['kmp', 'recursion', 'binary_search', 'stack'],
      answer: 'kmp',
      explain: 'KMP 是字符串模式匹配的经典算法。'
    },
    {
      title: '尝试所有可能，再撤销错误分支',
      prompt: '你要从一组数字里找出所有排列组合，通常需要试、判断、回退。最适合学习哪个思想？',
      options: ['backtracking', 'greedy', 'sort', 'queue'],
      answer: 'backtracking',
      explain: '回溯适合枚举所有可能解。'
    },
    {
      title: '树节点按不同顺序访问',
      prompt: '二叉树题中，题目会让你按先序、中序、后序或层次顺序访问节点。最适合学习哪个知识点？',
      options: ['tree_traversal', 'binary_tree', 'graph_bfs', 'stack'],
      answer: 'tree_traversal',
      explain: '树遍历是树结构中的基础考点。'
    },
    {
      title: '用表格记录状态转移',
      prompt: '你在做动态规划时常会画一个二维表，每个格子代表一个状态。最适合学习哪个结构？',
      options: ['matrix', 'dynamic_programming', 'array', 'linked_list'],
      answer: 'matrix',
      explain: '二维数组常用于动态规划表、矩阵和路径问题。'
    },
    {
      title: '理解字符串边界信息',
      prompt: '你在学习 KMP 前，先要理解字符串的前缀和后缀怎么匹配。最适合学习哪个知识点？',
      options: ['prefix_suffix', 'kmp', 'hashing', 'sort'],
      answer: 'prefix_suffix',
      explain: '前缀后缀是字符串算法的重要基础概念。'
    },
    {
      title: '左右分支都要能继续递归',
      prompt: '你在分析一棵二叉树的结构，左子树和右子树都可以继续递归处理。最适合学习哪个结构？',
      options: ['binary_tree', 'tree_traversal', 'stack', 'queue'],
      answer: 'binary_tree',
      explain: '二叉树是树与递归题中最常见的结构之一。'
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
    hintCharges: HINT_CHARGES,
    lightningMode: false,
    hintUsedThisRound: false,
    collected: new Set(),
    wrongAttempts: 0,
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
  let lightningBtnEl;
  let playAgainBtnEl;
  let resultOverlayEl;
  let resultTitleEl;
  let resultTextEl;
  let resultEmojiEl;
  let summaryEl;
  let algorithmCardsEl;
  let collectionProgressEl;
  let collectionFillEl;
  let collectionListEl;
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
    lightningBtnEl = document.getElementById('lightningBtn');
    playAgainBtnEl = document.getElementById('playAgainBtn');
    resultOverlayEl = document.getElementById('resultOverlay');
    resultTitleEl = document.getElementById('resultTitle');
    resultTextEl = document.getElementById('resultText');
    resultEmojiEl = document.getElementById('resultEmoji');
    summaryEl = document.getElementById('summaryBox');
    algorithmCardsEl = document.getElementById('algorithmCards');
    collectionProgressEl = document.getElementById('collectionProgress');
    collectionFillEl = document.getElementById('collectionFill');
    collectionListEl = document.getElementById('collectionList');
    statusPillEl = document.getElementById('statusPill');

    const stored = Number(localStorage.getItem(STORAGE_KEY) || '0');
    state.bestScore = Number.isFinite(stored) ? stored : 0;
  }

  function bindEvents() {
    startBtnEl.addEventListener('click', startGame);
    restartBtnEl.addEventListener('click', restartGame);
    hintBtnEl.addEventListener('click', useHint);
    lightningBtnEl.addEventListener('click', toggleLightningMode);
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
    state.hintCharges = HINT_CHARGES;
    state.lightningMode = false;
    state.hintUsedThisRound = false;
    state.collected = new Set();
    state.wrongAttempts = 0;
    renderRound();
    startTimer();
    updateUI();
    hideResult();
    setStatus('算法学习训练已开始');
  }

  function restartGame() {
    stopTimer();
    startGame();
  }

  function resetGame() {
    stopTimer();
    clearOptionButtons();
    feedbackEl.textContent = '点击开始按钮，进入算法软考单选题训练场。';
  }

  function renderRound() {
    const question = QUESTIONS[state.roundOrder[state.roundIndex]];
    const roundNo = state.roundIndex + 1;
    roundTitleEl.textContent = `第 ${roundNo} 关 · 软考单选题`;
    roundPromptEl.innerHTML = `
      <span class="ala-exam-chip">单选题</span>
      <strong class="ala-exam-title">${question.title}</strong>
      <span class="ala-exam-stem">${question.prompt}</span>
      <span class="ala-exam-note">请从 4 个选项中选出最符合题意的一项。</span>
    `;
    roundHintEl.textContent = '考点：算法与数据结构';
    feedbackEl.textContent = '先抓住题干关键词，再判断对应的算法或数据结构。';
    state.timeLeft = ROUND_TIME;
    state.locked = false;
    state.hintUsedThisRound = false;
    renderOptions(question.options);
    renderAlgorithmCards(question);
    updateUI();
  }

  function renderOptions(options) {
    optionListEl.innerHTML = '';
    options.forEach((key) => {
      const algorithm = ALGORITHMS[key];
      const button = document.createElement('button');
      button.className = 'ala-option';
      button.type = 'button';
      button.dataset.algorithm = key;
      button.innerHTML = `<span class="ala-option-name">${algorithm.name}</span><span class="ala-option-tag">${algorithm.group} · ${algorithm.tag}</span>`;
      button.addEventListener('click', () => answerQuestion(key, button));
      optionListEl.appendChild(button);
    });
  }

  function renderAlgorithmCards(question) {
    const keys = Array.from(new Set([...question.options, question.answer]));
    algorithmCardsEl.innerHTML = keys.map((key) => {
      const algorithm = ALGORITHMS[key];
      return `
        <article class="ala-card" style="--card-color:${algorithm.color}">
          <div class="ala-card-title">${algorithm.name}</div>
          <div class="ala-card-tag">${algorithm.group} · ${algorithm.tag}</div>
          <p>${algorithm.desc}</p>
        </article>
      `;
    }).join('');
  }

  function renderCollection() {
    const unlockedCount = state.collected.size;
    const totalCount = ALGORITHM_ORDER.length;
    const percent = Math.round((unlockedCount / totalCount) * 100);

    collectionProgressEl.textContent = `${unlockedCount}/${totalCount}`;
    collectionFillEl.style.width = `${percent}%`;

    collectionListEl.innerHTML = ALGORITHM_ORDER.map((key) => {
      const algorithm = ALGORITHMS[key];
      const unlocked = state.collected.has(key);
      return `
        <article class="ala-collection-item ${unlocked ? 'unlocked' : 'locked'}">
          <div class="ala-collection-name">${unlocked ? algorithm.name : '未解锁'}</div>
          <div class="ala-collection-tag">${unlocked ? `${algorithm.group} · ${algorithm.tag}` : '等待收集'}</div>
        </article>
      `;
    }).join('');
  }

  function answerQuestion(selectedKey, buttonEl) {
    if (state.locked || state.finished) return;
    if (buttonEl.disabled) return;

    state.locked = true;
    stopTimer();

    const question = QUESTIONS[state.roundOrder[state.roundIndex]];
    const isCorrect = selectedKey === question.answer;
    const correctAlgorithm = ALGORITHMS[question.answer];
    const speedBonus = state.lightningMode && state.timeLeft >= SPEED_BONUS_THRESHOLD ? SPEED_BONUS_SCORE : 0;

    Array.from(optionListEl.querySelectorAll('.ala-option')).forEach((btn) => {
      const isRight = btn.dataset.algorithm === question.answer;
      const isPicked = btn === buttonEl;
      btn.classList.add('disabled');
      btn.disabled = true;
      if (isRight) btn.classList.add('correct');
      if (isPicked && !isCorrect) btn.classList.add('wrong');
    });

    if (isCorrect) {
      state.streak += 1;
      state.collected.add(question.answer);
      const comboBonus = Math.min(5, state.streak);
      const totalBonus = SCORE_PER_CORRECT + comboBonus + speedBonus;
      state.score += totalBonus;
      state.wrongAttempts = 0;

      const bonusText = speedBonus > 0 ? `，闪电奖励 +${speedBonus} 分` : '';
      feedbackEl.textContent = `正确！${correctAlgorithm.name} +${totalBonus} 分${bonusText}。${question.explain}`;
      setStatus('软考单选题：作答正确');
    } else {
      state.lives -= 1;
      state.streak = 0;
      state.wrongAttempts += 1;
      feedbackEl.textContent = `答错了。正确答案是 ${correctAlgorithm.name}。${question.explain}`;
      setStatus('软考单选题：本题作答错误');
    }

    updateUI();
    renderCollection();

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

  function useHint() {
    if (state.locked || state.finished || state.hintCharges <= 0 || state.hintUsedThisRound) return;

    const question = QUESTIONS[state.roundOrder[state.roundIndex]];
    const candidates = Array.from(optionListEl.querySelectorAll('.ala-option'))
      .filter((btn) => btn.dataset.algorithm !== question.answer && !btn.disabled);

    if (candidates.length === 0) return;

    const target = candidates[Math.floor(Math.random() * candidates.length)];
    target.disabled = true;
    target.classList.add('disabled', 'hinted');
    state.hintCharges -= 1;
    state.hintUsedThisRound = true;

    feedbackEl.textContent = `提示已使用：已排除一个干扰项。抓住关键词“${ALGORITHMS[question.answer].tag}”来判断答案。`;
    setStatus('提示卡已触发');
    updateUI();
  }

  function toggleLightningMode() {
    if (state.finished) return;
    state.lightningMode = !state.lightningMode;
    setStatus(state.lightningMode ? '闪电模式已开启' : '闪电模式已关闭');
    updateUI();
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
        state.wrongAttempts += 1;
        feedbackEl.textContent = '时间到！本题判定失败。';
        updateUI();
        Array.from(optionListEl.querySelectorAll('.ala-option')).forEach((btn) => {
          btn.classList.add('disabled');
          btn.disabled = true;
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
    renderCollection();

    const total = QUESTIONS.length;
    const passed = state.roundIndex + (completed ? 1 : 0);
    const accuracy = Math.max(0, Math.min(100, Math.round((passed / total) * 100)));

    if (completed) {
      resultEmojiEl.textContent = '🎓';
      resultTitleEl.textContent = state.collected.size === total ? '全图鉴收集完成' : '学习完成';
      resultTextEl.textContent = `你完成了全部 ${total} 题软考单选题训练，最终得分 ${state.score}，完成率约 ${accuracy}%。`;
    } else {
      resultEmojiEl.textContent = '💥';
      resultTitleEl.textContent = '本轮结束';
      resultTextEl.textContent = `你在第 ${state.roundIndex + 1} 关止步，最终得分 ${state.score}，已收集 ${state.collected.size}/${total} 个知识图鉴。`;
    }

    summaryEl.innerHTML = buildSummary();
    showResult();
    setStatus(completed ? '算法软考知识点已覆盖完毕' : '可以重新开始继续学习');
  }

  function buildSummary() {
    const groups = ['基础理解', '基础结构', '常见算法', '算法思想', '图算法', '高效查找', '字符串', '搜索', '图与树'];
    const seen = new Set();
    const counts = groups
      .filter((group) => {
        const count = QUESTIONS.filter((q) => ALGORITHMS[q.answer].group === group).length;
        if (count === 0 || seen.has(group)) return false;
        seen.add(group);
        return true;
      })
      .map((group) => {
        const count = QUESTIONS.filter((q) => ALGORITHMS[q.answer].group === group).length;
        return `<div class="ala-summary-item"><strong>${group}</strong><span>${count} 题</span></div>`;
      })
      .join('');

    return `
      <div class="ala-summary-grid">
        ${counts}
      </div>
      <div class="ala-summary-grid ala-summary-grid-secondary">
        <div class="ala-summary-item"><strong>提示卡剩余</strong><span>${state.hintCharges} 张</span></div>
        <div class="ala-summary-item"><strong>闪电模式</strong><span>${state.lightningMode ? '开启' : '关闭'}</span></div>
        <div class="ala-summary-item"><strong>已收集图鉴</strong><span>${state.collected.size}/${ALGORITHM_ORDER.length}</span></div>
        <div class="ala-summary-item"><strong>错题次数</strong><span>${state.wrongAttempts} 次</span></div>
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
    updateButtons();
    renderCollection();

    if (state.lives <= 1) {
      livesEl.parentElement.classList.add('danger');
    } else {
      livesEl.parentElement.classList.remove('danger');
    }
  }

  function updateButtons() {
    hintBtnEl.textContent = state.hintCharges > 0 ? `提示卡（${state.hintCharges}）` : '提示卡已用完';
    hintBtnEl.disabled = state.hintCharges <= 0 || state.locked || state.finished;
    lightningBtnEl.textContent = state.lightningMode ? '闪电模式：开' : '闪电模式：关';
    lightningBtnEl.classList.toggle('active', state.lightningMode);
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
    setStatus('等待开始 · 软考单选题');
    summaryEl.innerHTML = buildSummary();
    renderCollection();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
