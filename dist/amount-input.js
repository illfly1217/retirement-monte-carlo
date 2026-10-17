// Keep the displayed separators out of the simulation and saved configuration.
export function amountInput(input, feedback) {
  const syntax = /^(?:\d+|\d{1,3}(?:,\d{3})+)$/;
  const min = Number(input.dataset.min), max = Number(input.dataset.max);
  const grouped = digits => digits.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  let previous = input.value;

  function read() {
    const text = input.value.trim();
    const value = syntax.test(text) ? Number(text.replaceAll(',', '')) : NaN;
    return Number.isSafeInteger(value) && value >= min && value <= max ? value : NaN;
  }

  function validate() {
    const text = input.value.trim();
    const message = !text ? '請輸入初始資產。'
      : !syntax.test(text) ? '請輸入整數金額，例如 30,000,000。'
      : !Number.isFinite(read()) ? `初始資產須介於 ${min.toLocaleString('en-US')} 與 ${max.toLocaleString('en-US')}。` : '';
    input.setCustomValidity(message);
    input.setAttribute('aria-invalid', String(!!message));
    if (feedback.textContent !== message) feedback.textContent = message;
    feedback.hidden = !message;
  }

  function format(event = {}) {
    if (event.isComposing) return;
    const text = input.value.trim();
    // Normal digit edits can temporarily disturb existing groups; pasted or
    // otherwise malformed grouping must still pass the strict syntax check.
    const digitEdit = event.inputType === 'insertText' && /^\d+$/.test(event.data || '');
    const deletion = event.inputType?.startsWith('delete');
    if (syntax.test(text) || (syntax.test(previous) && (digitEdit || deletion) && /^[\d,]+$/.test(text))) {
      const raw = input.value, digits = text.replaceAll(',', ''), formatted = grouped(digits);
      if (formatted !== raw) {
        const removed = digits.length - formatted.replaceAll(',', '').length;
        const caret = position => {
          const count = Math.max(0, raw.slice(0, position).replace(/\D/g, '').length - removed);
          let index = 0, seen = 0;
          while (index < formatted.length && seen < count) if (/\d/.test(formatted[index++])) seen++;
          return index;
        };
        const start = caret(input.selectionStart), end = caret(input.selectionEnd), direction = input.selectionDirection;
        input.value = formatted;
        input.setSelectionRange(start, end, direction);
      }
    }
    previous = input.value;
    validate();
  }

  input.addEventListener('beforeinput', event => {
    if (event.isComposing || !event.cancelable || !syntax.test(input.value)) return;
    const start = input.selectionStart, end = input.selectionEnd;
    if (start !== end) return;
    // Deleting beside a separator removes the adjacent digit, avoiding a
    // separator that is immediately reinserted and traps the caret.
    if (event.inputType === 'deleteContentBackward' && input.value[start - 1] === ',') {
      event.preventDefault();
      input.setRangeText('', start - 2, start, 'start');
    } else if (event.inputType === 'deleteContentForward' && input.value[start] === ',') {
      event.preventDefault();
      input.setRangeText('', start, start + 2, 'start');
    } else return;
    input.dispatchEvent(new InputEvent('input', {bubbles: true, inputType: event.inputType}));
  });
  input.addEventListener('input', format);
  input.addEventListener('compositionend', () => format());
  input.addEventListener('blur', () => format());
  format();

  return {read, write(value) {input.value = String(value ?? ''); format();}};
}
