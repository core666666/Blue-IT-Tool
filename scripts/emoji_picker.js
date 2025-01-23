document.addEventListener('DOMContentLoaded', function() {
    // 主题切换功能
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light-theme';

    // 初始化主题
    document.body.classList.add(currentTheme);
    if (themeToggle) {
        themeToggle.checked = currentTheme === 'dark-theme';
    }

    // 监听主题变化
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const bodyClasses = document.body.classList;
                const isDark = bodyClasses.contains('dark-theme');
                if (themeToggle) {
                    themeToggle.checked = isDark;
                }
            }
        });
    });

    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
    });

    if (themeToggle) {
        themeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.remove('light-theme');
                document.body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
                document.body.classList.add('light-theme');
                localStorage.setItem('theme', 'light-theme');
            }
        });
    }

    // Emoji选择器功能
    const emojiItems = document.querySelectorAll('.emoji-item');
    const copyNotification = document.getElementById('copyNotification');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const searchInput = document.getElementById('emoji-search');

    // 搜索功能
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = this.value.toLowerCase();
            const activeCategory = document.querySelector('.category-btn.active').dataset.category;

            emojiItems.forEach(item => {
                const keywords = item.dataset.keywords || '';
                const description = item.querySelector('.description').textContent;
                const emoji = item.dataset.emoji;
                const category = item.dataset.category;
                const searchString = `${keywords},${description},${emoji}`.toLowerCase();

                const matchesSearch = searchTerm === '' || searchString.includes(searchTerm);
                const matchesCategory = activeCategory === 'all' || category === activeCategory;

                if (matchesSearch && matchesCategory) {
                    item.classList.remove('hidden');
                    if (searchTerm !== '') {
                        item.classList.add('highlight');
                        setTimeout(() => item.classList.remove('highlight'), 500);
                    }
                } else {
                    item.classList.add('hidden');
                }
            });
        }, 300);
    });

    // 分类功能
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除其他按钮的active类
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            // 添加当前按钮的active类
            button.classList.add('active');

            const category = button.dataset.category;
            const searchTerm = searchInput.value.toLowerCase();
            
            // 显示/隐藏emoji
            emojiItems.forEach(item => {
                const keywords = item.dataset.keywords || '';
                const description = item.querySelector('.description').textContent;
                const emoji = item.dataset.emoji;
                const searchString = `${keywords},${description},${emoji}`.toLowerCase();
                const matchesSearch = searchTerm === '' || searchString.includes(searchTerm);

                if ((category === 'all' || item.dataset.category === category) && matchesSearch) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });

    // 复制功能
    emojiItems.forEach(item => {
        item.addEventListener('click', async () => {
            const emoji = item.dataset.emoji;
            try {
                // 首选方案：使用 Clipboard API
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(emoji);
                } else {
                    // 后备方案：使用传统的复制方法
                    const textArea = document.createElement('textarea');
                    textArea.value = emoji;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-9999px';
                    document.body.appendChild(textArea);
                    textArea.select();
                    try {
                        document.execCommand('copy');
                    } catch (err) {
                        console.error('复制失败:', err);
                    }
                    document.body.removeChild(textArea);
                }
                // 显示复制成功提示
                copyNotification.style.opacity = '1';
                setTimeout(() => {
                    copyNotification.style.opacity = '0';
                }, 1500);
            } catch (err) {
                console.error('复制失败:', err);
            }
        });

        // 添加鼠标悬停效果
        item.addEventListener('mouseenter', () => {
            item.classList.add('hover');
        });

        item.addEventListener('mouseleave', () => {
            item.classList.remove('hover');
        });
    });
}); 