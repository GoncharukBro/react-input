import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useInput } from '@react-input/core';

import '@testing-library/jest-dom';

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const ref = useInput({
    init: ({ initialValue }) => ({
      value: initialValue,
      options: {},
    }),
    tracking: ({ value, selectionStart, selectionEnd }) => ({
      value,
      selectionStart,
      selectionEnd,
      options: {},
    }),
  });

  return <input ref={ref} autoFocus {...props} data-testid="testing-input" />;
}

/**
 * INSERT
 */

test('Insert with autofocus', async () => {
  render(<Input />);

  const input = screen.getByTestId<HTMLInputElement>('testing-input');

  await userEvent.type(input, '9123456789');
  expect(input).toHaveValue('9123456789');
});

/**
 * ISSUE #59: fast typing / held Backspace causes reverted or duplicated characters
 */

afterEach(() => {
  jest.useRealTimers();
});

test('two input events dispatched before the selection poll ticks do not drop a keystroke', () => {
  jest.useFakeTimers();

  render(<Input />);

  const input = screen.getByTestId<HTMLInputElement>('testing-input');

  expect(document.activeElement).toBe(input);

  // Bypass the library's own `value` property interceptor, the same way a real
  // browser keystroke mutates the DOM value without going through any JS setter.
  const nativeValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;

  const typeCharacter = (value: string, caretPosition: number) => {
    // A real keystroke fires `beforeinput` synchronously, with the selection still at its
    // pre-edit position, before the browser mutates the DOM value/selection.
    input.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText' }));
    nativeValueSetter.call(input, value);
    input.setSelectionRange(caretPosition, caretPosition);
    input.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: false, inputType: 'insertText' }));
  };

  // First keystroke is processed normally.
  typeCharacter('9', 1);
  expect(input).toHaveValue('9');

  // Second keystroke arrives before the fake-timer clock has advanced at all, so the
  // pre-edit selection poll (`setTimeout(setSelection)`) has not had a chance to tick.
  typeCharacter('91', 2);

  expect(input).toHaveValue('91');
});
