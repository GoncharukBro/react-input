import { useCallback, useRef } from 'react';

import { SyntheticChangeError } from './core/errors/SyntheticChangeError';
import useInput from './core/hooks/useInput';
import type { Init, Tracking } from './core/types';

import localizeValues from './utils/localizeValues';
import resolveDetail from './utils/resolveDetail';
import resolveMinimumFractionDigits from './utils/resolveMinimumFractionDigits';
import resolveOptions from './utils/resolveOptions';
import resolveSelection from './utils/resolveSelection';

import type { NumberFormatEventDetail, NumberFormatOptions, NumberFormatProps } from './types';

import useError from './useError';

interface CachedNumberFormatProps {
  locales: NumberFormatProps['locales'];
  options: NumberFormatOptions;
}

interface Cache {
  value: string;
  props: CachedNumberFormatProps;
  fallbackProps: CachedNumberFormatProps;
}

export default function useNumberFormat(
  props?: NumberFormatProps
): React.MutableRefObject<HTMLInputElement | null> {
  const {
    locales,
    format,
    currency,
    currencyDisplay,
    unit,
    unitDisplay,
    signDisplay,
    groupDisplay,
    minimumIntegerDigits,
    maximumIntegerDigits,
    minimumFractionDigits,
    maximumFractionDigits,
    // minimumSignificantDigits,
    // maximumSignificantDigits,
    onNumberFormat,
  } = props ?? {};

  const options = {
    format,
    currency,
    currencyDisplay,
    unit,
    unitDisplay,
    signDisplay,
    groupDisplay,
    minimumIntegerDigits,
    maximumIntegerDigits,
    minimumFractionDigits,
    maximumFractionDigits,
    // minimumSignificantDigits,
    // maximumSignificantDigits,
  };

  const cache = useRef<Cache | null>(null);

  // Преобразовываем в строку для сравнения с зависимостью в `useCallback`
  const stringifiedLocales = JSON.stringify(locales);
  const stringifiedOptions = JSON.stringify(options);

  /**
   *
   * Init
   *
   */

  const init = useCallback<Init>(({ initialValue }) => {
    const cachedProps = { locales, options };
    cache.current = { value: initialValue, props: cachedProps, fallbackProps: cachedProps };

    return { value: initialValue };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   *
   * Tracking
   *
   */

  const tracking = useCallback<Tracking<NumberFormatEventDetail>>(
    ({ inputType, added, previousValue, selectionStartRange, selectionEndRange, value }) => {
      if (cache.current === null) {
        throw new SyntheticChangeError('The state has not been initialized.');
      }

      // Предыдущее значение всегда должно соответствовать маскированному значению из кэша. Обратная ситуация может
      // возникнуть при контроле значения, если значение не было изменено после ввода. Для предотвращения подобных
      // ситуаций, нам важно синхронизировать предыдущее значение с кэшированным значением, если они различаются
      if (cache.current.value !== previousValue) {
        cache.current.props = cache.current.fallbackProps;
      } else {
        cache.current.fallbackProps = cache.current.props;
      }

      const previousLocalizedValues = localizeValues(cache.current.props.locales);
      const localizedValues = localizeValues(locales);
      const { current, resolved } = resolveOptions(locales, options);

      // Регулярное выражение с поиском неразрешённых символов
      const regExp$0 = (() => {
        const p$0 = `[^\\-\\${localizedValues.minusSign}.,${localizedValues.decimal}\\d${localizedValues.digits}]`;
        const p$1 = `[.,${localizedValues.decimal}](?=.*[.,${localizedValues.decimal}])`;
        const p$2 = `[\\-\\${localizedValues.minusSign}](?=.*[\\-\\${localizedValues.minusSign}\\d${localizedValues.digits}])`;
        const p$3 = `(?<=[\\-\\${localizedValues.minusSign}\\d${localizedValues.digits}].*)[\\-\\${localizedValues.minusSign}]`;

        // \((?!.*[)\d])|(?<=[(\d].*)\(|(?<![(\d].*)\)|\)(?=.*[).\d]) // `accounting`

        const pattern = `${p$0}|${p$1}|${localizedValues.signBackwards ? p$2 : p$3}`;

        return RegExp(pattern, 'g');
      })();

      // eslint-disable-next-line no-param-reassign
      added = added.replace(regExp$0, '');

      if (inputType === 'insert' && !added) {
        throw new SyntheticChangeError('The added value does not contain allowed characters.');
      }

      const regExp$1 = RegExp(
        `[^\\${previousLocalizedValues.minusSign}${previousLocalizedValues.decimal}${previousLocalizedValues.digits}]`,
        'g'
      );

      // Нам важно удалить ненужные символы перед преобразованием в число, так
      // как символ группы и символ десятичного разделителя могут пересекаться
      const before = previousValue.slice(0, selectionStartRange).replace(regExp$1, '');
      const after = previousValue.slice(selectionEndRange).replace(regExp$1, '');

      let normalizedValue = before + added + after;

      // Фильтруем значение для преобразование в число
      normalizedValue = normalizedValue
        .replace(regExp$0, '')
        // Нормализуем десятичный разделитель
        .replace(RegExp(`[,${localizedValues.decimal}]`, 'g'), '.')
        // Нормализуем знак минуса
        .replace(RegExp(localizedValues.minusSign, 'g'), '-')
        // Нормализуем цифры
        .replace(RegExp(`[${localizedValues.digits}]`, 'g'), (localeDigit) => {
          const digit = localizedValues.digits.indexOf(localeDigit);
          return digit !== -1 ? digit.toString() : localeDigit;
        });

      // В случае ввода знака минуса нам нужно его удалить если
      // оно присутствует, в противном случае добавить, тем самым
      // создав автоматическую вставку при любой позиции каретки
      {
        const isReflectMinusSign =
          RegExp(`^[\\-\\${localizedValues.minusSign}]$`).test(added) &&
          selectionStartRange === selectionEndRange;

        const hasPreviousValueMinusSign = previousValue.includes(previousLocalizedValues.minusSign);
        const hasNormalizedValueMinusSign = normalizedValue.includes('-');

        if (isReflectMinusSign && hasPreviousValueMinusSign && hasNormalizedValueMinusSign) {
          normalizedValue = normalizedValue.replace('-', '');
        }
        if (isReflectMinusSign && !hasPreviousValueMinusSign && !hasNormalizedValueMinusSign) {
          normalizedValue = `-${normalizedValue}`;
        }
      }

      // Для нормализации значения, ставим минус слева.
      // В случае арабской локали он может находиться справа
      if (normalizedValue.at(-1) === '-') {
        normalizedValue = `-${normalizedValue.slice(0, -1)}`;
      }

      // Если изменения происходят в области `minimumFractionDigits`, очищаем дробную часть
      // для замены значения, чтобы заменить "0" на вводимое значение,
      // например, при вводе "1", получим "0.00" -> "0.1" -> "0.10" (не "0.100")
      if (/\..*0$/.test(normalizedValue)) {
        const previousMatchedFraction = RegExp(
          `(?<=[${previousLocalizedValues.decimal}].*)[${previousLocalizedValues.digits}]+`
        ).exec(previousValue);

        if (previousMatchedFraction !== null) {
          const p$0 = `(?<![${previousLocalizedValues.decimal}].*)[^${previousLocalizedValues.digits}]+|(?<=[${previousLocalizedValues.decimal}].*).+`;

          const previousMinimumFractionDigits = resolveMinimumFractionDigits({
            integer: previousValue.replace(RegExp(p$0, 'g'), ''),
            fraction: previousMatchedFraction[0],
            resolvedOptions: resolveOptions(
              cache.current.props.locales,
              cache.current.props.options
            ).resolved,
          });

          // Если изменения происходят в области `minimumFractionDigits`
          const isRange =
            selectionStartRange >= previousMatchedFraction.index &&
            selectionEndRange <
              previousMatchedFraction.index + (previousMinimumFractionDigits || 1);

          if (
            isRange &&
            previousMatchedFraction[0].length <= (previousMinimumFractionDigits || 1)
          ) {
            normalizedValue = normalizedValue.replace(/0+$/g, '');
          }
        }
      }

      const detail = resolveDetail(normalizedValue, {
        inputType,
        locales,
        localizedValues,
        currentOptions: current,
        resolvedOptions: resolved,
      });

      const selection = resolveSelection({
        previousLocalizedValues,
        localizedValues,
        resolvedOptions: resolved,
        inputType,
        added,
        previousValue,
        nextValue: detail.value,
        selectionStartRange,
        selectionEndRange,
      });

      cache.current.value = detail.value;
      cache.current.props = { locales, options };

      return {
        value: detail.value,
        selectionStart: selection.start,
        selectionEnd: selection.end,
        __detail: detail,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stringifiedLocales, stringifiedOptions]
  );

  /**
   *
   * Use input
   *
   */

  const inputRef = useInput<NumberFormatEventDetail>({
    init,
    tracking,
    customInputEventType: 'input-number-format',
    customInputEventHandler: onNumberFormat,
  });

  useError({ locales, options });

  return inputRef;
}
