import type { InputType } from '../core/types';

import type { LocalizedNumberFormatValues, ResolvedNumberFormatOptions } from '../types';

interface ResolveSelectionParam {
  previousLocalizedValues: LocalizedNumberFormatValues;
  localizedValues: LocalizedNumberFormatValues;
  resolvedOptions: ResolvedNumberFormatOptions;
  inputType: InputType;
  added: string;
  previousValue: string;
  nextValue: string;
  selectionStartRange: number;
  selectionEndRange: number;
}

interface ResolveSelectionReturn {
  start: number;
  end: number;
}

/**
 * Определяет позицию каретки для последующей установки
 * @param param
 * @returns
 */
export default function resolveSelection({
  previousLocalizedValues,
  localizedValues,
  resolvedOptions,
  inputType,
  added,
  previousValue,
  nextValue,
  selectionStartRange,
  selectionEndRange,
}: ResolveSelectionParam): ResolveSelectionReturn {
  if (
    RegExp(`^[.,${localizedValues.decimal}]$`, 'g').test(added) &&
    previousValue.includes(localizedValues.decimal)
  ) {
    const decimalIndex = nextValue.indexOf(localizedValues.decimal);

    if (decimalIndex !== -1) {
      const position = decimalIndex + 1;
      return { start: position, end: position };
    }
  }

  if (
    RegExp(`^[\\-\\${localizedValues.minusSign}]$`, 'g').test(added) &&
    previousValue.includes(localizedValues.minusSign)
  ) {
    const minusSignIndex = nextValue.indexOf(localizedValues.minusSign);
    if (minusSignIndex !== -1) {
      const position = minusSignIndex + (localizedValues.signBackwards ? 0 : 1);
      return { start: position, end: position };
    }
  }

  // При стирании значения в `integer`, при условии что `integer` равен нулю,
  // необходимо выделить все нули для последующего удаления `integer`. Такое
  // поведение оправдано в случае если `minimumIntegerDigits` больше чем 1
  if (inputType === 'deleteBackward' || inputType === 'deleteForward') {
    const [previousValueBeforeDecimal] = previousValue.split(previousLocalizedValues.decimal);

    if (
      selectionEndRange <= previousValueBeforeDecimal.length &&
      !RegExp(`[${previousLocalizedValues.digits.slice(1)}]`).test(previousValueBeforeDecimal)
    ) {
      const firstPreviousIntegerDigitIndex = previousValueBeforeDecimal.indexOf(
        previousLocalizedValues.digits[0]
      );
      const lastPreviousIntegerDigitIndex = previousValueBeforeDecimal.lastIndexOf(
        previousLocalizedValues.digits[0]
      );

      const hasPreviousIntegerDigitIndex =
        firstPreviousIntegerDigitIndex !== -1 && lastPreviousIntegerDigitIndex !== -1;

      // Нам не нужно повторно сохранять выделение
      const hasSelection =
        selectionStartRange === firstPreviousIntegerDigitIndex &&
        selectionEndRange === lastPreviousIntegerDigitIndex + 1;

      if (
        hasPreviousIntegerDigitIndex &&
        !hasSelection &&
        selectionEndRange > firstPreviousIntegerDigitIndex &&
        selectionEndRange <= lastPreviousIntegerDigitIndex + 1
      ) {
        return { start: firstPreviousIntegerDigitIndex, end: lastPreviousIntegerDigitIndex + 1 };
      }
    }
  }

  let selection = nextValue.length;

  // Поскольку длина значения способна меняться, за счёт добавления/удаления
  // символов разрядности, гарантированным способом получить точную позицию
  // каретки, в рамках изменения значения при добавлении/удалении значения,
  // будет подсчёт количества цифр до выделенной области изменения (до `selectionStartRange`).

  // Находим символы "устойчивого" числа до `selectionStartRange` (не учитывая
  // нули от начала значения до первой цифры не равной нулю в `integer`)
  let countStableDigits = (() => {
    const p$0 = `([${previousLocalizedValues.digits.slice(1)}].*`;
    const p$1 = `(?<=[${previousLocalizedValues.decimal}].*)[${
      previousLocalizedValues.digits
    }]+)(?=.{${previousValue.length - selectionStartRange}})`;

    const match = previousValue.match(RegExp(`${p$0}|${p$1}`, 'g'))?.[0] ?? '';

    return match.replace(RegExp(`[^${previousLocalizedValues.digits}]`, 'g'), '').length;
  })();

  // Важно учесть добавленные символы, в противном
  // случае позиция каретки не будет сдвигаться
  if (inputType === 'insert') {
    const previousValueBeforeSelectionStartRange = previousValue.slice(0, selectionStartRange);

    // eslint-disable-next-line prefer-const
    let [previousInteger, previousFraction = ''] = previousValueBeforeSelectionStartRange
      .replace(
        RegExp(`[^${previousLocalizedValues.decimal}${previousLocalizedValues.digits}]`, 'g'),
        ''
      )
      .replace(RegExp(`^${previousLocalizedValues.digits[0]}+`, 'g'), '')
      .split(previousLocalizedValues.decimal);

    const regExp$0 = RegExp(`[^\\d${localizedValues.digits}]+`, 'g');
    const previousDecimalIndex = previousValue.indexOf(previousLocalizedValues.decimal);

    let absAdded = added
      .replace(RegExp(`[\\-\\${localizedValues.minusSign}]`, 'g'), '')
      .replace(RegExp(`[,${localizedValues.decimal}]`, 'g'), '.');

    // Поскольку десятичный разделитель не может находиться
    // перед имеющимся разделителем, нам важно удалить его
    if (previousDecimalIndex !== -1 && selectionEndRange <= previousDecimalIndex) {
      absAdded = absAdded.replace(regExp$0, '');
    }

    let [addedInteger, addedFraction = ''] = absAdded.split('.');

    if (previousDecimalIndex !== -1 && selectionStartRange > previousDecimalIndex) {
      if (absAdded.includes('.')) {
        const joinedPreviousInteger = previousInteger + previousFraction;

        if (joinedPreviousInteger.length > resolvedOptions.maximumIntegerDigits) {
          countStableDigits = resolvedOptions.maximumIntegerDigits;
          previousInteger = joinedPreviousInteger.slice(0, resolvedOptions.maximumIntegerDigits);
        }
      } else {
        addedFraction = addedInteger;
        addedInteger = '';
      }
    }

    const p$0 = `[${previousLocalizedValues.decimal}${previousLocalizedValues.digits.slice(1)}]`;

    if (!RegExp(p$0).test(previousValueBeforeSelectionStartRange)) {
      const p$1 = `^[0${previousLocalizedValues.digits[0]}]+`;
      addedInteger = addedInteger.replace(RegExp(p$1, 'g'), '');
    }

    const normalizedAdded =
      addedInteger.slice(0, resolvedOptions.maximumIntegerDigits - previousInteger.length) +
      addedFraction;

    countStableDigits += normalizedAdded.replace(regExp$0, '').length;
  }

  // Вычисляем первоначальную позицию каретки по индексу отформатированного
  // значения путём подсчёта количества цифр "устойчивого" числа, где:
  // `start` - начало "устойчивого" числа (не учитывая нули от начала
  // значения до первой цифры не равной нулю в `integer`)
  // `countDigits` - количество найденных символов после начала "устойчивого" числа\
  // Порядок инструкций имеет значение!
  for (let i = 0, start = false, countDigits = 0; i < nextValue.length; i++) {
    if (
      !start &&
      (localizedValues.decimal === nextValue[i] ||
        localizedValues.digits.slice(1).includes(nextValue[i]))
    ) {
      start = true;
    }

    if (start && countDigits >= countStableDigits) {
      selection = i;
      break;
    }

    if (start && localizedValues.digits.includes(nextValue[i])) {
      countDigits += 1;
    }
  }

  // Сдвигаем каретку к ближайшей цифре
  if (inputType === 'deleteForward') {
    const p$0 = `^.{${selection}}[^${localizedValues.digits}]*[\\${localizedValues.minusSign}${localizedValues.digits}]`;
    const nextDigitIndex = nextValue.match(RegExp(p$0))?.[0].length;

    if (nextDigitIndex !== undefined) {
      selection = nextDigitIndex - 1;
    }
  } else {
    // При `deleteBackward` нам важно поставить каретку после знака минуса, если такой существует
    const p$0 = `[${inputType === 'deleteBackward' ? `\\${localizedValues.minusSign}` : ''}${
      localizedValues.digits
    }][^${localizedValues.digits}]*.{${nextValue.length - selection}}$`;
    const previousDigitIndex = nextValue.match(RegExp(p$0))?.index;

    if (previousDigitIndex !== undefined) {
      selection = previousDigitIndex + 1;
    }

    if (
      nextValue[selection] === localizedValues.decimal &&
      RegExp(`[.,${localizedValues.decimal}]`).test(added.at(-1) ?? '')
    ) {
      selection += 1;
    }
  }

  // Страхуем границы позиции каретки
  {
    const p$0 = `[\\${localizedValues.minusSign}${
      localizedValues.decimal
    }${localizedValues.digits.slice(1)}]`;
    const p$1 = `[\\${localizedValues.minusSign}${localizedValues.digits}][^${localizedValues.digits}]*$`;

    const firstStableDigitIndex = nextValue.search(RegExp(p$0));
    const lastDigitIndex = nextValue.search(RegExp(p$1));

    if (firstStableDigitIndex !== -1 && selection < firstStableDigitIndex) {
      selection = firstStableDigitIndex;
    } else if (lastDigitIndex !== -1 && selection > lastDigitIndex + 1) {
      selection = lastDigitIndex + 1;
    }
  }

  return { start: selection, end: selection };
}
