// 时间戳转换工具的核心功能

// 格式化日期
function formatDate(date) {
    const pad = (num) => num.toString().padStart(2, '0');
    
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // 月份从0开始
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 复制文本到剪贴板
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            showToast('已复制到剪贴板');
        })
        .catch(err => {
            console.error('复制失败:', err);
            showToast('复制失败', true);
        });
}

// 显示提示消息
function showToast(message, isError = false) {
    // 移除现有的toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // 创建新的toast
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'toast-error' : 'toast-success'}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 动画显示
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // 3秒后隐藏
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// 时间戳转日期时间
function timestampToDate(timestamp, unit = 'seconds') {
    // 校验输入
    if (!timestamp || isNaN(Number(timestamp))) {
        showToast('请输入有效的时间戳', true);
        return null;
    }
    
    // 确保时间戳是数字类型
    timestamp = Number(timestamp);
    
    // 转换为毫秒级时间戳
    const timestampMs = unit === 'seconds' ? timestamp * 1000 : timestamp;
    
    // 输出调试信息
    console.log("转换后的毫秒级时间戳:", timestampMs);
    
    // 检查时间戳是否在合理范围内 (1970年到2100年)
    const minTimestamp = 0; // 1970年开始
    const maxTimestamp = 4102444800000; // 2100年左右结束
    
    if (timestampMs < minTimestamp || timestampMs > maxTimestamp) {
        console.log("时间戳超出合理范围:", timestampMs);
        showToast('时间戳值超出合理范围 (1970-2100年)', true);
        return null;
    }
    
    const date = new Date(timestampMs);
    
    // 输出调试信息
    console.log("创建的日期对象:", date);
    console.log("日期getTime():", date.getTime());
    console.log("日期是否有效:", !isNaN(date.getTime()));
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
        showToast('无效的时间戳，请检查输入', true);
        return null;
    }
    
    return date;
}

// 日期时间转时间戳
function dateToTimestamp(dateString) {
    // 校验输入
    if (!dateString) {
        showToast('请选择有效的日期时间', true);
        return null;
    }
    
    const date = new Date(dateString);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
        showToast('无效的日期时间，请检查输入', true);
        return null;
    }
    
    return {
        seconds: Math.floor(date.getTime() / 1000),
        milliseconds: date.getTime()
    };
}

// 获取当前时间戳
function getCurrentTimestamp() {
    const now = new Date();
    return {
        seconds: Math.floor(now.getTime() / 1000),
        milliseconds: now.getTime()
    };
}

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const timestampInput = document.getElementById('timestamp-input');
    const secondsRadio = document.getElementById('seconds');
    const millisecondsRadio = document.getElementById('milliseconds');
    const getCurrentTimestampBtn = document.getElementById('get-current-timestamp');
    const convertToDateBtn = document.getElementById('convert-to-date');
    const localDateResult = document.getElementById('local-date-result');
    const utcDateResult = document.getElementById('utc-date-result');
    const isoDateResult = document.getElementById('iso-date-result');
    
    const dateInput = document.getElementById('date-input');
    const convertToTimestampBtn = document.getElementById('convert-to-timestamp');
    const secondsResult = document.getElementById('seconds-result');
    const millisecondsResult = document.getElementById('milliseconds-result');
    
    // 初始化日期时间选择器为当前时间
    const now = new Date();
    const localDateString = now.toISOString().slice(0, 16); // 格式为 "yyyy-MM-ddThh:mm"
    dateInput.value = localDateString;
    
    // 设置获取当前时间戳按钮点击事件
    getCurrentTimestampBtn.addEventListener('click', function() {
        const currentTimestamp = getCurrentTimestamp();
        timestampInput.value = secondsRadio.checked ? currentTimestamp.seconds : currentTimestamp.milliseconds;
    });
    
    // 设置时间戳转日期按钮点击事件
    convertToDateBtn.addEventListener('click', function() {
        const timestamp = timestampInput.value;
        const unit = document.getElementById('milliseconds').checked ? 'milliseconds' : 'seconds';
    
        console.log("时间戳值:", timestamp, "单位:", unit); // 调试信息
        
        const date = timestampToDate(timestamp, unit);
        if (date) {
            // 格式化并显示结果
            localDateResult.textContent = formatDate(date);
            
            // UTC格式
            const utcDate = new Date(date.getTime());
            const utcString = formatDate(new Date(
                date.getUTCFullYear(),
                date.getUTCMonth(),
                date.getUTCDate(),
                date.getUTCHours(),
                date.getUTCMinutes(),
                date.getUTCSeconds()
            ));
            utcDateResult.textContent = utcString;
            
            // ISO格式
            isoDateResult.textContent = date.toISOString();
        }
    });
    
    // 设置日期转时间戳按钮点击事件
    convertToTimestampBtn.addEventListener('click', function() {
        const dateString = dateInput.value;
        const timestamp = dateToTimestamp(dateString);
        
        if (timestamp) {
            // 显示结果
            secondsResult.textContent = timestamp.seconds;
            millisecondsResult.textContent = timestamp.milliseconds;
        }
    });
    
    // 设置复制按钮点击事件
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            const textToCopy = targetElement.textContent;
            
            // 如果内容不为"-"，则复制
            if (textToCopy && textToCopy !== '-') {
                copyToClipboard(textToCopy);
            } else {
                showToast('没有内容可复制', true);
            }
        });
    });
}); 