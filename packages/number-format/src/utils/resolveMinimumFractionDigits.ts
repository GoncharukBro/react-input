import { ResolvedNumberFormatOptions } from '../types';

interface ResolveMinimumFractionDigitsParam {
  integer: string;
  fraction: string;
  resolvedOptions: ResolvedNumberFormatOptions;
}

/**
 * Высчитываем фактический `minimumFractionDigits`
 * @param param
 * @returns
 */
export default function resolveMinimumFractionDigits({
  integer,
  fraction,
  resolvedOptions,
}: ResolveMinimumFractionDigitsParam) {
  const { minimumFractionDigits = 0 } = resolvedOptions;

  // if (resolvedOptions.minimumSignificantDigits !== undefined) {
  //   minimumFractionDigits =
  //     resolvedOptions.minimumSignificantDigits - integer.replace(/^0+/g, '').length;

  //   if (/^0*$/.test(integer)) {
  //     if (/^0*$/.test(fraction)) {
  //       minimumFractionDigits -= 1;
  //     } else if (/^0*[1-9]+/.test(fraction)) {
  //       minimumFractionDigits += fraction.match(/^0+/g)?.[0].length ?? 0;
  //     }
  //   }
  // }

  return minimumFractionDigits < 0 ? 0 : minimumFractionDigits;
}
