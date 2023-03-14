import React from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import { useNumberFormat } from '../src';

export default {
  title: 'Number Format',
} as Meta;

export const Hook: ComponentStory<any> = () => {
  const refIN = useNumberFormat();
  const refRU = useNumberFormat({ locales: 'ru-RU', maximumIntegerDigits: 6 });
  const refRUCur = useNumberFormat({ locales: 'ru-RU', format: 'currency', currency: 'RUB' });
  const refJA = useNumberFormat({ locales: 'ja-JP', format: 'currency', currency: 'RUB' });
  const refAR = useNumberFormat({ locales: 'ar-EG' });
  const refCN = useNumberFormat({ locales: 'zh-Hans-CN-u-nu-hanidec' });

  return (
    <>
      <div>
        <p>{`{ locales: 'en-IN', options: { minimumIntegerDigits: 4 } }`}</p>
        <input ref={refIN} />
      </div>

      <hr />

      <div>
        <p>{`{ locales: 'ru-RU', options: { maximumIntegerDigits: 6 } }`}</p>
        <input ref={refRU} />
      </div>

      <hr />

      <div>
        <p>{`{ locales: 'ru-RU', options: { format: 'currency', currency: 'RUB' } }`}</p>
        <input ref={refRUCur} />
      </div>

      <hr />

      <div>
        <p>{`{ locales: 'ja-JP', options: { format: 'currency', currency: 'RUB' } }`}</p>
        <input ref={refJA} />
      </div>

      <hr />

      <div>
        <p>{`{ locales: 'ar-EG' }`}</p>
        <input ref={refAR} />
      </div>

      <hr />

      <div>
        <p>{`{ locales: 'zh-Hans-CN-u-nu-hanidec' }`}</p>
        <input ref={refCN} />
      </div>
    </>
  );
};
