document.addEventListener("DOMContentLoaded", function () {
  // 主题切换功能保持不变
  const themeToggle = document.getElementById("theme-toggle");
  const body = document.body;

  function setTheme(theme) {
    if (theme === "dark") {
      body.classList.remove("light-mode");
      body.classList.add("dark-mode");
      themeToggle.checked = true;
      localStorage.setItem("theme", "dark");
    } else {
      body.classList.remove("dark-mode");
      body.classList.add("light-mode");
      themeToggle.checked = false;
      localStorage.setItem("theme", "light");
    }
  }

  themeToggle.addEventListener("change", () => {
    if (themeToggle.checked) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  });

  // 检查本地存储中的主题设置
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    // 根据系统偏好设置
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  }

  // HTML预览功能
  const htmlInput = document.getElementById("html-input");
  const htmlOutput = document.getElementById("html-output");
  const formatHtmlBtn = document.getElementById("format-html-btn");
  const unescapeBtn = document.getElementById("unescape-btn");
  const clearHtmlBtn = document.getElementById("clear-html-btn");
  const maximizeBtn = document.getElementById("maximize-btn");
  const restoreBtn = document.getElementById("restore-btn");

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
  const dragbar = document.getElementById("dragbar");
  const inputPane = document.getElementById("input-pane");
  const outputPane = document.getElementById("output-pane");

  dragbar.addEventListener("mousedown", (e) => {
    e.preventDefault();
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
  });

  function resize(e) {
    const containerWidth = inputPane.parentNode.offsetWidth;
    const newWidth = (e.clientX / containerWidth) * 100;
    if (newWidth > 10 && newWidth < 90) {
      // 限制最小和最大宽度
      inputPane.style.flex = `0 0 ${newWidth}%`;
      outputPane.style.flex = `0 0 ${100 - newWidth}%`;
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
