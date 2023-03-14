export interface CustomInputEvent<D = unknown> extends CustomEvent<D> {
  target: EventTarget & HTMLInputElement;
}

export type CustomInputEventHandler<D = unknown> = (event: CustomInputEvent<D>) => void;

export type InputType = 'initial' | 'insert' | 'deleteBackward' | 'deleteForward';

export interface InputAttributes {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

interface InitParam {
  controlled: boolean;
  initialValue: string;
}

export type Init = (param: InitParam) => Pick<InputAttributes, 'value'>;

interface TrackingParam {
  inputType: InputType;
  added: string;
  deleted: string;
  previousValue: string;
  selectionStartRange: number;
  selectionEndRange: number;
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

export type Tracking<D = unknown> = (param: TrackingParam) => InputAttributes & { __detail: D };

export interface ExtendedHTMLInputElement extends HTMLInputElement {
  _wrapperState?: {
    controlled?: boolean;
    initialValue?: string;
  };
  _valueTracker?: {
    getValue?: () => string;
    setValue?: (value: string) => void;
  };
}

export type InputComponentProps<P extends object | null = null> = P extends null
  ? { component?: undefined } & React.InputHTMLAttributes<HTMLInputElement>
  : P extends object
  ? { component: React.ComponentType<P & React.RefAttributes<HTMLInputElement>> } & P
  : {};

export type InputComponent<T extends object> = {
  (props: T & InputComponentProps & React.RefAttributes<HTMLInputElement>): JSX.Element;
  <P extends object>(
    props: T & InputComponentProps<P> & React.RefAttributes<HTMLInputElement>
  ): JSX.Element;
};
