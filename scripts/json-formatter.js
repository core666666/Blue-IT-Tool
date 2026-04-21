document.addEventListener("DOMContentLoaded", function () {
  let isCollapsed = false; // 初始状态为未折叠

  // JSON格式化功能
  const jsonInput = document.getElementById("json-input");
  const jsonOutputContainer = document.getElementById("json-output");
  const formatBtn = document.getElementById("format-btn");
  const minifyBtn = document.getElementById("minify-btn");
  const copyBtn = document.getElementById("copy-btn");
  const collapseBtn = document.getElementById("collapse-btn");
  const clearBtn = document.getElementById("clear-btn");
  const simplifyBtn = document.getElementById("simplify-btn");
  const maximizeBtn = document.getElementById("maximize-btn");
  const restoreBtn = document.getElementById("restore-btn");
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

  // 同步右侧编辑器内容到左侧输入框
  function syncToInput() {
    try {
      const json = jsonEditor.get();
      jsonInput.value = JSON.stringify(json, null, 4);
    } catch (e) {
      console.error("同步失败：", e.message);
    }
  }

  // 创建JSON编辑器实例
  const options = {
    mode: "tree",
    modes: ["tree", "view"], // 支持树形编辑和只读模式
    onError: function (err) {
      alert("JSON格式不正确：" + err.toString());
    },
    onChange: function () {
      // 当编辑器内容变化时，自动同步到左侧输入框
      syncToInput();
    },
    navigationBar: false,
    statusBar: false,
    mainMenuBar: false,
    enableSort: false,
    enableTransform: false,
  };
  const jsonEditor = new JSONEditor(jsonOutputContainer, options);

  function formatJSON() {
    try {
      const json = JSON.parse(jsonInput.value);
      jsonInput.value = JSON.stringify(json, null, 4);
      jsonEditor.set(json);
      jsonEditor.expandAll();
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

  // 精简JSON结构：数组只保留第一个元素，对象保留所有键但递归精简
  function simplifyJSON(data) {
    if (Array.isArray(data)) {
      // 数组只保留第一个元素，并递归精简
      if (data.length > 0) {
        return [simplifyJSON(data[0])];
      }
      return [];
    } else if (data !== null && typeof data === 'object') {
      // 对象保留所有键，但递归精简每个值
      const result = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          result[key] = simplifyJSON(data[key]);
        }
      }
      return result;
    }
    // 基本类型直接返回
    return data;
  }

  function doSimplifyJSON() {
    try {
      const json = jsonEditor.get();
      const simplified = simplifyJSON(json);
      jsonInput.value = JSON.stringify(simplified, null, 4);
      jsonEditor.set(simplified);
      jsonEditor.expandAll();
      isCollapsed = false;
      collapseBtn.innerHTML = '<i class="fas fa-compress-arrows-alt"></i> 折叠';
    } catch (e) {
      alert("精简失败：" + e.message);
    }
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
  simplifyBtn.addEventListener("click", doSimplifyJSON);

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
      inputPane.style.flexBasis = `${newWidth}%`;
      outputPane.style.flexBasis = `${100 - newWidth}%`;
    }
  }

  function stopResize() {
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResize);
  }

  // 左右滚动同步（jsoneditor 真实滚动容器是 .jsoneditor-tree）
  let isSyncing = false;
  function getTreeScroller() {
    return jsonOutputContainer.querySelector('.jsoneditor-tree');
  }

  jsonInput.addEventListener("scroll", () => {
    const treeScroller = getTreeScroller();
    if (isSyncing || !treeScroller) return;
    isSyncing = true;
    const ratio = jsonInput.scrollTop / (jsonInput.scrollHeight - jsonInput.clientHeight || 1);
    treeScroller.scrollTop = ratio * (treeScroller.scrollHeight - treeScroller.clientHeight);
    isSyncing = false;
  });

  jsonOutputContainer.addEventListener("scroll", (e) => {
    const treeScroller = getTreeScroller();
    if (!treeScroller || e.target !== treeScroller) return;
    if (isSyncing) return;
    isSyncing = true;
    const ratio = treeScroller.scrollTop / (treeScroller.scrollHeight - treeScroller.clientHeight || 1);
    jsonInput.scrollTop = ratio * (jsonInput.scrollHeight - jsonInput.clientHeight);
    isSyncing = false;
  }, true);

  // 页面加载时自动进入最大化模式
  document.body.classList.add("maximized");
  document.querySelector('.toolbar').style.visibility = 'visible';
  maximizeBtn.style.display = "none";
  restoreBtn.style.display = "inline-block";
  console.log("已自动最大化", document.body.classList);

  // 初始格式化
  formatJSON();
}); 