import React, { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import { InputMask as InputMaskComponent } from '../src';
import type { InputMaskProps, MaskEventDetail } from '../src';

export default {
  title: 'Mask',
  component: InputMaskComponent,
} as Meta<InputMaskProps>;

export const UncontrolledComponent: ComponentStory<typeof InputMaskComponent> = () => {
  const [detail, setDetail] = useState<MaskEventDetail | null>(null);

  return (
    <>
      <InputMaskComponent
        mask="+7 (___) ___-__-__"
        replacement={{ _: /\d/ }}
        defaultValue="+7 (___) ___-__-__"
        autoFocus
        onMask={(event) => setDetail(event.detail)}
      />

      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};
