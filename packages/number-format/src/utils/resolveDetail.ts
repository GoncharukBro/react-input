import type { InputType } from '../core/types';

import type {
  LocalizedNumberFormatValues,
  NumberFormatOptions,
  ResolvedNumberFormatOptions,
} from '../types';

import resolveMinimumFractionDigits from './resolveMinimumFractionDigits';

interface Options {
  inputType: InputType;
  locales: string | string[] | undefined;
  localizedValues: LocalizedNumberFormatValues;
  currentOptions: NumberFormatOptions | undefined;
  resolvedOptions: ResolvedNumberFormatOptions;
}

/**
 *
 * @param value
 * @param options
 * @returns
 */
export default function resolveDetail(
  value: string,
  { inputType, locales, localizedValues, currentOptions, resolvedOptions }: Options
) {
  if (
    (inputType === 'deleteBackward' || inputType === 'deleteForward') &&
    (value === '' || value === '-' || /^-?\.?0*$/.test(value))
  ) {
    return { value: '', parts: [], number: 0 };
  }

  const isNegative = value[0] === '-';
  const absValue = isNegative ? value.slice(1) : value;

  // При `fraction` равном `undefined` - разделитель не был введён
  let [integer, fraction = undefined] = absValue.split('.');

  // Определяем настройки для применения в `Intl.NumberFormat`
  let currentMinimumFractionDigits = resolvedOptions.minimumFractionDigits as number | undefined;
  const currentMaximumFractionDigits = resolvedOptions.maximumFractionDigits;
  // let currentMinimumSignificantDigits = resolvedOptions.minimumSignificantDigits;

  // Поскольку состояние ввода хранит последний введенный символ,
  // при форматировании может произойти округление, поэтому нам важно
  // заранее обрезать символ не соответствующий максимальному количеству символов

  // - `replace` - Учитываем `minimumSignificantDigits` и `minimumIntegerDigits`.
  // Так, при `added` "2": "000 001" -> "000 0012" -> "12" -> "000 012"
  integer = integer.replace(/^0+/g, '').slice(0, resolvedOptions.maximumIntegerDigits);

  // if (fraction !== undefined && resolvedOptions.maximumSignificantDigits !== undefined) {
  //   currentMaximumFractionDigits = resolvedOptions.maximumSignificantDigits - integer.length;

  //   if (/^0*$/.test(integer) && /^0*$/.test(fraction)) {
  //     currentMaximumFractionDigits -= 1;
  //   } else if (/^0*$/.test(integer) && /^0*[1-9]+/.test(fraction)) {
  //     currentMaximumFractionDigits += fraction.match(/^0+/g)?.[0].length ?? 0;
  //   }
  // }

  fraction = fraction?.slice(0, currentMaximumFractionDigits);

  const number = Number(
    (isNegative ? '-' : '') + (integer || '0') + (fraction ? `.${fraction}` : '')
  );

  // Чтобы иметь возможность прописывать "0" и сохранять его с каждой итерацией,
  // переопределяем `minimumFractionDigits` и `minimumSignificantDigits`

  currentMinimumFractionDigits = resolveMinimumFractionDigits({
    integer,
    fraction: fraction ?? '',
    resolvedOptions,
  });

  // Если `currentMinimumFractionDigits` равен нулю, дробная часть будет округлена
  if (
    inputType === 'insert' &&
    fraction === '' &&
    currentMinimumFractionDigits === 0 &&
    currentMaximumFractionDigits > 0
  ) {
    currentMinimumFractionDigits = 1;

    // if (currentMinimumSignificantDigits !== undefined) {
    //   currentMinimumSignificantDigits = (integer.length || 1) + 1;
    // }
  }

  if (fraction !== undefined && fraction.length > currentMinimumFractionDigits) {
    currentMinimumFractionDigits = fraction.length;

    // `minimumFractionDigits` игнорируется при указанном `minimumSignificantDigits` или
    // `maximumSignificantDigits`, поэтому указываем правило для `minimumSignificantDigits`
    // if (currentMinimumSignificantDigits !== undefined) {
    //   if (/^0*$/.test(integer) && /^0*$/.test(fraction)) {
    //     currentMinimumSignificantDigits = fraction.length + 1;
    //   } else if (/^0*$/.test(integer) && /^0*[1-9]+/.test(fraction)) {
    //     currentMinimumSignificantDigits = fraction.replace(/^0+/g, '').length;
    //   } else if (/^0*[1-9]+/.test(integer)) {
    //     currentMinimumSignificantDigits = integer.length + fraction.length;
    //   }
    // }
  }

  // eslint-disable-next-line no-unused-vars
  const { format, groupDisplay, maximumIntegerDigits, ...options } = currentOptions ?? {};

  const numberFormat = Intl.NumberFormat(locales, {
    ...options,
    style: format,
    useGrouping: groupDisplay,
    minimumFractionDigits: currentMinimumFractionDigits,
    // minimumSignificantDigits: currentMinimumSignificantDigits,
  });

  let nextValue = numberFormat.format(number);
  let nextParts = numberFormat.formatToParts(number);

  const sign = nextParts.find((part) => part.type === 'plusSign' || part.type === 'minusSign');

  // Арабская локаль содержит юникод, что приводит к неожидаемому
  // сдвигу курсора при смещении через клавиатуру, для предотвращения
  // устанавливаем знак в конец числа с удалением нежелательного юникода
  if (sign !== undefined && localizedValues.signBackwards) {
    nextValue = nextValue.replace(RegExp(`[؜${sign.value}]`, 'g'), '');
    nextParts = nextParts.filter((part) => part.value !== '؜' && part.type !== sign.type);

    const lastDigitIndex = nextValue.search(
      RegExp(`[${localizedValues.digits}](?!.*[${localizedValues.digits}])`)
    );

    if (lastDigitIndex !== -1) {
      nextValue =
        nextValue.slice(0, lastDigitIndex + 1) + sign.value + nextValue.slice(lastDigitIndex + 1);

      nextParts.splice(lastDigitIndex + 1, 0, sign);

      if (nextValue[0] !== '‏') {
        nextValue = `‏${nextValue}`;
      }

      if (nextParts[0].value !== '‏') {
        nextParts = [{ type: 'literal', value: '‏' }, ...nextParts];
      }
    }
  }

  return { value: nextValue, parts: nextParts, number };
}
