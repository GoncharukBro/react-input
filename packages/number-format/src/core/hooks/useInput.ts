import { useEffect, useLayoutEffect, useRef } from 'react';

import setInputAttributes from '../utils/setInputAttributes';

import { SyntheticChangeError } from '../errors/SyntheticChangeError';

import type {
  CustomInputEventHandler,
  ExtendedHTMLInputElement,
  Init,
  InputType,
  Tracking,
} from '../types';

import useDispatchCustomInputEvent from './useDispatchCustomInputEvent';

const validInputElement = (inputElement: HTMLInputElement | null) => {
  return inputElement !== null && inputElement.type === 'text';
};

interface UseInputParam<D> {
  init: Init;
  tracking: Tracking<D>;
  customInputEventType?: string;
  customInputEventHandler?: CustomInputEventHandler<D>;
}

/**
 * Хук контроля события изменения ввода позволяет выполнять логику и изменять
 * аттрибуты `input` элемента на определённых этапах трекинга события.
 * @param param
 * @returns
 */
export default function useInput<D = unknown>({
  init,
  tracking,
  customInputEventType,
  customInputEventHandler,
}: UseInputParam<D>): React.MutableRefObject<HTMLInputElement | null> {
  const inputRef = useRef<ExtendedHTMLInputElement | null>(null);

  const selection = useRef({
    requestID: -1,
    fallbackRequestID: -1,
    cachedRequestID: -1,
    start: 0,
    end: 0,
  });

  const [dispatchedCustomInputEvent, dispatchCustomInputEvent] = useDispatchCustomInputEvent<D>(
    inputRef,
    customInputEventType,
    customInputEventHandler
  );

  /**
   *
   * Handle errors
   *
   */

  useLayoutEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    if (inputRef.current === null) {
      // eslint-disable-next-line no-console
      console.error(new Error('Input element does not exist.'));
    }
    if (inputRef.current !== null && inputRef.current.type !== 'text') {
      // eslint-disable-next-line no-console
      console.error(new Error('The type of the input element does not match the type "text".'));
    }
  }, []);

  /**
   *
   * Init input state
   *
   */

  useLayoutEffect(() => {
    if (inputRef.current === null || !validInputElement(inputRef.current)) return;

    const { controlled = false, initialValue = '' } = inputRef.current._wrapperState ?? {};
    const initResult = init({ controlled, initialValue });

    // Поскольку в предыдущем шаге мы изменяем инициализированное значение, мы
    // также должны изменить значение элемента, при этом мы не должны устанавливать
    // позицию каретки, так как установка позиции здесь приведёт к автофокусу
    setInputAttributes(inputRef.current, { value: initResult.value });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   *
   * Handle input
   *
   */

  useEffect(() => {
    const handleInput = (event: Event) => {
      if (!validInputElement(inputRef.current)) return;

      try {
        if (inputRef.current === null) {
          throw new SyntheticChangeError('Reference to input element is not initialized.');
        }

        // Если событие вызывается слишком часто, смена курсора может не поспеть за новым событием,
        // поэтому сравниваем `requestID` кэшированный и текущий для избежания некорректного поведения маски
        if (selection.current.cachedRequestID === selection.current.requestID) {
          throw new SyntheticChangeError('The input selection has not been updated.');
        }

        selection.current.cachedRequestID = selection.current.requestID;

        const { value, selectionStart, selectionEnd } = inputRef.current;

        if (selectionStart === null || selectionEnd === null) {
          throw new SyntheticChangeError('The selection attributes have not been initialized.');
        }

        const previousValue = inputRef.current._valueTracker?.getValue?.() ?? '';
        let inputType: InputType = 'initial';

        // Определяем тип ввода (ручное определение типа ввода способствует кроссбраузерности)
        if (selectionStart > selection.current.start) {
          inputType = 'insert';
        } else if (
          selectionStart <= selection.current.start &&
          selectionStart < selection.current.end
        ) {
          inputType = 'deleteBackward';
        } else if (
          selectionStart === selection.current.end &&
          value.length < previousValue.length
        ) {
          inputType = 'deleteForward';
        }

        if (
          (inputType === 'deleteBackward' || inputType === 'deleteForward') &&
          value.length > previousValue.length
        ) {
          throw new SyntheticChangeError('Input type detection error.');
        }

        let added = '';
        let deleted = '';
        let selectionStartRange = selection.current.start;
        let selectionEndRange = selection.current.end;

        switch (inputType) {
          case 'insert': {
            added = value.slice(selection.current.start, selectionStart);
            break;
          }
          case 'deleteBackward':
          case 'deleteForward': {
            // Для `delete` нам необходимо определить диапазон удаленных символов, так как
            // при удалении без выделения позиция каретки "до" и "после" будут совпадать
            const countDeleted = previousValue.length - value.length;

            selectionStartRange = selectionStart;
            selectionEndRange = selectionStart + countDeleted;

            deleted = previousValue.slice(selectionStartRange, selectionEndRange);
            break;
          }
          default: {
            throw new SyntheticChangeError('The input type is undefined.');
          }
        }

        const trackingResult = tracking({
          inputType,
          added,
          deleted,
          previousValue,
          selectionStartRange,
          selectionEndRange,
          value,
          selectionStart,
          selectionEnd,
        });

        setInputAttributes(inputRef.current, {
          value: trackingResult.value,
          selectionStart: trackingResult.selectionStart,
          selectionEnd: trackingResult.selectionEnd,
        });

        dispatchCustomInputEvent(trackingResult.__detail);

        // После изменения значения в кастомном событии (`dispatchCustomInputEvent`) событие `change`
        // срабатывать не будет, так как предыдущее и текущее состояние внутри `input` совпадают. Чтобы
        // обойти эту проблему с версии React 16, устанавливаем предыдущее состояние на отличное от текущего.
        inputRef.current._valueTracker?.setValue?.(previousValue);

        // Чтобы гарантировать правильное позиционирование каретки, обновляем
        // значения `selection` перед последующим вызовом функции обработчика `input`
        selection.current.start = trackingResult.selectionStart;
        selection.current.end = trackingResult.selectionEnd;
      } catch (error) {
        const __attributes = (error as SyntheticChangeError).cause?.__attributes;

        if (inputRef.current !== null) {
          setInputAttributes(inputRef.current, {
            value: __attributes?.value ?? inputRef.current._valueTracker?.getValue?.() ?? '',
            selectionStart: __attributes?.selectionStart ?? selection.current.start,
            selectionEnd: __attributes?.selectionEnd ?? selection.current.end,
          });
        }

        // Чтобы гарантировать правильное позиционирование каретки, обновляем
        // значения `selection` перед последующим вызовом функции обработчика `input`

        if (__attributes?.selectionStart !== undefined) {
          selection.current.start = __attributes.selectionStart;
        }

        if (__attributes?.selectionEnd !== undefined) {
          selection.current.end = __attributes.selectionEnd;
        }

        event.preventDefault();
        event.stopPropagation();

        if (error instanceof SyntheticChangeError) {
          // eslint-disable-next-line no-console
          if (process.env.NODE_ENV !== 'production') console.error({ error });
        } else {
          throw error;
        }
      }
    };

    const inputElement = inputRef.current;

    inputElement?.addEventListener('input', handleInput);

    return () => {
      inputElement?.removeEventListener('input', handleInput);
    };
  }, [tracking, dispatchCustomInputEvent]);

  /**
   *
   * Handle focus
   *
   */

  useEffect(() => {
    const handleFocus = () => {
      if (!validInputElement(inputRef.current)) return;

      const setSelection = () => {
        // Позиция курсора изменяется после завершения события `change` и к срабатыванию кастомного
        // события позиция курсора может быть некорректной, что может повлечь за собой ошибки
        if (dispatchedCustomInputEvent.current) {
          selection.current.start = inputRef.current?.selectionStart ?? 0;
          selection.current.end = inputRef.current?.selectionEnd ?? 0;

          selection.current.requestID = requestAnimationFrame(setSelection);
        } else {
          selection.current.fallbackRequestID = requestAnimationFrame(setSelection);
        }
      };

      selection.current.requestID = requestAnimationFrame(setSelection);
    };

    // Событие `focus` не сработает при рендере, даже если включено свойство `autoFocus`,
    // поэтому нам необходимо запустить определение позиции курсора вручную при автофокусе
    if (inputRef.current !== null && document.activeElement === inputRef.current) {
      handleFocus();
    }

    const inputElement = inputRef.current;

    inputElement?.addEventListener('focus', handleFocus);

    return () => {
      inputElement?.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   *
   * Handle blur
   *
   */

  useEffect(() => {
    const handleBlur = () => {
      if (!validInputElement(inputRef.current)) return;

      cancelAnimationFrame(selection.current.requestID);
      cancelAnimationFrame(selection.current.fallbackRequestID);

      selection.current.requestID = -1;
      selection.current.fallbackRequestID = -1;
      selection.current.cachedRequestID = -1;
    };

    const inputElement = inputRef.current;

    inputElement?.addEventListener('blur', handleBlur);

    return () => {
      inputElement?.removeEventListener('blur', handleBlur);
    };
  }, []);

  return inputRef;
}
