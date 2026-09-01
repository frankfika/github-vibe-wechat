import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:3080';
const outputDir = process.env.OUTPUT_DIR ?? '/tmp/omniwriter-mobile-audit';
const auditLabel = process.env.AUDIT_LABEL ?? 'latest';
const viewportWidth = Number(process.env.VIEWPORT_WIDTH ?? 390);
const viewportHeight = Number(process.env.VIEWPORT_HEIGHT ?? 844);
const viewportMode = viewportWidth < 768 ? 'mobile' : 'desktop';
const executablePath = process.env.CHROME_PATH
  ?? (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined);
const articleId = 'mobile-ux-audit';
const platforms = ['wechat', 'x', 'reddit', 'hacker-news', 'zhihu', 'csdn', 'product-hunt', 'bilibili', 'xiaohongshu'];
const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const article = {
  id: articleId,
  title: '移动端真实体验验收稿',
  brief: {
    material: '用一份可靠的母稿适配不同平台，并让模板、图片和复制动作保持可用。',
    materialType: 'topic',
    angle: '创作工具必须在手机上也能顺手完成从输入到发布的完整流程。',
    voice: 'editorial',
    length: 'medium',
    platforms,
    bilingual: true,
    agentId: 'opinion',
    scene: 'everything',
  },
  content: `# 移动端真实体验验收稿\n\n这是一篇用于真实浏览器回归的完整母稿。\n\n## 一稿多投不是复制粘贴\n\n不同渠道需要不同结构、语气和长度，但事实与核心判断必须保持一致。\n\n### 标题层级也属于内容\n\n一级、二级和三级标题应当拥有明确但协调的视觉差异。\n\n> 可用性必须通过真实点击、切换和复制来证明。\n\n![真实复制验收图片](${pixel})\n\n图片来源：OmniWriter 自动化验收素材。\n\n## 从输入到发布\n\n- 模板切换清晰\n- 图片复制完整\n- 平台格式独立\n\n行内代码 \`copyRichText()\` 和代码块也必须保持可读。\n\n\`\`\`js\nconst ready = true;\n\`\`\``,
  contentEn: '# Mobile UX acceptance article\n\nA real-browser fixture for the complete publishing workflow.',
  platformDrafts: Object.fromEntries(platforms.map((platform) => [platform, `# ${platform} 平台真实验收文案\n\n## 发布结构\n\n不同渠道需要独立的结构、格式和复制行为。\n\n[[图片 1]]\n\n[配图说明：真实复制验收图片]\n\n- 保留核心判断\n- 调整平台语气\n- 配图完整可用\n\n> 这不是简单的跨平台复制粘贴。`])),
  templateId: 'paper',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath });
const context = await browser.newContext({
  viewport: { width: viewportWidth, height: viewportHeight },
  deviceScaleFactor: 1,
  isMobile: viewportMode === 'mobile',
  hasTouch: viewportMode === 'mobile',
  locale: 'zh-CN',
  permissions: ['clipboard-read', 'clipboard-write'],
});
await context.addInitScript(({ value }) => {
  localStorage.setItem('omniwriter:articles:v1', JSON.stringify([value]));
}, { value: article });
const page = await context.newPage();
const interactions = { conversationCommands: [], agentCommands: [], templates: [], templateHeadings: {}, platformPreviews: [], platformCopies: [], platformImages: [], platformInlineImages: [], wechatImageCopy: null };

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

