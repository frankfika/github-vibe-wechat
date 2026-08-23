'use client';

import * as React from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DEFAULT_CONFIG, loadConfig, saveConfig } from '@/src/lib/config';
import type { CreatorConfig, PlatformId, Voice } from '@/src/lib/types';
import { PLATFORM_ORDER, PLATFORMS } from '@/src/lib/platforms';

export default function SettingsPage() {
  const [cfg, setCfg] = React.useState<CreatorConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => { setCfg(loadConfig()); }, []);

  const update = (patch: Partial<CreatorConfig>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    saveConfig(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const togglePlatform = (p: PlatformId) => {
    const set = new Set(cfg.defaultPlatforms);
    set.has(p) ? set.delete(p) : set.add(p);
    update({ defaultPlatforms: Array.from(set) });
  };

  return (
    <AppShell>
      <div className="h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-12">
          <h1 className="text-2xl font-bold tracking-tightish mb-1">设置</h1>
          <p className="text-sm text-ink-muted mb-8">这些默认会应用到所有新文章。改完自动保存到浏览器本地。</p>

          <Section title="默认平台">
            <div className="flex flex-wrap gap-1.5">
              {PLATFORM_ORDER.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  aria-pressed={cfg.defaultPlatforms.includes(p)}
                  className={
                    'h-8 px-3 rounded-full text-xs border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ' +
                    (cfg.defaultPlatforms.includes(p)
                      ? 'bg-ink text-white border-ink'
                      : 'bg-white text-ink-soft border-ink-line hover:border-ink')
                  }
                >
                  {PLATFORMS[p].label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="公众号">
            <Field label="系列标题前缀">
              <Input value={cfg.seriesTitle} onChange={(e) => update({ seriesTitle: e.target.value })} placeholder="如 Vibe Coding｜；留空则不用系列前缀" />
            </Field>
            <Field label="Eyebrow（默认）">
              <Input value={cfg.wechatEyebrow} onChange={(e) => update({ wechatEyebrow: e.target.value })} />
            </Field>
            <Field label="作者署名（文末）">
              <Input value={cfg.authorSignature} onChange={(e) => update({ authorSignature: e.target.value })} placeholder="如 陈放Frank" />
            </Field>
            <Field label="账号名">
              <Input value={cfg.accountName} onChange={(e) => update({ accountName: e.target.value })} />
            </Field>
          </Section>

          <Section title="新闻渠道">
            <Field label="Eyebrow">
              <Input value={cfg.newsEyebrow} onChange={(e) => update({ newsEyebrow: e.target.value })} />
            </Field>
          </Section>

          <Section title="默认风格">
            <Field label="语气">
              <Select value={cfg.voice} onChange={(e) => update({ voice: e.target.value as Voice })}>
                <option value="relaxed">relaxed 轻松口语</option>
                <option value="editorial">editorial 克制评论</option>
                <option value="technical">technical 技术</option>
                <option value="market">market 商业分析</option>
              </Select>
            </Field>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={cfg.bilingual}
                onChange={(e) => update({ bilingual: e.target.checked })}
                className="h-4 w-4 accent-ink"
              />
              默认生成中英双语
            </label>
          </Section>

          <div className="mt-8 text-xs text-ink-muted">
            AI 模型在 .env.local 里配（ANTHROPIC_API_KEY / ANTHROPIC_BASE_URL / ANTHROPIC_MODEL）。改完重启 dev server 生效。
            {saved && <span className="ml-2 text-ink">已保存</span>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold tracking-tightish mb-3 text-ink">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-soft mb-1">{label}</label>
      {children}
    </div>
  );
}
