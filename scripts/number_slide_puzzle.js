// 数字华容道游戏核心逻辑

// 优先队列实现（用于A*算法）
class PriorityQueue {
    constructor() {
        this.items = [];
    }
    
    enqueue(element, priority) {
        const queueElement = { element, priority };
        let added = false;
        
        for (let i = 0; i < this.items.length; i++) {
            if (queueElement.priority < this.items[i].priority) {
                this.items.splice(i, 0, queueElement);
                added = true;
                break;
            }
        }
        
        if (!added) {
            this.items.push(queueElement);
        }
    }
    
    dequeue() {
        return this.items.shift();
    }
    
    isEmpty() {
        return this.items.length === 0;
    }
    
    contains(element) {
        return this.items.some(item => item.element === element);
    }
}

class NumberSlidePuzzle {
    constructor() {
        this.size = 3; // 默认3x3模式
        this.board = [];
        this.emptyPos = { row: 0, col: 0 };
        this.moves = 0;
        this.startTime = null;
        this.timer = null;
        this.gameStarted = false;
        this.isAnimating = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadBestScores();
        this.updateDisplay();
    }
    
    // 初始化DOM元素引用
    initializeElements() {
        this.puzzleBoard = document.getElementById('puzzleBoard');
        this.gameModeSelect = document.getElementById('gameMode');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.solveBtn = document.getElementById('solveBtn');
        this.timeDisplay = document.getElementById('timeDisplay');
        this.moveCount = document.getElementById('moveCount');
        this.gameStatus = document.getElementById('gameStatus');
        this.winModal = document.getElementById('winModal');
        this.winTime = document.getElementById('winTime');
        this.winMoves = document.getElementById('winMoves');
        this.newRecord = document.getElementById('newRecord');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.best3x3 = document.getElementById('best3x3');
        this.best4x4 = document.getElementById('best4x4');
        
        // 模态框关闭按钮
        this.closeBtn = this.winModal.querySelector('.close');
    }
    
    // 绑定事件监听器
    bindEvents() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.shuffleBtn.addEventListener('click', () => this.shuffleBoard());
        this.solveBtn.addEventListener('click', () => this.showHint());
        this.gameModeSelect.addEventListener('change', (e) => {
            this.size = parseInt(e.target.value);
            this.startNewGame();
        });
        
        // 模态框事件
        this.closeBtn.addEventListener('click', () => this.hideWinModal());
        this.playAgainBtn.addEventListener('click', () => {
            this.hideWinModal();
            this.startNewGame();
        });
        
