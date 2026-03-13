/**
 * 侧边栏组件
 * 动态加载并管理工具导航侧边栏
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'sidebar-collapsed';
  const CONFIG_PATH = '../config/tools.json';

  // 内联备用配置（当 fetch 失败时使用）
  const FALLBACK_CONFIG = {
    "siteName": "蔚蓝工具导航",
    "categories": [
      {
        "name": "开发工具",
        "tools": [
          { "name": "JSON 格式化", "path": "json_formatter.html", "icon": "fa-code" },
          { "name": "HTML 预览", "path": "html_preview.html", "icon": "fa-file-code" },
          { "name": "代码格式化", "path": "code_formatter.html", "icon": "fa-magic" },
          { "name": "加密解密", "path": "crypto_tool.html", "icon": "fa-lock" },
          { "name": "Base64 转换", "path": "base64convert.html", "icon": "fa-exchange-alt" },
          { "name": "时间戳转换", "path": "timestamp_converter.html", "icon": "fa-clock" },
          { "name": "UUID 生成", "path": "uuid_generation.html", "icon": "fa-fingerprint" },
          { "name": "密码生成", "path": "password_generation.html", "icon": "fa-key" },
          { "name": "正则测试器", "path": "regex_tester.html", "icon": "fa-asterisk" },
          { "name": "Cron 生成器", "path": "cron_generator.html", "icon": "fa-calendar-check" }
        ]
      },
      {
        "name": "图片工具",
        "tools": [
          { "name": "九宫格切图", "path": "nine_grid.html", "icon": "fa-th" },
          { "name": "颜色选择器", "path": "color_picker.html", "icon": "fa-palette" },
          { "name": "Emoji 选择", "path": "emoji_picker.html", "icon": "fa-smile" }
        ]
      },
      {
        "name": "游戏娱乐",
        "tools": [
          { "name": "数字华容道", "path": "number_slide_puzzle.html", "icon": "fa-puzzle-piece" },
          { "name": "无尽防御", "path": "InfiniteDefense.html", "icon": "fa-shield-alt" },
          { "name": "无尽射击", "path": "InfiniteShooting.html", "icon": "fa-crosshairs" }
        ]
      }
    ]
  };

  // 获取当前页面文件名
  function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    return filename || 'index.html';
  }

  // 从 localStorage 读取侧边栏状态
  function getSidebarState() {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  // 保存侧边栏状态到 localStorage
  function setSidebarState(collapsed) {
    localStorage.setItem(STORAGE_KEY, collapsed);
  }

  // 加载工具配置
  async function loadToolsConfig() {
    try {
      const response = await fetch(CONFIG_PATH);
      if (!response.ok) throw new Error('Failed to load config');
      return await response.json();
    } catch (error) {
      console.warn('Failed to load tools config, using fallback:', error);
      return FALLBACK_CONFIG;
    }
  }

  // 生成侧边栏 HTML
  function generateSidebarHTML(config, currentPage) {
    const isCollapsed = getSidebarState();
    
    let categoriesHTML = '';
    config.categories.forEach(category => {
      categoriesHTML += `<div class="sidebar-category">${category.name}</div>`;
      category.tools.forEach(tool => {
        const isActive = tool.path === currentPage ? 'active' : '';
        categoriesHTML += `
          <a href="${tool.path}" class="sidebar-item ${isActive}">
            <i class="fas ${tool.icon}"></i>
            <span>${tool.name}</span>
          </a>
        `;
      });
    });

    return `
      <aside class="sidebar ${isCollapsed ? 'collapsed' : ''}" id="sidebar">
        <div class="sidebar-header">
          <img src="../tools.png" alt="Logo">
          <a href="../index.html">${config.siteName}</a>
        </div>
        <nav class="sidebar-content">
          ${categoriesHTML}
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-theme-toggle">
            <span>深色模式</span>
            <div class="theme-switch-small">
              <input type="checkbox" id="sidebar-theme-toggle">
              <label for="sidebar-theme-toggle"></label>
            </div>
          </div>
          <button class="sidebar-toggle-btn" id="sidebar-collapse-btn">
            <i class="fas fa-chevron-left"></i>
            <span>收起侧边栏</span>
          </button>
        </div>
      </aside>
      <button class="sidebar-expand-btn" id="sidebar-expand-btn">
        <i class="fas fa-chevron-right"></i>
      </button>
      <div class="sidebar-overlay" id="sidebar-overlay"></div>
    `;
  }


  // 初始化侧边栏交互
  function initSidebarInteractions() {
    const sidebar = document.getElementById('sidebar');
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    const expandBtn = document.getElementById('sidebar-expand-btn');
    const overlay = document.getElementById('sidebar-overlay');
    const themeToggle = document.getElementById('sidebar-theme-toggle');

    if (!sidebar) return;

    // 更新 body class
    function updateBodyClass() {
      if (sidebar.classList.contains('collapsed')) {
        document.body.classList.remove('sidebar-open');
        document.body.classList.add('sidebar-collapsed');
      } else {
        document.body.classList.add('sidebar-open');
        document.body.classList.remove('sidebar-collapsed');
      }
    }

    // 初始化 body class
    updateBodyClass();

    // 收起按钮
    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        sidebar.classList.add('collapsed');
        setSidebarState(true);
        updateBodyClass();
        updateCollapseBtn(true);
      });
    }

    // 展开按钮
    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        sidebar.classList.remove('collapsed');
        setSidebarState(false);
        updateBodyClass();
        updateCollapseBtn(false);
      });
    }

    // 遮罩层点击关闭（移动端）
    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.add('collapsed');
        setSidebarState(true);
        updateBodyClass();
      });
    }

    // 更新收起按钮文字
    function updateCollapseBtn(collapsed) {
      if (collapseBtn) {
        const icon = collapseBtn.querySelector('i');
        const text = collapseBtn.querySelector('span');
        if (collapsed) {
          icon.className = 'fas fa-chevron-right';
          text.textContent = '展开侧边栏';
        } else {
          icon.className = 'fas fa-chevron-left';
          text.textContent = '收起侧边栏';
        }
      }
    }

    // 主题切换
    if (themeToggle) {
      // 同步当前主题状态
      const currentTheme = document.documentElement.getAttribute('data-theme');
      themeToggle.checked = currentTheme === 'dark';

      themeToggle.addEventListener('change', () => {
        const newTheme = themeToggle.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // 同步页面上其他主题切换按钮
        const pageThemeToggle = document.getElementById('theme-toggle');
        if (pageThemeToggle) {
          pageThemeToggle.checked = themeToggle.checked;
        }
      });

      // 监听页面主题切换按钮变化
      const pageThemeToggle = document.getElementById('theme-toggle');
      if (pageThemeToggle) {
        pageThemeToggle.addEventListener('change', () => {
          themeToggle.checked = pageThemeToggle.checked;
        });
      }
    }
  }

  // 初始化侧边栏
  async function initSidebar() {
    const config = await loadToolsConfig();
    if (!config) {
      console.error('Failed to initialize sidebar: config not loaded');
      return;
    }

    const currentPage = getCurrentPage();
    const sidebarHTML = generateSidebarHTML(config, currentPage);

    // 插入到 body 开头
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);

    // 初始化交互
    initSidebarInteractions();
    
    console.log('Sidebar initialized successfully');
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
  } else {
    initSidebar();
  }
})();
