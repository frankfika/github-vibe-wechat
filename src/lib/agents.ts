import type { Brief, PlatformId } from './types';
import { PLATFORM_ORDER } from './platforms';

// ===== Agent 市场数据模型 =====
// 一个 Agent = 一套预置的写作偏好（风格/长度/平台/角度/写作指令），
// 用户只需选一张卡片 → 贴素材 → 标发布场景 → 生成。

export type AgentGroup = 'news' | 'opinion' | 'project' | 'commercial' | 'craft';

export const GROUP_LABELS: Record<AgentGroup, string> = {
  news: '新闻快评',
  opinion: '观点随笔',
  project: '项目 / 开源',
  commercial: '商业 / 发布',
  craft: '爆款 / 排版',
};

export interface ScenePreset {
  id: string;
  label: string;
  hint: string;
  platforms: PlatformId[];
}

export interface WriterAgent {
  id: string;
  emoji: string;
  name: string;
  tagline: string;
  description: string;
  group: AgentGroup;
  defaults: Partial<Brief>;
  inputHint: string;
  directive: string; // 追加进生成提示的写作指令（风格/结构/事实层级）
  pluginIds: string[]; // 运行这条工作流时会调用的内置能力
}

// ===== 发布场景（一次点选即解析出平台集合）=====
export const SCENES: ScenePreset[] = [
  { id: 'everything', label: '全网一稿多投', hint: '9 个平台全量分发', platforms: [...PLATFORM_ORDER] },
  { id: 'domestic', label: '国内矩阵', hint: '公众号 · 知乎 · 小红书 · B站', platforms: ['wechat', 'zhihu', 'xiaohongshu', 'bilibili'] },
  { id: 'dev', label: '开发者社媒', hint: 'X · HN · Reddit · CSDN', platforms: ['x', 'hacker-news', 'reddit', 'csdn'] },
  { id: 'launch', label: '新品首发', hint: 'PH · X · HN · 公众号', platforms: ['product-hunt', 'x', 'hacker-news', 'wechat'] },
  { id: 'chat', label: '短平快社媒', hint: 'X · B站 · 小红书', platforms: ['x', 'bilibili', 'xiaohongshu'] },
];