async function audit(name) {
  // 等响应式样式真正应用再量尺寸：页面刚加载时 sr-only 的 clip 和 xl: 断点可能还没生效，
  // 会让桌面侧栏与移动顶栏同时"可见"、把 sr-only 链接算成控件，从而误报 undersized。
  await page.waitForFunction(() => {
    const skip = document.querySelector('a[href="#main"]');
    if (!skip) return false;
    const clip = getComputedStyle(skip).clip || '';
    return /rect\(0(?:px)?, ?0(?:px)?, ?0(?:px)?, ?0(?:px)?\)/.test(clip);
  }, null, { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(250);
  const metrics = await page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      // sr-only 用 clip 裁剪成 1px 供屏幕阅读器使用，视觉上不可见，不算可点击控件。
      const clipped = /rect\(0(?:px)?, ?0(?:px)?, ?0(?:px)?, ?0(?:px)?\)/.test(style.clip || '');
      return !clipped && style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    };
    const controls = [...document.querySelectorAll('button, a[href], input, textarea, select, [role="tab"]')]
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        let ancestor = element.parentElement;
        let inHorizontalScroller = false;
        while (ancestor) {
          const overflowX = getComputedStyle(ancestor).overflowX;
          if (['auto', 'scroll'].includes(overflowX) && ancestor.scrollWidth > ancestor.clientWidth) {
            inHorizontalScroller = true;
            break;
          }
          ancestor = ancestor.parentElement;
        }
        return {
          label: (element.getAttribute('aria-label') || element.textContent || element.getAttribute('placeholder') || element.tagName).trim().replace(/\s+/g, ' ').slice(0, 42),
          tag: element.tagName.toLowerCase(),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          inHorizontalScroller,
          fontSize: getComputedStyle(element).fontSize,
          type: element instanceof HTMLInputElement ? element.type : undefined,
        };
      });
    const formControls = controls.filter((control) => ['input', 'textarea', 'select'].includes(control.tag));
    return {
      viewport: { width: innerWidth, height: innerHeight },
      layout: {
        body: document.body.scrollWidth,
        html: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      },
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      undersized: controls.filter((control) => !['checkbox', 'radio'].includes(control.type) && (control.height < 40 || control.width < 40)),
      offscreen: controls.filter((control) => !control.inHorizontalScroller && (control.left < -1 || control.right > innerWidth + 1)),
      formControls,
    };
  });
  ensure(!metrics.hasHorizontalOverflow, `${name} has horizontal overflow`);
  ensure(metrics.offscreen.length === 0, `${name} has offscreen controls: ${metrics.offscreen.map((item) => item.label).join(', ')}`);
  if (viewportMode === 'mobile') {
    ensure(metrics.undersized.length === 0, `${name} has undersized controls: ${metrics.undersized.map((item) => item.label).join(', ')}`);
    ensure(metrics.formControls.every((control) => ['checkbox', 'radio'].includes(control.type) || Number.parseFloat(control.fontSize) >= 16), `${name} has a form control below 16px`);
  }
  await page.screenshot({ path: path.join(outputDir, `ux-${viewportMode}-${name}-${auditLabel}.png`), fullPage: true });
  return { name, ...metrics };
}

const results = [];
for (const [name, pathname] of [['home', '/'], ['marketplace', '/marketplace'], ['settings', '/settings']]) {
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: 'domcontentloaded' });
  results.push(await audit(name));
}
await page.goto(`${baseUrl}/marketplace`, { waitUntil: 'domcontentloaded' });
await page.getByRole('tab', { name: /模板 ·/ }).click();
results.push(await audit('marketplace-templates'));

await page.goto(`${baseUrl}/article/${articleId}`, { waitUntil: 'domcontentloaded' });
results.push(await audit('brief'));
await page.getByRole('tab', { name: '原稿' }).click();
results.push(await audit('editor'));
const creativeCommand = page.getByRole('textbox', { name: '继续创作或修改' });
await page.getByRole('button', { name: '选择协作 Agent' }).click();
await page.getByRole('button', { name: /排版师/ }).click();
await creativeCommand.fill('@排版师 换成杂志模板');
await creativeCommand.press('Enter');
await page.locator('.wechat-rendered [data-template="magazine"]').waitFor({ state: 'visible' });
interactions.conversationCommands.push('template-to-magazine');
interactions.agentCommands.push('layout-editor');
results.push(await audit('preview'));
const templatePicker = page.getByRole('button', { name: '公众号排版模板' });
await templatePicker.click();
results.push(await audit('template-picker'));
const templateIds = await page.locator('[data-template-id]').evaluateAll((options) => options.map((option) => option.getAttribute('data-template-id')).filter(Boolean));
await templatePicker.click();
const wechatCopyButton = page.getByRole('button', { name: /复制公众号正文|已复制，去公众号粘贴/ });
for (const templateId of templateIds) {
  await templatePicker.click();
  await page.locator(`[data-template-id="${templateId}"]`).click();
  await page.waitForTimeout(100);
  const rendered = await page.locator('.wechat-rendered').innerHTML();
  ensure(rendered.includes(`data-template="${templateId}"`), `template ${templateId} did not render`);
  const headingStyles = await page.locator('.wechat-rendered').evaluate((root) => {
    const signature = (selector) => {
      const element = root.querySelector(selector);
      if (!element) return '';
      const style = getComputedStyle(element);
      return [style.fontSize, style.fontWeight, style.color, style.backgroundColor, style.borderLeftWidth, style.borderBottomWidth, style.borderRadius].join('|');
    };
    return { h1: signature('h1'), h2: signature('h2'), h3: signature('h3') };
  });
  ensure(Object.values(headingStyles).every(Boolean), `template ${templateId} is missing H1/H2/H3`);
  ensure(new Set(Object.values(headingStyles)).size === 3, `template ${templateId} heading levels are not visually distinct`);
  await wechatCopyButton.click();
  await page.waitForTimeout(80);
  const copied = await page.evaluate(async () => {
    const items = await navigator.clipboard.read();
    const types = [...new Set(items.flatMap((item) => item.types))];
    const htmlItem = items.find((item) => item.types.includes('text/html'));
    const html = htmlItem ? await (await htmlItem.getType('text/html')).text() : '';
    return { types, html };
  });
  ensure(copied.types.includes('text/html'), `${templateId} copy is missing rich HTML`);
  ensure(copied.html.includes(`data-template="${templateId}"`), `${templateId} clipboard used the wrong template`);
  ensure(copied.html.includes('<img'), `${templateId} rich copy is missing the embedded image`);
  ensure(['h1', 'h2', 'h3'].every((tag) => new RegExp(`<${tag}[^>]+style=`).test(copied.html)), `${templateId} clipboard is missing inline heading styles`);
  await page.screenshot({ path: path.join(outputDir, `ux-${viewportMode}-template-${templateId}-${auditLabel}.png`), fullPage: true });
  interactions.templates.push(templateId);
  interactions.templateHeadings[templateId] = headingStyles;
}
const wechatClipboard = await page.evaluate(async () => {
  const items = await navigator.clipboard.read();
  const types = [...new Set(items.flatMap((item) => item.types))];
  const htmlItem = items.find((item) => item.types.includes('text/html'));
  const html = htmlItem ? await (await htmlItem.getType('text/html')).text() : '';
  return { types, html };
});
ensure(wechatClipboard.types.includes('text/html'), 'WeChat copy is missing rich HTML');
ensure(wechatClipboard.html.includes('<img'), 'WeChat rich copy is missing the embedded image');
interactions.wechatImageCopy = { types: wechatClipboard.types, hasImage: true };
await page.getByRole('tab', { name: '平台文案' }).click();
results.push(await audit('platforms'));

