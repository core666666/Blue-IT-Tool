/**
 * Umami 统计脚本延迟加载器
 * 优化页面加载性能，避免统计脚本阻塞页面渲染
 * 
 * 特性：
 * - 延迟加载：页面完全加载后再加载统计脚本
 * - 用户交互触发：用户有任何交互行为时立即加载
 * - 错误处理：加载失败不影响页面功能
 * - 防重复加载：确保脚本只加载一次
 * - 性能优化：使用 requestIdleCallback 在浏览器空闲时加载
 */

(function() {
    'use strict';
    
    // 配置项
    const CONFIG = {
        SCRIPT_URL: 'https://cloud.umami.is/script.js',
        WEBSITE_ID: '09c0a9c3-17ec-49e2-8fd0-7064f75f6978',
        DELAY_TIME: 2000, // 延迟加载时间（毫秒）
        TIMEOUT: 10000,   // 脚本加载超时时间（毫秒）
    };
    
    // 状态管理
    let isLoaded = false;
    let isLoading = false;
    let userInteracted = false;
    
    /**
     * 检查是否已经加载过 Umami 脚本
     */
    function isUmamiLoaded() {
        return document.querySelector('script[src*="umami"]') !== null;
    }
    
    /**
     * 加载 Umami 统计脚本
     */
    function loadUmamiScript() {
        // 防止重复加载
        if (isLoaded || isLoading || isUmamiLoaded()) {
            return Promise.resolve();
        }
        
        isLoading = true;
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.defer = true;
            script.src = CONFIG.SCRIPT_URL;
            script.setAttribute('data-website-id', CONFIG.WEBSITE_ID);
            
            // 设置超时
            const timeout = setTimeout(() => {
                isLoading = false;
                reject(new Error('Umami script loading timeout'));
            }, CONFIG.TIMEOUT);
            
            // 成功加载
            script.onload = function() {
                clearTimeout(timeout);
                isLoaded = true;
                isLoading = false;
                console.log('Umami 统计脚本加载成功');
                resolve();
            };
            
            // 加载失败
            script.onerror = function() {
                clearTimeout(timeout);
                isLoading = false;
                const error = new Error('Umami 统计脚本加载失败，但不影响页面功能');
                console.warn(error.message);
                reject(error);
            };
            
            // 添加到页面
            document.head.appendChild(script);
        });
    }
    
    /**
     * 处理用户交互事件
     */
    function handleUserInteraction() {
        if (!userInteracted) {
            userInteracted = true;
            loadUmamiScript().catch(() => {
                // 静默处理错误，不影响用户体验
            });
            removeInteractionListeners();
        }
    }
    
    /**
     * 移除交互事件监听器
     */
    function removeInteractionListeners() {
        document.removeEventListener('click', handleUserInteraction, { passive: true });
        document.removeEventListener('scroll', handleUserInteraction, { passive: true });
        document.removeEventListener('keydown', handleUserInteraction, { passive: true });
        document.removeEventListener('touchstart', handleUserInteraction, { passive: true });
        document.removeEventListener('mousemove', handleUserInteraction, { passive: true });
    }
    
    /**
     * 添加交互事件监听器
     */
    function addInteractionListeners() {
        // 使用 passive 选项优化性能
        document.addEventListener('click', handleUserInteraction, { passive: true });
        document.addEventListener('scroll', handleUserInteraction, { passive: true });
        document.addEventListener('keydown', handleUserInteraction, { passive: true });
        document.addEventListener('touchstart', handleUserInteraction, { passive: true });
        document.addEventListener('mousemove', handleUserInteraction, { passive: true });
    }
    
    /**
     * 使用 requestIdleCallback 在浏览器空闲时加载
     */
    function loadWhenIdle() {
        if (window.requestIdleCallback) {
            requestIdleCallback(() => {
                loadUmamiScript().catch(() => {
                    // 静默处理错误
                });
            }, { timeout: CONFIG.DELAY_TIME });
        } else {
            // 降级方案：使用 setTimeout
            setTimeout(() => {
                loadUmamiScript().catch(() => {
                    // 静默处理错误
                });
            }, CONFIG.DELAY_TIME);
        }
    }
    
    /**
     * 初始化加载器
     */
    function init() {
        // 如果已经加载过，直接返回
        if (isUmamiLoaded()) {
            return;
        }
        
        // 页面加载完成后的处理
        if (document.readyState === 'complete') {
            addInteractionListeners();
            loadWhenIdle();
        } else {
            window.addEventListener('load', () => {
                addInteractionListeners();
                loadWhenIdle();
            });
        }
        
        // 如果页面已经可见，立即添加交互监听器
        if (document.readyState !== 'loading') {
            addInteractionListeners();
        } else {
            document.addEventListener('DOMContentLoaded', addInteractionListeners);
        }
    }
    
    // 导出到全局作用域（可选）
    window.UmamiLoader = {
        load: loadUmamiScript,
        isLoaded: () => isLoaded,
        config: CONFIG
    };
    
    // 自动初始化
    init();
    
})();
