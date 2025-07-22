/**
 * Umami 统计脚本直接加载器（备用方案）
 * 如果延迟加载器有问题，可以使用这个直接加载版本
 */

(function() {
    'use strict';
    
    console.log('🚀 开始直接加载 Umami 统计脚本...');
    
    // 检查是否已经加载
    if (document.querySelector('script[src="https://cloud.umami.is/script.js"]')) {
        console.log('✅ Umami 脚本已存在');
        return;
    }
    
    // 创建脚本元素
    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://cloud.umami.is/script.js';
    script.setAttribute('data-website-id', '09c0a9c3-17ec-49e2-8fd0-7064f75f6978');
    
    // 成功加载
    script.onload = function() {
        console.log('✅ Umami 统计脚本直接加载成功');
        
        // 验证功能
        setTimeout(() => {
            if (window.umami) {
                console.log('✅ Umami 统计功能已激活');
            } else {
                console.warn('⚠️ Umami 脚本已加载但对象未初始化');
            }
        }, 100);
    };
    
    // 加载失败
    script.onerror = function() {
        console.error('❌ Umami 统计脚本直接加载失败');
    };
    
    // 添加到页面
    document.head.appendChild(script);
    
})();
