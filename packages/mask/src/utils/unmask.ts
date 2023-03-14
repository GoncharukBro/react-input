import { Replacement } from '../types';

interface UnmaskParam {
  value: string;
  start?: number;
  end?: number;
  mask: string;
  replacement: Replacement;
  separate: boolean;
}

export default function unmask({
  value,
  start = 0,
  end,
  mask,
  replacement,
  separate,
}: UnmaskParam) {
  const slicedMask = mask.slice(start, end);
  const slicedValue = value.slice(start, end);

  return slicedMask.split('').reduce((prev, char, index) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, char);

    if (isReplacementKey && slicedValue[index] !== undefined && slicedValue[index] !== char) {
      return prev + slicedValue[index];
    }

    if (isReplacementKey && separate) {
      return prev + char;
    }

    return prev;
  }, '');
}
