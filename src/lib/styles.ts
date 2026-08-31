import type { Voice } from './types';

export type StyleGroup = 'clear' | 'editorial' | 'narrative' | 'professional' | 'platform';

export const STYLE_GROUP_LABELS: Record<StyleGroup, string> = {
  clear: '清晰表达',
  editorial: '新闻与评论',
  narrative: '叙事与个人',
  professional: '专业内容',
  platform: '平台原生',
};

export interface WritingStylePreset {
  id: Voice;
  name: string;
  tagline: string;
  description: string;
  group: StyleGroup;
  symbol: string;
  bestFor: string[];
  sample: string;
  sourceNote: string;
  directive: string;
}

// 风格是可复用的表达层：Agent 决定工作流，风格决定声音。
// 命名保持中性，不要求模型模仿具体媒体或在世作者。
export const WRITING_STYLES: WritingStylePreset[] = [
  {
    id: 'relaxed',
    name: '自然口语',
    tagline: '像一个清醒的人在认真聊天',
    description: '常用词、自然节奏和适度第一人称，亲近但不装熟，不用网络热梗堆气氛。',
    group: 'clear',
    symbol: 'Aa',
    bestFor: ['日常分享', 'Newsletter', '轻量观点'],
    sample: '这件事看起来复杂，其实先抓住两个变化就够了。',
    sourceNote: 'Human voice / conversational writing',
    directive: '使用自然中文和常用词，像对一个聪明的朋友解释；允许适度第一人称和长短句变化；不装熟、不卖萌、不堆网络热梗。',
  },
  {
    id: 'editorial',
    name: '克制评论',
    tagline: '判断明确，情绪收住',
    description: '先给可验证判断，再展开证据和影响；区分事实、推断与个人意见。',
    group: 'editorial',
    symbol: '§',
    bestFor: ['时事评论', '公众号', '行业观察'],
    sample: '真正值得关注的不是发布本身，而是成本结构开始改变。',
    sourceNote: 'Editorial analysis / fact-opinion separation',
    directive: '论点先行但不过度断言；明确区分事实、推断和观点；每个判断说明证据或推理路径；避免情绪化形容词和胜负叙事。',
  },
  {
    id: 'newswire',
    name: '新闻快讯',
    tagline: '重要信息前置，来源清楚',
    description: '倒金字塔结构，开头回答发生了什么、何时发生、为何重要，事实均有归属。',
    group: 'editorial',
    symbol: 'N',
    bestFor: ['新闻摘要', '事件更新', '快报'],
    sample: '该公司周一发布新服务，首先影响的是中小团队的使用成本。',
    sourceNote: 'Newswire standards / inverted pyramid',
    directive: '使用倒金字塔结构：最重要的新事实和影响放在开头，再给背景与细节；所有数字、引语和争议性事实标明来源与日期；不用悬念开场。',
  },
  {
    id: 'explainer',
    name: '深度解释',
    tagline: '把复杂机制讲给外行听懂',
    description: '从读者问题进入，逐层解释机制、案例、边界与现实影响，不牺牲准确性。',
    group: 'clear',
    symbol: '?',
    bestFor: ['概念科普', '项目解读', '趋势分析'],
    sample: '要理解它为什么有效，先看旧流程里哪一步最耗时间。',
    sourceNote: 'Explanatory journalism / reader-first content design',
    directive: '从读者最可能提出的问题开始；先用一句话给直观答案，再分层解释机制；技术词首次出现即解释；使用具体例子，并主动说明边界、反例和未解决问题。',
  },
  {
    id: 'essay',
    name: '个人随笔',
    tagline: '从具体经验走向一个判断',
    description: '用真实场景和第一人称组织思考，允许停顿和转折，但不虚构经历。',
    group: 'narrative',
    symbol: '✎',
    bestFor: ['观点随笔', '创作复盘', '个人公众号'],
    sample: '我第一次意识到这个问题，不是在会议里，而是在一次失败的发布之后。',
    sourceNote: 'Personal essay / reflective narrative',
    directive: '以真实的具体场景、观察或困惑开篇，再自然走向判断；使用第一人称但不虚构经历；保留犹豫、转折和细节；避免鸡汤结论与整齐排比。',
  },
  {
    id: 'maker',
    name: '创始人手记',
    tagline: '为什么做、怎么做、哪里还不够',
    description: '第一人称讲产品动机、关键选择、真实限制和希望获得的具体反馈。',
    group: 'narrative',
    symbol: 'M',
    bestFor: ['项目首发', 'Show HN', 'Maker Comment'],
    sample: '我做它，是因为每次发布前都在重复同一套低价值整理工作。',
    sourceNote: 'Maker launch / factual founder voice',
    directive: '第一人称直说真实痛点和动机；讲清产品是什么、如何工作、与现有方案的具体差异；主动披露限制、定价或风险；不写营销口号，结尾提出一个具体反馈问题。',
  },
  {
    id: 'technical',
    name: '技术教程',
    tagline: '目标、原理、步骤、验证',
    description: '主动语态和现在时，顺序步骤用编号，代码和术语保持准确可执行。',
    group: 'professional',
    symbol: '</>',
    bestFor: ['教程', 'README', '架构说明'],
    sample: '先启动本地服务，再用健康检查确认模型连接是否可用。',
    sourceNote: 'Developer documentation style',
    directive: '先说明读者完成后能得到什么及前置条件；使用主动语态和现在时；顺序操作用编号，非顺序信息用项目符号；解释原理、给出可运行步骤、验证方式、常见错误与限制。',
  },
  {
    id: 'market',
    name: '商业分析',
    tagline: '市场结构、利益变化、可证伪判断',
    description: '从数据和机制解释竞争格局，说明谁受益、谁受损以及判断失效的条件。',
    group: 'professional',
    symbol: '↗',
    bestFor: ['行业研究', '财报解读', '竞争分析'],
    sample: '如果推理成本继续下降，最先被重估的不是模型公司，而是交付环节。',
    sourceNote: 'Market analysis / falsifiable thesis',
    directive: '从市场结构与利益关系展开；数据注明口径、来源和时间；解释谁受益、谁受损以及为什么；给出可以被未来数据证伪的判断，并明确判断成立与失效的条件。',
  },
  {
    id: 'research',
    name: '研究简报',
    tagline: '主张、证据、不确定性',
    description: '按问题、证据、推理、限制和结论组织，纳入支持与反对材料。',
    group: 'professional',
    symbol: '∴',
    bestFor: ['研究综述', '决策备忘', '事实核查'],
    sample: '现有证据支持相关性，但不足以证明这一变化由单一因素造成。',
    sourceNote: 'Evidence-based writing / claim-evidence-reasoning',
    directive: '明确研究问题与结论置信度；按主张—证据—推理组织；同时呈现支持、反对和缺失的证据；区分相关与因果；列出方法、样本或来源限制，避免把推测写成结论。',
  },
  {
    id: 'social',
    name: '社媒口语',
    tagline: '短句、有钩子、可以直接读',
    description: '前两句交代冲突或收益，段落短、信息密，不靠夸张词和表情符号制造热闹。',
    group: 'platform',
    symbol: '#',
    bestFor: ['X', '小红书', '短帖'],
    sample: '很多人以为问题是不会写。其实真正耗时的是每个平台都要重来一次。',
    sourceNote: 'Social-native concise writing',
    directive: '前两句给出读者痛点、反差或具体收益；使用短句和短段落，适合手机阅读；每段只推进一个信息；表情符号少量使用；禁止夸张承诺和空洞互动诱导。',
  },
  {
    id: 'script',
    name: '视频口播',
    tagline: '说得出口，听一遍就懂',
    description: '按口语节拍组织钩子、段落转场和画面提示，避免书面语直接朗读。',
    group: 'platform',
    symbol: '▶',
    bestFor: ['B站', '短视频', '播客提纲'],
    sample: '先别急着看功能。我们从它替你省掉的第一步开始。',
    sourceNote: 'Spoken-word script / beat structure',
    directive: '写成真正能说出口的中文；开头快速建立问题与观看收益；每一段有一个信息节拍和自然转场；必要时标注画面或演示提示；避免长定语、书面套话和连续抽象名词。',
  },
];

export const WRITING_STYLE_MAP = Object.fromEntries(
  WRITING_STYLES.map((style) => [style.id, style]),
) as Record<Voice, WritingStylePreset>;

export function resolveWritingStyle(id: Voice): WritingStylePreset {
  return WRITING_STYLE_MAP[id] ?? WRITING_STYLE_MAP.relaxed;
}
