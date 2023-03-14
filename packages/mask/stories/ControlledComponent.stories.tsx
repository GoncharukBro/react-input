import React, { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import { InputMask as InputMaskComponent } from '../src';
import type { InputMaskProps } from '../src';

export default {
  title: 'Mask',
  component: InputMaskComponent,
} as Meta<InputMaskProps>;

export const ControlledComponent: ComponentStory<typeof InputMaskComponent> = () => {
  const [value, setValue] = useState('');

  return (
    <>
      <InputMaskComponent
        mask="+7 (___) ___-__-__"
        replacement={{ _: /\d/ }}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onMask={() => {}}
      />

      <pre>{JSON.stringify({ value }, null, 2)}</pre>
    </>
  );
};
