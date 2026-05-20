document.addEventListener('DOMContentLoaded', () => {
    const leftTextarea = document.getElementById('left-json');
    const rightTextarea = document.getElementById('right-json');
    const compareBtn = document.getElementById('compare-btn');
    const formatBtn = document.getElementById('format-btn');
    const swapBtn = document.getElementById('swap-btn');
    const clearBtn = document.getElementById('clear-btn');
    const leftFormatBtn = document.getElementById('left-format-btn');
    const rightFormatBtn = document.getElementById('right-format-btn');
    const leftCopyBtn = document.getElementById('left-copy-btn');
    const rightCopyBtn = document.getElementById('right-copy-btn');
    const syncFormatToggle = document.getElementById('sync-format');
    const ignoreEmptyToggle = document.getElementById('ignore-empty');
    const showEqualToggle = document.getElementById('show-equal');
    const resultBanner = document.getElementById('result-banner');
    const resultList = document.getElementById('result-list');
    const leftStatus = document.getElementById('left-status');
    const rightStatus = document.getElementById('right-status');
    const summary = document.getElementById('summary');

    const DEBOUNCE_DELAY = 350;
    let debounceTimer = null;

    function parseJson(text) {
        const trimmed = text.trim();
        if (!trimmed) {
            return { ok: false, error: '内容为空' };
        }

        try {
            return { ok: true, value: JSON.parse(trimmed) };
        } catch (error) {
            return { ok: false, error: error.message };
        }
    }

    function isEmptyValue(value) {
        if (value === null || value === undefined) {
            return true;
        }

        if (typeof value === 'string') {
            return value.trim() === '';
        }

        if (Array.isArray(value)) {
            return value.length === 0;
        }

        if (typeof value === 'object') {
            return Object.keys(value).length === 0;
        }

        return false;
    }

    function formatJsonText(text) {
        const parsed = parseJson(text);
        if (!parsed.ok) {
            throw new Error(parsed.error);
        }

        return JSON.stringify(parsed.value, null, 2);
    }

    function stringifyValue(value) {
        if (value === undefined) {
            return 'undefined';
        }

        if (typeof value === 'string') {
            return JSON.stringify(value);
        }

        if (typeof value === 'function') {
            return '[Function]';
        }

        try {
            return JSON.stringify(value, null, 2);
        } catch (error) {
            return String(value);
        }
    }

    function getTypeLabel(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    function getPath(parent, key) {
        if (parent === '$') {
            return `$.${key}`;
        }

        return `${parent}.${key}`;
    }

    function getArrayPath(parent, index) {
        return `${parent}[${index}]`;
    }

    function compareNodes(left, right, path, options, diffs) {
        const leftType = getTypeLabel(left);
        const rightType = getTypeLabel(right);

        if (left === right) {
            if (options.showEqual) {
                diffs.push({
                    kind: 'same',
                    path,
                    left,
                    right,
                    leftType,
                    rightType,
                    message: '值相同'
                });
            }
            return;
        }

        if (options.ignoreEmpty && isEmptyValue(left) && isEmptyValue(right)) {
            if (options.showEqual) {
                diffs.push({
                    kind: 'same',
                    path,
                    left,
                    right,
                    leftType,
                    rightType,
                    message: '均为空'
                });
            }
            return;
        }

        if (leftType !== rightType) {
            diffs.push({
                kind: 'changed',
                path,
                left,
                right,
                leftType,
                rightType,
                message: '类型不同'
            });
            return;
        }

        if (Array.isArray(left) && Array.isArray(right)) {
            const maxLength = Math.max(left.length, right.length);

            for (let index = 0; index < maxLength; index += 1) {
                const hasLeft = index < left.length;
                const hasRight = index < right.length;
                const nextPath = getArrayPath(path, index);

                if (hasLeft && hasRight) {
                    compareNodes(left[index], right[index], nextPath, options, diffs);
                } else if (hasLeft) {
                    diffs.push({
                        kind: 'removed',
                        path: nextPath,
                        left: left[index],
                        right: undefined,
                        leftType: getTypeLabel(left[index]),
                        rightType: 'undefined',
                        message: '右侧缺少该数组项'
                    });
                } else {
                    diffs.push({
                        kind: 'added',
                        path: nextPath,
                        left: undefined,
                        right: right[index],
                        leftType: 'undefined',
                        rightType: getTypeLabel(right[index]),
                        message: '左侧缺少该数组项'
                    });
                }
            }

            return;
        }

        if (left && right && typeof left === 'object' && typeof right === 'object') {
            const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
            Array.from(keys).sort().forEach((key) => {
                const hasLeft = Object.prototype.hasOwnProperty.call(left, key);
                const hasRight = Object.prototype.hasOwnProperty.call(right, key);
                const nextPath = getPath(path, key);

                if (hasLeft && hasRight) {
                    compareNodes(left[key], right[key], nextPath, options, diffs);
                } else if (hasLeft) {
                    diffs.push({
                        kind: 'removed',
                        path: nextPath,
                        left: left[key],
                        right: undefined,
                        leftType: getTypeLabel(left[key]),
                        rightType: 'undefined',
                        message: '右侧缺少该字段'
                    });
                } else {
                    diffs.push({
                        kind: 'added',
                        path: nextPath,
                        left: undefined,
                        right: right[key],
                        leftType: 'undefined',
                        rightType: getTypeLabel(right[key]),
                        message: '左侧缺少该字段'
                    });
                }
            });

            return;
        }

        diffs.push({
            kind: 'changed',
            path,
            left,
            right,
            leftType,
            rightType,
            message: '值不同'
        });
    }

    function compareJson(leftValue, rightValue, options) {
        const diffs = [];
        compareNodes(leftValue, rightValue, '$', options, diffs);

        const summary = diffs.reduce((acc, item) => {
            acc[item.kind] += 1;
            return acc;
        }, { same: 0, changed: 0, added: 0, removed: 0 });

        return { diffs, summary };
    }

    function setStatus(element, ok, text) {
        element.textContent = text;
        element.classList.toggle('ok', ok);
        element.classList.toggle('error', !ok);
    }

    function setBanner(type, text) {
        resultBanner.className = `result-banner ${type}`;
        resultBanner.textContent = text;
    }

    function updateSummary(summaryData) {
        summary.innerHTML = `
            <span class="summary-item same">相同 ${summaryData.same}</span>
            <span class="summary-item changed">修改 ${summaryData.changed}</span>
            <span class="summary-item added">新增 ${summaryData.added}</span>
            <span class="summary-item removed">删除 ${summaryData.removed}</span>
        `;
    }

    function renderDiffItem(diff) {
        const leftValue = stringifyValue(diff.left);
        const rightValue = stringifyValue(diff.right);

        return `
            <article class="diff-card ${diff.kind}">
                <div class="diff-head">
                    <span class="diff-kind">${diff.kind === 'same' ? '相同' : diff.kind === 'changed' ? '修改' : diff.kind === 'added' ? '新增' : '删除'}</span>
                    <code class="diff-path">${diff.path}</code>
                </div>
                <div class="diff-body">
                    <div class="diff-column">
                        <span class="diff-label">左侧</span>
                        <pre>${leftValue}</pre>
                    </div>
                    <div class="diff-column">
                        <span class="diff-label">右侧</span>
                        <pre>${rightValue}</pre>
                    </div>
                </div>
                <div class="diff-message">${diff.message}</div>
            </article>
        `;
    }

    function renderResults(diffs, summaryData) {
        if (!diffs.length) {
            resultList.innerHTML = '';
            setBanner('success', '两侧 JSON 完全一致');
            updateSummary(summaryData);
            return;
        }

        const visibleDiffs = diffs.filter((item) => {
            if (!showEqualToggle.checked && item.kind === 'same') {
                return false;
            }
            return true;
        });

        resultList.innerHTML = visibleDiffs.map(renderDiffItem).join('');

        const hasChanges = summaryData.changed > 0 || summaryData.added > 0 || summaryData.removed > 0;
        if (hasChanges) {
            setBanner('warning', `发现 ${summaryData.changed + summaryData.added + summaryData.removed} 处差异`);
        } else {
            setBanner('success', '两侧 JSON 完全一致');
        }

        updateSummary(summaryData);
    }

    function compareAndRender() {
        const leftParsed = parseJson(leftTextarea.value);
        const rightParsed = parseJson(rightTextarea.value);

        if (!leftParsed.ok || !rightParsed.ok) {
            const messages = [];
            if (!leftParsed.ok) {
                setStatus(leftStatus, false, `左侧错误：${leftParsed.error}`);
                messages.push(`左侧 JSON 无效：${leftParsed.error}`);
            } else {
                setStatus(leftStatus, true, '左侧 JSON 有效');
            }

            if (!rightParsed.ok) {
                setStatus(rightStatus, false, `右侧错误：${rightParsed.error}`);
                messages.push(`右侧 JSON 无效：${rightParsed.error}`);
            } else {
                setStatus(rightStatus, true, '右侧 JSON 有效');
            }

            resultList.innerHTML = '';
            setBanner('error', messages.join('；'));
            updateSummary({ same: 0, changed: 0, added: 0, removed: 0 });
            return;
        }

        setStatus(leftStatus, true, '左侧 JSON 有效');
        setStatus(rightStatus, true, '右侧 JSON 有效');

        const { diffs, summary: summaryData } = compareJson(leftParsed.value, rightParsed.value, {
            ignoreEmpty: ignoreEmptyToggle.checked,
            showEqual: showEqualToggle.checked
        });

        renderResults(diffs, summaryData);
    }

    function scheduleCompare() {
        window.clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(compareAndRender, DEBOUNCE_DELAY);
    }

    function formatTextarea(textarea, shouldCompareAfter = true) {
        try {
            textarea.value = formatJsonText(textarea.value);
            setBanner('neutral', '格式化完成');
            if (shouldCompareAfter) {
                compareAndRender();
            }
        } catch (error) {
            setBanner('error', `格式化失败：${error.message}`);
        }
    }

    async function copyText(text) {
        if (!text.trim()) {
            setBanner('neutral', '没有可复制的内容');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            setBanner('success', '已复制到剪贴板');
        } catch (error) {
            setBanner('error', '复制失败');
        }
    }

    function swapText() {
        const temp = leftTextarea.value;
        leftTextarea.value = rightTextarea.value;
        rightTextarea.value = temp;
        compareAndRender();
    }

    function clearAll() {
        leftTextarea.value = '';
        rightTextarea.value = '';
        resultList.innerHTML = '';
        setBanner('neutral', '请输入两侧 JSON 后点击“开始比对”');
        updateSummary({ same: 0, changed: 0, added: 0, removed: 0 });
        setStatus(leftStatus, true, '等待输入');
        setStatus(rightStatus, true, '等待输入');
    }

    compareBtn.addEventListener('click', compareAndRender);

    formatBtn.addEventListener('click', () => {
        formatTextarea(leftTextarea, false);
        formatTextarea(rightTextarea, false);
        compareAndRender();
    });

    swapBtn.addEventListener('click', swapText);
    clearBtn.addEventListener('click', clearAll);

    leftFormatBtn.addEventListener('click', () => {
        formatTextarea(leftTextarea, syncFormatToggle.checked);
    });

    rightFormatBtn.addEventListener('click', () => {
        formatTextarea(rightTextarea, syncFormatToggle.checked);
    });

    leftCopyBtn.addEventListener('click', () => copyText(leftTextarea.value));
    rightCopyBtn.addEventListener('click', () => copyText(rightTextarea.value));

    leftTextarea.addEventListener('input', scheduleCompare);
    rightTextarea.addEventListener('input', scheduleCompare);
    syncFormatToggle.addEventListener('change', scheduleCompare);
    ignoreEmptyToggle.addEventListener('change', compareAndRender);
    showEqualToggle.addEventListener('change', compareAndRender);

    leftTextarea.value = '{\n  "name": "Blue-IT",\n  "version": 1,\n  "features": {\n    "sidebar": true,\n    "theme": "light"\n  },\n  "tags": ["tool", "json"]\n}';
    rightTextarea.value = '{\n  "name": "Blue-IT",\n  "version": 2,\n  "features": {\n    "sidebar": true,\n    "theme": "dark"\n  },\n  "tags": ["tool", "compare"],\n  "author": "Blue"\n}';

    compareAndRender();
});
