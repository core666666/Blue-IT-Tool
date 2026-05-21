document.addEventListener("DOMContentLoaded", function () {
  const regexInput = document.getElementById("regex-input");
  const regexFlags = document.getElementById("regex-flags");
  const replaceInput = document.getElementById("replace-input");
  const testInput = document.getElementById("test-input");

  const resultOutput = document.getElementById("result-output");
  const replaceOutput = document.getElementById("replace-output");
  const matchCount = document.getElementById("match-count");
  const replaceCount = document.getElementById("replace-count");
  const matchDetails = document.getElementById("match-details");

  const clearBtn = document.getElementById("clear-btn");
  const copyBtn = document.getElementById("copy-btn");
  const copyReplacedBtn = document.getElementById("copy-replaced-btn");
  const highlightBtn = document.getElementById("highlight-btn");
  const replaceBtn = document.getElementById("replace-btn");
  const maximizeBtn = document.getElementById("maximize-btn");
  const restoreBtn = document.getElementById("restore-btn");
  const templateBtns = document.querySelectorAll(".template-btn");
  const flagItems = document.querySelectorAll(".flag-item");

  const FLAG_ORDER = "dgimsuvy";
  let latestReplacedText = "";
  let updateTimer = null;

  function debounceUpdate() {
    if (updateTimer) {
      clearTimeout(updateTimer);
    }

    updateTimer = setTimeout(updateAll, 120);
  }

  function sanitizeFlags(flags) {
    const uniqueFlags = new Set((flags || "").split("").filter(Boolean));
    return FLAG_ORDER.split("").filter((flag) => uniqueFlags.has(flag)).join("");
  }

  function buildRegex() {
    const pattern = regexInput.value.trim();

    if (!pattern) {
      throw new Error("请输入正则表达式");
    }

    const flags = sanitizeFlags(regexFlags.value);
    regexFlags.value = flags || "g";
    updateFlagButtons();

    return new RegExp(pattern, regexFlags.value);
  }

  function createTextBox(message, className) {
    const box = document.createElement("div");
    box.className = className;
    box.textContent = message;
    return box;
  }

  function clearElement(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function setInfoState() {
    clearElement(resultOutput);
    clearElement(replaceOutput);
    clearElement(matchDetails);
    resultOutput.appendChild(createTextBox("请输入正则表达式和测试文本", "no-match"));
    replaceOutput.textContent = "";
    matchCount.textContent = "";
    replaceCount.textContent = "";
    latestReplacedText = "";
  }

  function setErrorState(message) {
    clearElement(resultOutput);
    clearElement(replaceOutput);
    clearElement(matchDetails);
    resultOutput.appendChild(createTextBox(`正则表达式错误：${message}`, "regex-error"));
    replaceOutput.textContent = "";
    matchCount.textContent = "";
    replaceCount.textContent = "";
    latestReplacedText = "";
  }

  function collectMatches(text, regex) {
    const matches = [];
    const useGlobal = regex.global;
    let match;

    if (useGlobal) {
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          value: match[0],
          index: match.index,
          end: match.index + match[0].length,
          groups: match.slice(1),
        });

        if (match[0] === "") {
          regex.lastIndex += 1;
        }
      }
    } else {
      match = regex.exec(text);
      if (match) {
        matches.push({
          value: match[0],
          index: match.index,
          end: match.index + match[0].length,
          groups: match.slice(1),
        });
      }
    }

    return matches;
  }

  function renderHighlightedText(text, matches) {
    clearElement(resultOutput);

    if (!text) {
      resultOutput.appendChild(createTextBox("请输入测试文本", "no-match"));
      return;
    }

    if (matches.length === 0) {
      resultOutput.appendChild(document.createTextNode(text));
      return;
    }

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    matches.forEach((match) => {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      const highlight = document.createElement("span");
      highlight.className = "match-highlight";
      highlight.textContent = match.value;
      fragment.appendChild(highlight);

      lastIndex = match.end;
    });

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    resultOutput.appendChild(fragment);
  }

  function renderGroups(groups) {
    const groupsWrapper = document.createElement("div");
    groupsWrapper.className = "match-groups";

    groups.forEach((group, index) => {
      const row = document.createElement("div");
      row.className = "group-item";

      const label = document.createElement("span");
      label.className = "group-label";
      label.textContent = `组 ${index + 1}:`;

      const value = document.createElement("span");
      value.className = "group-value";
      value.textContent = group !== undefined ? group : "(未匹配)";

      row.appendChild(label);
      row.appendChild(value);
      groupsWrapper.appendChild(row);
    });

    return groupsWrapper;
  }

  function renderMatchDetails(matches) {
    clearElement(matchDetails);

    if (matches.length === 0) {
      matchDetails.appendChild(createTextBox("没有找到匹配项", "no-match"));
      return;
    }

    const fragment = document.createDocumentFragment();

    matches.forEach((match, index) => {
      const item = document.createElement("div");
      item.className = "match-item";

      const header = document.createElement("div");
      header.className = "match-item-header";

      const title = document.createElement("span");
      title.textContent = `匹配 #${index + 1}`;

      const position = document.createElement("span");
      position.textContent = `位置: ${match.index} - ${match.end}`;

      const value = document.createElement("div");
      value.className = "match-item-value";
      value.textContent = match.value;

      header.appendChild(title);
      header.appendChild(position);
      item.appendChild(header);
      item.appendChild(value);

      if (match.groups.length > 0) {
        item.appendChild(renderGroups(match.groups));
      }

      fragment.appendChild(item);
    });

    matchDetails.appendChild(fragment);
  }

  function updateCounts(matches, replacedText) {
    matchCount.textContent = `(${matches.length} 个匹配)`;
    replaceCount.textContent = replacedText ? `(${replacedText.length} 字符)` : "";
  }

  function updateReplacementOutput(text, regex) {
    if (!text) {
      latestReplacedText = "";
      replaceOutput.textContent = "";
      return;
    }

    const replacement = replaceInput.value;
    try {
      latestReplacedText = text.replace(regex, replacement);
      replaceOutput.textContent = latestReplacedText;
    } catch (error) {
      latestReplacedText = "";
      replaceOutput.textContent = `替换失败：${error.message}`;
    }
  }

  function updateAll() {
    const text = testInput.value;
    const pattern = regexInput.value.trim();

    clearElement(matchDetails);
    matchCount.textContent = "";
    replaceCount.textContent = "";

    if (!pattern) {
      setInfoState();
      return;
    }

    if (!text) {
      clearElement(resultOutput);
      clearElement(replaceOutput);
      resultOutput.appendChild(createTextBox("请输入测试文本", "no-match"));
      replaceOutput.textContent = "";
      matchDetails.appendChild(createTextBox("请输入测试文本", "no-match"));
      latestReplacedText = "";
      return;
    }

    try {
      const regex = buildRegex();
      const matches = collectMatches(text, regex);

      renderHighlightedText(text, matches);
      renderMatchDetails(matches);
      updateReplacementOutput(text, regex);
      updateCounts(matches, latestReplacedText);
    } catch (error) {
      setErrorState(error.message);
    }
  }

  function updateFlagButtons() {
    const currentFlags = sanitizeFlags(regexFlags.value);
    flagItems.forEach((item) => {
      item.classList.toggle("active", currentFlags.includes(item.dataset.flag));
    });
  }

  async function copyToClipboard(text, successMessage, failMessage) {
    if (!text) {
      alert(failMessage);
      return false;
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
        alert(successMessage);
        return true;
      }

      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(textarea);

      alert(copied ? successMessage : failMessage);
      return copied;
    } catch (error) {
      alert(failMessage);
      return false;
    }
  }

  function clearAll() {
    regexInput.value = "";
    regexFlags.value = "g";
    replaceInput.value = "";
    testInput.value = "";
    latestReplacedText = "";

    updateFlagButtons();
    setInfoState();
  }

  function toggleMaximized(isMaximized) {
    document.body.classList.toggle("maximized", isMaximized);
    maximizeBtn.style.display = isMaximized ? "none" : "inline-block";
    restoreBtn.style.display = isMaximized ? "inline-block" : "none";
  }

  regexInput.addEventListener("input", debounceUpdate);
  regexFlags.addEventListener("input", () => {
    regexFlags.value = sanitizeFlags(regexFlags.value);
    updateFlagButtons();
    debounceUpdate();
  });
  replaceInput.addEventListener("input", debounceUpdate);
  testInput.addEventListener("input", debounceUpdate);

  flagItems.forEach((item) => {
    item.addEventListener("click", () => {
      const flag = item.dataset.flag;
      const currentFlags = sanitizeFlags(regexFlags.value);

      if (currentFlags.includes(flag)) {
        regexFlags.value = currentFlags.replace(flag, "");
      } else {
        regexFlags.value = sanitizeFlags(currentFlags + flag);
      }

      if (!regexFlags.value) {
        regexFlags.value = "g";
      }

      updateFlagButtons();
      updateAll();
    });
  });

  templateBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      regexInput.value = btn.dataset.regex || "";
      regexFlags.value = btn.dataset.flags || "g";
      updateFlagButtons();
      updateAll();
    });
  });

  clearBtn.addEventListener("click", clearAll);

  copyBtn.addEventListener("click", () => {
    const pattern = regexInput.value.trim();
    const flags = sanitizeFlags(regexFlags.value) || "g";
    copyToClipboard(`/${pattern}/${flags}`, "已复制正则", "复制失败");
  });

  copyReplacedBtn.addEventListener("click", () => {
    copyToClipboard(latestReplacedText, "已复制替换结果", "暂无可复制的替换结果");
  });

  highlightBtn.addEventListener("click", updateAll);
  replaceBtn.addEventListener("click", updateAll);

  maximizeBtn.addEventListener("click", () => toggleMaximized(true));
  restoreBtn.addEventListener("click", () => toggleMaximized(false));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("maximized")) {
      toggleMaximized(false);
    }
  });

  updateFlagButtons();
  setInfoState();
});
