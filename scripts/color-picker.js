document.addEventListener('DOMContentLoaded', function() {
    // 颜色选择器相关元素
    const colorPicker = document.getElementById('color-picker');
    const colorPreview = document.getElementById('color-preview');
    const colorText = document.getElementById('color-text');
    const copyColorBtn = document.getElementById('copy-color-btn');
    const addToPaletteBtn = document.getElementById('add-to-palette-btn');
    
    // 颜色格式转换相关元素
    const hexValue = document.getElementById('hex-value');
    const rgbValue = document.getElementById('rgb-value');
    const hslValue = document.getElementById('hsl-value');
    const cmykValue = document.getElementById('cmyk-value');
    
    // 调色板相关元素
    const colorPalette = document.getElementById('color-palette');
    const clearPaletteBtn = document.getElementById('clear-palette-btn');
    const savePaletteBtn = document.getElementById('save-palette-btn');
    
    // 颜色方案相关元素
    const schemeButtons = document.querySelectorAll('.scheme-btn');
    const colorScheme = document.getElementById('color-scheme');
    
    // 渐变生成器相关元素
    const gradientType = document.getElementById('gradient-type');
    const gradientDirection = document.getElementById('gradient-direction');
    const gradientShape = document.getElementById('gradient-shape');
    const linearControls = document.getElementById('linear-controls');
    const radialControls = document.getElementById('radial-controls');
    const gradientColor1 = document.getElementById('gradient-color-1');
    const gradientColor2 = document.getElementById('gradient-color-2');
    const gradientPreview = document.getElementById('gradient-preview');
    const gradientCss = document.getElementById('gradient-css');
    
    // 复制按钮
    const copyButtons = document.querySelectorAll('.copy-btn');
    
    // 当前选择的颜色
    let currentColor = '#007AFF';
    
    // 从localStorage加载调色板
    let paletteColors = JSON.parse(localStorage.getItem('colorPalette')) || [];
    
    // 初始化
    initColorPicker();
    updateColorFormats();
    renderPalette();
    generateColorScheme('monochromatic');
    updateGradient();
    
    // 监听颜色选择器变化
    colorPicker.addEventListener('input', function() {
        currentColor = this.value;
        updateColorDisplay();
        updateColorFormats();
        generateColorScheme(getActiveSchemeType());
        gradientColor1.value = currentColor;
        updateGradient();
    });
    
    // 复制当前颜色
    copyColorBtn.addEventListener('click', function() {
        copyToClipboard(currentColor);
        showMessage('颜色值已复制到剪贴板');
    });
    
    // 添加到调色板
    addToPaletteBtn.addEventListener('click', function() {
        if (!paletteColors.includes(currentColor)) {
            paletteColors.push(currentColor);
            localStorage.setItem('colorPalette', JSON.stringify(paletteColors));
            renderPalette();
            showMessage('颜色已添加到调色板');
        } else {
            showMessage('此颜色已在调色板中');
        }
    });
    
    // 清空调色板
    clearPaletteBtn.addEventListener('click', function() {
        if (confirm('确定要清空调色板吗？')) {
            paletteColors = [];
            localStorage.setItem('colorPalette', JSON.stringify(paletteColors));
            renderPalette();
            showMessage('调色板已清空');
        }
    });
    
    // 保存调色板为图片
    savePaletteBtn.addEventListener('click', function() {
        if (paletteColors.length === 0) {
            showMessage('调色板为空，请先添加颜色');
            return;
        }
        
        const canvas = document.createElement('canvas');
        const size = 40;
        const padding = 10;
        const columns = Math.min(paletteColors.length, 5);
        const rows = Math.ceil(paletteColors.length / 5);
        
        canvas.width = columns * size + (columns + 1) * padding;
        canvas.height = rows * size + (rows + 1) * padding;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        paletteColors.forEach((color, index) => {
            const col = index % 5;
            const row = Math.floor(index / 5);
            ctx.fillStyle = color;
            ctx.fillRect(
                padding + col * (size + padding),
                padding + row * (size + padding),
                size,
                size
            );
        });
        
        const link = document.createElement('a');
        link.download = '调色板.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
    
    // 监听配色方案按钮
    schemeButtons.forEach(button => {
        button.addEventListener('click', function() {
            schemeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            generateColorScheme(this.dataset.scheme);
        });
    });
    
    // 监听渐变类型变化
    gradientType.addEventListener('change', function() {
        if (this.value === 'linear') {
            linearControls.style.display = 'flex';
            radialControls.style.display = 'none';
        } else {
            linearControls.style.display = 'none';
            radialControls.style.display = 'flex';
        }
        updateGradient();
    });
    
    // 监听渐变方向变化
    gradientDirection.addEventListener('change', updateGradient);
    gradientShape.addEventListener('change', updateGradient);
    
    // 监听渐变颜色变化
    gradientColor1.addEventListener('input', updateGradient);
    gradientColor2.addEventListener('input', updateGradient);
    
    // 监听复制按钮
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const targetInput = document.getElementById(targetId);
            copyToClipboard(targetInput.value);
            showMessage('已复制到剪贴板');
        });
    });
    
    // 初始化颜色选择器
    function initColorPicker() {
        colorPicker.value = currentColor;
        updateColorDisplay();
    }
    
    // 更新颜色显示
    function updateColorDisplay() {
        colorPreview.style.backgroundColor = currentColor;
        colorText.textContent = currentColor;
    }
    
    // 更新颜色格式转换
    function updateColorFormats() {
        // HEX
        hexValue.value = currentColor;
        
        // RGB
        const rgb = hexToRgb(currentColor);
        rgbValue.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        
        // HSL
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        hslValue.value = `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
        
        // CMYK
        const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
        cmykValue.value = `cmyk(${Math.round(cmyk.c)}%, ${Math.round(cmyk.m)}%, ${Math.round(cmyk.y)}%, ${Math.round(cmyk.k)}%)`;
    }
    
    // 渲染调色板
    function renderPalette() {
        colorPalette.innerHTML = '';
        
        paletteColors.forEach((color, index) => {
            const colorElement = document.createElement('div');
            colorElement.className = 'palette-color';
            colorElement.style.backgroundColor = color;
            colorElement.title = color;
            
            // 添加点击事件，选中此颜色
            colorElement.addEventListener('click', function() {
                currentColor = color;
                colorPicker.value = color;
                updateColorDisplay();
                updateColorFormats();
                generateColorScheme(getActiveSchemeType());
            });
            
            // 添加删除按钮
            const removeBtn = document.createElement('div');
            removeBtn.className = 'remove-color';
            removeBtn.innerHTML = '×';
            removeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                paletteColors.splice(index, 1);
                localStorage.setItem('colorPalette', JSON.stringify(paletteColors));
                renderPalette();
            });
            
            colorElement.appendChild(removeBtn);
            colorPalette.appendChild(colorElement);
        });
        
        // 如果调色板为空，显示提示信息
        if (paletteColors.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = '点击"添加到调色板"按钮添加颜色';
            emptyMessage.style.color = '#999';
            emptyMessage.style.fontStyle = 'italic';
            colorPalette.appendChild(emptyMessage);
        }
    }
    
    // 生成颜色方案
    function generateColorScheme(schemeType) {
        const rgb = hexToRgb(currentColor);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        let schemeColors = [];
        
        switch (schemeType) {
            case 'monochromatic':
                schemeColors = generateMonochromaticScheme(hsl);
                break;
            case 'analogous':
                schemeColors = generateAnalogousScheme(hsl);
                break;
            case 'complementary':
                schemeColors = generateComplementaryScheme(hsl);
                break;
            case 'triadic':
                schemeColors = generateTriadicScheme(hsl);
                break;
            case 'tetradic':
                schemeColors = generateTetradicScheme(hsl);
                break;
        }
        
        renderColorScheme(schemeColors);
    }
    
    // 渲染颜色方案
    function renderColorScheme(colors) {
        colorScheme.innerHTML = '';
        
        colors.forEach(color => {
            const schemeColor = document.createElement('div');
            schemeColor.className = 'scheme-color';
            schemeColor.style.backgroundColor = color;
            
            // 添加颜色文本
            const colorText = document.createElement('div');
            colorText.className = 'scheme-color-text';
            colorText.textContent = color;
            
            // 添加点击事件，选中此颜色
            schemeColor.addEventListener('click', function() {
                currentColor = color;
                colorPicker.value = color;
                updateColorDisplay();
                updateColorFormats();
            });
            
            schemeColor.appendChild(colorText);
            colorScheme.appendChild(schemeColor);
        });
    }
    
    // 更新渐变预览
    function updateGradient() {
        const color1 = gradientColor1.value;
        const color2 = gradientColor2.value;
        let gradientString = '';
        
        if (gradientType.value === 'linear') {
            const direction = gradientDirection.value;
            gradientString = `linear-gradient(${direction}, ${color1}, ${color2})`;
        } else {
            const shape = gradientShape.value;
            gradientString = `radial-gradient(${shape}, ${color1}, ${color2})`;
        }
        
        gradientPreview.style.background = gradientString;
        gradientCss.value = `background: ${gradientString};`;
    }
    
    // 获取当前激活的方案类型
    function getActiveSchemeType() {
        const activeButton = document.querySelector('.scheme-btn.active');
        return activeButton ? activeButton.dataset.scheme : 'monochromatic';
    }
    
    // 工具函数：复制到剪贴板
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
    
    // 工具函数：显示消息
    function showMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.textContent = message;
        document.body.appendChild(messageElement);
        
        setTimeout(() => {
            messageElement.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            messageElement.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(messageElement);
            }, 300);
        }, 2000);
    }
    
    // 颜色转换函数：HEX转RGB
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }
    
    // 颜色转换函数：RGB转HSL
    function rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // 灰色
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            
            h /= 6;
        }
        
        return { h: h * 360, s: s * 100, l: l * 100 };
    }
    
    // 颜色转换函数：RGB转CMYK
    function rgbToCmyk(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        let k = 1 - Math.max(r, g, b);
        let c = (1 - r - k) / (1 - k) || 0;
        let m = (1 - g - k) / (1 - k) || 0;
        let y = (1 - b - k) / (1 - k) || 0;
        
        return { c: c * 100, m: m * 100, y: y * 100, k: k * 100 };
    }
    
    // 颜色转换函数：HSL转HEX
    function hslToHex(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l; // 灰色
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        const toHex = x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    
    // 生成单色方案
    function generateMonochromaticScheme(hsl) {
        const colors = [];
        const { h, s } = hsl;
        
        for (let i = 0; i <= 4; i++) {
            const l = Math.max(10, Math.min(90, 20 + i * 15));
            colors.push(hslToHex(h, s, l));
        }
        
        return colors;
    }
    
    // 生成类似色方案
    function generateAnalogousScheme(hsl) {
        const colors = [];
        const { h, s, l } = hsl;
        
        for (let i = -2; i <= 2; i++) {
            const newH = (h + i * 30 + 360) % 360;
            colors.push(hslToHex(newH, s, l));
        }
        
        return colors;
    }
    
    // 生成互补色方案
    function generateComplementaryScheme(hsl) {
        const { h, s, l } = hsl;
        const complementaryH = (h + 180) % 360;
        
        return [
            hslToHex(h, s, l),
            hslToHex(h, s * 0.8, l * 1.1),
            hslToHex(h, s * 0.6, l * 1.2),
            hslToHex(complementaryH, s, l),
            hslToHex(complementaryH, s * 0.8, l * 1.1)
        ];
    }
    
    // 生成三角色方案
    function generateTriadicScheme(hsl) {
        const { h, s, l } = hsl;
        
        return [
            hslToHex(h, s, l),
            hslToHex((h + 120) % 360, s, l),
            hslToHex((h + 240) % 360, s, l),
            hslToHex(h, s * 0.8, l * 1.1),
            hslToHex((h + 120) % 360, s * 0.8, l * 1.1)
        ];
    }
    
    // 生成四色组方案
    function generateTetradicScheme(hsl) {
        const { h, s, l } = hsl;
        
        return [
            hslToHex(h, s, l),
            hslToHex((h + 90) % 360, s, l),
            hslToHex((h + 180) % 360, s, l),
            hslToHex((h + 270) % 360, s, l),
            hslToHex(h, s * 0.8, l * 1.1)
        ];
    }
    
    // 添加消息样式
    const style = document.createElement('style');
    style.textContent = `
        .message {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            font-weight: 500;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s, transform 0.3s;
        }
        
        .message.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        
        body.dark-mode .message {
            background-color: rgba(255, 255, 255, 0.9);
            color: #333;
        }
    `;
    document.head.appendChild(style);
}); 