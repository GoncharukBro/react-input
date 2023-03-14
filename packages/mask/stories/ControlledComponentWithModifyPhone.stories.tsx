import React, { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import { InputMask as InputMaskComponent } from '../src';
import type { InputMaskProps, MaskEventDetail } from '../src';

export default {
  title: 'Mask',
  component: InputMaskComponent,
} as Meta<InputMaskProps>;

export const ControlledComponentWithModifyPhone: ComponentStory<typeof InputMaskComponent> = () => {
  const [detail, setDetail] = useState<MaskEventDetail | null>(null);

  const modify = (unmaskedValue: string) => {
    const newMask =
      unmaskedValue && unmaskedValue[0] !== '7' ? '+_ __________' : '+_ (___) ___-__-__';
    return { mask: newMask };
  };

  return (
    <>
      <InputMaskComponent
        mask="+_ (___) ___-__-__"
        replacement={{ _: /\d/ }}
        value={detail?.value}
        modify={modify}
        onMask={(event) => setDetail(event.detail)}
      />

      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};
