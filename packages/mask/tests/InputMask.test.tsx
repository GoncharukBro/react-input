import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import InputMask from '@react-input/mask/InputMask';

import type { Track } from '@react-input/mask';
import type { InputMaskProps } from '@react-input/mask/InputMask';

import '@testing-library/jest-dom';

const init = (props: InputMaskProps = {}) => {
  render(<InputMask mask="+7 (___) ___-__-__" replacement="_" {...props} data-testid="input-mask" />);
  return screen.getByTestId<HTMLInputElement>('input-mask');
};

const initWithDefaultType = async (props: InputMaskProps = {}) => {
  const input = init(props);
  await userEvent.type(input, '9123456789');
  return input;
};

/**
 * INSERT
 */

test('Insert', async () => {
  const input = await initWithDefaultType();
  expect(input).toHaveValue('+7 (912) 345-67-89');
});

test('Insert with selection range', async () => {
  const input = await initWithDefaultType();
  await userEvent.type(input, '0', { initialSelectionStart: 4, initialSelectionEnd: 8 });
  expect(input).toHaveValue('+7 (034) 567-89');
});

/**
 * BACKSPACE
 */

test('Backspace after user character', async () => {
  const input = await initWithDefaultType();
  await userEvent.type(input, '{Backspace}', { initialSelectionStart: 5, initialSelectionEnd: 5 });
  expect(input).toHaveValue('+7 (123) 456-78-9');
});

test('Backspace after mask character', async () => {
  const input = await initWithDefaultType();
  await userEvent.type(input, '{Backspace}', { initialSelectionStart: 8, initialSelectionEnd: 8 });
  expect(input).toHaveValue('+7 (912) 345-67-89');
});

/**
 * DELETE
 */

test('Delete before user character', async () => {
  const input = await initWithDefaultType();
  await userEvent.type(input, '{Delete}', { initialSelectionStart: 4, initialSelectionEnd: 4 });
  expect(input).toHaveValue('+7 (123) 456-78-9');
});

test('Delete before mask character', async () => {
  const input = await initWithDefaultType();
  await userEvent.type(input, '{Delete}', { initialSelectionStart: 7, initialSelectionEnd: 7 });
  expect(input).toHaveValue('+7 (912) 345-67-89');
});

/*
 * Phone number with track
 */

const track: Track = ({ inputType, value, data, selectionStart, selectionEnd }) => {
  if (inputType === 'insert' && selectionStart <= 1) {
    const _data = data.replace(/\D/g, '');
    return /^[78]/.test(_data) ? `7${_data.slice(1)}` : /^[0-69]/.test(_data) ? `7${_data}` : data;
  }

  if (inputType !== 'insert' && selectionStart <= 1 && selectionEnd < value.length) {
    return selectionEnd > 2 ? '7' : selectionEnd === 2 ? false : data;
  }

  return data;
};

const initWithPhoneNumberProps = () => {
  return init({ mask: '+_ (___) ___-__-__', replacement: { _: /\d/ }, track });
};

test('Insert phone number $1', async () => {
  const input = initWithPhoneNumberProps();
  await userEvent.type(input, '9123456789');
  expect(input).toHaveValue('+7 (912) 345-67-89');
});

test('Insert phone number $2', async () => {
  const input = initWithPhoneNumberProps();
  await userEvent.type(input, '79123456789');
  expect(input).toHaveValue('+7 (912) 345-67-89');
});

test('Insert phone number $3', async () => {
  const input = initWithPhoneNumberProps();
  await userEvent.type(input, '89123456789');
  expect(input).toHaveValue('+7 (912) 345-67-89');
});
