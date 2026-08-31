import JSZip from 'jszip';

const baseUrl = process.env.OMNIWRITER_URL ?? 'http://127.0.0.1:3080';

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`, { cache: 'no-store' });
  const payload = await response.json();
  ensure(response.ok, `${path} returned ${response.status}`);
  return payload;
}

const health = [];
for (let index = 0; index < 8; index += 1) health.push(await getJson('/api/health'));
ensure(health.every((item) => item.status === 'ok'), 'liveness probe failed');
const instances = [...new Set(health.map((item) => item.instance))].sort();
ensure(instances.includes('app-a') && instances.includes('app-b'), `both instances were not observable: ${instances.join(', ')}`);
const versions = [...new Set(health.map((item) => item.version))];
ensure(versions.length === 1 && !['', 'dev'].includes(versions[0]), `unexpected versions: ${versions.join(', ')}`);

const ready = await getJson('/api/ready');
ensure(ready.status === 'ready', 'readiness probe failed');
ensure(ready.checks?.capabilities?.platforms === 9, 'readiness reported the wrong platform count');
ensure(ready.checks?.capabilities?.templates >= 7, 'readiness reported too few templates');
ensure(['server-configured', 'bring-your-own-key'].includes(ready.checks?.ai?.mode), 'readiness AI mode is invalid');

const exportResponse = await fetch(`${baseUrl}/api/export`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ title: 'monitor', md: '# Monitor\n\nSynthetic export probe.', templateId: 'paper' }),
});
ensure(exportResponse.ok, `synthetic export returned ${exportResponse.status}`);
ensure(exportResponse.headers.get('content-type')?.includes('application/zip'), 'synthetic export is not a ZIP');
const zip = await JSZip.loadAsync(await exportResponse.arrayBuffer());
ensure(zip.file('article.html') && zip.file('article.md'), 'synthetic export is missing required files');
const html = await zip.file('article.html').async('string');
ensure(html.includes('data-template="paper"'), 'synthetic export did not use the requested template');

console.log(JSON.stringify({
  status: 'pass',
  instances,
  version: versions[0],
  readiness: {
    platforms: ready.checks.capabilities.platforms,
    templates: ready.checks.capabilities.templates,
    aiMode: ready.checks.ai.mode,
    rssMiB: ready.runtime.rssMiB,
  },
  syntheticExport: Object.keys(zip.files),
}, null, 2));
