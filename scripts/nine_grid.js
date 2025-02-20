document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById('imageInput');
    const originalCanvas = document.getElementById('originalCanvas');
    const gridContainer = document.getElementById('gridContainer');
    const splitButton = document.getElementById('splitButton');
    const downloadAllButton = document.getElementById('downloadAllButton');
    const downloadZipButton = document.getElementById('downloadZipButton');
    const imageList = document.getElementById('imageList');
    let originalImage = null;
    let gridPieces = [];

    // 获取背景设置
    function getBackgroundSetting() {
        return document.querySelector('input[name="background"]:checked').value;
    }

    // 获取形状设置
    function getShapeSetting() {
        return document.querySelector('input[name="shape"]:checked').value;
    }

    // 获取宫格设置
    function getGridSetting() {
        return parseInt(document.querySelector('input[name="grid"]:checked').value);
    }

    // 获取导出的图片格式
    function getImageFormat() {
        return getBackgroundSetting() === 'transparent' ? 'image/png' : 'image/jpeg';
    }

    // 清除画布背景
    function clearCanvas(ctx, width, height) {
        if (getBackgroundSetting() === 'transparent') {
            ctx.clearRect(0, 0, width, height);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
        }
    }

    // 应用形状裁剪
    function applyShape(ctx, width, height) {
        const shape = getShapeSetting();
        if (shape === 'none') return;

        ctx.beginPath();
        if (shape === 'rounded') {
            const radius = Math.min(width, height) * 0.1; // 10% 圆角
            ctx.moveTo(radius, 0);
            ctx.lineTo(width - radius, 0);
            ctx.quadraticCurveTo(width, 0, width, radius);
            ctx.lineTo(width, height - radius);
            ctx.quadraticCurveTo(width, height, width - radius, height);
            ctx.lineTo(radius, height);
            ctx.quadraticCurveTo(0, height, 0, height - radius);
            ctx.lineTo(0, radius);
            ctx.quadraticCurveTo(0, 0, radius, 0);
        } else if (shape === 'circle') {
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) / 2;
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        } else if (shape === 'heart') {
            const scale = Math.min(width, height);
            ctx.scale(scale / 100, scale / 100);
            // 绘制心形路径
            ctx.moveTo(50, 15);
            ctx.bezierCurveTo(50, 12, 45, 0, 25, 0);
            ctx.bezierCurveTo(10, 0, 0, 12, 0, 30);
            ctx.bezierCurveTo(0, 55, 20, 77, 50, 95);
            ctx.bezierCurveTo(80, 77, 100, 55, 100, 30);
            ctx.bezierCurveTo(100, 12, 90, 0, 75, 0);
            ctx.bezierCurveTo(55, 0, 50, 12, 50, 15);
            ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换
        }
        ctx.closePath();
        ctx.clip();
    }

    // 监听图片上传
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                originalImage = new Image();
                originalImage.onload = function() {
                    // 启用切割按钮
                    splitButton.disabled = false;
                    // 显示原图预览并自动切割
                    displayOriginalImage();
                    splitImage();
                };
                originalImage.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // 显示原图预览
    function displayOriginalImage() {
        gridContainer.innerHTML = '';
        const previewDiv = document.createElement('div');
        previewDiv.style.gridColumn = '1 / span 3';
        const img = document.createElement('img');
        img.src = originalImage.src;
        img.style.width = '100%';
        img.style.height = 'auto';
        previewDiv.appendChild(img);
        gridContainer.appendChild(previewDiv);
    }

    // 创建单个图片项
    function createImageItem(dataUrl, index) {
        const item = document.createElement('div');
        item.className = 'image-item';
        
        const img = document.createElement('img');
        img.src = dataUrl;
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.innerHTML = '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.href = dataUrl;
            const format = getBackgroundSetting() === 'transparent' ? 'png' : 'jpg';
            link.download = `piece_${index}.${format}`;
            link.click();
        };
        
        item.appendChild(img);
        item.appendChild(downloadBtn);
        return item;
    }

    // 更新图片列表
    function updateImageList() {
        imageList.innerHTML = '';
        gridPieces.forEach(piece => {
            const item = createImageItem(piece.dataUrl, piece.index);
            imageList.appendChild(item);
        });
    }

    // 创建ZIP文件并下载
    async function downloadAsZip() {
        const JSZip = window.JSZip;
        const zip = new JSZip();
        const format = getBackgroundSetting() === 'transparent' ? 'png' : 'jpg';
        
        gridPieces.forEach(piece => {
            const imageData = piece.dataUrl.split(',')[1];
            zip.file(`piece_${piece.index}.${format}`, imageData, {base64: true});
        });
        
        const content = await zip.generateAsync({type: 'blob'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'nine_grid_images.zip';
        link.click();
        URL.revokeObjectURL(link.href);
    }

    // 切割图片
    function splitImage() {
        if (!originalImage) return;

        const ctx = originalCanvas.getContext('2d', { alpha: true });
        
        // 计算最大边长（取最大值）
        const maxSize = Math.max(originalImage.width, originalImage.height);
        
        // 设置画布为正方形，使用最大边长
        originalCanvas.width = maxSize;
        originalCanvas.height = maxSize;
        
        // 清除画布（使用选择的背景）
        clearCanvas(ctx, maxSize, maxSize);

        // 应用形状裁剪到整个画布
        applyShape(ctx, maxSize, maxSize);
        
        // 居中绘制图片
        const x = (maxSize - originalImage.width) / 2;
        const y = (maxSize - originalImage.height) / 2;
        ctx.drawImage(originalImage, x, y);

        // 清空网格容器和图片列表
        gridContainer.innerHTML = '';
        imageList.innerHTML = '';
        gridPieces = [];

        // 获取宫格数量
        const gridSize = getGridSetting();
        const cols = gridSize === 4 ? 2 : 3;
        
        // 设置网格容器的data-grid属性
        gridContainer.setAttribute('data-grid', gridSize.toString());
        
        // 计算每个切片的大小（正方形）
        const pieceSize = Math.floor(maxSize / cols);

        // 切割图片并创建宫格
        for (let row = 0; row < cols; row++) {
            for (let col = 0; col < cols; col++) {
                const pieceCanvas = document.createElement('canvas');
                const pieceCtx = pieceCanvas.getContext('2d', { alpha: true });

                const startX = col * pieceSize;
                const startY = row * pieceSize;
                
                const currentSize = (col === cols - 1 || row === cols - 1) ? 
                    (maxSize - pieceSize * (cols - 1)) : pieceSize;

                pieceCanvas.width = currentSize;
                pieceCanvas.height = currentSize;

                // 清除画布（使用选择的背景）
                clearCanvas(pieceCtx, currentSize, currentSize);

                pieceCtx.imageSmoothingEnabled = true;
                pieceCtx.imageSmoothingQuality = 'high';

                pieceCtx.drawImage(
                    originalCanvas,
                    startX, startY,
                    currentSize, currentSize,
                    0, 0,
                    currentSize, currentSize
                );

                const gridItem = document.createElement('div');
                gridItem.className = 'grid-item';
                
                const img = document.createElement('img');
                img.src = pieceCanvas.toDataURL(getImageFormat(), 1.0);
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                
                gridItem.appendChild(img);
                gridContainer.appendChild(gridItem);

                // 调整索引计算方式，确保4宫格和9宫格都按照从左到右、从上到下的顺序
                const index = row * cols + col + 1;
                
                gridPieces.push({
                    dataUrl: pieceCanvas.toDataURL(getImageFormat(), 1.0),
                    index: index
                });
            }
        }

        // 更新网格容器的样式
        gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        
        // 如果是4宫格，调整网格容器的最大宽度
        if (cols === 2) {
            gridContainer.style.maxWidth = '400px';
        } else {
            gridContainer.style.maxWidth = '600px';
        }

        // 更新图片列表
        updateImageList();

        // 启用下载按钮
        downloadAllButton.disabled = false;
        downloadZipButton.disabled = false;
    }

    // 监听切割按钮点击
    splitButton.addEventListener('click', splitImage);

    // 监听全部下载按钮点击
    downloadAllButton.addEventListener('click', () => {
        const format = getBackgroundSetting() === 'transparent' ? 'png' : 'jpg';
        gridPieces.forEach(piece => {
            const link = document.createElement('a');
            link.href = piece.dataUrl;
            link.download = `piece_${piece.index}.${format}`;
            link.click();
        });
    });

    // 监听打包下载按钮点击
    downloadZipButton.addEventListener('click', downloadAsZip);

    // 监听背景和形状选项变化
    document.querySelectorAll('input[name="background"], input[name="shape"], input[name="grid"]').forEach(input => {
        input.addEventListener('change', () => {
            if (originalImage) {
                splitImage();
            }
        });
    });
}); 