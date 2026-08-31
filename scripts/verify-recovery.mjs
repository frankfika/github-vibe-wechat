import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

const baseUrl = process.env.OMNIWRITER_URL ?? 'http://127.0.0.1:3080';
const outputDir = process.env.OUTPUT_DIR ?? '/tmp/omniwriter-recovery';
const recoveryLabel = process.env.RECOVERY_LABEL ?? 'latest';
const executablePath = process.env.CHROME_PATH
  ?? (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined);
const articleId = 'disaster-recovery-audit';
const secretMarker = 'must-not-appear-in-backup';
const now = Date.now();
const article = {
  id: articleId,
  title: '灾难恢复验收稿',
  brief: {
    material: '验证稿件在浏览器数据丢失后可以恢复。',
    materialType: 'topic',
    angle: '高可用也必须覆盖用户数据。',
    voice: 'editorial',
    length: 'short',
    platforms: ['wechat', 'x'],
    bilingual: false,
  },
  content: '# 灾难恢复验收稿\n\n这是恢复测试正文。',
  platformDrafts: { wechat: '公众号恢复稿', x: 'X 恢复稿' },
  templateId: 'focus',
  createdAt: now,
  updatedAt: now,
};
const config = {
  defaultPlatforms: ['wechat', 'x'],
  bilingual: false,
  voice: 'editorial',
  seriesTitle: '灾备验证｜',
  authorSignature: '灾备测试作者',
  wechatEyebrow: 'RECOVERY TEST',
  newsEyebrow: 'RECOVERY NEWS',
  defaultTemplateId: 'focus',
};

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
const page = await context.newPage();

await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
await page.evaluate(({ seededArticle, seededConfig, marker }) => {
  localStorage.setItem('pencil:articles:v1', JSON.stringify([seededArticle]));
  localStorage.setItem('pencil:config:v1', JSON.stringify(seededConfig));
  localStorage.setItem('omniwriter:ai:v1', JSON.stringify({ apiKey: marker, baseUrl: 'https://example.invalid', model: 'test' }));
}, { seededArticle: article, seededConfig: config, marker: secretMarker });

await page.goto(`${baseUrl}/settings`, { waitUntil: 'domcontentloaded' });
await page.getByRole('tab', { name: '数据安全' }).click();
await page.getByText('当前浏览器保存了 1 篇文章').waitFor();
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: '导出全部备份' }).click();
const download = await downloadPromise;
const backupPath = path.join(outputDir, 'downloaded-omniwriter-backup.json');
await download.saveAs(backupPath);
const backupRaw = await fs.readFile(backupPath, 'utf8');
const backup = JSON.parse(backupRaw);
ensure(backup.format === 'omniwriter-backup' && backup.version === 1, 'backup envelope is invalid');
ensure(backup.articles?.[0]?.id === articleId, 'backup is missing the article');
ensure(backup.config?.authorSignature === config.authorSignature, 'backup is missing creator settings');
ensure(!backupRaw.includes(secretMarker) && !backupRaw.includes('apiKey'), 'backup leaked the AI key');

await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'domcontentloaded' });
await page.getByRole('tab', { name: '数据安全' }).click();
await page.getByText('当前浏览器保存了 0 篇文章').waitFor();
await page.getByLabel('选择 OmniWriter 备份文件').setInputFiles(backupPath);
await page.getByText(/恢复完成：当前共 1 篇文章/).waitFor();
await page.screenshot({ path: path.join(outputDir, `ux-data-recovery-success-${recoveryLabel}.png`), fullPage: true });
const restored = await page.evaluate(() => ({
  articles: JSON.parse(localStorage.getItem('pencil:articles:v1') || '[]'),
  config: JSON.parse(localStorage.getItem('pencil:config:v1') || '{}'),
  ai: localStorage.getItem('omniwriter:ai:v1'),
}));
ensure(restored.articles[0]?.title === article.title, 'restored article content mismatch');
ensure(restored.config.authorSignature === config.authorSignature, 'creator settings were not restored');
ensure(restored.ai === null, 'restore unexpectedly introduced an AI key');

const quotaBackup = structuredClone(backup);
quotaBackup.articles.push({ ...article, id: 'quota-failure-audit', title: '容量失败不应假成功', updatedAt: article.updatedAt + 1 });
await page.evaluate(() => {
  const original = Storage.prototype.setItem;
  Storage.prototype.setItem = function setItem(key, value) {
    if (key === 'pencil:articles:v1') throw new DOMException('Quota exceeded', 'QuotaExceededError');
    return original.call(this, key, value);
  };
});
await page.getByLabel('选择 OmniWriter 备份文件').setInputFiles({
  name: 'quota-backup.json',
  mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify(quotaBackup)),
});
await page.getByText(/浏览器存储空间不足/).waitFor();
await page.reload({ waitUntil: 'domcontentloaded' });
await page.getByRole('tab', { name: '数据安全' }).click();
await page.getByText('当前浏览器保存了 1 篇文章').waitFor();

const staleBackup = structuredClone(backup);
staleBackup.articles[0].title = '不应覆盖的新旧冲突稿';
staleBackup.articles[0].updatedAt = article.updatedAt - 60_000;
await page.getByLabel('选择 OmniWriter 备份文件').setInputFiles({
  name: 'stale-backup.json',
  mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify(staleBackup)),
});
await page.getByText(/恢复完成：当前共 1 篇文章/).waitFor();
const titleAfterMerge = await page.evaluate(() => JSON.parse(localStorage.getItem('pencil:articles:v1') || '[]')[0]?.title);
ensure(titleAfterMerge === article.title, 'an older backup overwrote the newer article');

await page.getByLabel('选择 OmniWriter 备份文件').setInputFiles({
  name: 'invalid.json',
  mimeType: 'application/json',
  buffer: Buffer.from('{"unexpected":true}'),
});
await page.getByText('不是受支持的 OmniWriter 备份文件').waitFor();
await page.screenshot({ path: path.join(outputDir, `ux-data-recovery-${recoveryLabel}.png`), fullPage: true });

// 在线访问并让 Service Worker 接管、缓存文章页，然后模拟断网刷新与编辑。
await page.goto(`${baseUrl}/article/${articleId}?step=editor`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.getByPlaceholder('中文标题').waitFor();
await context.setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded' });
const offlineTitle = page.getByPlaceholder('中文标题');
await offlineTitle.waitFor();
await offlineTitle.fill('离线恢复验证稿');
await page.waitForTimeout(600);
ensure((await offlineTitle.inputValue()) === '离线恢复验证稿', 'offline editing did not accept input');
await context.setOffline(false);
await page.reload({ waitUntil: 'domcontentloaded' });
ensure((await page.getByPlaceholder('中文标题').inputValue()) === '离线恢复验证稿', 'offline edit was not persisted');

await browser.close();
console.log(JSON.stringify({
  checks: {
    exportedArticle: true,
    exportedConfig: true,
    excludedAiKey: true,
    restoredAfterClear: true,
    reportedQuotaFailure: true,
    protectedNewerDraft: true,
    rejectedInvalidBackup: true,
    offlineReloadAndEdit: true,
  },
  backupPath,
  screenshot: path.join(outputDir, `ux-data-recovery-${recoveryLabel}.png`),
  successScreenshot: path.join(outputDir, `ux-data-recovery-success-${recoveryLabel}.png`),
}, null, 2));
