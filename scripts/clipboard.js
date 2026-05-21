(function () {
  'use strict';

  async function copyTextToClipboard(text) {
    const content = String(text ?? '');

    if (!content.trim()) {
      return false;
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(content);
        return true;
      } catch (error) {
        console.warn('navigator.clipboard.writeText failed, falling back to execCommand:', error);
      }
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.setAttribute('readonly', 'readonly');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      textarea.style.opacity = '0';

      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch (error) {
      console.error('copyTextToClipboard failed:', error);
      return false;
    }
  }

  window.copyTextToClipboard = copyTextToClipboard;
})();
