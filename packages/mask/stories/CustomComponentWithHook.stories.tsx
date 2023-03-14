import React, { forwardRef, useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import { InputMask as InputMaskComponent, useMask } from '../src';
import type { InputMaskProps, MaskEventDetail } from '../src';

export default {
  title: 'Mask',
  component: InputMaskComponent,
} as Meta<InputMaskProps>;

const CustomComponent = forwardRef(
  (
    { label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>,
    forwardedRef: React.ForwardedRef<HTMLInputElement>
  ) => {
    return (
      <>
        <label htmlFor="custom-input">{label}</label>
        <input ref={forwardedRef} {...props} />
      </>
    );
  }
);

export const CustomComponentWithHook: ComponentStory<any> = () => {
  const [detail, setDetail] = useState<MaskEventDetail | null>(null);

  const ref = useMask({
    mask: '+7 (___) ___-__-__',
    replacement: { _: /\d/ },
    separate: true,
    showMask: true,
    onMask: (event) => {
      setDetail(event.detail);
    },
  });

  return (
    <>
      <CustomComponent ref={ref} label="Мой заголовок" id="custom-input" value={detail?.value} />

      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};