// ===== 内置 Agent 市场 =====
export const AGENTS: WriterAgent[] = [
  {
    id: 'news-fast',
    emoji: '📰',
    name: '极速新闻',
    tagline: '贴链接，五分钟出新闻解读',
    description: '贴链接或正文，五分钟左右出一篇带事实核查、克制评论的新闻解读母稿，数据标日期与「据X报道」。',
    group: 'news',
    defaults: {
      materialType: 'news',
      voice: 'newswire',
      length: 'medium',
      platforms: ['wechat', 'x', 'zhihu'],
      angle: '这篇新闻对普通读者真正重要的判断',
    },
    inputHint: '贴新闻链接（可抓取正文）或粘贴文本…',
    directive: '数据与事实分层：先给判断，再给证据链，标注「据X报道」与日期；克制评论，不写情绪化断言。',
    pluginIds: ['web-reader', 'editorial-check', 'platform-adapter'],
  },
  {
    id: 'opinion',
    emoji: '💬',
    name: '观点随笔',
    tagline: '你的主题 + 一句判断',
    description: '你的主题 + 一句判断，论点先行、无 AI 味的第一人称随笔，长短句交替。',
    group: 'opinion',
    defaults: {
      materialType: 'topic',
      voice: 'essay',
      length: 'medium',
      platforms: ['wechat', 'x', 'zhihu', 'xiaohongshu'],
      angle: '',
    },
    inputHint: '贴主题、痛点或素材，并写下你的判断…',
    directive: '论点先行，长短句交替，第一人称真实经验；避免空泛口号与 AI 味排比。',
    pluginIds: ['editorial-check', 'platform-adapter'],
  },
  {
    id: 'project-launch',
    emoji: '🚀',
    name: '项目首发',
    tagline: '自有开源项目，Show HN 结构',
    description: '自有开源项目：动机 → 端到端流程 → 关键设计选择 → 威胁模型 → 技术栈 → 仓库体验，长文 + 多平台转发。',
    group: 'project',
    defaults: {
      materialType: 'project-own',
      voice: 'maker',
      length: 'long',
      platforms: ['x', 'hacker-news', 'reddit', 'csdn', 'zhihu', 'wechat'],
      angle: '动机 + 端到端流程 + 威胁模型 + 技术栈 + 仓库体验',
    },
    inputHint: '贴项目名、仓库链接或功能描述…',
    directive: '按 Show HN 结构组织：动机→端到端流程→关键设计选择→威胁模型→技术栈→仓库体验→具体讨论问题。',
    pluginIds: ['editorial-check', 'platform-adapter', 'export-pack'],
  },
  {
    id: 'project-review',
    emoji: '🔍',
    name: '第三方项目解读',
    tagline: '把别人的项目拆给所有人懂',
    description: '把第三方开源项目拆给外行看懂：机制讲清、谁受益谁受损、落到你的判断。',
    group: 'project',
    defaults: {
      materialType: 'project-third',
      voice: 'explainer',
      length: 'medium',
      platforms: ['wechat', 'zhihu', 'x'],
      angle: '值得关注的技术选择 + 具体场景价值',
    },
    inputHint: '贴第三方开源项目链接或介绍…',
    directive: '把机制讲给外行听懂；讲清谁受益谁受损；落到具体可验证的判断。',
    pluginIds: ['web-reader', 'editorial-check', 'platform-adapter'],
  },
  {
    id: 'market-pulse',
    emoji: '📈',
    name: '商业分析',
    tagline: '行业新闻 → 可证伪判断',
    description: '行业新闻 / 财报 / 访谈要点：数据给出来源与报道时间、竞争格局逐层展开、给可证伪判断。',
    group: 'commercial',
    defaults: {
      materialType: 'topic',
      voice: 'market',
      length: 'medium',
      platforms: ['wechat', 'zhihu', 'x'],
      angle: '行业竞争格局里谁受益谁受损',
    },
    inputHint: '贴行业新闻、财报或访谈要点…',
    directive: '数据给出来源与报道时间；竞争格局逐层展开；给可证伪判断，不写营销腔。',
    pluginIds: ['web-reader', 'editorial-check', 'platform-adapter'],
  },
  {
    id: 'ph-launch',
    emoji: '📣',
    name: 'Product Hunt 发布',
    tagline: '字段化提交 + Maker Comment',
    description: 'Submit 字段值（Name/Tagline/描述/Topics）+ 第一人称 Maker Comment：动机/流程/安全/限制/征求反馈。',
    group: 'commercial',
    defaults: {
      materialType: 'project-own',
      voice: 'maker',
      length: 'medium',
      platforms: ['product-hunt'],
      angle: '目标用户是谁、解决了什么',
    },
    inputHint: '贴产品名、描述、目标用户…',
    directive: '字段化输出 Name/Tagline/Short Description/Topics，再加第一人称 Maker Comment：动机/流程/安全/限制/征求反馈。',
    pluginIds: ['editorial-check', 'platform-adapter'],
  },
  {
    id: 'xiaohongshu',
    emoji: '✨',
    name: '小红书种草',
    tagline: '口语化种草笔记',
    description: '口语化种草笔记：图先文后、5-8 个标签、结尾互动问题，不夸张不承诺。',
    group: 'craft',
    defaults: {
      materialType: 'topic',
      voice: 'social',
      length: 'short',
      platforms: ['xiaohongshu'],
      angle: '真实体验 + 避坑点',
    },
    inputHint: '贴产品 / 体验 / 场景…',
    directive: '口语化种草：图先文后逻辑，5-8 个相关标签，结尾互动问题；不夸张不承诺。',
    pluginIds: ['editorial-check', 'image-pack', 'platform-adapter'],
  },
  {
    id: 'bilibili',
    emoji: '🎬',
    name: 'B站口播',
    tagline: '视频发布包：封面 + 提纲 + 置顶',
    description: '视频发布包：封面标题、分段口播提纲、置顶评论、标签。',
    group: 'craft',
    defaults: {
      materialType: 'topic',
      voice: 'script',
      length: 'medium',
      platforms: ['bilibili'],
      angle: '视频悬念钩子',
    },
    inputHint: '贴选题、口播要点或资料…',
    directive: '输出短视频发布包：封面标题→分段口播提纲（每段一个钩子）→置顶评论→标签。',
    pluginIds: ['editorial-check', 'platform-adapter'],
  },
  {
    id: 'copy-format',
    emoji: '🧪',
    name: '纯排版',
    tagline: '已有文案，原样排版校验',
    description: '已有文案原样保留，只做校验与公众号成品排版——未配 AI key 也能跑通整套发布流程。',
    group: 'craft',
    defaults: {
      materialType: 'copy',
      voice: 'relaxed',
      length: 'medium',
      platforms: ['wechat'],
      angle: '',
    },
    inputHint: '粘贴已有文案（不改内容，只排版）…',
    directive: '不改原文内容，仅整理为符合编辑准则的排版；不做 AI 改写。',
    pluginIds: ['editorial-check', 'wechat-layout', 'image-pack', 'export-pack'],
  },
];

export function resolveAgent(id?: string): WriterAgent | undefined {
  if (!id) return undefined;
  return AGENTS.find((a) => a.id === id);
}

export function allPlatforms(): PlatformId[] {
  return [...PLATFORM_ORDER];
}

// Agent + 可选发布场景 → 新建文章用的 Brief
export function mergeBrief(
  agent: WriterAgent,
  sceneId?: string,
  custom: Partial<Brief> = {},
): Brief {
  const scene = sceneId ? SCENES.find((s) => s.id === sceneId) : undefined;
  const base: Brief = {
    material: '',
    materialType: 'topic',
    angle: '',
    voice: 'relaxed',
    length: 'medium',
    bilingual: false,
    platforms: [],
    ...agent.defaults,
  };
  const platforms = scene?.platforms ?? base.platforms;
  return {
    ...base,
    platforms,
    agentId: agent.id,
    scene: sceneId ?? agent.id, // 默认场景即 agent 自身预设
    ...custom,
  };
}
