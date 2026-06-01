(() => {
    "use strict";

    const STORAGE_KEY = "mfe-save-state";

    const MODE_CONFIG = {
        story: {
            label: "故事模式",
            timeMultiplier: 1,
            monsterMultiplier: 1,
            scoreMultiplier: 1,
        },
        challenge: {
            label: "限时挑战",
            timeMultiplier: 0.9,
            monsterMultiplier: 0.85,
            scoreMultiplier: 1.2,
        },
        endless: {
            label: "无尽模式",
            timeMultiplier: 0.82,
            monsterMultiplier: 0.72,
            scoreMultiplier: 1.35,
        },
    };

    const LEVELS = [
        {
            name: "第 1 关 · 电力失控",
            objective: "找到 1 张钥匙卡，修复电源，然后前往出口。",
            timeLimit: 180,
            keysRequired: 1,
            playerStart: [5, 1],
            monsterStart: [3, 3],
            monsterInterval: 1100,
            layout: [
                "#######",
                "#K...E#",
                "#.#.#.#",
                "#..M..#",
                "#.#.#.#",
                "#S....#",
                "#######",
            ],
        },
        {
            name: "第 2 关 · 维修通道",
            objective: "收集 2 把钥匙，避开巡逻怪，打开闸门。",
            timeLimit: 165,
            keysRequired: 2,
            playerStart: [5, 1],
            monsterStart: [2, 5],
            monsterInterval: 980,
            layout: [
                "#######",
                "#K.#.E#",
                "#..#..#",
                "#.M...#",
                "#..#K.#",
                "#S....#",
                "#######",
            ],
        },
        {
            name: "第 3 关 · 怪物追击",
            objective: "启动警报后快速逃离，别被加速怪抓到。",
            timeLimit: 150,
            keysRequired: 2,
            playerStart: [5, 1],
            monsterStart: [1, 5],
            monsterInterval: 850,
            layout: [
                "#######",
                "#K...E#",
                "#.###.#",
                "#..M..#",
                "#.#.#K#",
                "#S....#",
                "#######",
            ],
        },
        {
            name: "第 4 关 · 熔炉区域",
            objective: "找到 3 把钥匙，穿过高温区域，冲向最终出口。",
            timeLimit: 135,
            keysRequired: 3,
            playerStart: [5, 1],
            monsterStart: [3, 5],
            monsterInterval: 760,
            layout: [
                "#######",
                "#K.#.E#",
                "#..#..#",
                "#.#M#.#",
                "#K...K#",
                "#S....#",
                "#######",
            ],
        },
    ];

    const state = {
        save: {
            unlockedLevel: 1,
            bestScore: 0,
        },
        mode: "story",
        selectedLevelIndex: 0,
        levelIndex: 0,
        running: false,
        paused: false,
        overlayOpen: false,
        score: 0,
        timeLeft: 0,
        collectedKeys: 0,
        requiredKeys: 0,
        player: { row: 0, col: 0 },
        monster: { row: 0, col: 0 },
        levelMap: [],
        tiles: [],
        countdownTimer: null,
        monsterTimer: null,
        selectedNextAction: "next",
        levelCleared: false,
        gameOver: false,
    };

    let homeScreenEl;
    let stageScreenEl;
    let unlockTextEl;
    let startGameBtnEl;
    let selectLevelBtnEl;
    let pauseBtnEl;
    let restartBtnEl;
    let backHomeBtnEl;
    let nextLevelBtnEl;
    let retryLevelBtnEl;
    let levelTitleEl;
    let timeTextEl;
    let keyTextEl;
    let alarmTextEl;
    let scoreTextEl;
    let objectiveTextEl;
    let statusTextEl;
    let metaTextEl;
    let monsterTextEl;
    let inventoryListEl;
    let boardEl;
    let resultOverlayEl;
    let resultEmojiEl;
    let resultTitleEl;
    let resultTextEl;
    let modeCards = [];
    let levelCards = [];

    function initDom() {
        homeScreenEl = document.getElementById("homeScreen");
        stageScreenEl = document.getElementById("stageScreen");
        unlockTextEl = document.getElementById("unlockText");
        startGameBtnEl = document.getElementById("startGameBtn");
        selectLevelBtnEl = document.getElementById("selectLevelBtn");
        pauseBtnEl = document.getElementById("pauseBtn");
        restartBtnEl = document.getElementById("restartBtn");
        backHomeBtnEl = document.getElementById("backHomeBtn");
        nextLevelBtnEl = document.getElementById("nextLevelBtn");
        retryLevelBtnEl = document.getElementById("retryLevelBtn");
        levelTitleEl = document.getElementById("levelTitle");
        timeTextEl = document.getElementById("timeText");
        keyTextEl = document.getElementById("keyText");
        alarmTextEl = document.getElementById("alarmText");
        scoreTextEl = document.getElementById("scoreText");
        objectiveTextEl = document.getElementById("objectiveText");
        statusTextEl = document.getElementById("statusText");
        metaTextEl = document.getElementById("metaText");
        monsterTextEl = document.getElementById("monsterText");
        inventoryListEl = document.getElementById("inventoryList");
        boardEl = document.getElementById("board");
        resultOverlayEl = document.getElementById("resultOverlay");
        resultEmojiEl = document.getElementById("resultEmoji");
        resultTitleEl = document.getElementById("resultTitle");
        resultTextEl = document.getElementById("resultText");
        modeCards = Array.from(document.querySelectorAll(".mfe-mode-card"));
        levelCards = Array.from(document.querySelectorAll(".mfe-level-card"));
        state.tiles = Array.from(boardEl.querySelectorAll(".tile"));

        const saved = loadSave();
        state.save.unlockedLevel = saved.unlockedLevel;
        state.save.bestScore = saved.bestScore;

        refreshHomeLocks();
        syncLevelSelection();
        updateUnlockText();
        applyModeSelection();
        applyLevelSelection();
        updateInventory();
    }

    function bindEvents() {
        startGameBtnEl.addEventListener("click", () => startSelectedLevel());
        selectLevelBtnEl.addEventListener("click", () => {
            const section = document.querySelector(".mfe-levels");
            if (section) {
                section.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });

        pauseBtnEl.addEventListener("click", togglePause);
        restartBtnEl.addEventListener("click", () => restartLevel());
        backHomeBtnEl.addEventListener("click", () => showHome());

        nextLevelBtnEl.addEventListener("click", () => {
            if (state.selectedNextAction === "home") {
                showHome();
                return;
            }

            const nextIndex = Math.min(state.levelIndex + 1, LEVELS.length - 1);
            startLevel(nextIndex);
        });

        retryLevelBtnEl.addEventListener("click", () => {
            hideResultOverlay();
            startLevel(state.levelIndex);
        });

        modeCards.forEach((card) => {
            card.addEventListener("click", () => {
                if (state.running) {
                    toast("正在关卡中，先暂停或重开再切换模式");
                    return;
                }

                state.mode = card.dataset.mode || "story";
                applyModeSelection();
                updateHomeHeroStats();
                toast(`已切换为 ${MODE_CONFIG[state.mode].label}`);
            });
        });

        levelCards.forEach((card) => {
            card.addEventListener("click", () => {
                const levelIndex = Number(card.dataset.level || "1") - 1;
                if (Number.isNaN(levelIndex)) return;

                if (levelIndex + 1 > state.save.unlockedLevel) {
                    toast("该关卡尚未解锁");
                    return;
                }

                state.selectedLevelIndex = levelIndex;
                syncLevelSelection();
                toast(`已选择 ${LEVELS[levelIndex].name}`);
            });
        });

        document.querySelectorAll("[data-move]").forEach((btn) => {
            btn.addEventListener("click", () => {
                if (!state.running || state.paused || state.overlayOpen) return;
                const move = btn.dataset.move;
                if (move === "up") movePlayer(-1, 0);
                if (move === "down") movePlayer(1, 0);
                if (move === "left") movePlayer(0, -1);
                if (move === "right") movePlayer(0, 1);
            });
        });

        document.querySelectorAll("[data-action]").forEach((btn) => {
            btn.addEventListener("click", () => {
                if (!state.running || state.paused || state.overlayOpen) return;
                if (btn.dataset.action === "interact") {
                    interact();
                }
            });
        });

        document.addEventListener("keydown", handleKeydown);
        document.addEventListener("visibilitychange", () => {
            if (document.hidden && state.running && !state.paused) {
                pauseGame(true);
            }
        });

        window.addEventListener("resize", () => {
            refreshBoardAspect();
        });
    }

    function handleKeydown(event) {
        if (!state.running || state.paused || state.overlayOpen) return;

        switch (event.key.toLowerCase()) {
            case "arrowup":
            case "w":
                event.preventDefault();
                movePlayer(-1, 0);
                break;
            case "arrowdown":
            case "s":
                event.preventDefault();
                movePlayer(1, 0);
                break;
            case "arrowleft":
            case "a":
                event.preventDefault();
                movePlayer(0, -1);
                break;
            case "arrowright":
            case "d":
                event.preventDefault();
                movePlayer(0, 1);
                break;
            case "e":
            case " ":
                event.preventDefault();
                interact();
                break;
            case "p":
                event.preventDefault();
                togglePause();
                break;
            default:
                break;
        }
    }

    function loadSave() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { unlockedLevel: 1, bestScore: 0 };
            const parsed = JSON.parse(raw);
            return {
                unlockedLevel: Math.max(1, Number(parsed.unlockedLevel) || 1),
                bestScore: Math.max(0, Number(parsed.bestScore) || 0),
            };
        } catch (error) {
            return { unlockedLevel: 1, bestScore: 0 };
        }
    }

    function saveGame() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    unlockedLevel: state.save.unlockedLevel,
                    bestScore: state.save.bestScore,
                })
            );
        } catch (error) {
            // ignore
        }
    }

    function updateUnlockText() {
        unlockTextEl.textContent = `第 ${state.save.unlockedLevel} 关已解锁`;
    }

    function refreshHomeLocks() {
        levelCards.forEach((card) => {
            const levelIndex = Number(card.dataset.level || "1");
            const isUnlocked = levelIndex <= state.save.unlockedLevel;
            card.classList.toggle("locked", !isUnlocked);
            card.disabled = !isUnlocked;
            card.setAttribute("aria-disabled", String(!isUnlocked));
        });
    }

    function applyModeSelection() {
        modeCards.forEach((card) => {
            card.classList.toggle("active", card.dataset.mode === state.mode);
        });
    }

    function syncLevelSelection() {
        levelCards.forEach((card) => {
            const levelIndex = Number(card.dataset.level || "1") - 1;
            card.classList.toggle("active", levelIndex === state.selectedLevelIndex);
        });
        updateHomeHeroStats();
    }

    function updateHomeHeroStats() {
        const selectedLevel = LEVELS[state.selectedLevelIndex];
        if (!selectedLevel) return;
        unlockTextEl.textContent = `已选：${selectedLevel.name}`;
    }

    function applyLevelSelection() {
        const selected = LEVELS[state.selectedLevelIndex];
        if (selected) {
            levelTitleEl.textContent = selected.name;
            objectiveTextEl.textContent = selected.objective;
        }
    }

    function showHome() {
        stopTimers();
        state.running = false;
        state.paused = false;
        state.overlayOpen = false;
        state.levelCleared = false;
        state.gameOver = false;

        hideResultOverlay();
        stageScreenEl.hidden = true;
        homeScreenEl.classList.add("is-active");
        homeScreenEl.hidden = false;
        updateUnlockText();
        refreshHomeLocks();
        syncLevelSelection();
    }

    function startSelectedLevel() {
        startLevel(state.selectedLevelIndex);
    }

    function startLevel(levelIndex) {
        const level = LEVELS[levelIndex];
        if (!level) return;

        hideResultOverlay();
        clearTimers();

        state.levelIndex = levelIndex;
        state.running = true;
        state.paused = false;
        state.overlayOpen = false;
        state.levelCleared = false;
        state.gameOver = false;
        state.score = 0;
        state.collectedKeys = 0;
        state.requiredKeys = level.keysRequired;
        state.timeLeft = Math.max(30, Math.round(level.timeLimit * MODE_CONFIG[state.mode].timeMultiplier));
        state.player = { row: level.playerStart[0], col: level.playerStart[1] };
        state.monster = { row: level.monsterStart[0], col: level.monsterStart[1] };
        state.levelMap = level.layout.map((row) => row.split(""));
        state.selectedNextAction = "next";

        homeScreenEl.classList.remove("is-active");
        homeScreenEl.hidden = true;
        stageScreenEl.hidden = false;

        applyLevelSelection();
        buildBoard();
        updateHud();
        updateMetaText();
        updateInventory();
        setStatus("准备逃生");
        refreshBoard();
        startTimers();

        monsterTextEl.textContent = "巡逻怪已启动，注意躲避。";
        scoreTextEl.textContent = "0";
    }

    function restartLevel() {
        if (!state.running) {
            startLevel(state.levelIndex);
            return;
        }

        startLevel(state.levelIndex);
    }

    function togglePause() {
        if (!state.running) return;

        if (state.paused) {
            resumeGame();
        } else {
            pauseGame(false);
        }
    }

    function pauseGame(fromVisibility) {
        if (!state.running) return;
        state.paused = true;
        stopTimers();
        setStatus(fromVisibility ? "已自动暂停" : "游戏已暂停");
        pauseBtnEl.textContent = "继续";
    }

    function resumeGame() {
        if (!state.running) return;
        state.paused = false;
        pauseBtnEl.textContent = "暂停";
        setStatus("继续逃生");
        startTimers();
    }

    function stopTimers() {
        clearTimers();
    }

    function clearTimers() {
        if (state.countdownTimer) {
            clearInterval(state.countdownTimer);
            state.countdownTimer = null;
        }
        if (state.monsterTimer) {
            clearInterval(state.monsterTimer);
            state.monsterTimer = null;
        }
    }

    function startTimers() {
        clearTimers();

        state.countdownTimer = window.setInterval(() => {
            if (!state.running || state.paused || state.overlayOpen) return;
            state.timeLeft -= 1;
            updateHud();
            if (state.timeLeft <= 0) {
                failLevel("时间耗尽");
            }
        }, 1000);

        const level = LEVELS[state.levelIndex];
        const monsterDelay = Math.max(
            380,
            Math.round(level.monsterInterval * MODE_CONFIG[state.mode].monsterMultiplier)
        );

        state.monsterTimer = window.setInterval(() => {
            if (!state.running || state.paused || state.overlayOpen) return;
            moveMonster();
        }, monsterDelay);
    }

    function buildBoard() {
        const level = LEVELS[state.levelIndex];
        const flatCells = state.tiles;
        const boardSize = 7;

        for (let index = 0; index < flatCells.length; index += 1) {
            const row = Math.floor(index / boardSize);
            const col = index % boardSize;
            const cellType = getCellType(row, col);
            const tile = flatCells[index];

            tile.className = "tile";
            tile.removeAttribute("style");
            tile.textContent = "";

            if (cellType === "#") {
                tile.classList.add("wall");
                continue;
            }

            tile.classList.add("floor");
            if (cellType === "K") {
                tile.classList.add("key");
                if (!isPlayerAt(row, col) && !isMonsterAt(row, col)) {
                    paintCell(tile, "🔑");
                }
            } else if (cellType === "E") {
                tile.classList.add("exit", "locked");
                if (!isPlayerAt(row, col) && !isMonsterAt(row, col)) {
                    paintCell(tile, "🔒");
                }
            }

            if (isPlayerAt(row, col)) {
                paintCell(tile, "🧑");
            } else if (isMonsterAt(row, col)) {
                paintCell(tile, "👾");
            }
        }

        levelTitleEl.textContent = level.name;
        objectiveTextEl.textContent = level.objective;
        refreshBoardAspect();
    }

    function refreshBoard() {
        buildBoard();
        updateHud();
    }

    function refreshBoardAspect() {
        if (!boardEl) return;
        const width = boardEl.getBoundingClientRect().width;
        if (!width) return;
        const cellSize = Math.max(34, Math.floor((width - 8 * 6) / 7));
        state.tiles.forEach((tile) => {
            if (tile.classList.contains("wall")) return;
            tile.style.minHeight = `${cellSize}px`;
            tile.style.fontSize = `${Math.max(18, Math.floor(cellSize * 0.52))}px`;
        });
    }

    function paintCell(tile, emoji) {
        tile.style.display = "flex";
        tile.style.alignItems = "center";
        tile.style.justifyContent = "center";
        tile.style.fontSize = "28px";
        tile.style.lineHeight = "1";
        tile.style.userSelect = "none";
        tile.textContent = emoji;
    }

    function getCellType(row, col) {
        const levelRow = state.levelMap[row];
        if (!levelRow) return "#";
        return levelRow[col] || "#";
    }

    function isWall(row, col) {
        return getCellType(row, col) === "#";
    }

    function isExit(row, col) {
        return getCellType(row, col) === "E";
    }

    function isKey(row, col) {
        return getCellType(row, col) === "K";
    }

    function isPlayerAt(row, col) {
        return state.player.row === row && state.player.col === col;
    }

    function isMonsterAt(row, col) {
        return state.monster.row === row && state.monster.col === col;
    }

    function movePlayer(dRow, dCol) {
        if (!state.running || state.paused || state.overlayOpen) return;

        const nextRow = state.player.row + dRow;
        const nextCol = state.player.col + dCol;

        if (nextRow < 0 || nextRow >= 7 || nextCol < 0 || nextCol >= 7) return;
        if (isWall(nextRow, nextCol)) return;

        state.player.row = nextRow;
        state.player.col = nextCol;

        collectKeyIfNeeded();
        updateHud();
        refreshBoard();

        if (isMonsterAt(state.player.row, state.player.col)) {
            failLevel("被怪物抓住了");
            return;
        }

        if (isExit(state.player.row, state.player.col) && state.collectedKeys >= state.requiredKeys) {
            completeLevel();
        } else if (isExit(state.player.row, state.player.col)) {
            setStatus("出口被锁住了");
            toast("还需要更多钥匙");
        } else {
            setStatus("继续前进");
        }
    }

    function interact() {
        if (!state.running || state.paused || state.overlayOpen) return;

        if (isKey(state.player.row, state.player.col)) {
            collectKeyIfNeeded(true);
            return;
        }

        if (isExit(state.player.row, state.player.col)) {
            if (state.collectedKeys >= state.requiredKeys) {
                completeLevel();
            } else {
                toast("出口还锁着，继续找钥匙");
                setStatus("出口未解锁");
            }
            return;
        }

        toast("这里没有可以互动的东西");
    }

    function collectKeyIfNeeded(fromInteract = false) {
        if (!isKey(state.player.row, state.player.col)) return;
        if (state.collectedKeys >= state.requiredKeys) return;

        state.collectedKeys += 1;
        state.score += Math.round(12 * MODE_CONFIG[state.mode].scoreMultiplier);
        setStatus(fromInteract ? "找到钥匙卡" : "自动拾取钥匙卡");
        toast(`钥匙 +1（${state.collectedKeys}/${state.requiredKeys}）`);

        updateHud();
        updateInventory();
        refreshBoard();

        if (state.collectedKeys >= state.requiredKeys) {
            lockExit(false);
            toast("出口已经解锁");
            monsterTextEl.textContent = "警报升级，怪物正在加速！";
        }
    }

    function lockExit(lock) {
        state.tiles.forEach((tile) => {
            if (tile.classList.contains("exit")) {
                tile.classList.toggle("locked", lock);
            }
        });
    }

    function moveMonster() {
        const nextStep = getNextMonsterStep();
        if (!nextStep) return;

        state.monster.row = nextStep.row;
        state.monster.col = nextStep.col;
        refreshBoard();

        if (isMonsterAt(state.player.row, state.player.col)) {
            failLevel("怪物追上你了");
            return;
        }

        const distance = Math.abs(state.player.row - state.monster.row) + Math.abs(state.player.col - state.monster.col);
        if (distance <= 1) {
            setStatus("怪物就在附近！");
            monsterTextEl.textContent = "怪物已经逼近，快跑！";
        }
    }

    function getNextMonsterStep() {
        const queue = [];
        const visited = Array.from({ length: 7 }, () => Array(7).fill(false));
        const prev = Array.from({ length: 7 }, () => Array(7).fill(null));

        queue.push({ row: state.monster.row, col: state.monster.col });
        visited[state.monster.row][state.monster.col] = true;

        while (queue.length > 0) {
            const current = queue.shift();
            if (current.row === state.player.row && current.col === state.player.col) {
                break;
            }

            const neighbours = [
                { row: current.row - 1, col: current.col },
                { row: current.row + 1, col: current.col },
                { row: current.row, col: current.col - 1 },
                { row: current.row, col: current.col + 1 },
            ];

            neighbours.forEach((next) => {
                if (next.row < 0 || next.row >= 7 || next.col < 0 || next.col >= 7) return;
                if (visited[next.row][next.col]) return;
                if (isWall(next.row, next.col)) return;

                const type = getCellType(next.row, next.col);
                if (type === "E" && state.collectedKeys < state.requiredKeys) {
                    return;
                }

                visited[next.row][next.col] = true;
                prev[next.row][next.col] = current;
                queue.push(next);
            });
        }

        let cursor = { row: state.player.row, col: state.player.col };
        if (!prev[cursor.row][cursor.col]) {
            const randomStep = getRandomMonsterStep();
            return randomStep;
        }

        while (
            prev[cursor.row][cursor.col] &&
            !(prev[cursor.row][cursor.col].row === state.monster.row && prev[cursor.row][cursor.col].col === state.monster.col)
        ) {
            cursor = prev[cursor.row][cursor.col];
        }

        return cursor;
    }

    function getRandomMonsterStep() {
        const options = [
            { row: state.monster.row - 1, col: state.monster.col },
            { row: state.monster.row + 1, col: state.monster.col },
            { row: state.monster.row, col: state.monster.col - 1 },
            { row: state.monster.row, col: state.monster.col + 1 },
        ].filter((cell) => {
            if (cell.row < 0 || cell.row >= 7 || cell.col < 0 || cell.col >= 7) return false;
            if (isWall(cell.row, cell.col)) return false;
            return true;
        });

        if (options.length === 0) return null;
        return options[Math.floor(Math.random() * options.length)];
    }

    function completeLevel() {
        state.running = false;
        state.levelCleared = true;
        stopTimers();
        state.score += Math.round(50 * MODE_CONFIG[state.mode].scoreMultiplier);

        if (state.score > state.save.bestScore) {
            state.save.bestScore = state.score;
        }

        const nextLevelExists = state.levelIndex < LEVELS.length - 1;
        if (state.levelIndex + 1 > state.save.unlockedLevel) {
            state.save.unlockedLevel = Math.min(LEVELS.length, state.levelIndex + 2);
        }

        saveGame();
        refreshHomeLocks();
        updateUnlockText();

        if (nextLevelExists) {
            state.selectedNextAction = "next";
            nextLevelBtnEl.textContent = "下一关";
            resultEmojiEl.textContent = "🏆";
            resultTitleEl.textContent = "通关成功";
            resultTextEl.textContent = `你完成了 ${LEVELS[state.levelIndex].name}，得分 ${state.score}。准备进入下一关。`;
        } else {
            state.selectedNextAction = "home";
            nextLevelBtnEl.textContent = "回到首页";
            resultEmojiEl.textContent = "🎉";
            resultTitleEl.textContent = "全部通关";
            resultTextEl.textContent = `你已经逃出所有工厂区域，最终得分 ${state.score}。`;
        }

        showResultOverlay();
        setStatus("关卡完成！");
        scoreTextEl.textContent = String(state.score);
        updateInventory();
        monsterTextEl.textContent = "工厂警报暂时解除。";
    }

    function failLevel(reason) {
        if (state.gameOver) return;
        state.running = false;
        state.gameOver = true;
        stopTimers();

        if (state.score > state.save.bestScore) {
            state.save.bestScore = state.score;
            saveGame();
            refreshHomeLocks();
            updateUnlockText();
        } else {
            saveGame();
        }

        resultEmojiEl.textContent = "💀";
        resultTitleEl.textContent = "逃生失败";
        resultTextEl.textContent = `${reason}，你停在了 ${LEVELS[state.levelIndex].name}，得分 ${state.score}。`;
        nextLevelBtnEl.textContent = "重新前进";
        state.selectedNextAction = "next";

        showResultOverlay();
        setStatus("失败");
        monsterTextEl.textContent = "怪物已经占领了通道。";
    }

    function updateHud() {
        timeTextEl.textContent = formatTime(state.timeLeft);
        keyTextEl.textContent = `${state.collectedKeys} / ${state.requiredKeys}`;
        scoreTextEl.textContent = String(state.score);
        alarmTextEl.textContent = getAlarmLabel();
        pauseBtnEl.textContent = state.paused ? "继续" : "暂停";
        metaTextEl.textContent = `地图：${LEVELS[state.levelIndex].name} / 模式：${MODE_CONFIG[state.mode].label}`;
    }

    function updateInventory() {
        if (!inventoryListEl) return;
        inventoryListEl.innerHTML = "";
        const items = [
            `闪光弹 x${state.levelIndex < 2 ? 1 : 2}`,
            `加速鞋 x1`,
            `钥匙卡 x${Math.max(0, state.requiredKeys - state.collectedKeys)}`,
        ];

        items.forEach((item) => {
            const span = document.createElement("span");
            span.className = "inventory-item";
            span.textContent = item;
            inventoryListEl.appendChild(span);
        });
    }

    function updateMetaText() {
        metaTextEl.textContent = `地图：${LEVELS[state.levelIndex].name} / 模式：${MODE_CONFIG[state.mode].label}`;
    }

    function getAlarmLabel() {
        const distance = Math.abs(state.player.row - state.monster.row) + Math.abs(state.player.col - state.monster.col);
        if (distance <= 1 || state.timeLeft <= 20) return "高";
        if (distance <= 3 || state.timeLeft <= 60) return "中";
        return "低";
    }

    function setStatus(text) {
        statusTextEl.textContent = text;
    }

    function showResultOverlay() {
        state.overlayOpen = true;
        resultOverlayEl.classList.add("show");
        resultOverlayEl.setAttribute("aria-hidden", "false");
    }

    function hideResultOverlay() {
        state.overlayOpen = false;
        resultOverlayEl.classList.remove("show");
        resultOverlayEl.setAttribute("aria-hidden", "true");
    }

    function formatTime(totalSeconds) {
        const seconds = Math.max(0, totalSeconds);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    function toast(message) {
        let toastEl = document.querySelector(".mfe-toast");
        if (!toastEl) {
            toastEl = document.createElement("div");
            toastEl.className = "mfe-toast";
            Object.assign(toastEl.style, {
                position: "fixed",
                left: "50%",
                bottom: "24px",
                transform: "translateX(-50%)",
                border: "3px solid #111",
                background: "#fff",
                borderRadius: "999px",
                padding: "10px 16px",
                boxShadow: "4px 4px 0 #111",
                fontWeight: "800",
                zIndex: "2300",
                display: "none",
                maxWidth: "calc(100vw - 24px)",
                textAlign: "center",
            });
            document.body.appendChild(toastEl);
        }

        toastEl.textContent = message;
        toastEl.style.display = "block";
        clearTimeout(toastEl._hideTimer);
        toastEl._hideTimer = setTimeout(() => {
            toastEl.style.display = "none";
        }, 1400);
    }

    function init() {
        initDom();
        bindEvents();
        updateHomeHeroStats();
        refreshBoardAspect();
        showHome();
        updateHud();
        buildBoard();
        updateInventory();
    }

    document.addEventListener("DOMContentLoaded", init);
})();
