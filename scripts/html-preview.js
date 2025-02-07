document.addEventListener("DOMContentLoaded", function () {
  // HTML预览功能
  const htmlInput = document.getElementById("html-input");
  const htmlOutput = document.getElementById("html-output");
  const formatHtmlBtn = document.getElementById("format-html-btn");
  const unescapeBtn = document.getElementById("unescape-btn");
  const clearHtmlBtn = document.getElementById("clear-html-btn");
  const maximizeBtn = document.getElementById("maximize-btn");
  const restoreBtn = document.getElementById("restore-btn");
  const pasteHtmlBtn = document.getElementById("paste-html-btn");
  const dragbar = document.getElementById("dragbar");
  const inputPane = document.getElementById("input-pane");
  const outputPane = document.getElementById("output-pane");

  // 添加最大化状态管理相关函数
  const MAXIMIZE_STATE_KEY = 'html_preview_maximize_state';
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000; // 7天的毫秒数

  // 初始化面板宽度
  function initializePanels() {
    inputPane.style.width = "49.8%";  // 50% - dragbar宽度的一半
    outputPane.style.width = "49.8%"; // 50% - dragbar宽度的一半
  }

  // 页面加载时初始化面板
  initializePanels();

  // 自动运行
  function runHtml() {
    const code = htmlInput.value;
    htmlOutput.srcdoc = code;
  }

  // 自动运行
  htmlInput.addEventListener("input", runHtml);

  formatHtmlBtn.addEventListener("click", () => {
    const code = htmlInput.value;
    const formattedCode = html_beautify(code, { indent_size: 4 });
    htmlInput.value = formattedCode;
    runHtml();
  });

  unescapeBtn.addEventListener("click", () => {
    const code = htmlInput.value;
    const unescapedCode = unescapeHtml(code);
    htmlInput.value = unescapedCode;
    runHtml();
  });

  clearHtmlBtn.addEventListener("click", () => {
    htmlInput.value = "";
    htmlOutput.srcdoc = "";
  });

  pasteHtmlBtn.addEventListener("click", async () => {
    // 添加加载状态
    pasteHtmlBtn.disabled = true;
    pasteHtmlBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 粘贴中...';
    
    try {
        // 清空现有内容
        htmlInput.value = "";
        htmlOutput.srcdoc = "";
        
        // 读取剪贴板
        const clipboardText = await navigator.clipboard.readText();
        
        if (clipboardText.trim() === "") {
            throw new Error("剪贴板为空");
        }
        
        // 设置新内容
        htmlInput.value = clipboardText;
        htmlOutput.srcdoc = clipboardText;
        
    } catch (err) {
        if (err.message === "剪贴板为空") {
            alert("剪贴板中没有内容");
        } else {
            alert("无法访问剪贴板，请确保已授予剪贴板访问权限。");
        }
        console.error("剪贴板访问错误:", err);
    } finally {
        // 恢复按钮状态
        pasteHtmlBtn.disabled = false;
        pasteHtmlBtn.innerHTML = '<i class="fas fa-paste"></i> 清空并粘贴';
    }
  });

  // 保存最大化状态
  function saveMaximizeState(isMaximized) {
    const state = {
      isMaximized: isMaximized,
      timestamp: Date.now()
    };
    localStorage.setItem(MAXIMIZE_STATE_KEY, JSON.stringify(state));
  }

  // 获取最大化状态
  function getMaximizeState() {
    const stateStr = localStorage.getItem(MAXIMIZE_STATE_KEY);
    if (!stateStr) return null;

    const state = JSON.parse(stateStr);
    const now = Date.now();

    // 检查是否过期
    if (now - state.timestamp > SEVEN_DAYS) {
      localStorage.removeItem(MAXIMIZE_STATE_KEY);
      return null;
    }

    return state;
  }

  // 执行最大化
  function maximizeEditor() {
    document.body.classList.add("maximized");
    document.querySelector('.toolbar').style.visibility = 'visible';
    maximizeBtn.style.display = "none";
    restoreBtn.style.display = "inline-block";
    saveMaximizeState(true);
  }

  // 执行还原
  function restoreEditor() {
    document.body.classList.remove("maximized");
    maximizeBtn.style.display = "inline-block";
    restoreBtn.style.display = "none";
    saveMaximizeState(false);
  }

  // 检查并应用最大化状态
  function checkAndApplyMaximizeState() {
    const state = getMaximizeState();
    if (state && state.isMaximized) {
      maximizeEditor();
    }
  }

  // 修改最大化按钮事件
  maximizeBtn.addEventListener("click", () => {
    maximizeEditor();
  });

  // 修改还原按钮事件
  restoreBtn.addEventListener("click", () => {
    restoreEditor();
  });

  // 修改ESC键监听
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("maximized")) {
      restoreEditor();
    }
  });

  // 页面加载时检查最大化状态
  checkAndApplyMaximizeState();

  // 拖动分割条调整布局
  dragbar.addEventListener("mousedown", (e) => {
    e.preventDefault();
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
  });

  function resize(e) {
    const containerWidth = inputPane.parentNode.offsetWidth;
    const newWidth = (e.clientX / containerWidth) * 100;
    if (newWidth > 10 && newWidth < 90) {
      inputPane.style.flexBasis = `${newWidth}%`;
      outputPane.style.flexBasis = `${100 - newWidth}%`;
    }
  }

  function stopResize() {
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResize);
  }

  // HTML反转义函数
  function unescapeHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.documentElement.textContent;
  }

  // 初始运行
  runHtml();

  // 添加截图功能
  document.getElementById('capture-preview-btn').addEventListener('click', async () => {
    try {
        // 获取预览iframe中的内容
        const iframe = document.getElementById('html-output');
        const iframeContent = iframe.contentDocument || iframe.contentWindow.document;
        
        // 创建加载提示
        const loadingToast = document.createElement('div');
        loadingToast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 30px;
            border-radius: 5px;
            z-index: 9999;
        `;
        loadingToast.textContent = '正在生成截图...';
        document.body.appendChild(loadingToast);

        // 使用html2canvas截图
        const canvas = await html2canvas(iframeContent.body, {
            allowTaint: true,
            useCORS: true,
            backgroundColor: '#ffffff',
            scale: 2, // 提高图片质量
        });

        // 转换为图片
        const image = canvas.toDataURL('image/png', 1.0);
        
        // 创建下载链接
        const downloadLink = document.createElement('a');
        downloadLink.href = image;
        downloadLink.download = `preview-${new Date().getTime()}.png`;
        
        // 触发下载
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // 移除加载提示
        document.body.removeChild(loadingToast);
        
        // 显示成功提示
        const successToast = document.createElement('div');
        successToast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 30px;
            border-radius: 5px;
            z-index: 9999;
        `;
        successToast.textContent = '截图已保存';
        document.body.appendChild(successToast);
        
        // 3秒后移除成功提示
        setTimeout(() => {
            document.body.removeChild(successToast);
        }, 3000);
    } catch (error) {
        console.error('截图失败:', error);
        alert('截图生成失败，请重试');
    }
  });
}); 