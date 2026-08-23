'use client';

import * as React from 'react';

/** AI 配置状态：global 单例，避免首页与指令面板重复请求 /api/ai-status。
 *  shared: true | false | null(检测中)  */
const cache: { loaded: boolean; value: boolean } = { loaded: false, value: false };

export function useAiStatus(): boolean | null {
  const [state, setState] = React.useState<boolean | null>(
    cache.loaded ? cache.value : null,
  );

  React.useEffect(() => {
    if (cache.loaded) {
      setState(cache.value);
      return;
    }
    let alive = true;
    fetch('/api/ai-status')
      .then((r) => r.json())
      .then((d: { configured: boolean }) => {
        cache.loaded = true;
        cache.value = !!d.configured;
        if (alive) setState(cache.value);
      })
      .catch(() => {
        cache.loaded = true;
        cache.value = false;
        if (alive) setState(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}