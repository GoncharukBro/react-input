import { useEffect } from 'react';

import resolveOptions from './utils/resolveOptions';

import type { NumberFormatOptions } from './types';

interface UseErrorParam {
  locales: string | string[] | undefined;
  options: NumberFormatOptions | undefined;
}

/**
 * Выводит в консоль сообщения об ошибках. Сообщения
 * выводятся один раз при монтировании компонента
 * @param param
 */
export default function useError({ locales, options }: UseErrorParam) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    const { current, resolved } = resolveOptions(locales, options);

    const invalidType =
      typeof current.maximumIntegerDigits !== 'number' &&
      typeof current.maximumIntegerDigits !== 'undefined';

    const invalidRange =
      typeof current.maximumIntegerDigits === 'number' &&
      current.maximumIntegerDigits < resolved.minimumIntegerDigits;

    if (invalidType || invalidRange) {
      throw new RangeError('maximumIntegerDigits value is out of range.');
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
