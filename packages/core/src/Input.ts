import SyntheticChangeError from './SyntheticChangeError';

import type { InputOptions, InputType } from './types';

const ALLOWED_TYPES = ['text', 'email', 'tel', 'search', 'url'];

interface ContextValue {
  onFocus: (event: FocusEvent) => void;
  onBlur: (event: FocusEvent) => void;
  onInput: (event: Event) => void;
}

export default class Input<T = unknown> {
  static {
    Object.defineProperty(this.prototype, Symbol.toStringTag, {
      writable: false,
      enumerable: false,
      configurable: true,
      value: 'Input',
    });
  }

  register: (element: HTMLInputElement) => void;
  unregister: (element: HTMLInputElement) => void;

  constructor({ init, tracking }: InputOptions<T>) {
    const handlersMap = new WeakMap<HTMLInputElement, ContextValue>();
    const descriptorMap = new WeakMap<HTMLInputElement, PropertyDescriptor | undefined>();

    this.register = (element) => {
      if (!ALLOWED_TYPES.includes(element.type)) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`Warn: The input element type does not match one of the types: ${ALLOWED_TYPES.join(', ')}.`);
        }

        return;
      }

      const { initialValue = '', controlled = false } =
        (element as { _wrapperState?: { initialValue?: string; controlled?: boolean } })._wrapperState ?? {};

      // При создании `input` элемента возможно программное изменение свойства `value`, что может
      // сказаться на отображении состояния элемента, поэтому важно учесть свойство `value` в приоритете.
      // ISSUE: https://github.com/GoncharukOrg/react-input/issues/3
      const { value, options } = init({
        initialValue: element.value || initialValue,
        controlled,
      });

      const cache = {
        value,
        options,
        fallbackOptions: options,
      };

      const timeout = {
        id: -1,
        cachedId: -1,
      };

      const tracker = {
        value: '',
        selectionStart: 0,
        selectionEnd: 0,
      };

      // Важно сохранить дескриптор создаваемый React
      const descriptor = Object.getOwnPropertyDescriptor(
        '_valueTracker' in element ? element : HTMLInputElement.prototype,
        'value',
      );

      // Поскольку значение элемента может быть изменено вне текущей логики,
      // нам важно перехватывать каждое изменение для обновления `tracker.value`.
      // `tracker.value` служит заменой `_valueTracker.getValue()` предоставляемый React.
      descriptorMap.set(element, descriptor);
      Object.defineProperty(element, 'value', {
        ...descriptor,
        set: (value: string) => {
          tracker.value = value;
          descriptor?.set?.call(element, value);
        },
      });

      // Поскольку в `init` возможно изменение инициализированного значения, мы
      // также должны изменить значение элемента, при этом мы не должны устанавливать
      // позицию каретки, так как установка позиции здесь приведёт к автофокусу.
      element.value = value;

      /**
       * Handle focus
       */
      const onFocus = () => {
        const setSelection = () => {
          tracker.selectionStart = element.selectionStart ?? 0;
          tracker.selectionEnd = element.selectionEnd ?? 0;

          timeout.id = window.setTimeout(setSelection);
        };

        timeout.id = window.setTimeout(setSelection);
      };

      /**
       * Handle blur
       */
      const onBlur = () => {
        window.clearTimeout(timeout.id);

        timeout.id = -1;
        timeout.cachedId = -1;
      };

      /**
       * Handle input
       */
      const onInput = (event: Event) => {
        try {
          // Если событие вызывается слишком часто, смена курсора может не поспеть за новым событием,
          // поэтому сравниваем `timeoutId` кэшированный и текущий для избежания некорректного поведения маски
          if (timeout.cachedId === timeout.id) {
            throw new SyntheticChangeError('The input selection has not been updated.');
          }

          timeout.cachedId = timeout.id;

          const { value, selectionStart, selectionEnd } = element;

          if (selectionStart === null || selectionEnd === null) {
            throw new SyntheticChangeError('The selection attributes have not been initialized.');
          }

          const previousValue = tracker.value;
          let inputType: InputType | undefined;

          // При автоподстановке значения браузер заменяет значение полностью, как если бы мы
          // выделили значение и вставили новое, однако `tracker.selectionStart` и `tracker.selectionEnd`
          // не изменятся что приведёт к не правильному определению типа ввода, например, при
          // автоподстановке значения меньше чем предыдущее, тип ввода будет определён как `deleteBackward`.
          // Учитывая что при автоподстановке `inputType` не определён и значение заменяется полностью,
          // нам надо имитировать выделение всего значения, для этого переопределяем позиции выделения
          // @ts-expect-error
          if (event.inputType === undefined) {
            tracker.selectionStart = 0;
            tracker.selectionEnd = previousValue.length;
          }

          // Определяем тип ввода (ручное определение типа ввода способствует кроссбраузерности)
          if (selectionStart > tracker.selectionStart) {
            inputType = 'insert';
          } else if (selectionStart <= tracker.selectionStart && selectionStart < tracker.selectionEnd) {
            inputType = 'deleteBackward';
          } else if (selectionStart === tracker.selectionEnd && value.length < previousValue.length) {
            inputType = 'deleteForward';
          }

          if (
            inputType === undefined ||
            ((inputType === 'deleteBackward' || inputType === 'deleteForward') && value.length > previousValue.length)
          ) {
            throw new SyntheticChangeError('Input type detection error.');
          }

          let addedValue = '';
          let changeStart = tracker.selectionStart;
          let changeEnd = tracker.selectionEnd;

          if (inputType === 'insert') {
            addedValue = value.slice(tracker.selectionStart, selectionStart);
          } else {
            // Для `delete` нам необходимо определить диапазон удаленных символов, так как
            // при удалении без выделения позиция каретки "до" и "после" будут совпадать
            const countDeleted = previousValue.length - value.length;

            changeStart = selectionStart;
            changeEnd = selectionStart + countDeleted;
          }

          // Предыдущее значение всегда должно соответствовать маскированному значению из кэша. Обратная ситуация может
          // возникнуть при контроле значения, если значение не было изменено после ввода. Для предотвращения подобных
          // ситуаций, нам важно синхронизировать предыдущее значение с кэшированным значением, если они различаются
          if (cache.value !== previousValue) {
            cache.options = cache.fallbackOptions;
          } else {
            cache.fallbackOptions = cache.options;
          }

          const previousOptions = cache.options;

          const { options, ...attributes } = tracking({
            inputType,
            previousValue,
            previousOptions,
            value,
            addedValue,
            changeStart,
            changeEnd,
            selectionStart,
            selectionEnd,
          });

          element.value = attributes.value;
          element.setSelectionRange(attributes.selectionStart, attributes.selectionEnd);

          cache.value = attributes.value;
          cache.options = options;

          tracker.selectionStart = attributes.selectionStart;
          tracker.selectionEnd = attributes.selectionEnd;

          // Действие необходимо только при работе React, для правильной работы события `change`!
          // После изменения значения с помощью `setInputAttributes` значение в свойстве `_valueTracker` также
          // изменится и будет соответствовать значению в элементе что приведёт к несрабатыванию события `change`.
          // Чтобы обойти эту проблему с версии React 16, устанавливаем предыдущее состояние на отличное от текущего.
          (element as { _valueTracker?: { setValue?: (value: string) => void } })._valueTracker?.setValue?.(
            previousValue,
          );
        } catch (error) {
          element.value = tracker.value;
          element.setSelectionRange(tracker.selectionStart, tracker.selectionEnd);

          event.preventDefault();
          event.stopPropagation();

          if ((error as SyntheticChangeError).name !== 'SyntheticChangeError') {
            throw error;
          }
        }
      };

      // Событие `focus` не сработает при рендере, даже если включено свойство `autoFocus`,
      // поэтому нам необходимо запустить определение позиции курсора вручную при автофокусе.
      if (document.activeElement === element) {
        onFocus();
      }

      element.addEventListener('focus', onFocus);
      element.addEventListener('blur', onBlur);
      element.addEventListener('input', onInput);

      handlersMap.set(element, { onFocus, onBlur, onInput });
    };

    this.unregister = (element) => {
      const descriptor = descriptorMap.get(element);

      if (descriptor !== undefined) {
        const { value } = element;

        Object.defineProperty(element, 'value', descriptor);
        descriptorMap.delete(element);
        element.value = value;
      }

      const handlers = handlersMap.get(element);

      if (handlers !== undefined) {
        element.removeEventListener('focus', handlers.onFocus);
        element.removeEventListener('blur', handlers.onBlur);
        element.removeEventListener('input', handlers.onInput);

        handlersMap.delete(element);
      }
    };
  }
}
