import type { MaskEventDetail, MaskPart, Replacement } from '../types';

/**
 * Формирует регулярное выражение для паттерна в `input`
 * @param disableReplacementKey если `true`, поиск по регулярному выражению не будет учитывать
 * ключ параметра `replacement`, то есть символ по индексу символа замены в значении может быть
 * любым символом соответствующим значению `replacement` кроме ключа самого `replacement`.
 *
 * Так, если `mask === 'abc_123'` и `replacement === { _: /\D/ }` то
 * - при `false`: `pattern === /^abc\D123$/` и `pattern.test('abc_123')` вернёт `true`;
 * - при `true`: `pattern === /^abc(?!_)\D123$/` и `pattern.test('abc_123')` вернёт `false`.
 * @param mask
 * @param replacement
 * @returns
 */
function generatePattern(
  disableReplacementKey: boolean,
  mask: string,
  replacement: Replacement
): string {
  const special = ['[', ']', '\\', '/', '^', '$', '.', '|', '?', '*', '+', '(', ')', '{', '}'];

  return mask.split('').reduce((prev, char, index, array) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, char);
    const lookahead = disableReplacementKey ? `(?!${char})` : '';

    const pattern = isReplacementKey
      ? lookahead + replacement[char].toString().slice(1, -1)
      : special.includes(char)
      ? `\\${char}`
      : char;

    const value = prev + pattern;
    return index + 1 === array.length ? `${value}$` : value;
  }, '^');
}

interface Options {
  mask: string;
  replacement: Replacement;
}

/**
 * Определяет части маскированного значения. Части маскированного значения представляет собой массив
 * объектов, где каждый объект содержит в себе всю необходимую информацию о каждом символе значения.
 * Части маскированного значения используется для точечного манипулирования символом или группой символов.
 * @param value
 * @param options
 * @returns
 */
function formatToParts(value: string, { mask, replacement }: Options): MaskPart[] {
  return value.split('').map((char, index) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, char);

    const type = isReplacementKey
      ? ('replacement' as const) // символ замены
      : char === mask[index]
      ? ('mask' as const) // символ маски
      : ('input' as const); // символ введенный пользователем

    return { type, value: char, index };
  });
}

/**
 * Маскирует значение по заданной маске
 * @param unmaskedValue
 * @param options
 * @returns
 */
function formatToMask(unmaskedValue: string, { mask, replacement }: Options): string {
  let position = 0;

  return mask.split('').reduce((prev, char) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, char);

    if (isReplacementKey && unmaskedValue[position] !== undefined) {
      return prev + unmaskedValue[position++];
    }

    return prev + char;
  }, '');
}

interface FormatOptions {
  mask: string;
  replacement: Replacement;
  showMask: boolean;
}

/**
 * Формирует данные маскированного значения
 * @param value пользовательские символы без учета символов маски
 * @param param
 * @param param.mask
 * @param param.replacement
 * @param param.showMask
 * @returns объект с данными маскированного значение
 */
export default function resolveDetail(
  value: string,
  { mask, replacement, showMask }: FormatOptions
): MaskEventDetail {
  let formattedValue = formatToMask(value, { mask, replacement });

  const parts = formatToParts(formattedValue, { mask, replacement });

  if (!showMask) {
    // Если пользователь не ввел ни одного символа, присваиваем пустую строку,
    // в противном случае, обрезаем значение по последний пользовательский символ
    if (parts.find(({ type }) => type === 'input') === undefined) {
      formattedValue = '';
    } else {
      const lastChangedChar = [...parts].reverse().find(({ type }) => type === 'input');
      const to = lastChangedChar !== undefined ? lastChangedChar.index + 1 : 0;
      formattedValue = formattedValue.slice(0, to);
    }
  }

  const pattern = generatePattern(false, mask, replacement);
  const patternWithDisableReplacementKey = generatePattern(true, mask, replacement);

  const isValid = RegExp(patternWithDisableReplacementKey).test(formattedValue);

  return { value: formattedValue, unmaskedValue: value, parts, pattern, isValid };
}
