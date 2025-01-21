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

  // 最大化功能
  maximizeBtn.addEventListener("click", () => {
    document.body.classList.add("maximized");
    // 确保工具栏和按钮可见
    document.querySelector('.toolbar').style.visibility = 'visible';
    maximizeBtn.style.display = "none";
    restoreBtn.style.display = "inline-block";
  });

  restoreBtn.addEventListener("click", () => {
    document.body.classList.remove("maximized");
    maximizeBtn.style.display = "inline-block";
    restoreBtn.style.display = "none";
  });

  // 监听 Esc 键恢复窗口
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("maximized")) {
        document.body.classList.remove("maximized");
        maximizeBtn.style.display = "inline-block";
        restoreBtn.style.display = "none";
    }
  });

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
      inputPane.style.width = `${newWidth}%`;
      outputPane.style.width = `${100 - newWidth - 0.4}%`; // 减去dragbar的宽度(0.4%)
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
}); 