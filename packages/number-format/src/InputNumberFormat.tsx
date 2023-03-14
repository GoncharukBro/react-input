import { forwardRef } from 'react';

import useConnectedInputRef from './core/hooks/useConnectedInputRef';
import type { InputComponent, InputComponentProps } from './core/types';

import type { NumberFormatProps } from './types';

import useNumberFormat from './useNumberFormat';

export type InputNumberFormatProps<P extends object | null = null> = NumberFormatProps &
  InputComponentProps<P>;

function InputNumberFormatComponent(
  props: InputNumberFormatProps,
  forwardedInputRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element;
// eslint-disable-next-line no-redeclare
function InputNumberFormatComponent<P extends object>(
  props: InputNumberFormatProps<P>,
  forwardedInputRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element;
// eslint-disable-next-line no-redeclare
function InputNumberFormatComponent<P extends object>(
  {
    component: Component,
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
    onNumberFormat,
    ...props
  }: InputNumberFormatProps | InputNumberFormatProps<P>,
  forwardedInputRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element {
  const inputRef = useNumberFormat({
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
    onNumberFormat,
  });

  const connectedInputRef = useConnectedInputRef(inputRef, forwardedInputRef);

  if (Component) {
    return <Component ref={connectedInputRef} {...props} />;
  }

  return <input ref={connectedInputRef} {...props} />;
}

const InputNumberFormat = forwardRef(
  InputNumberFormatComponent
) as unknown as InputComponent<NumberFormatProps>;

export default InputNumberFormat;
