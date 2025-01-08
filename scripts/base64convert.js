// 编码函数
function base64Encode(input, urlSafe) {
    var encoded = btoa(unescape(encodeURIComponent(input)));
    if (urlSafe) {
        encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    return encoded;
}

// 解码函数
function base64Decode(input, urlSafe) {
    if (urlSafe) {
        input = input.replace(/-/g, '+').replace(/_/g, '/');
        while (input.length % 4) {
            input += '=';
        }
    }
    try {
        return decodeURIComponent(escape(atob(input)));
    } catch (e) {
        return '解码失败: 输入的不是有效的 Base64 字符串';
    }
}

// 复制文本到剪贴板
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('已复制到剪贴板');
    }).catch(err => {
        console.error('复制失败:', err);
        alert('复制失败');
    });
}

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取所有需要的DOM元素
    const encodeBtn = document.getElementById('encode-btn');
    const decodeBtn = document.getElementById('decode-btn');
    const copyEncodedBtn = document.getElementById('copy-encoded-btn');
    const copyDecodedBtn = document.getElementById('copy-decoded-btn');
    const clearEncodeBtn = document.getElementById('clear-encode-btn');
    const clearDecodeBtn = document.getElementById('clear-decode-btn');
    const stringToEncode = document.getElementById('string-to-encode');
    const encodedString = document.getElementById('encoded-string');
    const base64ToDecode = document.getElementById('base64-to-decode');
    const decodedString = document.getElementById('decoded-string');
    const encodeUrlSafe = document.getElementById('encode-url-safe');
    const decodeUrlSafe = document.getElementById('decode-url-safe');

    // 编码按钮点击事件
    encodeBtn.addEventListener('click', function() {
        const input = stringToEncode.value;
        const urlSafe = encodeUrlSafe.checked;
        encodedString.value = base64Encode(input, urlSafe);
    });

    // 解码按钮点击事件
    decodeBtn.addEventListener('click', function() {
        const input = base64ToDecode.value;
        const urlSafe = decodeUrlSafe.checked;
        decodedString.value = base64Decode(input, urlSafe);
    });

    // 复制编码结果按钮点击事件
    copyEncodedBtn.addEventListener('click', function() {
        copyToClipboard(encodedString.value);
    });

    // 复制解码结果按钮点击事件
    copyDecodedBtn.addEventListener('click', function() {
        copyToClipboard(decodedString.value);
    });

    // 清空编码区域按钮点击事件
    clearEncodeBtn.addEventListener('click', function() {
        stringToEncode.value = '';
        encodedString.value = '';
    });

    // 清空解码区域按钮点击事件
    clearDecodeBtn.addEventListener('click', function() {
        base64ToDecode.value = '';
        decodedString.value = '';
    });
}); 