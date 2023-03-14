import { Replacement } from '../types';

interface FilterParam {
  value: string;
  replacementChars: string;
  replacement: Replacement;
  separate: boolean;
}

/**
 * Фильтруем символы для соответствия значениям `replacement`
 * @param param
 * @returns
 */
export default function filter({
  value,
  replacementChars,
  replacement,
  separate,
}: FilterParam): string {
  let __replacementChars = replacementChars;

  return value.split('').reduce((prev, char) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, char);
    const isValidChar = !isReplacementKey && replacement[__replacementChars[0]]?.test(char);

    if ((separate ? char === __replacementChars[0] : false) || isValidChar) {
      __replacementChars = __replacementChars.slice(1);
      return prev + char;
    }

    return prev;
  }, '');
}
