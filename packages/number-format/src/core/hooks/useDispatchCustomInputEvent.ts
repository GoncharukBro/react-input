import { useCallback, useRef } from 'react';
import { unstable_batchedUpdates } from 'react-dom';

import setInputAttributes from '../utils/setInputAttributes';

import type { CustomInputEvent, CustomInputEventHandler, ExtendedHTMLInputElement } from '../types';

export default function useDispatchCustomInputEvent<D = unknown>(
  inputRef: React.MutableRefObject<ExtendedHTMLInputElement | null>,
  customInputEventType: string | undefined,
  customInputEventHandler: CustomInputEventHandler<D> | undefined
): [React.MutableRefObject<boolean>, (customInputEventDetail: D) => void] {
  const dispatched = useRef(true);

  const dispatch = useCallback(
    (customInputEventDetail: D) => {
      if (inputRef.current === null || !customInputEventType || !customInputEventHandler) {
        return;
      }

      const { value, selectionStart, selectionEnd } = inputRef.current;

      dispatched.current = false;

      // Генерируем и отправляем пользовательское событие. Нулевой `setTimeout` необходим для
      // запуска события в асинхронном режиме, в противном случае возможна ситуация, когда компонент
      // будет повторно отрисован с предыдущим значением, из-за обновления состояние после события `change`
      setTimeout(() => {
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
          detail: customInputEventDetail,
        }) as CustomInputEvent<D>;

        inputRef.current.dispatchEvent(customInputEvent);

        if (unstable_batchedUpdates) {
          unstable_batchedUpdates(customInputEventHandler, customInputEvent);
        } else {
          customInputEventHandler(customInputEvent);
        }

        dispatched.current = true;
      });
    },
    [inputRef, customInputEventType, customInputEventHandler]
  );

  return [dispatched, dispatch];
}
