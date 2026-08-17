import React, { useState } from 'react';

import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import InputNumberFormat from '@react-input/number-format/InputNumberFormat';

import type { InputNumberFormatProps } from '@react-input/number-format/InputNumberFormat';

import '@testing-library/jest-dom';

const init = (props: InputNumberFormatProps = {}) => {
  render(<InputNumberFormat {...props} data-testid="input-number-format" />);
  return screen.getByTestId<HTMLInputElement>('input-number-format');
};

const initWithDefaultType = async (props: InputNumberFormatProps = {}) => {
  const input = init(props);
  await userEvent.type(input, '1234');
  return input;
};

/**
 * INSERT
 */

// default

test('Insert', async () => {
  const input = await initWithDefaultType();
  expect(input).toHaveValue('1 234');
});

test('Insert without selection range', async () => {
  const input = await initWithDefaultType();
  await userEvent.type(input, '9', { initialSelectionStart: 3, initialSelectionEnd: 3 });
  expect(input).toHaveValue('12 934');
});

test('Insert less than selection range', async () => {
  const input = await initWithDefaultType();
  await userEvent.type(input, '9', { initialSelectionStart: 2, initialSelectionEnd: 4 });
  expect(input).toHaveValue('194');
});

test('Insert more than selection range', async () => {
  const input = await initWithDefaultType();
  await userEvent.type(input, '6789', { initialSelectionStart: 2, initialSelectionEnd: 4 });
  expect(input).toHaveValue('167 894');
});

// minimumIntegerDigits: 4

test('Insert without selection range (3-3)', async () => {
  const input = await initWithDefaultType({ minimumIntegerDigits: 4 });
  await userEvent.type(input, '9', { initialSelectionStart: 3, initialSelectionEnd: 3 });
  expect(input).toHaveValue('12 934');
});

test('Insert less than selection range (2-4)', async () => {
  const input = await initWithDefaultType({ minimumIntegerDigits: 4 });
  await userEvent.type(input, '9', { initialSelectionStart: 2, initialSelectionEnd: 4 });
  expect(input).toHaveValue('0 194');
});

test('Insert more than selection range (2-4)', async () => {
  const input = await initWithDefaultType({ minimumIntegerDigits: 4 });
  await userEvent.type(input, '6789', { initialSelectionStart: 2, initialSelectionEnd: 4 });
  expect(input).toHaveValue('167 894');
});

// minimumIntegerDigits: 6

test('Insert without selection range (5-5)', async () => {
  const input = await initWithDefaultType({ minimumIntegerDigits: 6 });
  await userEvent.type(input, '9', { initialSelectionStart: 5, initialSelectionEnd: 5 });
  expect(input).toHaveValue('012 934');
});

test('Insert less than selection range (4-6)', async () => {
  const input = await initWithDefaultType({ minimumIntegerDigits: 6 });
  await userEvent.type(input, '9', { initialSelectionStart: 4, initialSelectionEnd: 6 });
  expect(input).toHaveValue('000 194');
});

test('Insert more than selection range (4-6)', async () => {
  const input = await initWithDefaultType({ minimumIntegerDigits: 6 });
  await userEvent.type(input, '6789', { initialSelectionStart: 4, initialSelectionEnd: 6 });
  expect(input).toHaveValue('167 894');
});

/**
 * BACKSPACE
 */

test('Backspace without selection range', async () => {
  const input = await initWithDefaultType();
  await userEvent.type(input, '{Backspace}', { initialSelectionStart: 4, initialSelectionEnd: 4 });
  expect(input).toHaveValue('124');
});

test('Backspace with selection range', async () => {
  const input = await initWithDefaultType();
  await userEvent.type(input, '{Backspace}', { initialSelectionStart: 2, initialSelectionEnd: 4 });
  expect(input).toHaveValue('14');
});

// minimumIntegerDigits: 4

test('Backspace without selection range (4-4)', async () => {
  const input = await initWithDefaultType({ minimumIntegerDigits: 4 });
  await userEvent.type(input, '{Backspace}', { initialSelectionStart: 4, initialSelectionEnd: 4 });
  expect(input).toHaveValue('0 124');
});

test('Backspace with selection range (2-4)', async () => {
  const input = await initWithDefaultType({ minimumIntegerDigits: 4 });
  await userEvent.type(input, '{Backspace}', { initialSelectionStart: 2, initialSelectionEnd: 4 });
  expect(input).toHaveValue('0 014');
});

// minimumIntegerDigits: 6

test('Backspace without selection range (6, 6)', async () => {
  const input = await initWithDefaultType({ minimumIntegerDigits: 6 });
  await userEvent.type(input, '{Backspace}', { initialSelectionStart: 6, initialSelectionEnd: 6 });
  expect(input).toHaveValue('000 124');
});

