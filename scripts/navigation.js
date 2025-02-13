// 主题切换功能
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    // 检查本地存储中的主题设置
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        body.setAttribute('data-theme', currentTheme);
        themeToggle.checked = currentTheme === 'dark';
    }
    
    // 监听主题切换
    themeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            body.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });

    // 搜索功能实现
    const searchInput = document.getElementById('search-input');
    const siteCards = document.querySelectorAll('.site-card');
    const navSections = document.querySelectorAll('.nav-section');

    // 防抖函数
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 搜索处理函数
    const handleSearch = debounce((searchTerm) => {
        searchTerm = searchTerm.toLowerCase().trim();
        
        // 如果搜索框为空，显示所有内容
        if (searchTerm === '') {
            navSections.forEach(section => {
                section.style.display = '';
                const cards = section.querySelectorAll('.site-card');
                cards.forEach(card => {
                    card.style.display = '';
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                });
            });
            return;
        }

        // 遍历所有卡片进行搜索匹配
        navSections.forEach(section => {
            let hasVisibleCards = false;
            const cards = section.querySelectorAll('.site-card');
            
            cards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const description = card.querySelector('p').textContent.toLowerCase();
                const sectionTitle = section.querySelector('h2').textContent.toLowerCase();
                
                // 检查标题、描述和分类标题是否包含搜索词
                const isMatch = title.includes(searchTerm) || 
                              description.includes(searchTerm) || 
                              sectionTitle.includes(searchTerm);

                if (isMatch) {
                    card.style.display = '';
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                    hasVisibleCards = true;
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        if (!isMatch) {
                            card.style.display = 'none';
                        }
                    }, 300);
                }
            });

            // 控制分类标题的显示/隐藏
            section.style.display = hasVisibleCards ? '' : 'none';
        });
    }, 300);

    // 监听搜索输入
    searchInput.addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });

    // 添加搜索框清空按钮功能
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            handleSearch('');
        }
    });

    // 添加搜索框聚焦效果
    searchInput.addEventListener('focus', () => {
        searchInput.parentElement.classList.add('focused');
    });

    searchInput.addEventListener('blur', () => {
        searchInput.parentElement.classList.remove('focused');
    });

    // 平滑滚动
    document.querySelectorAll('.category-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 导航栏交互控制
    const topNav = document.querySelector('.category-nav');
    let lastScrollTop = 0;
    
    // 监听滚动事件
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        
        // 根据滚动方向控制导航栏的显示
        if (currentScroll > lastScrollTop && currentScroll > 100) {
            // 向下滚动
            topNav.classList.add('hide');
        } else {
            // 向上滚动
            topNav.classList.remove('hide');
        }
        
        lastScrollTop = currentScroll;
    });
}); 