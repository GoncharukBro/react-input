import type { InputAttributes } from '../types';

export default function setInputAttributes(
  inputElement: HTMLInputElement,
  { value, selectionStart, selectionEnd }: Partial<InputAttributes>
) {
  // Важно установить позицию курсора после установки значения,
  // так как после установки значения, курсор автоматически уходит в конец значения

  if (value !== undefined) {
    // eslint-disable-next-line no-param-reassign
    inputElement.value = value;
  }

  if (selectionStart !== undefined && selectionEnd !== undefined) {
    inputElement.setSelectionRange(selectionStart, selectionEnd);
  }
}