test('Backspace with selection range (4-6)', async () => {
  const input = await initWithDefaultType({ minimumIntegerDigits: 6 });
  await userEvent.type(input, '{Backspace}', { initialSelectionStart: 4, initialSelectionEnd: 6 });
  expect(input).toHaveValue('000 014');
});

/**
 * DELETE
 */

// default

test('Delete without selection range', async () => {
  const input = await initWithDefaultType();
  await userEvent.type(input, '{Delete}', { initialSelectionStart: 3, initialSelectionEnd: 3 });
  expect(input).toHaveValue('124');
});

test('Delete with selection range', async () => {
  const input = await initWithDefaultType();
  await userEvent.type(input, '{Delete}', { initialSelectionStart: 2, initialSelectionEnd: 4 });
  expect(input).toHaveValue('14');
});

// minimumIntegerDigits: 4

test('Delete without selection range (3-3)', async () => {
  const input = await initWithDefaultType({ minimumIntegerDigits: 4 });
  await userEvent.type(input, '{Delete}', { initialSelectionStart: 3, initialSelectionEnd: 3 });
  expect(input).toHaveValue('0 124');
});

test('Delete with selection range (2-4)', async () => {
  const input = await initWithDefaultType({ minimumIntegerDigits: 4 });
  await userEvent.type(input, '{Delete}', { initialSelectionStart: 2, initialSelectionEnd: 4 });
  expect(input).toHaveValue('0 014');
});

// minimumIntegerDigits: 6

test('Delete without selection range (5-5)', async () => {
  const input = await initWithDefaultType({ minimumIntegerDigits: 6 });
  await userEvent.type(input, '{Delete}', { initialSelectionStart: 5, initialSelectionEnd: 5 });
  expect(input).toHaveValue('000 124');
});

test('Delete with selection range (4-6)', async () => {
  const input = await initWithDefaultType({ minimumIntegerDigits: 6 });
  await userEvent.type(input, '{Delete}', { initialSelectionStart: 4, initialSelectionEnd: 6 });
  expect(input).toHaveValue('000 014');
});

/**
 * SELECTION TRACKING RACE
 */

// A real controlled consumer: it echoes the digits back into `value` on every
// keystroke, the way a form library normalizing/validating on change would.
function ControlledNumberFormat(props: InputNumberFormatProps) {
  const [value, setValue] = useState('');
  return (
    <InputNumberFormat
      {...props}
      data-testid="input-number-format"
      value={value}
      onChange={(event) => setValue(event.target.value.replace(/[^0-9]/g, ''))}
    />
  );
}

const nativeValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;

// Mutates the element the way a real keypress would (native value + caret move),
// bypassing the library's intercepted `value` setter, then dispatches the native
// `beforeinput`/`input` events the library listens for.
function typeAtCaret(input: HTMLInputElement, char: string) {
  fireEvent(input, new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText' }));
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  nativeValueSetter.call(input, input.value.slice(0, start) + char + input.value.slice(end));
  input.setSelectionRange(start + 1, start + 1);
  fireEvent.input(input, { inputType: 'insertText', data: char });
}

function backspaceAtCaret(input: HTMLInputElement) {
  fireEvent(
    input,
    new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'deleteContentBackward' }),
  );
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  if (start === end) {
    if (start === 0) {
      return;
    }
    nativeValueSetter.call(input, input.value.slice(0, start - 1) + input.value.slice(end));
    input.setSelectionRange(start - 1, start - 1);
  } else {
    nativeValueSetter.call(input, input.value.slice(0, start) + input.value.slice(end));
    input.setSelectionRange(start, start);
  }
  fireEvent.input(input, { inputType: 'deleteContentBackward' });
}

test('Rapid backspace and retype does not resurrect a deleted digit', () => {
  jest.useFakeTimers();

  try {
    render(<ControlledNumberFormat locales="en-US" />);
    const input = screen.getByTestId<HTMLInputElement>('input-number-format');

    act(() => {
      fireEvent.focus(input);
    });

    // Two keystrokes fired back-to-back, faster than the selection-tracking
    // poll (a self-rescheduling zero-delay timer) can tick, followed by
    // keystrokes spaced out enough for the poll to catch up.
    act(() => {
      typeAtCaret(input, '7');
    });
    act(() => {
      backspaceAtCaret(input);
    });
    act(() => {
      backspaceAtCaret(input);
    });
    act(() => {
      jest.advanceTimersByTime(4);
      typeAtCaret(input, '9');
    });
    act(() => {
      jest.advanceTimersByTime(10);
      backspaceAtCaret(input);
    });
    act(() => {
      jest.advanceTimersByTime(4);
      typeAtCaret(input, '3');
    });

    // Deleting "7" and typing "9" then deleting it and typing "3" should leave
    // just "3". The stale cached selection instead lets the deleted "7" survive
    // and reappear in the output alongside "3".
    expect(input.value.replace(/[^0-9]/g, '')).toBe('3');
  } finally {
    jest.useRealTimers();
  }
});
