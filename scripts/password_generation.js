// 初始化下拉选项
function initializeSelects() {
    const lengthSelect = document.getElementById('password-length');
    const countSelect = document.getElementById('password-count');
    
    // 添加密码长度选项（1-99）
    for(let i = 1; i <= 99; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.text = i;
        if(i === 16) option.selected = true;
        lengthSelect.appendChild(option);
    }
    
    // 添加密码数量选项（1-99）
    for(let i = 1; i <= 99; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.text = i;
        if(i === 1) option.selected = true;
        countSelect.appendChild(option);
    }
}

// 生成随机密码
function generatePassword(length, options) {
    let charset = '';
    if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.numbers) charset += '0123456789';
    if (options.symbols) charset += options.customSymbols;

    // 排除指定字符
    if (options.excludeChars) {
        const excludeSet = new Set(options.excludedChars);
        charset = Array.from(charset).filter(char => !excludeSet.has(char)).join('');
    }

    if (charset === '') {
        return '请至少选择一种字符类型';
    }

    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// 生成多个密码
function generatePasswords() {
    const length = parseInt(document.getElementById('password-length').value);
    const count = parseInt(document.getElementById('password-count').value);
    
    const options = {
        lowercase: document.getElementById('lowercase').checked,
        uppercase: document.getElementById('uppercase').checked,
        numbers: document.getElementById('numbers').checked,
        symbols: document.getElementById('symbols').checked,
        customSymbols: document.getElementById('custom-symbols').value,
        excludeChars: document.getElementById('exclude-chars').checked,
        excludedChars: document.getElementById('excluded-chars').value
    };

    let passwords = [];
    for (let i = 0; i < count; i++) {
        passwords.push(generatePassword(length, options));
    }

    const output = passwords.join('\n');
    document.getElementById('password-output').value = output;

    // 如果启用了历史记录，保存到历史记录中
    if (document.getElementById('save-history').checked) {
        saveToHistory(output);
    }
}

// 保存到历史记录
function saveToHistory(passwords) {
    let history = localStorage.getItem('password-history');
    history = history ? JSON.parse(history) : [];
    
    // 将新密码添加到历史记录开头
    history = passwords.split('\n').concat(history);
    
    // 限制历史记录数量为1000
    if (history.length > 1000) {
        history = history.slice(0, 1000);
    }
    
    localStorage.setItem('password-history', JSON.stringify(history));
    updateHistoryDisplay();
}

// 更新历史记录显示
function updateHistoryDisplay() {
    const history = JSON.parse(localStorage.getItem('password-history') || '[]');
    document.getElementById('history-output').value = history.join('\n');
}

// 复制密码到剪贴板
function copyToClipboard() {
    const text = document.getElementById('password-output').value;
    navigator.clipboard.writeText(text).then(() => {
        alert('已复制到剪贴板');
    }).catch(err => {
        console.error('复制失败:', err);
        alert('复制失败');
    });
}

// 清空输出
function clearOutput() {
    document.getElementById('password-output').value = '';
}

// 清空历史记录
function clearHistory() {
    localStorage.removeItem('password-history');
    updateHistoryDisplay();
}

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化下拉选项
    initializeSelects();

    // 绑定按钮事件
    document.getElementById('generate-btn').addEventListener('click', generatePasswords);
    document.getElementById('copy-btn').addEventListener('click', copyToClipboard);
    document.getElementById('clear-btn').addEventListener('click', clearOutput);
    document.getElementById('clear-history-btn').addEventListener('click', clearHistory);

    // 历史记录面板切换
    document.getElementById('view-history-btn').addEventListener('click', function() {
        const panel = document.getElementById('history-panel');
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            updateHistoryDisplay();
        } else {
            panel.style.display = 'none';
        }
    });

    // 生成初始密码
    generatePasswords();
}); 