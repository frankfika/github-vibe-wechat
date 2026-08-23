'use client';

import * as React from 'react';

// 统一探测 AI 是否已配置（首页、AgentCompose、BriefPanel 共用）
export function useAiStatus() {
  const [aiReady, setAiReady] = React.useState<boolean | null>(null);

  const refresh = React.useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/ai-status');
      const d = (await res.json()) as { configured: boolean };
      setAiReady(d.configured);
      return d.configured;
    } catch {
      setAiReady(false);
      return false;
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return { aiReady, refresh };
}