        // 点击模态框外部关闭
        this.winModal.addEventListener('click', (e) => {
            if (e.target === this.winModal) {
                this.hideWinModal();
            }
        });
        
        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }
    
    // 开始新游戏
    startNewGame() {
        this.size = parseInt(this.gameModeSelect.value);
        this.moves = 0;
        this.gameStarted = true;
        this.startTime = Date.now();
        
        this.initializeBoard();
        this.renderBoard();
        this.shuffleBoard();
        this.startTimer();
        this.updateDisplay();
        
        this.gameStatus.textContent = '游戏进行中...';
        this.shuffleBtn.disabled = false;
    }
    
    // 初始化棋盘
    initializeBoard() {
        this.board = [];
        for (let i = 0; i < this.size; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.size; j++) {
                this.board[i][j] = i * this.size + j + 1;
            }
        }
        // 最后一个位置是空格
        this.board[this.size - 1][this.size - 1] = 0;
        this.emptyPos = { row: this.size - 1, col: this.size - 1 };
    }
    
    // 渲染棋盘
    renderBoard() {
        this.puzzleBoard.innerHTML = '';
        this.puzzleBoard.className = `puzzle-board size-${this.size}`;
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const tile = document.createElement('div');
                tile.className = 'puzzle-tile';
                tile.dataset.row = i;
                tile.dataset.col = j;
                
                if (this.board[i][j] === 0) {
                    tile.classList.add('empty');
                    tile.textContent = '';
                } else {
                    tile.textContent = this.board[i][j];
                    tile.addEventListener('click', () => this.handleTileClick(i, j));
                }
                
                this.puzzleBoard.appendChild(tile);
            }
        }
        
        this.updateMoveableTiles();
    }
    
    // 更新可移动的方块样式
    updateMoveableTiles() {
        const tiles = this.puzzleBoard.querySelectorAll('.puzzle-tile:not(.empty)');
        tiles.forEach(tile => {
            const row = parseInt(tile.dataset.row);
            const col = parseInt(tile.dataset.col);
            
            if (this.isMoveable(row, col)) {
                tile.classList.add('moveable');
            } else {
                tile.classList.remove('moveable');
            }
        });
    }
    
    // 检查方块是否可移动
    isMoveable(row, col) {
        const emptyRow = this.emptyPos.row;
        const emptyCol = this.emptyPos.col;
        
        return (
            (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
            (Math.abs(col - emptyCol) === 1 && row === emptyRow)
        );
    }
    
    // 处理方块点击
    async handleTileClick(row, col) {
        if (!this.gameStarted || this.isAnimating || !this.isMoveable(row, col)) {
            return;
        }
        
        await this.moveTile(row, col);
        this.moves++;
        this.updateDisplay();
        
        if (this.checkWin()) {
            this.handleWin();
        }
    }
    
    // 移动方块
    async moveTile(row, col) {
        this.isAnimating = true;
        
        const tile = this.puzzleBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const emptyTile = this.puzzleBoard.querySelector(`[data-row="${this.emptyPos.row}"][data-col="${this.emptyPos.col}"]`);
        
        // 添加移动动画类
        tile.classList.add('moving');
        
        // 交换数据
        const temp = this.board[row][col];
        this.board[row][col] = this.board[this.emptyPos.row][this.emptyPos.col];
        this.board[this.emptyPos.row][this.emptyPos.col] = temp;
        
        // 更新空格位置
        this.emptyPos = { row, col };
        
        // 等待动画完成
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 重新渲染棋盘
        this.renderBoard();
        
        this.isAnimating = false;
    }
    
    // 打乱棋盘
    shuffleBoard() {
        if (!this.gameStarted) return;
        
        // 重置计时器
        this.startTime = Date.now();
        this.moves = 0;
        this.updateDisplay();
        
        // 进行随机移动来打乱棋盘
        const shuffleMoves = this.size === 3 ? 500 : 1000;
        
        for (let i = 0; i < shuffleMoves; i++) {
            const moveableTiles = [];
            
            // 找到所有可移动的方块
            for (let row = 0; row < this.size; row++) {
                for (let col = 0; col < this.size; col++) {
                    if (this.board[row][col] !== 0 && this.isMoveable(row, col)) {
                        moveableTiles.push({ row, col });
                    }
                }
            }
            
            if (moveableTiles.length > 0) {
                const randomTile = moveableTiles[Math.floor(Math.random() * moveableTiles.length)];
                
                // 直接交换位置（不需要动画）
                const temp = this.board[randomTile.row][randomTile.col];
                this.board[randomTile.row][randomTile.col] = this.board[this.emptyPos.row][this.emptyPos.col];
                this.board[this.emptyPos.row][this.emptyPos.col] = temp;
                
                this.emptyPos = { row: randomTile.row, col: randomTile.col };
            }
        }
        
        // 确保打乱后的状态不是完成状态
        if (this.checkWin()) {
            this.shuffleBoard();
            return;
        }
        
        this.renderBoard();
        this.gameStatus.textContent = '游戏进行中...';
    }
    
    // 检查是否获胜
    checkWin() {
        let expectedNum = 1;
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (i === this.size - 1 && j === this.size - 1) {
                    // 最后一个位置应该是0（空格）
                    return this.board[i][j] === 0;
                } else {
                    if (this.board[i][j] !== expectedNum) {
                        return false;
                    }
                    expectedNum++;
                }
            }
        }
        
        return true;
    }
    
    // 处理获胜
    handleWin() {
        this.gameStarted = false;
        this.stopTimer();
        
        const totalTime = Math.floor((Date.now() - this.startTime) / 1000);
        const timeStr = this.formatTime(totalTime);
        
        // 更新显示
        this.gameStatus.textContent = '恭喜完成！';
        
        // 检查是否创造新记录
        const isNewRecord = this.checkAndSaveRecord(totalTime, this.moves);
        
        // 显示胜利弹窗
        this.showWinModal(timeStr, this.moves, isNewRecord);
    }
    
    // 显示胜利弹窗
    showWinModal(timeStr, moves, isNewRecord) {
        this.winTime.textContent = timeStr;
        this.winMoves.textContent = moves;
        
        if (isNewRecord) {
            this.newRecord.style.display = 'block';
        } else {
            this.newRecord.style.display = 'none';
        }
        
        this.winModal.classList.add('show');
    }
    
    // 隐藏胜利弹窗
    hideWinModal() {
        this.winModal.classList.remove('show');
    }
    
    // 检查并保存记录
    checkAndSaveRecord(time, moves) {
        const modeKey = `best${this.size}x${this.size}`;
        const currentRecord = localStorage.getItem(modeKey);
        
        let isNewRecord = false;
        
        if (!currentRecord) {
            isNewRecord = true;
        } else {
            const [bestTime, bestMoves] = currentRecord.split(',').map(Number);
            
            // 比较记录：时间优先，步数次之
            if (time < bestTime || (time === bestTime && moves < bestMoves)) {
                isNewRecord = true;
            }
        }
        
        if (isNewRecord) {
            localStorage.setItem(modeKey, `${time},${moves}`);
            this.loadBestScores();
        }
        
        return isNewRecord;
    }
    
    // 加载最佳记录
    loadBestScores() {
        const best3x3Record = localStorage.getItem('best3x3');
        const best4x4Record = localStorage.getItem('best4x4');
        
        if (best3x3Record) {
            const [time, moves] = best3x3Record.split(',').map(Number);
            this.best3x3.textContent = `${this.formatTime(time)} / ${moves}步`;
        }
        
        if (best4x4Record) {
            const [time, moves] = best4x4Record.split(',').map(Number);
            this.best4x4.textContent = `${this.formatTime(time)} / ${moves}步`;
        }
    }
    
    // 自动求解演示（增强版）
    async showHint() {
        if (!this.gameStarted || this.isAnimating) return;
        
        this.isAnimating = true;
        this.solveBtn.disabled = true;
        
        // 根据模式显示不同的提示信息
        const solvingText = this.size === 3 ? 
            '<i class="fas fa-spinner fa-spin"></i> 求解中...' :
            '<i class="fas fa-spinner fa-spin"></i> 复杂求解中，请稍候...';
        
        this.solveBtn.innerHTML = solvingText;
        this.gameStatus.textContent = this.size === 3 ? 
            '正在计算最优解...' : 
            '4x4模式较复杂，正在深度搜索中...';
        
        try {
            // 首先检查是否可解
            if (!this.isSolvable(this.board)) {
                this.gameStatus.textContent = '当前状态无解！请重新开始游戏';
                return;
            }
            
            const startSolveTime = Date.now();
            const solution = await this.solvePuzzle();
            const solveTime = Date.now() - startSolveTime;
            
            console.log(`求解耗时: ${solveTime}ms`);
            
            if (solution && solution.length > 0) {
                this.gameStatus.textContent = `找到解决方案！共${solution.length}步，开始演示...`;
                await this.demonstrateSolution(solution);
                this.gameStatus.textContent = '自动求解完成！';
                this.handleWin();
            } else {
                if (this.size === 4) {
                    this.gameStatus.textContent = '4x4模式求解超时，建议尝试3x3模式或手动求解';
                } else {
                    this.gameStatus.textContent = '无法找到解决方案，请检查游戏状态';
                }
            }
        } catch (error) {
            console.error('求解过程中出现错误:', error);
            this.gameStatus.textContent = '求解过程出现错误，请重试';
        } finally {
            this.isAnimating = false;
            this.solveBtn.disabled = false;
            this.solveBtn.innerHTML = '<i class="fas fa-magic"></i> 自动求解';
        }
    }
    
    // A*算法求解数字华容道（优化版）
    async solvePuzzle() {
        const targetState = this.getTargetState();
        const startState = this.boardToString(this.board);
        
        if (startState === targetState) return [];
        
        // 检查是否可解
        if (!this.isSolvable(this.board)) {
            return null;
        }
        
        // 根据棋盘大小调整搜索参数
        const maxIterations = this.size === 3 ? 50000 : 200000;
        const maxTime = this.size === 3 ? 5000 : 30000; // 最大搜索时间(毫秒)
        const startTime = Date.now();
        
        const openSet = new PriorityQueue();
        const closedSet = new Set();
        const gScore = new Map();
        const fScore = new Map();
        const cameFrom = new Map();
        
        gScore.set(startState, 0);
        fScore.set(startState, this.heuristic(this.board));
        openSet.enqueue(startState, fScore.get(startState));
        
        let iterations = 0;
        
        while (!openSet.isEmpty() && iterations < maxIterations) {
            // 检查超时
            if (Date.now() - startTime > maxTime) {
                console.log(`搜索超时，已搜索${iterations}次`);
                break;
            }
            
            iterations++;
            
            const current = openSet.dequeue().element;
            
            if (current === targetState) {
                console.log(`找到解决方案，搜索了${iterations}次迭代`);
                return this.reconstructPath(cameFrom, current);
            }
            
            closedSet.add(current);
            const currentBoard = this.stringToBoard(current);
            const neighbors = this.getNeighbors(currentBoard);
            
            for (const neighbor of neighbors) {
                const neighborStr = this.boardToString(neighbor);
                
                if (closedSet.has(neighborStr)) continue;
                
                const tentativeGScore = gScore.get(current) + 1;
                
                if (!gScore.has(neighborStr) || tentativeGScore < gScore.get(neighborStr)) {
                    cameFrom.set(neighborStr, current);
                    gScore.set(neighborStr, tentativeGScore);
                    fScore.set(neighborStr, tentativeGScore + this.heuristic(neighbor));
                    
                    if (!openSet.contains(neighborStr)) {
                        openSet.enqueue(neighborStr, fScore.get(neighborStr));
                    }
                }
            }
            
            // 定期让出控制权并清理内存
            if (iterations % 1000 === 0) {
                await new Promise(resolve => setTimeout(resolve, 1));
                
                // 对于4x4模式，定期清理过深的搜索节点以节省内存
                if (this.size === 4 && iterations % 10000 === 0) {
                    this.pruneSearchSpace(closedSet, gScore, fScore, cameFrom);
                }
            }
        }
        
        console.log(`搜索结束，共进行${iterations}次迭代，未找到解决方案`);
        return null; // 无解或超时
    }
    
    // 增强的启发式函数（曼哈顿距离 + 线性冲突）
    heuristic(board) {
        let manhattan = 0;
        let linearConflict = 0;
        
        // 计算曼哈顿距离
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const value = board[i][j];
                if (value !== 0) {
                    const targetRow = Math.floor((value - 1) / this.size);
                    const targetCol = (value - 1) % this.size;
                    manhattan += Math.abs(i - targetRow) + Math.abs(j - targetCol);
                }
            }
        }
        
        // 计算线性冲突（同行或同列中的逆序对）
        for (let i = 0; i < this.size; i++) {
            // 检查行冲突
            const rowTiles = [];
            for (let j = 0; j < this.size; j++) {
                const value = board[i][j];
                if (value !== 0 && Math.floor((value - 1) / this.size) === i) {
                    rowTiles.push({ value, col: j, targetCol: (value - 1) % this.size });
                }
            }
            linearConflict += this.countConflicts(rowTiles, 'col', 'targetCol');
            
            // 检查列冲突
            const colTiles = [];
            for (let j = 0; j < this.size; j++) {
                const value = board[j][i];
                if (value !== 0 && (value - 1) % this.size === i) {
                    colTiles.push({ value, row: j, targetRow: Math.floor((value - 1) / this.size) });
                }
            }
            linearConflict += this.countConflicts(colTiles, 'row', 'targetRow');
        }
        
        return manhattan + 2 * linearConflict;
    }
    
    // 计算冲突数量
    countConflicts(tiles, posKey, targetKey) {
        let conflicts = 0;
        for (let i = 0; i < tiles.length; i++) {
            for (let j = i + 1; j < tiles.length; j++) {
                if (tiles[i][targetKey] > tiles[j][targetKey] && 
                    tiles[i][posKey] < tiles[j][posKey]) {
                    conflicts++;
                }
            }
        }
        return conflicts;
    }
    
    // 检查谜题是否可解
    isSolvable(board) {
        const flatBoard = board.flat();
        const inversions = this.countInversions(flatBoard);
        
        if (this.size % 2 === 1) {
            // 奇数大小：逆序数必须是偶数
            return inversions % 2 === 0;
        } else {
            // 偶数大小：需要考虑空格位置
            const emptyRowFromBottom = this.size - this.emptyPos.row;
            if (emptyRowFromBottom % 2 === 1) {
                return inversions % 2 === 0;
            } else {
                return inversions % 2 === 1;
            }
        }
    }
    
    // 计算逆序数
    countInversions(arr) {
        let inversions = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === 0) continue;
            for (let j = i + 1; j < arr.length; j++) {
                if (arr[j] !== 0 && arr[i] > arr[j]) {
                    inversions++;
                }
            }
        }
        return inversions;
    }
    
    // 清理搜索空间（用于4x4模式内存优化）
    pruneSearchSpace(closedSet, gScore, fScore, cameFrom) {
        const maxClosedSize = 50000; // 最大闭集大小
        
        if (closedSet.size > maxClosedSize) {
            // 将闭集转为数组并按g值排序，保留较好的状态
            const closedArray = Array.from(closedSet).map(state => ({
                state,
                g: gScore.get(state) || Infinity
            }));
            
            closedArray.sort((a, b) => a.g - b.g);
            
            // 清理较差的状态
            const toRemove = closedArray.slice(maxClosedSize * 0.8);
            toRemove.forEach(item => {
                closedSet.delete(item.state);
                gScore.delete(item.state);
                fScore.delete(item.state);
                cameFrom.delete(item.state);
            });
            
            console.log(`清理了${toRemove.length}个搜索状态`);
        }
    }
    
    // 获取目标状态字符串
    getTargetState() {
        const target = [];
        for (let i = 0; i < this.size; i++) {
            target[i] = [];
            for (let j = 0; j < this.size; j++) {
                target[i][j] = i * this.size + j + 1;
            }
        }
        target[this.size - 1][this.size - 1] = 0;
        return this.boardToString(target);
    }
    
    // 棋盘转字符串
    boardToString(board) {
        return board.flat().join(',');
    }
    
    // 字符串转棋盘
    stringToBoard(str) {
        const values = str.split(',').map(Number);
        const board = [];
        for (let i = 0; i < this.size; i++) {
            board[i] = values.slice(i * this.size, (i + 1) * this.size);
        }
        return board;
    }
    
    // 获取邻居状态
    getNeighbors(board) {
        const neighbors = [];
        let emptyRow, emptyCol;
        
        // 找到空格位置
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (board[i][j] === 0) {
                    emptyRow = i;
                    emptyCol = j;
                    break;
                }
            }
        }
        
        // 四个方向的移动
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dr, dc] of directions) {
            const newRow = emptyRow + dr;
            const newCol = emptyCol + dc;
            
            if (newRow >= 0 && newRow < this.size && newCol >= 0 && newCol < this.size) {
                const newBoard = board.map(row => [...row]);
                newBoard[emptyRow][emptyCol] = newBoard[newRow][newCol];
                newBoard[newRow][newCol] = 0;
                neighbors.push(newBoard);
            }
        }
        
        return neighbors;
    }
    
    // 重构路径
    reconstructPath(cameFrom, current) {
        const path = [];
        while (cameFrom.has(current)) {
            const prev = cameFrom.get(current);
            const currentBoard = this.stringToBoard(current);
            const prevBoard = this.stringToBoard(prev);
            
            // 找到移动的方块
            const move = this.findMove(prevBoard, currentBoard);
            if (move) path.unshift(move);
            
            current = prev;
        }
        return path;
    }
    
    // 找到两个状态之间移动的方块
    findMove(prevBoard, currentBoard) {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (prevBoard[i][j] !== 0 && currentBoard[i][j] === 0) {
                    return { row: i, col: j };
                }
            }
        }
        return null;
    }
    
    // 演示解决方案（优化版）
    async demonstrateSolution(solution) {
        const delay = this.size === 3 ? 800 : 600; // 4x4模式演示稍快一些
        
        for (const move of solution) {
            await this.moveTile(move.row, move.col);
            await new Promise(resolve => setTimeout(resolve, delay));
            this.moves++; // 自动求解也要计算步数
            this.updateDisplay();
        }
    }
    
    // 键盘控制
    handleKeyPress(e) {
        if (!this.gameStarted || this.isAnimating) return;
        
        let targetRow = this.emptyPos.row;
        let targetCol = this.emptyPos.col;
        
        switch (e.key) {
            case 'ArrowUp':
                targetRow = Math.min(this.size - 1, this.emptyPos.row + 1);
                break;
            case 'ArrowDown':
                targetRow = Math.max(0, this.emptyPos.row - 1);
                break;
            case 'ArrowLeft':
                targetCol = Math.min(this.size - 1, this.emptyPos.col + 1);
                break;
            case 'ArrowRight':
                targetCol = Math.max(0, this.emptyPos.col - 1);
                break;
            default:
                return;
        }
        
        if (targetRow !== this.emptyPos.row || targetCol !== this.emptyPos.col) {
            e.preventDefault();
            this.handleTileClick(targetRow, targetCol);
        }
    }
    
    // 启动计时器
    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.timer = setInterval(() => {
            if (this.gameStarted && this.startTime) {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                this.timeDisplay.textContent = this.formatTime(elapsed);
            }
        }, 1000);
    }
    
    // 停止计时器
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    // 格式化时间显示
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // 更新显示
    updateDisplay() {
        this.moveCount.textContent = this.moves;
        
        if (this.gameStarted && this.startTime) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            this.timeDisplay.textContent = this.formatTime(elapsed);
        }
    }
}

// 主题切换功能
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    // 检查本地存储的主题设置
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.className = savedTheme + '-mode';
    themeToggle.checked = savedTheme === 'dark';
    
    // 主题切换事件
    themeToggle.addEventListener('change', function() {
        const newTheme = this.checked ? 'dark' : 'light';
        body.className = newTheme + '-mode';
        localStorage.setItem('theme', newTheme);
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化游戏
    const game = new NumberSlidePuzzle();
    
    // 初始化主题切换
    initTheme();
    
    // 添加页面可见性监听，当页面不可见时暂停计时器
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && game.gameStarted) {
            game.stopTimer();
        } else if (!document.hidden && game.gameStarted) {
            game.startTimer();
        }
    });
});