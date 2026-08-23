'use client';

import * as React from 'react';
import { Sparkles, Loader2, Link as LinkIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input, Textarea } from './ui/input';
import { Select } from './ui/select';
import { useToast } from './ui/toast';
import { useAiStatus } from '@/src/lib/useAiStatus';
import { cn } from './ui/cn';
import type { Brief, MaterialType, PlatformId, Voice } from '@/src/lib/types';
import { PLATFORM_ORDER, PLATFORMS } from '@/src/lib/platforms';

interface Props {
  brief: Brief;
  onChange: (brief: Brief) => void;
  onGenerate: () => Promise<void>;
  generating: boolean;
}

const MATERIAL_OPTIONS: { value: MaterialType; label: string }[] = [
  { value: 'news', label: '新闻 / 事件 / 资讯' },
  { value: 'project-own', label: '自有 GitHub 项目' },
  { value: 'project-third', label: '第三方开源项目' },
  { value: 'topic', label: '观点 / 话题 / 随笔' },
  { value: 'copy', label: '已有文案（只排版）' },
];

export function BriefPanel({ brief, onChange, onGenerate, generating }: Props) {
  const [fetching, setFetching] = React.useState(false);
  const aiReady = useAiStatus();
  const { push } = useToast();

  const update = (patch: Partial<Brief>) => onChange({ ...brief, ...patch });

  const togglePlatform = (p: PlatformId) => {
    const set = new Set(brief.platforms);
    set.has(p) ? set.delete(p) : set.add(p);
    update({ platforms: Array.from(set) });
  };

  const onPickUrl = async () => {
    if (brief.materialType !== 'news') return;
    if (!/^https?:\/\//i.test(brief.material)) return;
    setFetching(true);
    try {
      // 走服务端路由避开 CORS
      const res = await fetch('/api/fetch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: brief.material }),
      });
      if (!res.ok) throw new Error(`抓取失败 (HTTP ${res.status})`);
      const { text } = (await res.json()) as { text: string | null };
      if (text) {
        update({ material: `${brief.material}\n\n---\n${text}` });
        push('success', '已抓取正文');
      } else {
        push('error', '该链接未抓到正文，请检查地址。');
      }
    } catch (e) {
      push('error', (e as Error).message || '抓取失败');
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-5 gap-4 bg-white">
      <div>
        <h2 className="text-base font-semibold tracking-tightish">创作指令</h2>
        <p className="text-xs text-ink-muted mt-1">
          {aiReady === null ? '检测 AI 配置…' : aiReady ? 'AI 已配置。给素材 + 你的判断，剩下交给模型。' : 'AI 未在服务端配置（.env.local 的 ANTHROPIC_API_KEY）。仍可手写或只排版。'}
        </p>
      </div>

      <Field label="素材类型">
        <Select
          value={brief.materialType}
          onChange={(e) => update({ materialType: e.target.value as MaterialType })}
        >
          {MATERIAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </Field>

      <Field
        label="素材"
        hint={brief.materialType === 'news' ? '支持 URL（可点右边的图标抓取正文）或粘贴文本' : '粘贴文本、链接或主题描述'}
      >
        <div className="flex gap-1.5">
          <Textarea
            value={brief.material}
            onChange={(e) => update({ material: e.target.value })}
            rows={5}
            placeholder={brief.materialType === 'news' ? 'https://...' : '把你的主题、痛点、判断贴在这里…'}
            className="flex-1"
          />
          {brief.materialType === 'news' && (
            <Button variant="outline" size="md" onClick={onPickUrl} disabled={fetching || !/^https?:\/\//i.test(brief.material)} aria-label={fetching ? '抓取正文链接中…' : '抓取链接正文'} title={fetching ? '抓取中…' : '抓取链接正文'}>
              {fetching ? <Loader2 size={14} className="animate-spin"/> : <LinkIcon size={14}/>}
            </Button>
          )}
        </div>
      </Field>

      <Field label="角度 / 立场" hint="这是文章的灵魂：你的判断，不是最安全的概括">
        <Textarea
          value={brief.angle}
          onChange={(e) => update({ angle: e.target.value })}
          rows={2}
          placeholder="我主要想表达……"
        />
      </Field>

      <div className="grid grid-cols-2 gap-2.5">
        <Field label="语气">
          <Select value={brief.voice} onChange={(e) => update({ voice: e.target.value as Voice })}>
            <option value="relaxed">relaxed 轻松口语</option>
            <option value="editorial">editorial 克制评论</option>
            <option value="technical">technical 技术</option>
            <option value="market">market 商业分析</option>
          </Select>
        </Field>
        <Field label="长度">
          <Select value={brief.length} onChange={(e) => update({ length: e.target.value as Brief['length'] })}>
            <option value="short">短 (&lt;800)</option>
            <option value="medium">中 (800–2000)</option>
            <option value="long">长 (&gt;2000)</option>
          </Select>
        </Field>
      </div>

      <Field label="标题方向" hint="留空则按编辑准则最后拟">
        <Input
          value={brief.titleHint ?? ''}
          onChange={(e) => update({ titleHint: e.target.value })}
          placeholder="人物/事件 + 出人意料判断 + 未来方向"
        />
      </Field>

      <Field label="平台" hint="未选则用 config.default_platforms">
        <div className="flex flex-wrap gap-1.5">
          {PLATFORM_ORDER.map((p) => (
            <PlatformChip
              key={p}
              active={brief.platforms.includes(p)}
              onClick={() => togglePlatform(p)}
            >
              {PLATFORMS[p].label}
            </PlatformChip>
          ))}
        </div>
      </Field>

      <Field label="行动号召（CTA）">
        <Input
          value={brief.cta ?? ''}
          onChange={(e) => update({ cta: e.target.value })}
          placeholder="默认：留言讨论 / 关注系列"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={brief.bilingual}
          onChange={(e) => update({ bilingual: e.target.checked })}
          className="h-4 w-4 accent-ink"
        />
        生成中英双语版本
      </label>

      <div className="pt-2 mt-auto">
        <Button onClick={onGenerate} disabled={generating || aiReady === false} size="lg" className="w-full">
          {generating ? <Loader2 size={16} className="animate-spin mr-1.5"/> : <Sparkles size={16} className="mr-1.5"/>}
          {generating ? '生成中…' : '生成母稿'}
        </Button>
        {aiReady === false && (
          <p className="text-xs text-ink-muted mt-2">在 .env.local 设置 ANTHROPIC_API_KEY 后重启 dev server 启用 AI 生成。</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-soft mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-ink-muted mt-1">{hint}</p>}
    </div>
  );
}

function PlatformChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-8 px-3 rounded-full text-xs border transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
        active ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink-line hover:border-ink',
      )}
    >
      {children}
    </button>
  );
}
