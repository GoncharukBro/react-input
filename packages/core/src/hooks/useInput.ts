import { useEffect, useRef } from 'react';
import { unstable_batchedUpdates } from 'react-dom';

import SyntheticChangeError from '../errors/SyntheticChangeError';
import setInputAttributes from '../utils/setInputAttributes';

import type {
  CustomInputEvent,
  CustomInputEventHandler,
  ExtendedHTMLInputElement,
  Init,
  InputType,
  Tracking,
} from '../types';

const validInputElement = (inputElement: HTMLInputElement | null) =>
  inputElement !== null && inputElement.type === 'text';

interface UseInputParam<D> {
  init: Init;
  tracking: Tracking<D>;
  customInputEventType?: string;
  customInputEventHandler?: CustomInputEventHandler<CustomInputEvent<D>>;
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
    timeoutId: -1,
    fallbackTimeoutId: -1,
    cachedTimeoutId: -1,
    start: 0,
    end: 0,
  });

  const dispatchedCustomInputEvent = useRef(true);

  /**
   *
   * Handle errors
   *
   */

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    if (inputRef.current === null) {
      console.warn('Warn: Input element does not exist.');
    }

    if (inputRef.current !== null && inputRef.current.type !== 'text') {
      console.warn('Warn: The type of the input element does not match the type "text".');
    }
  }, []);

  /**
   *
   * Init input state
   *
   */

  useEffect(() => {
    if (inputRef.current === null || !validInputElement(inputRef.current)) return;

    const { controlled = false, initialValue = '' } = inputRef.current._wrapperState ?? {};
    // При создании `input` элемента возможно программное изменение свойства `value`, что может
    // сказаться на отображении состояния элемента, поэтому важно учесть свойство `value` в приоритете
    // ISSUE: https://github.com/GoncharukBro/react-input/issues/3
    const initResult = init({ controlled, initialValue: inputRef.current.value || initialValue });

    // Поскольку в предыдущем шаге возможно изменение инициализированного значения, мы
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
        // поэтому сравниваем `timeoutId` кэшированный и текущий для избежания некорректного поведения маски
        if (selection.current.cachedTimeoutId === selection.current.timeoutId) {
          throw new SyntheticChangeError('The input selection has not been updated.');
        }

        selection.current.cachedTimeoutId = selection.current.timeoutId;

        const { value, selectionStart, selectionEnd } = inputRef.current;

        if (selectionStart === null || selectionEnd === null) {
          throw new SyntheticChangeError('The selection attributes have not been initialized.');
        }

        const previousValue = inputRef.current._valueTracker?.getValue?.() ?? '';
        let inputType: InputType = 'initial';

        // Определяем тип ввода (ручное определение типа ввода способствует кроссбраузерности)
        if (selectionStart > selection.current.start) {
          inputType = 'insert';
        } else if (selectionStart <= selection.current.start && selectionStart < selection.current.end) {
          inputType = 'deleteBackward';
        } else if (selectionStart === selection.current.end && value.length < previousValue.length) {
          inputType = 'deleteForward';
        }

        if ((inputType === 'deleteBackward' || inputType === 'deleteForward') && value.length > previousValue.length) {
          throw new SyntheticChangeError('Input type detection error.');
        }

        let addedValue = '';
        let deletedValue = '';
        let changeStart = selection.current.start;
        let changeEnd = selection.current.end;

        switch (inputType) {
          case 'insert': {
            addedValue = value.slice(selection.current.start, selectionStart);
            break;
          }
          case 'deleteBackward':
          case 'deleteForward': {
            // Для `delete` нам необходимо определить диапазон удаленных символов, так как
            // при удалении без выделения позиция каретки "до" и "после" будут совпадать
            const countDeleted = previousValue.length - value.length;

            changeStart = selectionStart;
            changeEnd = selectionStart + countDeleted;

            deletedValue = previousValue.slice(changeStart, changeEnd);
            break;
          }
          default: {
            throw new SyntheticChangeError('The input type is undefined.');
          }
        }

        const trackingResult = tracking({
          inputType,
          previousValue,
          value,
          addedValue,
          deletedValue,
          changeStart,
          changeEnd,
          selectionStart,
          selectionEnd,
        });

        setInputAttributes(inputRef.current, {
          value: trackingResult.value,
          selectionStart: trackingResult.selectionStart,
          selectionEnd: trackingResult.selectionEnd,
        });

        if (customInputEventType && customInputEventHandler) {
          const { value, selectionStart, selectionEnd } = inputRef.current;

          dispatchedCustomInputEvent.current = false;

          // Генерируем и отправляем пользовательское событие. Нулевой `requestAnimationFrame` необходим для
          // запуска события в асинхронном режиме, в противном случае возможна ситуация, когда компонент
          // будет повторно отрисован с предыдущим значением, из-за обновления состояние после события `change`.
          // Важно использовать именно `requestAnimationFrame`, а не `setTimeout` чтобы не было заметно обновление
          // позиции каретки при вызове `setInputAttributes`
          requestAnimationFrame(() => {
            if (inputRef.current === null) return;

            // После изменения состояния при событии `change` мы можем столкнуться с ситуацией,
            // когда значение `input` элемента не будет равно маскированному значению, что отразится
            // на данных передаваемых `event.target`. Поэтому устанавливаем предыдущее значение
            setInputAttributes(inputRef.current, {
              value,
              selectionStart: selectionStart ?? value.length,
              selectionEnd: selectionEnd ?? value.length,
            });

            const customInputEvent = new CustomEvent(customInputEventType, {
              bubbles: true,
              cancelable: false,
              composed: true,
              detail: trackingResult.__detail,
            }) as CustomInputEvent<D>;

            inputRef.current.dispatchEvent(customInputEvent);

            if (unstable_batchedUpdates) {
              unstable_batchedUpdates(customInputEventHandler, customInputEvent);
            } else {
              customInputEventHandler(customInputEvent);
            }

            dispatchedCustomInputEvent.current = true;
          });
        }

        // После изменения значения в кастомном событии (`dispatchCustomInputEvent`) событие `change`
        // срабатывать не будет, так как предыдущее и текущее состояние внутри `input` совпадают. Чтобы
        // обойти эту проблему с версии React 16, устанавливаем предыдущее состояние на отличное от текущего.
        inputRef.current._valueTracker?.setValue?.(previousValue);

        // Чтобы гарантировать правильное позиционирование каретки, обновляем
        // значения `selection` перед последующим вызовом функции обработчика `input`
        selection.current.start = trackingResult.selectionStart;
        selection.current.end = trackingResult.selectionEnd;
      } catch (error) {
        const { name, cause } = error as SyntheticChangeError;

        if (inputRef.current !== null) {
          setInputAttributes(inputRef.current, {
            value: cause?.__attributes?.value ?? inputRef.current._valueTracker?.getValue?.() ?? '',
            selectionStart: cause?.__attributes?.selectionStart ?? selection.current.start,
            selectionEnd: cause?.__attributes?.selectionEnd ?? selection.current.end,
          });
        }

        // Чтобы гарантировать правильное позиционирование каретки, обновляем
        // значения `selection` перед последующим вызовом функции обработчика `input`

        if (cause?.__attributes?.selectionStart !== undefined) {
          selection.current.start = cause.__attributes.selectionStart;
        }

        if (cause?.__attributes?.selectionEnd !== undefined) {
          selection.current.end = cause.__attributes.selectionEnd;
        }

        event.preventDefault();
        event.stopPropagation();

        if (name !== 'SyntheticChangeError') {
          throw error;
        }
      }
    };

    const inputElement = inputRef.current;

    inputElement?.addEventListener('input', handleInput);

    return () => {
      inputElement?.removeEventListener('input', handleInput);
    };
  }, [customInputEventType, customInputEventHandler, tracking]);

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

          selection.current.timeoutId = window.setTimeout(setSelection);
        } else {
          selection.current.fallbackTimeoutId = window.setTimeout(setSelection);
        }
      };

      selection.current.timeoutId = window.setTimeout(setSelection);
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

      window.clearTimeout(selection.current.timeoutId);
      window.clearTimeout(selection.current.fallbackTimeoutId);

      selection.current.timeoutId = -1;
      selection.current.fallbackTimeoutId = -1;
      selection.current.cachedTimeoutId = -1;
    };

    const inputElement = inputRef.current;

    inputElement?.addEventListener('blur', handleBlur);

    return () => {
      inputElement?.removeEventListener('blur', handleBlur);
    };
  }, []);

  return inputRef;
}
