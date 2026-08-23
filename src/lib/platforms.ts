import type { PlatformId } from './types';

// 各平台的写作约束与适配规则（吸收原 platforms.md）
// 用于：(1) 给 LLM 的改写提示；(2) UI 上显示该平台的字段与限制。

export interface PlatformSpec {
  id: PlatformId;
  name: string;
  label: string;
  shape: string;            // 形态
  hook: string;             // 钩子要求
  depth: string;            // 事实深度
  copyMode: 'rich' | 'markdown' | 'plain';
  maxChars?: number;        // 软上限
  fields: string[];         // 发布页字段
  officialUrl?: string;     // 官方发布入口
  rules: string;            // 给 LLM 的改写规则
}

export const PLATFORMS: Record<PlatformId, PlatformSpec> = {
  wechat: {
    id: 'wechat',
    name: 'WeChat',
    label: '公众号',
    shape: '母稿长文',
    hook: '痛点和结果，不报技术栈',
    depth: '全量',
    copyMode: 'rich',
    fields: ['title', 'eyebrow', 'body'],
    rules:
      '单一 h1；图片 01_ 编号 + 来源图注；rich 复制嵌入全部本地图；语气克制、有判断；不堆砌结论。',
  },
  x: {
    id: 'x',
    name: 'X',
    label: 'X / Twitter',
    shape: '短帖 + 可选长文 + 16:9 配图',
    hook: '读者痛点/惊讶/结果，不宣告文章发布',
    depth: '精简',
    copyMode: 'plain',
    maxChars: 240,
    fields: ['title', 'body', 'hashtags'],
    officialUrl: 'https://twitter.com/intent/tweet',
    rules:
      '≤240 中文字符含 URL；用 1–2 个相关 hashtag，不要 Markdown 链接；不要压缩成一段；配图用真实素材；CTA 简短具体。',
  },
  reddit: {
    id: 'reddit',
    name: 'Reddit',
    label: 'Reddit',
    shape: '第一人称透明帖',
    hook: '原始痛点 + 为何现有方案不对',
    depth: '中',
    copyMode: 'markdown',
    fields: ['title', 'body', 'subreddit'],
    rules:
      '选一个主题匹配的子版块；第一人称、披露作者身份；只出现一次 canonical URL；不要求点赞、不跨社区复制；语气真实可讨论。',
  },
  'hacker-news': {
    id: 'hacker-news',
    name: 'Hacker News',
    label: 'Hacker News',
    shape: 'Show HN: 文本帖',
    hook: '直接可运行的产品 URL',
    depth: '技术 + 个人说明',
    copyMode: 'plain',
    fields: ['title', 'body'],
    officialUrl: 'https://news.ycombinator.com/submit',
    rules:
      'Show HN: 标题；动机 + 端到端流程 + 关键设计选择 + 威胁模型 + 技术栈 + 仓库 + 具体讨论问题；不假装 HN 插入本地图片；不要求投票。',
  },
  zhihu: {
    id: 'zhihu',
    name: 'Zhihu',
    label: '知乎',
    shape: '中文长文回答/文章',
    hook: '用户问题 + 产品判断',
    depth: '全量',
    copyMode: 'rich',
    fields: ['title', 'body'],
    officialUrl: 'https://www.zhihu.com/',
    rules: '围绕用户问题、实现选择、局限、实际用法展开；rich 复制保留图片与样式。',
  },
  csdn: {
    id: 'csdn',
    name: 'CSDN',
    label: 'CSDN',
    shape: '技术中文文章',
    hook: '问题 → 架构 → 安全 → 部署 → 用法 → 局限 → 源码',
    depth: '全量技术',
    copyMode: 'markdown',
    fields: ['title', 'body', 'tags'],
    officialUrl: 'https://editor.csdn.net/md/',
    rules: '保持 Markdown 友好结构；代码块完整可运行；给出参考链接与许可证说明。',
  },
  'product-hunt': {
    id: 'product-hunt',
    name: 'Product Hunt',
    label: 'Product Hunt',
    shape: '发布工作表 + Maker Comment',
    hook: '产品名、标语、描述、Topics',
    depth: '字段化',
    copyMode: 'plain',
    fields: ['name', 'tagline', 'short_description', 'topics', 'maker_comment'],
    officialUrl: 'https://www.producthunt.com/posts/new',
    rules:
      '提交前核对当前字段要求；Maker Comment 第一人称：动机、流程、安全、限制、反馈请求；不虚构画廊素材。',
  },
  bilibili: {
    id: 'bilibili',
    name: 'Bilibili',
    label: 'B站',
    shape: '视频/专栏发布包',
    hook: '视频标题、封面、简介、口播提纲',
    depth: '中',
    copyMode: 'markdown',
    fields: ['title', 'description', 'outline', 'pinned_comment', 'tags'],
    officialUrl: 'https://member.bilibili.com/v2/',
    rules:
      '分段口播提纲 + 置顶评论 + 标签；不伪装成自动上传视频；用户手动上传。',
  },
  xiaohongshu: {
    id: 'xiaohongshu',
    name: 'Xiaohongshu',
    label: '小红书',
    shape: '图文笔记发布包',
    hook: '短标题、图先文后、互动问题',
    depth: '精简',
    copyMode: 'markdown',
    fields: ['title', 'body', 'tags', 'question'],
    officialUrl: 'https://creator.xiaohongshu.com/',
    rules:
      '5–8 个相关标签；结尾互动问题；避免"爆款""永久安全"类不可验证承诺；口语化但不夸张。',
  },
};

export const PLATFORM_ORDER: PlatformId[] = [
  'wechat',
  'x',
  'zhihu',
  'xiaohongshu',
  'bilibili',
  'csdn',
  'reddit',
  'hacker-news',
  'product-hunt',
];
