'use client';

import * as React from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DEFAULT_CONFIG, loadConfig, saveConfig } from '@/src/lib/config';
import { DEFAULT_AI_CONFIG, loadAiConfig, saveAiConfig, isAiConfigured } from '@/src/lib/ai-config';
import type { AiConfig } from '@/src/lib/ai-config';
import type { CreatorConfig, PlatformId, Voice } from '@/src/lib/types';
import { PLATFORM_ORDER, PLATFORMS } from '@/src/lib/platforms';

export default function SettingsPage() {
  const [cfg, setCfg] = React.useState<CreatorConfig>(DEFAULT_CONFIG);
  const [ai, setAi] = React.useState<AiConfig>(DEFAULT_AI_CONFIG);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    setCfg(loadConfig());
    setAi(loadAiConfig());
  }, []);

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const update = (patch: Partial<CreatorConfig>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    saveConfig(next);
    flash();
  };

  const updateAi = (patch: Partial<AiConfig>) => {
    const next = { ...ai, ...patch };
    setAi(next);
    saveAiConfig(next);
    flash();
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

          <Section title="AI 模型">
            {isAiConfigured(ai) ? (
              <p className="text-[12.5px] text-emerald-700 inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"/> AI 密钥已配置，可直接生成
              </p>
            ) : (
              <p className="text-[12.5px] text-amber-700">尚未配置 AI 密钥，生成不可用；编辑器 / 预览 / 平台稿 / 导出不受影响。</p>
            )}
            <Field label="API Key">
              <Input
                type="password"
                value={ai.apiKey}
                onChange={(e) => updateAi({ apiKey: e.target.value })}
                placeholder="sk-… 粘贴你的模型密钥"
                autoComplete="off"
              />
            </Field>
            <Field label="Base URL（可选，默认 MiniMax）">
              <Input value={ai.baseUrl} onChange={(e) => updateAi({ baseUrl: e.target.value })} placeholder="https://api.minimaxi.com/anthropic" autoComplete="off"/>
            </Field>
            <Field label="模型（可选，默认 MiniMax-M3）">
              <Input value={ai.model} onChange={(e) => updateAi({ model: e.target.value })} placeholder="MiniMax-M3" autoComplete="off"/>
            </Field>
            <p className="text-[11px] text-ink-muted -mt-1">
              密钥只保存在你的浏览器本地，仅在生成 / 适配请求时发送到服务端调用模型，不写入任何作品。改完即生效，无需重启。
            </p>
          </Section>

          <Section title="默认平台">
            <div className="flex flex-wrap gap-1.5">
              {PLATFORM_ORDER.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={
                    'h-7 px-2.5 rounded-full text-xs border ' +
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
            {saved && <span className="mr-2 text-ink">已保存</span>}
            所有设置自动保存到此浏览器；AI 密钥仅在生成 / 适配请求时发送到服务端调用模型。
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
