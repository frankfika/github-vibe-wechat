export type PluginGroup = 'source' | 'quality' | 'assets' | 'publish';

export const PLUGIN_GROUP_LABELS: Record<PluginGroup, string> = {
  source: '素材与研究',
  quality: '写作与校验',
  assets: '图片与排版',
  publish: '发布与导出',
};

export interface CreatorPlugin {
  id: string;
  name: string;
  description: string;
  group: PluginGroup;
  icon: 'link' | 'shield' | 'layout' | 'image' | 'send' | 'archive' | 'search' | 'github' | 'fingerprint';
  status: 'built-in' | 'coming-soon';
  capability: string;
}

// 插件不是独立小工具，而是 Agent 在「素材 → 母稿 → 校验 → 发布」链路中可调用的能力。
// 只把已经接入产品的能力标成 built-in，避免市场展示与实际功能脱节。
export const CREATOR_PLUGINS: CreatorPlugin[] = [
  {
    id: 'web-reader',
    name: '网页素材读取',
    description: '读取新闻和文章链接正文，保留原始 URL，作为母稿素材使用。',
    group: 'source',
    icon: 'link',
    status: 'built-in',
    capability: '链接 → 可编辑素材',
  },
  {
    id: 'editorial-check',
    name: '编辑准则校验',
    description: '检查标题层级、图片编号、AI 味和营销化表达，写作时实时反馈。',
    group: 'quality',
    icon: 'shield',
    status: 'built-in',
    capability: '实时质量检查',
  },
  {
    id: 'wechat-layout',
    name: '公众号模板排版',
    description: '按所选模板把母稿转换为公众号富文本，并同步生成移动端预览。',
    group: 'assets',
    icon: 'layout',
    status: 'built-in',
    capability: '富文本预览与复制',
  },
  {
    id: 'image-pack',
    name: '图片与图注',
    description: '粘贴或拖入图片，自动压缩并随文章和 ZIP 一起保存。',
    group: 'assets',
    icon: 'image',
    status: 'built-in',
    capability: '图片嵌入与打包',
  },
  {
    id: 'platform-adapter',
    name: '九平台适配器',
    description: '按各平台钩子、长度、字段和发布习惯重写，而不是机械复制母稿。',
    group: 'publish',
    icon: 'send',
    status: 'built-in',
    capability: '一稿多平台重写',
  },
  {
    id: 'export-pack',
    name: '离线发布包',
    description: '导出 HTML、Markdown 和图片目录，作品和数据随时可以带走。',
    group: 'publish',
    icon: 'archive',
    status: 'built-in',
    capability: 'HTML / Markdown / ZIP',
  },
  {
    id: 'web-research',
    name: '联网研究',
    description: '围绕主题补充多来源资料、日期与引用，并把证据交给研究型 Agent。',
    group: 'source',
    icon: 'search',
    status: 'coming-soon',
    capability: '多来源检索与引用',
  },
  {
    id: 'github-context',
    name: 'GitHub 项目上下文',
    description: '读取公开仓库说明与 README，并与其他网页素材一起交给项目发布和解读流程。',
    group: 'source',
    icon: 'github',
    status: 'built-in',
    capability: '仓库说明与 README',
  },
  {
    id: 'brand-memory',
    name: '品牌与个人口吻',
    description: '从历史文章沉淀常用表达、禁用词和栏目规范，供所有 Agent 复用。',
    group: 'quality',
    icon: 'fingerprint',
    status: 'coming-soon',
    capability: '跨文章风格记忆',
  },
];

export const CREATOR_PLUGIN_MAP = Object.fromEntries(
  CREATOR_PLUGINS.map((plugin) => [plugin.id, plugin]),
) as Record<string, CreatorPlugin>;
