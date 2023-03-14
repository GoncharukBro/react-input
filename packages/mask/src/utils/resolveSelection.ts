import type { InputType } from '../core/types';

import type { MaskPart, Replacement } from '../types';

interface ResolveSelectionParam {
  inputType: InputType;
  added: string;
  beforeRange: string;
  afterRange: string;
  value: string;
  parts: MaskPart[];
  replacement: Replacement;
  separate: boolean;
}

/**
 * Определяет позицию курсора для последующей установки
 * @param param
 * @returns позиция курсора
 */
export default function resolveSelection({
  inputType,
  added,
  beforeRange,
  afterRange,
  value,
  parts,
  replacement,
  separate,
}: ResolveSelectionParam): number {
  const unmaskedChars = parts.filter(({ type }) => {
    return type === 'input' || (separate && type === 'replacement');
  });

  const addedLastIndex = unmaskedChars[beforeRange.length + added.length - 1]?.index;
  const beforeRangeLastIndex = unmaskedChars[beforeRange.length - 1]?.index;
  const afterRangeFirstIndex = unmaskedChars[beforeRange.length + added.length]?.index;

  if (inputType === 'insert') {
    if (addedLastIndex !== undefined) return addedLastIndex + 1;
    if (afterRangeFirstIndex !== undefined) return afterRangeFirstIndex;
    if (beforeRangeLastIndex !== undefined) return beforeRangeLastIndex + 1;
  }

  if (inputType === 'deleteForward') {
    if (afterRangeFirstIndex !== undefined) return afterRangeFirstIndex;
    if (beforeRangeLastIndex !== undefined) return beforeRangeLastIndex + 1;
  }

  if (inputType === 'deleteBackward') {
    if (beforeRangeLastIndex !== undefined) return beforeRangeLastIndex + 1;
    if (afterRangeFirstIndex !== undefined) return afterRangeFirstIndex;
  }

  // Находим первый индекс символа замены указанного в свойстве `replacement`
  const replacementCharIndex = value.split('').findIndex((char) => {
    return Object.prototype.hasOwnProperty.call(replacement, char);
  });

  return replacementCharIndex !== -1 ? replacementCharIndex : value.length;
}
