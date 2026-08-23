'use client';

import * as React from 'react';
import { Sparkles, Loader2, Link as LinkIcon, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input, Textarea } from './ui/input';
import { Select } from './ui/select';
import { cn } from './ui/cn';
import { AiSetupGuide } from './AiSetupGuide';
import { useAiStatus } from '@/src/lib/use-ai-status';
import { resolveAgent, SCENES, allPlatforms } from '@/src/lib/agents';
import { PLATFORMS } from '@/src/lib/platforms';
import type { Brief, PlatformId, Voice } from '@/src/lib/types';

interface Props {
  brief: Brief;
  onChange: (brief: Brief) => void;
  onGenerate: () => Promise<void>;
  generating: boolean;
}

const VOICE_LABELS: Record<Voice, string> = {
  relaxed: '轻松口语',
  editorial: '克制评论',
  technical: '技术',
  market: '商业分析',
};

// Agent 优先的极简编排器：只露出「素材 + 发布地点 + 生成」，
// 语气/长度/标题/CTA/双语/细粒度平台全部折叠进高级抽屉。
export function AgentCompose({ brief, onChange, onGenerate, generating }: Props) {
  const { aiReady, refresh } = useAiStatus();
  const [showGuide, setShowGuide] = React.useState(false);
  const [fetching, setFetching] = React.useState(false);

  const agent = resolveAgent(brief.agentId);

  // Hooks 恒定调用后再分支
  const update = (patch: Partial<Brief>) => onChange({ ...brief, ...patch });

  if (!agent) return null;

  const selectedScene = SCENES.find((s) => s.id === brief.scene);

  const pickScene = (sceneId: string) => {
    const scene = SCENES.find((s) => s.id === sceneId);
    update({ scene: sceneId, platforms: scene?.platforms ?? brief.platforms });
  };

  const togglePlatform = (p: PlatformId) => {
    const set = new Set(brief.platforms);
    set.has(p) ? set.delete(p) : set.add(p);
    update({ platforms: Array.from(set) });
  };

  const onPickUrl = async () => {
    if (brief.materialType !== 'news' || !/^https?:\/\//i.test(brief.material)) return;
    setFetching(true);
    try {
      const res = await fetch('/api/fetch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: brief.material }),
      });
      if (!res.ok) throw new Error(`抓取失败 (HTTP ${res.status})`);
      const { text } = (await res.json()) as { text: string | null };
      if (text) update({ material: `${brief.material}\n\n---\n${text}` });
    } catch (e) {
      alert((e as Error).message || '抓取失败');
    } finally {
      setFetching(false);
    }
  };

  const handleGenerate = () => {
    if (aiReady === false) {
      setShowGuide(true);
      return;
    }
    void onGenerate();
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-5 gap-4 bg-white">
      {/* Agent 卡 */}
      <div className="rounded-xl border border-ink-line p-3.5 flex items-start gap-3 bg-ink-panel/30">
        <div className="text-2xl leading-none mt-0.5">{agent.emoji}</div>
        <div className="min-w-0">
          <div className="text-sm font-semibold">{agent.name}</div>
          <div className="text-[12px] text-ink-soft leading-snug mt-0.5">{agent.description}</div>
        </div>
      </div>

      {/* 素材 */}
      <Field label="素材" hint={brief.materialType === 'news' ? '支持 URL（点图标抓取正文）或粘贴文本' : agent.inputHint}>
        <div className="flex gap-1.5">
          <Textarea
            value={brief.material}
            onChange={(e) => update({ material: e.target.value })}
            rows={5}
            placeholder={agent.inputHint}
            className="flex-1"
          />
          {brief.materialType === 'news' && (
            <Button variant="outline" size="md" onClick={onPickUrl} disabled={fetching} title="抓取链接正文">
              {fetching ? <Loader2 size={14} className="animate-spin"/> : <LinkIcon size={14}/>}
            </Button>
          )}
        </div>
      </Field>

      {/* 发布场景 */}
      <Field label="发布地点" hint="选一个场景，或去「高级」里精细勾选平台">
        <div className="flex flex-wrap gap-1.5">
          {SCENES.map((s) => (
            <Chip
              key={s.id}
              active={selectedScene?.id === s.id}
              onClick={() => pickScene(s.id)}
              title={s.hint}
            >
              {s.label}
            </Chip>
          ))}
          <Chip active={!selectedScene} onClick={() => update({ scene: undefined })} title="按 Agent 默认平台">
            默认
          </Chip>
        </div>
        <p className="text-[11px] text-ink-muted mt-1.5">
          {selectedScene ? `→ ${selectedScene.hint}` : '→ 使用该 Agent 预设的平台'}
          {brief.platforms.length > 0 && `（当前 ${brief.platforms.map((p) => PLATFORMS[p].label).join(' · ')}）`}
        </p>
      </Field>

      {/* 高级选项 */}
      <details className="group rounded-lg border border-ink-line">
        <summary className="flex items-center justify-between px-3 py-2 cursor-pointer text-[13px] font-medium text-ink-soft select-none">
          高级选项
          <ChevronDown size={14} className="text-ink-muted transition-transform group-open:rotate-180"/>
        </summary>
        <div className="px-3 pb-3 pt-1 flex flex-col gap-3 border-t border-ink-line">
          <Field label="角度 / 立场" hint="想给模型的判断；留空则按 Agent 预设">
            <Textarea
              value={brief.angle ?? ''}
              onChange={(e) => update({ angle: e.target.value })}
              rows={2}
              placeholder="我主要想表达……"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="语气">
              <Select value={brief.voice} onChange={(e) => update({ voice: e.target.value as Voice })}>
                <option value="relaxed">{VOICE_LABELS.relaxed}</option>
                <option value="editorial">{VOICE_LABELS.editorial}</option>
                <option value="technical">{VOICE_LABELS.technical}</option>
                <option value="market">{VOICE_LABELS.market}</option>
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
          <Field label="行动号召（CTA）">
            <Input value={brief.cta ?? ''} onChange={(e) => update({ cta: e.target.value })} placeholder="默认按编辑准则"/>
          </Field>
          <Field label="平台精细勾选">
            <div className="flex flex-wrap gap-1.5">
              {allPlatforms().map((p) => (
                <Chip key={p} active={brief.platforms.includes(p)} onClick={() => togglePlatform(p)}>
                  {PLATFORMS[p].label}
                </Chip>
              ))}
            </div>
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
        </div>
      </details>

      <div className="pt-2 mt-auto">
        <Button onClick={handleGenerate} disabled={generating} size="lg" className="w-full">
          {generating ? <Loader2 size={16} className="animate-spin mr-1.5"/> : <Sparkles size={16} className="mr-1.5"/>}
          {generating ? '生成中…' : '生成母稿'}
        </Button>
        {showGuide && (
          <div className="mt-2">
            <AiSetupGuide onRefresh={refresh}/>
          </div>
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

function Chip({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'h-7 px-2.5 rounded-full text-xs border transition-colors',
        active ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink-line hover:border-ink',
      )}
    >
      {children}
    </button>
  );
}