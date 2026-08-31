import type { CreatorAgentId } from './types';

export interface CreatorAgentDefinition {
  id: CreatorAgentId;
  handle: string;
  label: string;
  symbol: string;
  description: string;
  example: string;
}

export const CREATOR_AGENTS: CreatorAgentDefinition[] = [
  { id: 'chief-editor', handle: '@主编', label: '主编', symbol: '编', description: '统筹写作与改稿', example: '把开头改得更有判断' },
  { id: 'researcher', handle: '@资料员', label: '资料员', symbol: '查', description: '读取链接与整理来源', example: '读取素材里的链接' },
  { id: 'visual-editor', handle: '@视觉编辑', label: '视觉编辑', symbol: '图', description: '查找并插入有来源的图片', example: '为这篇文章找配图' },
  { id: 'layout-editor', handle: '@排版师', label: '排版师', symbol: '版', description: '切换模板与检查版式', example: '换成杂志模板' },
  { id: 'distribution-editor', handle: '@分发编辑', label: '分发编辑', symbol: '发', description: '生成各平台原生文案', example: '生成知乎和小红书稿' },
  { id: 'qa-editor', handle: '@质检员', label: '质检员', symbol: '检', description: '执行发布前内容检查', example: '检查一下能不能发布' },
];

export const CREATOR_AGENT_BY_ID = Object.fromEntries(
  CREATOR_AGENTS.map((agent) => [agent.id, agent]),
) as Record<CreatorAgentId, CreatorAgentDefinition>;

const EXPLICIT_AGENT = /@(主编|资料员|视觉编辑|排版师|分发编辑|质检员)\s*/;
const HANDLE_TO_ID: Record<string, CreatorAgentId> = {
  主编: 'chief-editor',
  资料员: 'researcher',
  视觉编辑: 'visual-editor',
  排版师: 'layout-editor',
  分发编辑: 'distribution-editor',
  质检员: 'qa-editor',
};

export function routeCreatorCommand(raw: string): {
  agentId: CreatorAgentId;
  instruction: string;
  explicit: boolean;
} {
  const input = raw.trim();
  const explicitMatch = input.match(EXPLICIT_AGENT);
  if (explicitMatch) {
    return {
      agentId: HANDLE_TO_ID[explicitMatch[1]],
      instruction: input.replace(EXPLICIT_AGENT, '').trim() || '开始处理',
      explicit: true,
    };
  }

  if (/来源|资料|链接|网页|查证|核实|事实/.test(input)) return { agentId: 'researcher', instruction: input, explicit: false };
  if (/配图|图片|封面|插图|视觉/.test(input)) return { agentId: 'visual-editor', instruction: input, explicit: false };
  if (/模板|版式|排版风格|字体|标题样式/.test(input)) return { agentId: 'layout-editor', instruction: input, explicit: false };
  if (/平台稿|发布包|全平台|一稿多投|知乎|小红书|B站|CSDN|Reddit|Hacker News|Product Hunt|推特|Twitter|\bX\b/i.test(input)) {
    return { agentId: 'distribution-editor', instruction: input, explicit: false };
  }
  if (/质检|检查|校验|能不能发布|发布前|问题/.test(input)) return { agentId: 'qa-editor', instruction: input, explicit: false };
  return { agentId: 'chief-editor', instruction: input, explicit: false };
}
