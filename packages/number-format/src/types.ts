import type { CustomInputEvent, CustomInputEventHandler } from './core/types';

export interface NumberFormatEventDetail {
  value: string;
  parts: Intl.NumberFormatPart[];
  number: number;
}

export type NumberFormatEvent = CustomInputEvent<NumberFormatEventDetail>;

export type NumberFormatEventHandler = CustomInputEventHandler<NumberFormatEventDetail>;

/** 
  ES5
  - `style`?: "decimal" | "currency" | "percent" | "unit";
  - `currency`?: string;
  - `useGrouping`?: boolean; (changed on `groupDisplay`)
  - `minimumIntegerDigits`?: number;
  - `minimumFractionDigits`?: number;
  - `maximumFractionDigits`?: number;
  
  ES2020
  - `signDisplay`?: "auto" | "negative" | "never" | "always" | "exceptZero";
  - `unit`?: string;
  - `unitDisplay`?: "short" | "long" | "narrow";
  - `currencyDisplay`?: "symbol" | "narrowSymbol" | "code" | "name";

  ES5 **excluded**
  - `localeMatcher`?: string;
  - `currencySign`?: "standard" | "accounting";
  - `minimumSignificantDigits`?: number;
  - `maximumSignificantDigits`?: number;

  ES2020 **excluded**
  - `compactDisplay`?: "short" | "long";
  - `notation`?: "standard" | "scientific" | "engineering" | "compact";
  - `numberingSystem`?: string;
  - `roundingIncrement`?: number;
  - `roundingMode`?: "ceil" | "floor" | "expand" | "trunc" | "halfCeil" | "halfFloor" | "halfExpand" | "halfTrunc" | "halfEven";
  - `roundingPriority`?: "auto" | "morePrecision" | "lessPrecision";
  - `trailingZeroDisplay`?: "auto" | "stripIfInteger";
 */
type ResolveOptions<T extends { [key: string]: any }> = Pick<
  T,
  | 'currency'
  | 'currencyDisplay'
  | 'unit'
  | 'unitDisplay'
  | 'signDisplay'
  | 'minimumIntegerDigits'
  | 'minimumFractionDigits'
  | 'maximumFractionDigits'
  // | 'minimumSignificantDigits'
  // | 'maximumSignificantDigits'
>;

interface IncludedOptions {
  format?: Intl.NumberFormatOptions['style'];
  groupDisplay?: Intl.NumberFormatOptions['useGrouping'];
  maximumIntegerDigits?: number;
}

export type NumberFormatOptions = ResolveOptions<Intl.NumberFormatOptions> & IncludedOptions;

export type ResolvedNumberFormatOptions = ResolveOptions<Intl.ResolvedNumberFormatOptions> &
  Required<IncludedOptions>;

export interface LocalizedNumberFormatValues {
  group: string;
  minusSign: string;
  signBackwards: boolean;
  decimal: string;
  digits: string;
}

export interface NumberFormatProps extends NumberFormatOptions {
  locales?: string | string[];
  onNumberFormat?: NumberFormatEventHandler;
}
