document.addEventListener('DOMContentLoaded', function () {
    const CRON_TEMPLATES = [
        { name: '每秒执行', expr: '* * * * * ?' },
        { name: '每分钟', expr: '0 * * * * ?' },
        { name: '每小时整点', expr: '0 0 * * * ?' },
        { name: '每天零点', expr: '0 0 0 * * ?' },
        { name: '每天8点', expr: '0 0 8 * * ?' },
        { name: '每5分钟', expr: '0 */5 * * * ?' },
        { name: '每30分钟', expr: '0 */30 * * * ?' },
        { name: '每周一零点', expr: '0 0 0 ? * 2' },
        { name: '每月1号零点', expr: '0 0 0 1 * ?' },
        { name: '工作日8点', expr: '0 0 8 ? * 2-6' }
    ];

    const FIELD_ORDER = ['second', 'minute', 'hour', 'day', 'month', 'week'];
    const WEEK_NAMES = {
        1: '周日',
        2: '周一',
        3: '周二',
        4: '周三',
        5: '周四',
        6: '周五',
        7: '周六'
    };

    const FIELD_CONFIG = {
        second: { label: '秒', min: 0, max: 59, allowQuestion: false },
        minute: { label: '分', min: 0, max: 59, allowQuestion: false },
        hour: { label: '时', min: 0, max: 23, allowQuestion: false },
        day: { label: '日', min: 1, max: 31, allowQuestion: true },
        month: { label: '月', min: 1, max: 12, allowQuestion: false },
        week: { label: '周', min: 1, max: 7, allowQuestion: true }
    };

    const TYPE_OPTIONS = {
        base: [
            { value: 'any', text: '每个 (*)' },
            { value: 'specific', text: '具体值' },
            { value: 'range', text: '范围 (-)' },
            { value: 'step', text: '步长 (/)' },
            { value: 'list', text: '列表 (,)' }
        ],
        day: [
            { value: 'dayLast', text: '最后一天 (L)' },
            { value: 'dayWorkday', text: '最近工作日 (W)' }
        ],
        week: [
            { value: 'weekLast', text: '最后一个 (L)' },
            { value: 'weekNth', text: '第N个 (#)' }
        ],
        unspecified: { value: 'unspecified', text: '不指定 (?)' }
    };

    const defaultState = {
        second: { type: 'specific', value: '0' },
        minute: { type: 'specific', value: '0' },
        hour: { type: 'specific', value: '0' },
        day: { type: 'any', value: '*' },
        month: { type: 'any', value: '*' },
        week: { type: 'unspecified', value: '?' }
    };

    const templateChips = document.getElementById('template-chips');
    const cronBuilder = document.getElementById('cron-builder');
    const cronExpressionEl = document.getElementById('cron-expression');
    const cronDescriptionEl = document.getElementById('cron-description');
    const reverseInput = document.getElementById('reverse-input');
    const reverseDescription = document.getElementById('reverse-description');
    const parseBtn = document.getElementById('parse-btn');
    const copyExpressionBtn = document.getElementById('copy-expression-btn');
    const previewCountSelect = document.getElementById('preview-count');
    const previewList = document.getElementById('preview-list');

    let builderState = JSON.parse(JSON.stringify(defaultState));
    let isSyncing = false;

    function pad2(num) {
        return String(num).padStart(2, '0');
    }

    function clampNumber(value, min, max, fallback) {
        const n = Number(value);
        if (Number.isNaN(n)) return fallback;
        return String(Math.min(max, Math.max(min, Math.trunc(n))));
    }

    function normalizeList(value, min, max) {
        if (!value) return '';
        return value
            .split(',')
            .map(function (item) {
                return item.trim();
            })
            .filter(function (item) {
                return item !== '';
            })
            .map(function (item) {
                return clampNumber(item, min, max, min);
            })
            .join(',');
    }

    function getTypeOptions(field) {
        const options = TYPE_OPTIONS.base.slice();
        if (field === 'day') {
            options.push.apply(options, TYPE_OPTIONS.day);
        }
        if (field === 'week') {
            options.push.apply(options, TYPE_OPTIONS.week);
        }
        if (FIELD_CONFIG[field].allowQuestion) {
            options.push(TYPE_OPTIONS.unspecified);
        }
        return options;
    }

    function tokenFromState(field, state) {
        const cfg = FIELD_CONFIG[field];
        switch (state.type) {
            case 'any':
                return '*';
            case 'specific':
                return clampNumber(state.value, cfg.min, cfg.max, cfg.min);
            case 'range': {
                const start = clampNumber(state.start, cfg.min, cfg.max, cfg.min);
                const end = clampNumber(state.end, cfg.min, cfg.max, cfg.max);
                return Number(start) <= Number(end) ? start + '-' + end : end + '-' + start;
            }
            case 'step': {
                const base = state.base === '*' ? '*' : clampNumber(state.base, cfg.min, cfg.max, cfg.min);
                const step = Math.max(1, Number(state.step) || 1);
                return base + '/' + step;
            }
            case 'list': {
                const list = normalizeList(state.list, cfg.min, cfg.max);
                return list || String(cfg.min);
            }
            case 'unspecified':
                return '?';
            case 'dayLast':
                return 'L';
            case 'dayWorkday': {
                const day = clampNumber(state.day, 1, 31, 1);
                return day + 'W';
            }
            case 'weekLast': {
                const weekDay = clampNumber(state.weekDay, 1, 7, 1);
                return weekDay + 'L';
            }
            case 'weekNth': {
                const weekDay = clampNumber(state.weekDay, 1, 7, 1);
                const nth = clampNumber(state.nth, 1, 5, 1);
                return weekDay + '#' + nth;
            }
            default:
                return '*';
        }
    }

    function buildCronExpression() {
        const dayToken = tokenFromState('day', builderState.day);
        const weekToken = tokenFromState('week', builderState.week);

        if (dayToken !== '?' && weekToken !== '?') {
            builderState.week = { type: 'unspecified', value: '?' };
        }

        return FIELD_ORDER.map(function (field) {
            return tokenFromState(field, builderState[field]);
        }).join(' ');
    }

    function parseTokenToState(field, token) {
        const cfg = FIELD_CONFIG[field];
        if (token === '?') return { type: 'unspecified', value: '?' };
        if (token === '*') return { type: 'any', value: '*' };

        if (field === 'day' && token === 'L') return { type: 'dayLast' };
        if (field === 'day' && /^\d+W$/.test(token)) {
            return { type: 'dayWorkday', day: token.slice(0, -1) };
        }
        if (field === 'week' && /^\d+L$/.test(token)) {
            return { type: 'weekLast', weekDay: token.slice(0, -1) };
        }
        if (field === 'week' && /^\d+#\d+$/.test(token)) {
            const parts = token.split('#');
            return { type: 'weekNth', weekDay: parts[0], nth: parts[1] };
        }
        if (token.indexOf(',') > -1) {
            return { type: 'list', list: normalizeList(token, cfg.min, cfg.max) };
        }
        if (token.indexOf('/') > -1) {
            const stepParts = token.split('/');
            const base = stepParts[0] === '*' ? '*' : clampNumber(stepParts[0], cfg.min, cfg.max, cfg.min);
            const step = String(Math.max(1, Number(stepParts[1]) || 1));
            return { type: 'step', base: base, step: step };
        }
        if (token.indexOf('-') > -1) {
            const rangeParts = token.split('-');
            return {
                type: 'range',
                start: clampNumber(rangeParts[0], cfg.min, cfg.max, cfg.min),
                end: clampNumber(rangeParts[1], cfg.min, cfg.max, cfg.max)
            };
        }
        if (/^\d+$/.test(token)) {
            return { type: 'specific', value: clampNumber(token, cfg.min, cfg.max, cfg.min) };
        }

        return field === 'week' ? { type: 'unspecified', value: '?' } : { type: 'any', value: '*' };
    }

    function parseCronExpression(expr) {
        const trimmed = (expr || '').trim();
        const parts = trimmed.split(/\s+/);
        if (parts.length !== 6) {
            throw new Error('Cron 表达式必须是6个字段：秒 分 时 日 月 周');
        }

        const nextState = {};
        FIELD_ORDER.forEach(function (field, idx) {
            nextState[field] = parseTokenToState(field, parts[idx]);
        });

        if (parts[3] !== '?' && parts[5] !== '?') {
            nextState.week = { type: 'unspecified', value: '?' };
        }

        return nextState;
    }

    function getFieldInputHTML(field, state) {
        const cfg = FIELD_CONFIG[field];
        if (state.type === 'any' || state.type === 'unspecified' || state.type === 'dayLast') {
            return '<span class="sep">无需额外参数</span>';
        }
        if (state.type === 'specific') {
            return '<input type="number" data-key="value" min="' + cfg.min + '" max="' + cfg.max + '" value="' + (state.value || cfg.min) + '">';
        }
        if (state.type === 'range') {
            return '<input type="number" data-key="start" min="' + cfg.min + '" max="' + cfg.max + '" value="' + (state.start || cfg.min) + '"><span class="sep">到</span><input type="number" data-key="end" min="' + cfg.min + '" max="' + cfg.max + '" value="' + (state.end || cfg.max) + '">';
        }
        if (state.type === 'step') {
            const base = state.base || '*';
            return '<input type="text" data-key="base" value="' + base + '" placeholder="* 或起始值"><span class="sep">每隔</span><input type="number" data-key="step" min="1" max="' + (cfg.max - cfg.min + 1) + '" value="' + (state.step || 1) + '">';
        }
        if (state.type === 'list') {
            return '<input type="text" data-key="list" value="' + (state.list || '') + '" placeholder="例如 1,5,10">';
        }
        if (state.type === 'dayWorkday') {
            return '<input type="number" data-key="day" min="1" max="31" value="' + (state.day || 1) + '"><span class="sep">号最近工作日 (W)</span>';
        }
        if (state.type === 'weekLast') {
            return '<input type="number" data-key="weekDay" min="1" max="7" value="' + (state.weekDay || 1) + '"><span class="sep">该周几最后一个 (L)</span>';
        }
        if (state.type === 'weekNth') {
            return '<input type="number" data-key="weekDay" min="1" max="7" value="' + (state.weekDay || 1) + '"><span class="sep">第</span><input type="number" data-key="nth" min="1" max="5" value="' + (state.nth || 1) + '"><span class="sep">个 (#)</span>';
        }
        return '<span class="sep">无需额外参数</span>';
    }

    function enforceMutualExclusion(changedField) {
        if (changedField === 'day' && builderState.day.type !== 'unspecified') {
            builderState.week = { type: 'unspecified', value: '?' };
        }
        if (changedField === 'week' && builderState.week.type !== 'unspecified') {
            builderState.day = { type: 'unspecified', value: '?' };
        }
    }

    function renderBuilder() {
        cronBuilder.innerHTML = '';

        FIELD_ORDER.forEach(function (field) {
            const row = document.createElement('div');
            row.className = 'cron-field-row';
            row.setAttribute('data-field', field);

            const label = document.createElement('div');
            label.className = 'field-label';
            label.textContent = FIELD_CONFIG[field].label;

            const typeSelect = document.createElement('select');
            typeSelect.className = 'field-type';
            typeSelect.setAttribute('data-role', 'type');

            const options = getTypeOptions(field);
            options.forEach(function (opt) {
                const op = document.createElement('option');
                op.value = opt.value;
                op.textContent = opt.text;
                if (opt.value === builderState[field].type) op.selected = true;
                typeSelect.appendChild(op);
            });

            const dynamicInput = document.createElement('div');
            dynamicInput.className = 'dynamic-input';
            dynamicInput.innerHTML = getFieldInputHTML(field, builderState[field]);

            row.appendChild(label);
            row.appendChild(typeSelect);
            row.appendChild(dynamicInput);
            cronBuilder.appendChild(row);
        });

        bindBuilderEvents();
    }

    function bindBuilderEvents() {
        cronBuilder.querySelectorAll('.cron-field-row').forEach(function (row) {
            const field = row.getAttribute('data-field');
            const select = row.querySelector('.field-type');
            const dynamicInputs = row.querySelectorAll('.dynamic-input input, .dynamic-input select');

            select.addEventListener('change', function () {
                builderState[field].type = this.value;
                enforceMutualExclusion(field);
                renderBuilder();
                syncFromBuilder();
            });

            dynamicInputs.forEach(function (input) {
                input.addEventListener('input', function () {
                    const key = this.getAttribute('data-key');
                    builderState[field][key] = this.value;
                    syncFromBuilder();
                });
            });
        });
    }

    function weekNameByValue(day) {
        return WEEK_NAMES[day] || ('周' + day);
    }

    function describeSimpleField(field, token) {
        const cfg = FIELD_CONFIG[field];
        const label = cfg.label;
        if (token === '*') return label + '任意';
        if (token === '?') return label + '不指定';
        if (token.indexOf(',') > -1) return label + '在 ' + token + ' 时';
        if (token.indexOf('-') > -1) return label + '范围 ' + token;
        if (token.indexOf('/') > -1) return label + '步长 ' + token;
        return label + '=' + token;
    }

    function cronToChineseDescription(expr) {
        const parts = expr.trim().split(/\s+/);
        if (parts.length !== 6) return '表达式格式无效';

        const sec = parts[0];
        const min = parts[1];
        const hour = parts[2];
        const day = parts[3];
        const month = parts[4];
        const week = parts[5];

        if (expr === '* * * * * ?') return '每秒执行一次';
        if (expr === '0 * * * * ?') return '每分钟执行一次';
        if (expr === '0 0 * * * ?') return '每小时整点执行';

        const stepMinuteMatch = /^0 \*\/(\d+) \* \* \* \?$/.exec(expr);
        if (stepMinuteMatch) {
            return '每隔' + stepMinuteMatch[1] + '分钟执行一次';
        }

        const dailyFixed = /^0 (\d{1,2}) (\d{1,2}) \* \* \?$/.exec(expr);
        if (dailyFixed) {
            return '每天 ' + pad2(dailyFixed[2]) + ':' + pad2(dailyFixed[1]) + ':00 执行';
        }

        const weeklyFixed = /^0 (\d{1,2}) (\d{1,2}) \? \* (\d)$/.exec(expr);
        if (weeklyFixed) {
            return '每周' + weekNameByValue(Number(weeklyFixed[3])).replace('周', '') + ' ' + pad2(weeklyFixed[2]) + ':' + pad2(weeklyFixed[1]) + ':00 执行';
        }

        if (day === 'L') {
            return '每月最后一天 ' + pad2(hour) + ':' + pad2(min) + ':' + pad2(sec) + ' 执行';
        }
        if (/^\d+W$/.test(day)) {
            return '每月' + day.slice(0, -1) + '号最近工作日 ' + pad2(hour) + ':' + pad2(min) + ':' + pad2(sec) + ' 执行';
        }
        if (/^\d+L$/.test(week)) {
            return '每月最后一个' + weekNameByValue(Number(week.slice(0, -1))) + ' ' + pad2(hour) + ':' + pad2(min) + ':' + pad2(sec) + ' 执行';
        }
        if (/^\d+#\d+$/.test(week)) {
            const p = week.split('#');
            return '每月第' + p[1] + '个' + weekNameByValue(Number(p[0])) + ' ' + pad2(hour) + ':' + pad2(min) + ':' + pad2(sec) + ' 执行';
        }

        return [
            describeSimpleField('second', sec),
            describeSimpleField('minute', min),
            describeSimpleField('hour', hour),
            describeSimpleField('day', day),
            describeSimpleField('month', month),
            describeSimpleField('week', week)
        ].join('，');
    }

    function getQuartzWeekday(date) {
        const d = date.getDay();
        return d === 0 ? 1 : d + 1;
    }

    function getLastDayOfMonth(year, monthIndex) {
        return new Date(year, monthIndex + 1, 0).getDate();
    }

    function getNearestWorkday(year, monthIndex, day) {
        const max = getLastDayOfMonth(year, monthIndex);
        let d = Math.min(Math.max(day, 1), max);
        let date = new Date(year, monthIndex, d);
        const week = date.getDay();

        if (week >= 1 && week <= 5) return d;
        if (week === 6) {
            if (d === 1) return 3;
            return d - 1;
        }
        if (week === 0) {
            if (d === max) return max - 2;
            return d + 1;
        }
        return d;
    }

    function getNthWeekdayOfMonth(year, monthIndex, quartzWeekday, nth) {
        const jsWeekday = quartzWeekday === 1 ? 0 : quartzWeekday - 1;
        const first = new Date(year, monthIndex, 1);
        const firstOffset = (7 + jsWeekday - first.getDay()) % 7;
        const day = 1 + firstOffset + (nth - 1) * 7;
        const max = getLastDayOfMonth(year, monthIndex);
        return day <= max ? day : null;
    }

    function getLastWeekdayOfMonth(year, monthIndex, quartzWeekday) {
        const jsWeekday = quartzWeekday === 1 ? 0 : quartzWeekday - 1;
        const max = getLastDayOfMonth(year, monthIndex);
        for (let d = max; d >= max - 6; d--) {
            const dt = new Date(year, monthIndex, d);
            if (dt.getDay() === jsWeekday) return d;
        }
        return null;
    }

    function parseSimpleListOrRangeToken(token, value, min, max) {
        if (token === '*') return true;
        if (/^\d+$/.test(token)) return value === Number(token);
        if (/^\d+-\d+$/.test(token)) {
            const p = token.split('-').map(Number);
            return value >= Math.min(p[0], p[1]) && value <= Math.max(p[0], p[1]);
        }
        if (/^(\*|\d+)\/\d+$/.test(token)) {
            const p = token.split('/');
            const base = p[0] === '*' ? min : Number(p[0]);
            const step = Math.max(1, Number(p[1]));
            return value >= base && (value - base) % step === 0;
        }
        if (token.indexOf(',') > -1) {
            return token.split(',').some(function (part) {
                return parseSimpleListOrRangeToken(part.trim(), value, min, max);
            });
        }
        return value >= min && value <= max;
    }

    function matchesDayToken(token, date) {
        const day = date.getDate();
        const year = date.getFullYear();
        const monthIndex = date.getMonth();

        if (token === '?') return true;
        if (token === 'L') return day === getLastDayOfMonth(year, monthIndex);
        if (/^\d+W$/.test(token)) {
            const base = Number(token.slice(0, -1));
            return day === getNearestWorkday(year, monthIndex, base);
        }
        return parseSimpleListOrRangeToken(token, day, 1, 31);
    }

    function matchesWeekToken(token, date) {
        const week = getQuartzWeekday(date);
        const year = date.getFullYear();
        const monthIndex = date.getMonth();
        const day = date.getDate();

        if (token === '?') return true;
        if (/^\d+L$/.test(token)) {
            const wd = Number(token.slice(0, -1));
            return day === getLastWeekdayOfMonth(year, monthIndex, wd);
        }
        if (/^\d+#\d+$/.test(token)) {
            const p = token.split('#').map(Number);
            return day === getNthWeekdayOfMonth(year, monthIndex, p[0], p[1]);
        }
        return parseSimpleListOrRangeToken(token, week, 1, 7);
    }

    function isCronMatch(date, parts) {
        const sec = date.getSeconds();
        const min = date.getMinutes();
        const hour = date.getHours();
        const day = date.getDate();
        const month = date.getMonth() + 1;

        if (!parseSimpleListOrRangeToken(parts[0], sec, 0, 59)) return false;
        if (!parseSimpleListOrRangeToken(parts[1], min, 0, 59)) return false;
        if (!parseSimpleListOrRangeToken(parts[2], hour, 0, 23)) return false;
        if (!parseSimpleListOrRangeToken(parts[4], month, 1, 12)) return false;

        const dayMatch = matchesDayToken(parts[3], date);
        const weekMatch = matchesWeekToken(parts[5], date);

        if (parts[3] === '?' && parts[5] === '?') return dayMatch && weekMatch;
        if (parts[3] === '?') return weekMatch;
        if (parts[5] === '?') return dayMatch;
        return dayMatch && weekMatch;
    }

    function formatDateTime(date) {
        const weekLabel = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()];
        return date.getFullYear() + '-' +
            pad2(date.getMonth() + 1) + '-' +
            pad2(date.getDate()) + ' ' +
            pad2(date.getHours()) + ':' +
            pad2(date.getMinutes()) + ':' +
            pad2(date.getSeconds()) + ' ' + weekLabel;
    }

    function calculateNextExecutions(expr, count) {
        const parts = expr.trim().split(/\s+/);
        if (parts.length !== 6) return [];

        const now = new Date();
        let cursor = new Date(now.getTime() + 1000);
        const endLimit = new Date(now);
        endLimit.setFullYear(endLimit.getFullYear() + 2);

        const results = [];
        let safety = 0;

        while (results.length < count && cursor <= endLimit && safety < 600000) {
            safety++;

            if (!parseSimpleListOrRangeToken(parts[4], cursor.getMonth() + 1, 1, 12)) {
                cursor.setMonth(cursor.getMonth() + 1, 1);
                cursor.setHours(0, 0, 0, 0);
                continue;
            }

            const dayMatch = matchesDayToken(parts[3], cursor);
            const weekMatch = matchesWeekToken(parts[5], cursor);
            const dayWeekOk = parts[3] === '?' ? weekMatch : (parts[5] === '?' ? dayMatch : (dayMatch && weekMatch));
            if (!dayWeekOk) {
                cursor.setDate(cursor.getDate() + 1);
                cursor.setHours(0, 0, 0, 0);
                continue;
            }

            if (!parseSimpleListOrRangeToken(parts[2], cursor.getHours(), 0, 23)) {
                cursor.setHours(cursor.getHours() + 1, 0, 0, 0);
                continue;
            }

            if (!parseSimpleListOrRangeToken(parts[1], cursor.getMinutes(), 0, 59)) {
                cursor.setMinutes(cursor.getMinutes() + 1, 0, 0);
                continue;
            }

            if (!parseSimpleListOrRangeToken(parts[0], cursor.getSeconds(), 0, 59)) {
                cursor.setSeconds(cursor.getSeconds() + 1, 0);
                continue;
            }

            if (isCronMatch(cursor, parts)) {
                results.push(formatDateTime(cursor));
            }
            cursor = new Date(cursor.getTime() + 1000);
        }

        return results;
    }

    function renderPreview(expr) {
        const count = Number(previewCountSelect.value) || 10;
        const items = calculateNextExecutions(expr, count);
        previewList.innerHTML = '';

        if (!items.length) {
            const li = document.createElement('li');
            li.textContent = '未在两年内匹配到执行时间，请检查表达式';
            previewList.appendChild(li);
            return;
        }

        items.forEach(function (item) {
            const li = document.createElement('li');
            li.textContent = item;
            previewList.appendChild(li);
        });
    }

    function updateTemplateActive(expr) {
        templateChips.querySelectorAll('.template-chip').forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute('data-expr') === expr);
        });
    }

    function syncFromBuilder() {
        if (isSyncing) return;
        isSyncing = true;

        const expr = buildCronExpression();
        cronExpressionEl.textContent = expr;
        reverseInput.value = expr;
        const description = cronToChineseDescription(expr);
        cronDescriptionEl.textContent = description;
        reverseDescription.textContent = description;
        renderPreview(expr);
        updateTemplateActive(expr);

        isSyncing = false;
    }

    function applyExpressionToAll(expr) {
        if (isSyncing) return;
        isSyncing = true;

        try {
            builderState = parseCronExpression(expr);
            renderBuilder();

            const normalizedExpr = buildCronExpression();
            cronExpressionEl.textContent = normalizedExpr;
            reverseInput.value = normalizedExpr;
            const description = cronToChineseDescription(normalizedExpr);
            cronDescriptionEl.textContent = description;
            reverseDescription.textContent = description;
            renderPreview(normalizedExpr);
            updateTemplateActive(normalizedExpr);
        } catch (error) {
            reverseDescription.textContent = '解析失败：' + error.message;
        }

        isSyncing = false;
    }

    function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }

        return new Promise(function (resolve, reject) {
            try {
                const temp = document.createElement('textarea');
                temp.value = text;
                temp.style.position = 'fixed';
                temp.style.opacity = '0';
                document.body.appendChild(temp);
                temp.focus();
                temp.select();
                const ok = document.execCommand('copy');
                document.body.removeChild(temp);
                if (ok) resolve();
                else reject(new Error('execCommand copy failed'));
            } catch (err) {
                reject(err);
            }
        });
    }

    function initTemplates() {
        templateChips.innerHTML = '';
        CRON_TEMPLATES.forEach(function (tpl) {
            const btn = document.createElement('button');
            btn.className = 'template-chip';
            btn.type = 'button';
            btn.setAttribute('data-expr', tpl.expr);
            btn.textContent = tpl.name;
            btn.addEventListener('click', function () {
                applyExpressionToAll(tpl.expr);
            });
            templateChips.appendChild(btn);
        });
    }

    parseBtn.addEventListener('click', function () {
        applyExpressionToAll(reverseInput.value);
    });

    reverseInput.addEventListener('input', function () {
        const expr = reverseInput.value.trim();
        const parts = expr.split(/\s+/);
        if (parts.length === 6) {
            applyExpressionToAll(expr);
        }
    });

    previewCountSelect.addEventListener('change', function () {
        renderPreview(cronExpressionEl.textContent.trim());
    });

    copyExpressionBtn.addEventListener('click', function () {
        const expr = cronExpressionEl.textContent.trim();
        copyText(expr).then(function () {
            copyExpressionBtn.innerHTML = '<i class="fas fa-check"></i> 已复制';
            setTimeout(function () {
                copyExpressionBtn.innerHTML = '<i class="fas fa-copy"></i> 复制';
            }, 1200);
        }).catch(function () {
            copyExpressionBtn.innerHTML = '<i class="fas fa-xmark"></i> 复制失败';
            setTimeout(function () {
                copyExpressionBtn.innerHTML = '<i class="fas fa-copy"></i> 复制';
            }, 1200);
        });
    });

    initTemplates();
    renderBuilder();
    syncFromBuilder();
});