import type { InputAttributes } from '../types';

export interface SyntheticChangeError {
  cause?: { __attributes?: Partial<InputAttributes> };
}

/**
 * Кастомная ошибка обрабатывается в хуке `useInput` с возможностью
 * передать аттрибуты для установки в `input` элемент.
 */
// eslint-disable-next-line no-redeclare
export class SyntheticChangeError extends Error {
  constructor(message: string, cause?: SyntheticChangeError['cause']) {
    super(message);
    this.name = this.constructor.name;
    this.cause = cause;
  }
}
