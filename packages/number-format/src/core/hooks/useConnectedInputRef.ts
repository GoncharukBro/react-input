import { useCallback } from 'react';

/**
 * Объединяет ссылки на dom-элементы (`ref`). Полезно когда необходимо хранить
 * ссылку на один и тот же элемент с помощью хука `useRef` в разных компонентах.
 * @returns функция объединения ссылок
 */
export default function useConnectedInputRef(
  ref: React.MutableRefObject<HTMLInputElement | null>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  return useCallback(
    (element: HTMLInputElement | null) => {
      // eslint-disable-next-line no-param-reassign
      ref.current = element;

      if (typeof forwardedRef === 'function') {
        forwardedRef(element);
      } else if (typeof forwardedRef === 'object' && forwardedRef !== null) {
        // eslint-disable-next-line no-param-reassign
        forwardedRef.current = element;
      }
    },
    [ref, forwardedRef]
  );
}
