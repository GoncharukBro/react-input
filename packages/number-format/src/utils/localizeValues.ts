import type { LocalizedNumberFormatValues } from '../types';

/**
 * Возвращает применяемые значения по заданной локали
 * @param locales
 * @returns
 */
export default function localizeValues(
  locales: string | string[] | undefined
): LocalizedNumberFormatValues {
  const parts = Intl.NumberFormat(locales, {
    useGrouping: true,
    minimumIntegerDigits: 10,
    minimumFractionDigits: 1,
    // minimumSignificantDigits: 10,
    // maximumSignificantDigits: 10,
  }).formatToParts(-1234567890.1);

  const group = parts.find(({ type }) => type === 'group')?.value;

  if (group === undefined) {
    throw new Error('The group is not defined.');
  }

  const minusSign = parts.find(({ type }) => type === 'minusSign')?.value;

  if (minusSign === undefined) {
    throw new Error('The minus sign is not defined.');
  }

  // При, например, арабской локали, минус устанавливается
  // справа от чисел, поэтому нам важно определить положение
  // минуса. Если минус расположен справа, то в `parts` на
  // первой позиции будет юникод `U+061C` (char code 1564)
  const signBackwards = parts[0].value === '؜' && parts[1].value === minusSign;

  // Получаем разделитель в заданной локали
  const decimal = parts.find(({ type }) => type === 'decimal')?.value;

  if (decimal === undefined) {
    throw new Error('The decimal separator is not defined.');
  }

  // Получаем все цифры в заданной локали (возможны варианты
  // с китайской десятичной системой или арабскими цифрами)
  let digits = parts.reduce(
    (prev, { type, value }) => (type === 'integer' ? prev + value : prev),
    ''
  );

  digits = digits[9] + digits.slice(0, -1);

  return { group, minusSign, signBackwards, decimal, digits };
}
