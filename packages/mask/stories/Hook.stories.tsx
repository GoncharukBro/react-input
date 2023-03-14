import React, { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import { InputMask as InputMaskComponent, useMask } from '../src';
import type { InputMaskProps, MaskEventDetail } from '../src';

export default {
  title: 'Mask',
  component: InputMaskComponent,
} as Meta<InputMaskProps>;

export const Hook: ComponentStory<any> = () => {
  const [detail, setDetail] = useState<MaskEventDetail | null>(null);
  const [value, setValue] = useState('');

  const ref = useMask({
    mask: 'wwwnnn',
    replacement: { w: /\D/, n: /\d/ },
    // separate: true,
    showMask: true,
    onMask: (event) => {
      setDetail(event.detail);
    },
  });

  return (
    <>
      <input
        ref={ref}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
        }}
      />

      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};
