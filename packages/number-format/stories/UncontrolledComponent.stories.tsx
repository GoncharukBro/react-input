import React, { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import { InputNumberFormat as InputNumberFormatComponent } from '../src';
import type { InputNumberFormatProps, NumberFormatEventDetail } from '../src';

export default {
  title: 'Number Format',
  component: InputNumberFormatComponent,
} as Meta<InputNumberFormatProps>;

export const UncontrolledComponent: ComponentStory<typeof InputNumberFormatComponent> = () => {
  const [detail, setDetail] = useState<NumberFormatEventDetail | null>(null);

  return (
    <>
      <InputNumberFormatComponent onNumberFormat={(event) => setDetail(event.detail)} />

      <pre>{JSON.stringify(detail, null, 2)}</pre>

      <>
        {/* request a currency format */}
        <InputNumberFormatComponent locales="de-DE" format="currency" currency="EUR" />
        {/* the Japanese yen doesn't use a minor unit */}
        <InputNumberFormatComponent locales="ja-JP" format="currency" currency="JPY" />
        {/* limit to three significant digits */}
        <InputNumberFormatComponent locales="en-IN" maximumIntegerDigits={3} />
        {/* Formatting with units */}
        <InputNumberFormatComponent locales="pt-PT" format="unit" unit="kilometer-per-hour" />
        <InputNumberFormatComponent locales="en-GB" format="unit" unit="liter" unitDisplay="long" />
      </>
    </>
  );
};
