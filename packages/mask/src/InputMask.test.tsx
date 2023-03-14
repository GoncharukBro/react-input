import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { InputMask } from '.';

const options = { delay: 10 };

async function init(value: string) {
  render(<InputMask mask="+7 (___) ___-__-__" replacement="_" />);
  const input = screen.getByRole('textbox') as HTMLInputElement;
  await userEvent.type(input, value, options);
  return input;
}

test('Type', async () => {
  const input = await init('9123456789');
  expect(input).toHaveValue('+7 (912) 345-67-89');
});

// test('Replace characters within the selected range', async () => {
//   const input = await init('9123456789');
//   input.setSelectionRange(4, 5);
//   await userEvent.type(input, '0', options);
//   expect(input).toHaveValue('+7 (012) 345-67-89');
// });

// test('Backspace after change character', async () => {
//   const input = await init();
//   input.setSelectionRange(5, 5);
//   await userEvent.type(input, '{backspace}', options);
//   expect(input).toHaveValue('+7 (123) 456-78-9');
// });

// test('Backspace after mask character', async () => {
//   const input = await init();
//   input.setSelectionRange(8, 8);
//   await userEvent.type(input, '{backspace}', options);
//   expect(input).toHaveValue('+7 (912) 345-67-89');
// });

// test('Delete before change character', async () => {
//   const input = await init();
//   input.setSelectionRange(4, 4);
//   await userEvent.type(input, '{del}', options);
//   expect(input).toHaveValue('+7 (123) 456-78-9');
// });

// test('Delete before mask character', async () => {
//   const input = await init();
//   input.setSelectionRange(7, 7);
//   await userEvent.type(input, '{del}', options);
//   expect(input).toHaveValue('+7 (912) 345-67-89');
// });
