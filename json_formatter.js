document.addEventListener("DOMContentLoaded", function () {
  // 主题切换功能保持不变
  const themeToggle = document.getElementById("theme-toggle");
  const body = document.body;

  let isCollapsed = false; // 初始状态为未折叠

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

  // JSON格式化功能
  const jsonInput = document.getElementById("json-input");
  const jsonOutputContainer = document.getElementById("json-output");
  const formatBtn = document.getElementById("format-btn");
  const minifyBtn = document.getElementById("minify-btn");
  const copyBtn = document.getElementById("copy-btn");
  const collapseBtn = document.getElementById("collapse-btn");
  const clearBtn = document.getElementById("clear-btn");
  const maximizeBtn = document.getElementById("maximize-btn");
  const restoreBtn = document.getElementById("restore-btn");

  // 创建JSON编辑器实例
  const options = {
    mode: "view",
    modes: ["view"], // 只读模式
    onError: function (err) {
      alert("JSON格式不正确：" + err.toString());
    },
    navigationBar: false,
    statusBar: false,
    mainMenuBar: false,
  };
  const jsonEditor = new JSONEditor(jsonOutputContainer, options);

  function formatJSON() {
    try {
      const json = JSON.parse(jsonInput.value);
      jsonInput.value = JSON.stringify(json, null, 4);
      jsonEditor.set(json);
      isCollapsed = false;
       collapseBtn.innerHTML = '<i class="fas fa-compress-arrows-alt"></i> 折叠';
    } catch (e) {
      // 在编辑器中显示错误信息
      jsonEditor.setText("JSON格式不正确：" + e.message);
    }
  }

  function minifyJSON() {
    try {
      const json = JSON.parse(jsonInput.value);
      jsonInput.value = JSON.stringify(json);
      jsonEditor.set(json);
    } catch (e) {
      jsonEditor.setText("JSON格式不正确：" + e.message);
    }
  }

  function collapseJSON() {
    if (!isCollapsed) {
        jsonEditor.collapseAll();
        collapseBtn.innerHTML = '<i class="fas fa-expand-arrows-alt"></i> 展开';
    } else {
        jsonEditor.expandAll();
        collapseBtn.innerHTML = '<i class="fas fa-compress-arrows-alt"></i> 折叠';
    }
    isCollapsed = !isCollapsed; // 切换状态
  }

  function copyJSON() {
    const text = JSON.stringify(jsonEditor.get(), null, 4);
    navigator.clipboard.writeText(text).then(
      () => {
        alert("已复制到剪贴板");
      },
      () => {
        alert("复制失败");
      }
    );
  }

  function clearJSON() {
    jsonInput.value = "";
    jsonEditor.set({});
    isCollapsed = false;
    collapseBtn.innerHTML = '<i class="fas fa-compress-arrows-alt"></i> 折叠';
  }

  // 自动格式化
  jsonInput.addEventListener("input", () => {
    formatJSON();
  });

  formatBtn.addEventListener("click", formatJSON);
  minifyBtn.addEventListener("click", minifyJSON);
  collapseBtn.addEventListener("click", collapseJSON);
  copyBtn.addEventListener("click", copyJSON);
  clearBtn.addEventListener("click", clearJSON);

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

  // 初始格式化
  formatJSON();
});
