import { chromium } from 'playwright-core';

const baseUrl = process.env.OMNIWRITER_URL ?? 'http://127.0.0.1:3080';
const executablePath = process.env.CHROME_PATH
  ?? (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined);
const articleId = 'accessibility-audit';
const now = Date.now();
const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const article = {
  id: articleId,
  title: '键盘与屏幕阅读器验收稿',
  brief: {
    material: '检查所有创作流程控件是否有可访问名称。',
    materialType: 'topic',
    angle: '视觉清晰之外，也必须支持键盘和辅助技术。',
    voice: 'editorial',
    length: 'short',
    platforms: ['wechat', 'x', 'zhihu'],
    bilingual: false,
    agentId: 'opinion',
    scene: 'domestic',
  },
  content: `<h1>键盘与屏幕阅读器验收稿</h1><p>辅助技术也应完成完整发布流程。</p><figure><img src="${pixel}" alt="无障碍验收配图"><figcaption>图 1｜无障碍验收配图</figcaption></figure>`,
  platformDrafts: { wechat: '# 公众号验收稿', x: 'X accessibility test', zhihu: '# 知乎验收稿' },
  templateId: 'graphite',
  createdAt: now,
  updatedAt: now,
};

const browser = await chromium.launch({ headless: true, executablePath });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(({ value }) => localStorage.setItem('omniwriter:articles:v1', JSON.stringify([value])), { value: article });
const page = await context.newPage();
const results = [];

async function audit(name) {
  await page.waitForTimeout(100);
  const result = await page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const accessibleName = (element) => {
      const aria = element.getAttribute('aria-label')?.trim();
      if (aria) return aria;
      const labelledBy = element.getAttribute('aria-labelledby');
      if (labelledBy) {
        const text = labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? '').join(' ').trim();
        if (text) return text;
      }
      if ('labels' in element && element.labels?.length) {
        const text = [...element.labels].map((label) => label.textContent ?? '').join(' ').trim();
        if (text) return text;
      }
      if (element instanceof HTMLInputElement && ['button', 'submit', 'reset'].includes(element.type) && element.value.trim()) return element.value.trim();
      return (element.textContent || element.getAttribute('title') || '').trim();
    };
    const interactive = [...document.querySelectorAll('button, a[href], input:not([type="hidden"]), textarea, select, [contenteditable="true"]')].filter(visible);
    const unnamed = interactive.filter((element) => !accessibleName(element)).map((element) => element.outerHTML.slice(0, 180));
    const imagesMissingAlt = [...document.querySelectorAll('img')].filter((image) => visible(image) && !image.hasAttribute('alt')).map((image) => image.outerHTML.slice(0, 180));
    const positiveTabIndex = interactive.filter((element) => Number(element.getAttribute('tabindex')) > 0).map((element) => element.outerHTML.slice(0, 180));
    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id).filter(Boolean);
    const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    return {
      controls: interactive.length,
      unnamed,
      imagesMissingAlt,
      positiveTabIndex,
      duplicateIds,
      hasMainLandmark: Boolean(document.querySelector('main')),
    };
  });

  // Confirm the page has a working sequential keyboard focus path.
  await page.locator('body').click({ position: { x: 1, y: 1 } });
  await page.keyboard.press('Tab');
  const firstFocus = await page.evaluate(() => ({ tag: document.activeElement?.tagName, name: document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent?.trim().slice(0, 40) }));
  results.push({ name, ...result, firstFocus });
}

await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
await audit('home');
await page.goto(`${baseUrl}/marketplace`, { waitUntil: 'domcontentloaded' });
await audit('marketplace');
await page.goto(`${baseUrl}/settings`, { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: /管理连接|连接 AI/ }).click();
await audit('settings-ai');
for (const tab of ['写作偏好', '发布', '数据安全']) {
  await page.getByRole('tab', { name: tab }).click();
  await audit(`settings-${tab}`);
}
await page.goto(`${baseUrl}/article/${articleId}`, { waitUntil: 'domcontentloaded' });
await page.locator('details').evaluateAll((elements) => elements.forEach((element) => { element.open = true; }));
await audit('article-brief');
await page.getByRole('tab', { name: '原稿' }).click();
await audit('article-editor');
await page.getByRole('tab', { name: '发布包' }).click();
await audit('article-preview');
await page.getByRole('button', { name: '公众号排版模板' }).click();
await audit('article-template-picker');
await page.keyboard.press('Escape');
await page.getByRole('tab', { name: '平台文案' }).click();
await audit('article-platforms');

await browser.close();
const failures = results.flatMap((result) => [
  ...result.unnamed.map((detail) => ({ page: result.name, rule: 'unnamed-control', detail })),
  ...result.imagesMissingAlt.map((detail) => ({ page: result.name, rule: 'image-missing-alt', detail })),
  ...result.positiveTabIndex.map((detail) => ({ page: result.name, rule: 'positive-tabindex', detail })),
  ...result.duplicateIds.map((detail) => ({ page: result.name, rule: 'duplicate-id', detail })),
  ...(!result.hasMainLandmark ? [{ page: result.name, rule: 'missing-main', detail: '' }] : []),
  ...(!result.firstFocus?.tag || result.firstFocus.tag === 'BODY' ? [{ page: result.name, rule: 'keyboard-focus', detail: JSON.stringify(result.firstFocus) }] : []),
]);
console.log(JSON.stringify({ pages: results, failures }, null, 2));
if (failures.length) process.exitCode = 1;
