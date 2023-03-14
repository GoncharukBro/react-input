import { NumberFormatOptions, ResolvedNumberFormatOptions } from '../types';

interface TempResolved extends Partial<Intl.ResolvedNumberFormatOptions> {
  localeMatcher?: string;
  numberingSystem?: string;
  roundingIncrement?: number;
  roundingMode?:
    | 'ceil'
    | 'floor'
    | 'expand'
    | 'trunc'
    | 'halfCeil'
    | 'halfFloor'
    | 'halfExpand'
    | 'halfTrunc'
    | 'halfEven';
  roundingPriority?: 'auto' | 'morePrecision' | 'lessPrecision';
  trailingZeroDisplay?: 'auto' | 'stripIfInteger';
}

export default function resolveOptions(
  locales: string | string[] | undefined,
  options: NumberFormatOptions | undefined = {}
) {
  const { format, groupDisplay, maximumIntegerDigits = 21, ...current } = options;

  const resolved = Intl.NumberFormat(locales, {
    ...current,
    style: format,
    useGrouping: groupDisplay,
  }).resolvedOptions() as unknown as ResolvedNumberFormatOptions;

  resolved.format = (resolved as unknown as Intl.ResolvedNumberFormatOptions).style;
  resolved.groupDisplay = (resolved as unknown as Intl.ResolvedNumberFormatOptions).useGrouping;
  resolved.maximumIntegerDigits = maximumIntegerDigits;

  if (resolved.maximumIntegerDigits < resolved.minimumIntegerDigits) {
    resolved.maximumIntegerDigits = resolved.minimumIntegerDigits;
  }

  // Удаляем из `resolved` неиспользуемые свойства
  const tempResolved = resolved as unknown as TempResolved;

  delete tempResolved.style;
  delete tempResolved.currencySign;
  delete tempResolved.useGrouping;
  delete tempResolved.minimumSignificantDigits;
  delete tempResolved.maximumSignificantDigits;
  delete tempResolved.compactDisplay;
  delete tempResolved.notation;
  delete tempResolved.numberingSystem;
  delete tempResolved.localeMatcher;
  delete tempResolved.roundingIncrement;
  delete tempResolved.roundingMode;
  delete tempResolved.roundingPriority;
  delete tempResolved.trailingZeroDisplay;

  return { current: options, resolved };
}
