'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  onRefresh: () => Promise<boolean>;
  compact?: boolean;
}

// 未配 AI 密钥时的三步引导（命中即展示,不阻挡其他能力）
export function AiSetupGuide({ onRefresh, compact = false }: Props) {
  const [checking, setChecking] = React.useState(false);
  const [ok, setOk] = React.useState<boolean | null>(null);

  const doRefresh = async () => {
    setChecking(true);
    setOk(await onRefresh());
    setChecking(false);
  };

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-[13px] text-amber-900">
      <div className="font-semibold mb-1.5">先配置 AI 密钥，AI 生成才可用</div>
      {!compact && (
        <ol className="list-decimal pl-4 space-y-1 text-[12.5px] text-amber-900/90">
          <li>
            打开项目根目录的 <code className="bg-white/70 px-1 rounded">.env.local</code>，填
            <code className="bg-white/70 px-1 rounded">ANTHROPIC_API_KEY=…</code>
            （默认 MiniMax 接口，密钥在 platform.minimaxi.com 申请）。
          </li>
          <li>
            保存后重启开发服务器（<code className="bg-white/70 px-1 rounded">./dev.sh</code> 或
            <code className="bg-white/70 px-1 rounded">pnpm dev</code>）——密钥只在进程启动时读取。
          </li>
          <li>
            点下面的「重新检测」。<span className="opacity-80">没配 key 也能用：编辑器、预览、平台稿、ZIP 导出都正常，「纯排版」Agent 不依赖 AI。</span>
          </li>
        </ol>
      )}
      <Button size="sm" variant="outline" className="mt-2" onClick={doRefresh} disabled={checking}>
        {checking ? '检测中…' : ok ? '已配置' : '我已配置，重新检测'}
      </Button>
      {ok && (
        <span className="ml-2 inline-flex items-center gap-1 text-emerald-700">
          <Check size={13}/> AI 已可用
        </span>
      )}
    </div>
  );
}