// 编辑准则（吸收原 skills 的 editorial-guide + fact-check，作为 App 内置模块）
// 既是 LLM 提示里的规则，也是构建期校验的依据。

export const EDITORIAL_RULES = `## 编辑准则（必须遵守）

1. **论点先行**：动笔前写一句私有论点——"这篇文章要论证______，因为______"。用最强的判断，不用最安全的概括。
2. **一条论证主线**：默认推进 = 事件/引语开场 → 暴露矛盾 → 讲清机制 → 谁受益/谁受损 → 延伸到你更大的判断。不硬套编号小标题。
3. **去掉 AI 味**：避免"第一第二第三"节奏、"这意味着""值得注意的是"堆砌、对称排比、空泛结尾、"重磅""深度解析""一文看懂"这类标签词。优先第一人称观察、具体名词、长短句交替。
4. **真实图片作证据**：图按阅读顺序 01_ 命名，紧跟"图 N｜描述。图片来源：…"。优先官方/原文截图；禁止假截图、P 图改变含义、装饰性 AI 图。
5. **生态竞争要具体**：写平台/开源/开放权重时，落到开发者与分发、工具与运行时与硬件、部署与数据控制、应用与行业工作流、许可证与安全评估与治理、用户能否检查/修改/迁移。
6. **标题最后拟**："人物/事件 + 出人意料判断 + 未来方向"。具体承诺论点，自然能读出声。
7. **署名与系列**：系列标题前缀（如 Vibe Coding｜）只在配置或用户要求时使用；新闻/推荐渠道默认不用个人系列前缀。
`;

export const FACT_CHECK_RULES = `## 事实核查（新闻渠道强制）

每个关键断言必须能归入一类：
- **事实**：≥2 个独立来源可证实。
- **来源声称**：单一来源/机构声称，未独立证实——写"据 X 报道""该公司称"。
- **我的推断**：明确标注"我认为""这可能意味着"。

禁止：
- 编造或"复原"引语、数字、截图。
- 把来源声称改写成事实句式。
- 未经核实的"首个/独家/最快/最大/史上"。
- 整段搬运原文——引用克制，改写转述并保留事实要点。

文内标注事件日期与"截至发文"状态；数据给"报道时间"。`;

export const STYLE_GUIDE = `## 公众号石墨风视觉（构建时应用）

- 画布 #ffffff；主文 #29292c；标题 #1d1d1f；辅助 #86868b；分割线 #d2d2d7；软面板 #f5f5f7。
- 字体：系统无衬线栈（PingFang SC / Hiragino Sans GB / Microsoft YaHei 优先）。
- H1 22px / 700 / 1.32；H2 18px / 650 / 下分割线 / 无图标；正文 16px / 1.9 / 左对齐。
- 引用：软灰底 + 3px 石墨左边线。
- 图片：通栏、4px 圆角、无阴影。
- 链接：石墨色 + 弱下划线。
- 禁止蓝色强调、渐变、玻璃感、阴影、装饰波浪、大圆角卡片、对齐中文正文。
`;

// 粗校验（构建/导出时）
export interface ValidationIssue {
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export function validateMarkdown(md: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  // 支持 Markdown (#) 和已渲染的 HTML (<h1>) 两种输入
  const mdH1 = md.match(/^# .+$/gm) ?? [];
  const htmlH1 = md.match(/<h1[\s>][^<]*<\/h1>/gi) ?? [];
  const h1Count = mdH1.length + htmlH1.length;
  if (h1Count === 0) issues.push({ severity: 'high', message: '缺少 h1 标题' });
  if (h1Count > 1) issues.push({ severity: 'high', message: `有 ${h1Count} 个 h1，应仅保留一个` });

  const imgs = [...md.matchAll(/!\[.*?\]\((.*?)\)/g)].map((m) => m[1]);
  imgs.forEach((src, i) => {
    const name = src.split('/').pop() ?? src;
    const ok = /^\d{2}[_-]/.test(name);
    if (!ok) issues.push({ severity: 'medium', message: `图片 ${i + 1} 文件名应以 ${String(i + 1).padStart(2, '0')}_ 开头：${name}` });
  });

  const banned = ['重磅', '一文看懂', '深度解析', '震惊'];
  banned.forEach((w) => {
    if (md.includes(w)) issues.push({ severity: 'low', message: `出现常见 AI/营销标签词："${w}"` });
  });
  return issues;
}