const platformLabels = {
  wechat: '公众号',
  x: 'X / Twitter',
  reddit: 'Reddit',
  'hacker-news': 'Hacker News',
  zhihu: '知乎',
  csdn: 'CSDN',
  'product-hunt': 'Product Hunt',
  bilibili: 'B站',
  xiaohongshu: '小红书',
};
for (const platform of platforms) {
  const label = platformLabels[platform];
  await page.getByRole('tab', { name: label, exact: false }).last().click();
  const preview = page.locator(`[aria-label="${label}中文成稿预览"]`);
  ensure(await preview.isVisible(), `${platform} formatted preview is not visible`);
  ensure(await preview.locator('h1').count() === 1, `${platform} preview lost the level-one heading`);
  ensure(await preview.locator('h2').count() === 1, `${platform} preview lost the level-two heading`);
  ensure(await preview.locator('li').count() === 3, `${platform} preview lost the platform list structure`);
  const inlinePlacement = await preview.locator('.platform-rendered').evaluate((root) => {
    const figure = root.querySelector('figure[data-omniwriter-inline-image="true"]');
    if (!figure) return { present: false, hasContentAfter: false };
    return { present: true, hasContentAfter: Boolean(figure.nextElementSibling) };
  });
  ensure(inlinePlacement.present, `${platform} full preview did not render the image inline`);
  ensure(inlinePlacement.hasContentAfter, `${platform} full preview appended the image at the end instead of its specified position`);
  await page.getByRole('tab', { name: '编辑文案' }).click();
  const editor = page.getByRole('textbox', { name: `${label}中文文案` });
  ensure(await editor.isVisible(), `${platform} editor is not visible after switching modes`);
  ensure((await editor.inputValue()).includes(`${platform} 平台真实验收文案`), `${platform} editor content mismatch`);
  await page.getByRole('tab', { name: '成稿预览' }).click();
  const platformImage = page.locator(`section[aria-label="${label}发布配图"] img`).first();
  ensure(await platformImage.isVisible(), `${platform} platform page lost the article image`);
  const copyLabel = platform === 'wechat' ? '复制排版正文' : platform === 'zhihu' ? '复制图文' : '复制文案';
  await page.getByRole('button', { name: copyLabel }).click();
  await page.waitForTimeout(60);
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  ensure(clipboardText.includes(`${platform} 平台真实验收文案`), `${platform} clipboard content mismatch`);
  if (platform === 'wechat' || platform === 'zhihu') {
    const richHtml = await page.evaluate(async () => {
      const items = await navigator.clipboard.read();
      const item = items.find((entry) => entry.types.includes('text/html'));
      return item ? await (await item.getType('text/html')).text() : '';
    });
    ensure(richHtml.includes('<img'), `${platform} rich copy did not include the article image`);
  }
  await page.getByRole('button', { name: '复制图片 1' }).click();
  await page.waitForTimeout(60);
  const imageTypes = await page.evaluate(async () => {
    const items = await navigator.clipboard.read();
    return [...new Set(items.flatMap((item) => item.types))];
  });
  ensure(imageTypes.includes('image/png'), `${platform} image copy did not write a PNG to the clipboard`);
  interactions.platformPreviews.push(platform);
  interactions.platformCopies.push(platform);
  interactions.platformImages.push(platform);
  interactions.platformInlineImages.push(platform);
}

await browser.close();
console.log(JSON.stringify({ baseUrl, outputDir, results, interactions }, null, 2));
