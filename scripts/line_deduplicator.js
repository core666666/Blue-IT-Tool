(function () {
    "use strict";

    const SAMPLE_TEXT = [
        "example.com:1.1.1.1",
        "api.example.com:1.1.1.2",
        "cdn.example.com:1.1.1.3",
        "example.com:1.1.1.1",
        "test.example.org:8.8.8.8",
        "api.example.com:1.1.1.2",
        "EXAMPLE.com:1.1.1.1"
    ].join("\n");

    /**
     * 将输入文本拆分为行，并根据选项完成基础清洗。
     * 默认忽略空行，避免复制粘贴时的尾部换行影响统计。
     */
    function parseLines(text, options) {
        if (!text) {
            return [];
        }

        return text.split(/\r\n|\n|\r/).reduce((lines, rawLine) => {
            const value = options.trimLines ? rawLine.trim() : rawLine;

            if (options.ignoreBlankLines && value === "") {
                return lines;
            }

            lines.push(value);
            return lines;
        }, []);
    }

    /**
     * 按整行去重，并保留首次出现顺序。
     * ignoreCase 仅影响比较键，不改变最终输出内容。
     */
    function deduplicateLines(text, options) {
        const lines = parseLines(text, options);
        const seen = new Set();
        const uniqueLines = [];

        lines.forEach((line) => {
            const key = options.ignoreCase ? line.toLocaleLowerCase() : line;

            if (seen.has(key)) {
                return;
            }

            seen.add(key);
            uniqueLines.push(line);
        });

        return {
            total: lines.length,
            duplicate: lines.length - uniqueLines.length,
            unique: uniqueLines.length,
            result: uniqueLines.join("\n")
        };
    }

    function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
        }

        return fallbackCopy(text);
    }

    function fallbackCopy(text) {
        return new Promise((resolve, reject) => {
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.setAttribute("readonly", "");
            textarea.style.position = "fixed";
            textarea.style.left = "-9999px";
            textarea.style.top = "0";
            document.body.appendChild(textarea);
            textarea.select();

            try {
                const success = document.execCommand("copy");
                document.body.removeChild(textarea);
                success ? resolve() : reject(new Error("浏览器拒绝复制操作"));
            } catch (error) {
                document.body.removeChild(textarea);
                reject(error);
            }
        });
    }

    // 暴露纯函数，便于后续单元测试或控制台验证。
    window.LineDeduplicatorUtils = {
        parseLines,
        deduplicateLines
    };

    document.addEventListener("DOMContentLoaded", function () {
        const sourceLines = document.getElementById("source-lines");
        const resultLines = document.getElementById("result-lines");
        const trimLines = document.getElementById("trim-lines");
        const ignoreBlankLines = document.getElementById("ignore-blank-lines");
        const ignoreCase = document.getElementById("ignore-case");
        const dedupeBtn = document.getElementById("dedupe-btn");
        const sampleBtn = document.getElementById("sample-btn");
        const clearBtn = document.getElementById("clear-btn");
        const copyResultBtn = document.getElementById("copy-result-btn");
        const copyStatus = document.getElementById("copy-status");
        const inputLineCount = document.getElementById("input-line-count");
        const totalCount = document.getElementById("total-count");
        const duplicateCount = document.getElementById("duplicate-count");
        const uniqueCount = document.getElementById("unique-count");

        if (!sourceLines || !resultLines) {
            return;
        }

        let updateTimer = null;
        let statusTimer = null;

        function getOptions() {
            return {
                trimLines: trimLines.checked,
                ignoreBlankLines: ignoreBlankLines.checked,
                ignoreCase: ignoreCase.checked
            };
        }

        function countRawLines(text) {
            return text ? text.split(/\r\n|\n|\r/).length : 0;
        }

        function showStatus(message, type) {
            if (!copyStatus) {
                return;
            }

            copyStatus.textContent = message;
            copyStatus.className = `copy-status ${type || ""}`.trim();

            if (statusTimer) {
                clearTimeout(statusTimer);
            }

            statusTimer = setTimeout(() => {
                copyStatus.textContent = "";
                copyStatus.className = "copy-status";
            }, 2200);
        }

        function updateResult() {
            const stats = deduplicateLines(sourceLines.value, getOptions());
            const rawCount = countRawLines(sourceLines.value);

            resultLines.value = stats.result;
            totalCount.textContent = String(stats.total);
            duplicateCount.textContent = String(stats.duplicate);
            uniqueCount.textContent = String(stats.unique);

            if (rawCount > stats.total) {
                inputLineCount.textContent = `${stats.total} 行有效 / ${rawCount} 行原始`;
            } else {
                inputLineCount.textContent = `${stats.total} 行`;
            }

            copyResultBtn.disabled = stats.unique === 0;
            return stats;
        }

        function scheduleUpdate() {
            if (updateTimer) {
                clearTimeout(updateTimer);
            }

            updateTimer = setTimeout(updateResult, 120);
        }

        sourceLines.addEventListener("input", scheduleUpdate);
        trimLines.addEventListener("change", updateResult);
        ignoreBlankLines.addEventListener("change", updateResult);
        ignoreCase.addEventListener("change", updateResult);
        dedupeBtn.addEventListener("click", updateResult);

        sampleBtn.addEventListener("click", function () {
            sourceLines.value = SAMPLE_TEXT;
            updateResult();
            sourceLines.focus();
        });

        clearBtn.addEventListener("click", function () {
            sourceLines.value = "";
            updateResult();
            sourceLines.focus();
            showStatus("已清空输入和结果", "success");
        });

        copyResultBtn.addEventListener("click", function () {
            const stats = updateResult();

            if (stats.unique === 0) {
                showStatus("暂无可复制的去重结果", "error");
                return;
            }

            copyText(resultLines.value)
                .then(() => showStatus(`已复制 ${stats.unique} 行去重结果`, "success"))
                .catch(() => showStatus("复制失败，请手动选择结果内容复制", "error"));
        });

        updateResult();
    });
})();
