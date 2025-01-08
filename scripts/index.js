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

// 添加滚动显示动画
function handleScrollAnimation() {
    const cards = document.querySelectorAll('.tool-card');
    cards.forEach((card, index) => {
        card.style.setProperty('--card-index', index);
        card.classList.add('scroll-reveal');
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.scroll-reveal').forEach(element => {
        observer.observe(element);
    });
}

// 添加卡片鼠标跟踪效果
function handleCardMouseEffects() {
    const cards = document.querySelectorAll('.tool-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / card.clientWidth) * 100;
            const y = ((e.clientY - rect.top) / card.clientHeight) * 100;
            
            // 更新光效位置
            card.style.setProperty('--mouse-x', `${x}%`);
            card.style.setProperty('--mouse-y', `${y}%`);
            
            // 添加倾斜效果
            const rotateY = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
            const rotateX = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
            
            card.style.transform = `
                perspective(1000px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
                translateY(-15px)
            `;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) perspective(1000px)';
            setTimeout(() => {
                card.style.setProperty('--mouse-x', '50%');
                card.style.setProperty('--mouse-y', '50%');
            }, 100);
        });
    });
}

// 页面加载完成后初始化动画和效果
document.addEventListener('DOMContentLoaded', () => {
    handleScrollAnimation();
    handleCardMouseEffects();
}); 