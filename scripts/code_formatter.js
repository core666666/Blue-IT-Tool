document.addEventListener("DOMContentLoaded", function () {
  const languageSelect = document.getElementById("language-select");
  const indentSelect = document.getElementById("indent-select");
  const inputCode = document.getElementById("input-code");
  const outputPre = document.getElementById("output-pre");
  const outputCode = document.getElementById("output-code");

  const formatBtn = document.getElementById("format-btn");
  const minifyBtn = document.getElementById("minify-btn");
  const clearBtn = document.getElementById("clear-btn");
  const copyOutputBtn = document.getElementById("copy-output-btn");
  const copyInputBtn = document.getElementById("copy-input-btn");

  let latestOutput = "";

  function getIndentConfig() {
    const indentValue = indentSelect.value;

    if (indentValue === "tab") {
      return {
        indentSize: 1,
        indentChar: "\t",
        useTabs: true,
      };
    }

    return {
      indentSize: Number(indentValue) || 2,
      indentChar: " ",
      useTabs: false,
    };
  }

  function getPrismClass(language) {
    const mapping = {
      javascript: "language-javascript",
      css: "language-css",
      html: "language-markup",
      json: "language-json",
      sql: "language-sql",
      xml: "language-markup",
      typescript: "language-typescript",
    };

    return mapping[language] || "language-markup";
  }

  function highlightOutput() {
    try {
      if (window.Prism && typeof Prism.highlightElement === "function") {
        Prism.highlightElement(outputCode);
      }
    } catch (error) {
      console.error("语法高亮失败:", error);
    }
  }

  function setOutput(text, language) {
    latestOutput = text;
    const prismClass = getPrismClass(language);

    outputPre.className = prismClass;
    outputCode.className = prismClass;
    outputCode.textContent = text;

    highlightOutput();
  }

  function showError(error) {
    const message = error && error.message ? error.message : "处理时发生未知错误，请检查输入内容。";
    latestOutput = "";
    outputPre.className = "language-markup";
    outputCode.className = "language-markup";
    outputCode.textContent = `格式化失败：${message}`;
    highlightOutput();
  }

  function createBeautifyOptions() {
    const { indentSize, indentChar } = getIndentConfig();
    return {
      indent_size: indentSize,
      indent_char: indentChar,
      preserve_newlines: true,
      max_preserve_newlines: 2,
      end_with_newline: false,
      wrap_line_length: 0,
    };
  }

  function formatXml(xmlText, indentChar, indentSize) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");
    const parseError = xmlDoc.getElementsByTagName("parsererror");

    if (parseError.length > 0) {
      throw new Error("XML 格式不正确，请检查标签是否闭合。");
    }

    const indentUnit = indentChar === "\t" ? "\t" : " ".repeat(indentSize);
    const serializer = new XMLSerializer();

    function formatNode(node, level) {
      const indent = indentUnit.repeat(level);

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue.trim();
        return text ? `${indent}${text}` : "";
      }

      if (node.nodeType === Node.COMMENT_NODE) {
        return `${indent}<!--${node.nodeValue}-->`;
      }

      if (node.nodeType === Node.CDATA_SECTION_NODE) {
        return `${indent}<![CDATA[${node.nodeValue}]]>`;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        const serializedNode = serializer.serializeToString(node).trim();
        return serializedNode ? `${indent}${serializedNode}` : "";
      }

      const tagName = node.nodeName;
      const attrs = Array.from(node.attributes || [])
        .map((attr) => `${attr.name}="${attr.value}"`)
        .join(" ");
      const openTag = attrs ? `<${tagName} ${attrs}>` : `<${tagName}>`;

      const children = Array.from(node.childNodes || []).filter((child) => {
        return !(child.nodeType === Node.TEXT_NODE && !child.nodeValue.trim());
      });

      if (children.length === 0) {
        return attrs ? `${indent}<${tagName} ${attrs}/>` : `${indent}<${tagName}/>`;
      }

      if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE) {
        return `${indent}${openTag}${children[0].nodeValue.trim()}</${tagName}>`;
      }

      const formattedChildren = children
        .map((child) => formatNode(child, level + 1))
        .filter(Boolean)
        .join("\n");

      return `${indent}${openTag}\n${formattedChildren}\n${indent}</${tagName}>`;
    }

    return formatNode(xmlDoc.documentElement, 0);
  }

  function minifyXml(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");
    const parseError = xmlDoc.getElementsByTagName("parsererror");

    if (parseError.length > 0) {
      throw new Error("XML 格式不正确，请检查标签是否闭合。");
    }

    return new XMLSerializer().serializeToString(xmlDoc);
  }

  function collapseBeautifyOutput(code) {
    return code.replace(/[\r\n]+/g, "").trim();
  }

  const languageConfig = {
    javascript: {
      prism: "language-javascript",
      format: (code) => js_beautify(code, createBeautifyOptions()),
      minify: (code) => collapseBeautifyOutput(js_beautify(code, {
        ...createBeautifyOptions(),
        preserve_newlines: false,
        indent_size: 0,
      })),
    },
    css: {
      prism: "language-css",
      format: (code) => css_beautify(code, createBeautifyOptions()),
      minify: (code) => collapseBeautifyOutput(css_beautify(code, {
        ...createBeautifyOptions(),
        preserve_newlines: false,
        indent_size: 0,
      })),
    },
    html: {
      prism: "language-markup",
      format: (code) => html_beautify(code, createBeautifyOptions()),
      minify: (code) => collapseBeautifyOutput(html_beautify(code, {
        ...createBeautifyOptions(),
        preserve_newlines: false,
        indent_size: 0,
      }).replace(/>\s+</g, "><")),
    },
    json: {
      prism: "language-json",
      format: (code) => {
        const { indentSize, indentChar } = getIndentConfig();
        const indent = indentChar === "\t" ? "\t" : indentSize;
        return JSON.stringify(JSON.parse(code), null, indent);
      },
      minify: (code) => JSON.stringify(JSON.parse(code)),
    },
    sql: {
      prism: "language-sql",
      format: (code) => {
        const { indentSize, useTabs } = getIndentConfig();
        return sqlFormatter.format(code, {
          language: "sql",
          tabWidth: indentSize,
          useTabs,
          linesBetweenQueries: 1,
        });
      },
      minify: (code) => code.replace(/\s+/g, " ").trim(),
    },
    xml: {
      prism: "language-markup",
      format: (code) => {
        const { indentSize, indentChar } = getIndentConfig();
        return formatXml(code, indentChar, indentSize);
      },
      minify: (code) => minifyXml(code),
    },
    typescript: {
      prism: "language-typescript",
      format: (code) => js_beautify(code, createBeautifyOptions()),
      minify: (code) => collapseBeautifyOutput(js_beautify(code, {
        ...createBeautifyOptions(),
        preserve_newlines: false,
        indent_size: 0,
      })),
    },
  };

  function formatCode() {
    const code = inputCode.value;
    const language = languageSelect.value;

    if (!code.trim()) {
      setOutput("", language);
      return;
    }

    try {
      const formatter = languageConfig[language] && languageConfig[language].format;
      if (typeof formatter !== "function") {
        throw new Error("暂不支持该语言类型。");
      }

      setOutput(formatter(code), language);
    } catch (error) {
      showError(error);
    }
  }

  function minifyCode() {
    const code = inputCode.value;
    const language = languageSelect.value;

    if (!code.trim()) {
      setOutput("", language);
      return;
    }

    try {
      const minifier = languageConfig[language] && languageConfig[language].minify;
      if (typeof minifier !== "function") {
        throw new Error("暂不支持该语言类型。");
      }

      setOutput(minifier(code), language);
    } catch (error) {
      showError(error);
    }
  }

  async function copyToClipboard(text) {
    if (!text) {
      alert("暂无可复制内容");
      return false;
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
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
      return copied;
    } catch (error) {
      console.error("复制失败:", error);
      return false;
    }
  }

  function clearAll() {
    inputCode.value = "";
    setOutput("", languageSelect.value);
  }

  formatBtn.addEventListener("click", formatCode);
  minifyBtn.addEventListener("click", minifyCode);
  clearBtn.addEventListener("click", clearAll);

  copyOutputBtn.addEventListener("click", async function () {
    const success = await copyToClipboard(latestOutput);
    alert(success ? "复制成功" : "复制失败，请稍后重试");
  });

  copyInputBtn.addEventListener("click", function () {
    if (!latestOutput) {
      alert("暂无可复制内容");
      return;
    }

    inputCode.value = latestOutput;
    alert("已复制到输入框");
  });

  languageSelect.addEventListener("change", function () {
    if (inputCode.value.trim()) {
      formatCode();
      return;
    }

    setOutput("", languageSelect.value);
  });

  indentSelect.addEventListener("change", function () {
    if (inputCode.value.trim()) {
      formatCode();
    }
  });

  setOutput("", languageSelect.value);
});
