// 主题切换功能
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

function setTheme(theme) {
    if (theme === 'dark') {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        themeToggle.checked = true;
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        themeToggle.checked = false;
        localStorage.setItem('theme', 'light');
    }
}

themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
        setTheme('dark');
    } else {
        setTheme('light');
    }
});

// 检查本地存储中的主题设置
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    setTheme(savedTheme);
} else {
    // 根据系统偏好设置
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
    } else {
        setTheme('light');
    }
}

// 搜索功能
const searchInput = document.getElementById('search-input');
const toolCards = document.querySelectorAll('.tool-card');

searchInput.addEventListener('keyup', () => {
    const filter = searchInput.value.toLowerCase();
    toolCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(filter)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
});