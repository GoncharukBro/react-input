import { useEffect } from 'react';

import type { ExtendedHTMLInputElement } from './core/types';

import type { Replacement } from './types';

const createError = (firstString: string, secondString: string) => {
  const message = `${firstString}

${secondString}
`;

  return new Error(message);
};

interface UseErrorParam {
  inputRef: React.MutableRefObject<ExtendedHTMLInputElement | null>;
  mask: string;
  replacement: Replacement;
}

/**
 * Выводит в консоль сообщения об ошибках. Сообщения
 * выводятся один раз при монтировании компонента
 * @param param
 */
export default function useError({ inputRef, mask, replacement }: UseErrorParam) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    // Валидируем длину инициализируемого значения

    const initialValue = inputRef.current?._wrapperState?.initialValue ?? '';

    if (initialValue.length > mask.length) {
      // eslint-disable-next-line no-console
      console.error(
        createError(
          'The initialized value of the `value` or `defaultValue` property is longer than the value specified in the `mask` property. Check the correctness of the initialized value in the specified property.',
          `Invalid value: "${initialValue}".`
        )
      );
    }

    // Валидируем длину ключей `replacement`

    const invalidReplacementKeys = Object.keys(replacement).filter((key) => key.length > 1);

    if (invalidReplacementKeys.length > 0) {
      // eslint-disable-next-line no-console
      console.error(
        createError(
          `Object keys in the \`replacement\` property are longer than one character. Replacement keys must be one character long. Check the correctness of the value in the specified property.`,
          `Invalid keys: ${invalidReplacementKeys.join(', ')}.`
        )
      );
    }

    // Валидируем символы

    const invalidCharIndex = mask
      .slice(0, initialValue.length)
      .split('')
      .findIndex((char, index) => {
        const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, char);
        const hasInvalidChar = char !== initialValue[index];

        if (isReplacementKey) {
          return hasInvalidChar ? !replacement[char].test(initialValue[index]) : false;
        }

        return hasInvalidChar;
      });

    if (invalidCharIndex !== -1) {
      // eslint-disable-next-line no-console
      console.error(
        createError(
          `An invalid character was found in the initialized property value \`value\` or \`defaultValue\` (index: ${invalidCharIndex}). Check the correctness of the initialized value in the specified property.`,
          `Invalid value: "${initialValue}".`
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
