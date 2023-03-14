import React, { forwardRef, useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import { InputMask as InputMaskComponent } from '../src';
import type { InputMaskProps, MaskEventDetail } from '../src';

export default {
  title: 'Mask',
  component: InputMaskComponent,
} as Meta<InputMaskProps>;

const CustomComponent = forwardRef(
  (
    { label, value }: { label?: string; value: string },
    forwardedRef: React.ForwardedRef<HTMLInputElement>
  ) => {
    return (
      <>
        <label htmlFor="custom-input">{label}</label>
        <input ref={forwardedRef} id="custom-input" value={value} />
      </>
    );
  }
);

export const CustomComponentWithOuterState: ComponentStory<typeof InputMaskComponent> = () => {
  const [detail, setDetail] = useState<MaskEventDetail | null>(null);

  return (
    <>
      <InputMaskComponent
        component={CustomComponent}
        label="Мой заголовок"
        mask="+7 (___) ___-__-__"
        replacement={{ _: /\d/ }}
        value={detail?.value ?? ''}
        onMask={(event) => setDetail(event.detail)}
      />

      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};
