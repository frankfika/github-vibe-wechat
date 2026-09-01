import JSZip from "jszip";

const baseUrl = process.env.OMNIWRITER_URL || "http://localhost:3000";
const runAI = process.env.RUN_AI !== "0";
const results = [];
const templateIds = ["graphite", "paper", "focus", "citrus", "geek", "jade", "magazine"];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  process.stdout.write(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}\n`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, init = {}, timeoutMs = 180_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${baseUrl}${path}`, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function postJson(path, body, timeoutMs) {
  const response = await request(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }, timeoutMs);
  const payload = await response.json().catch(() => ({}));
  assert(response.ok, `${path} returned ${response.status}: ${payload.error || "unknown error"}`);
  return payload;
}

async function generateMaster(brief) {
  const response = await request("/api/generate/stream", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ brief }),
  }, 300_000);
  assert(response.ok, `/api/generate/stream returned ${response.status}`);
  const raw = await response.text();
  const events = raw.split("\n").filter((line) => line.startsWith("data: "))
    .map((line) => JSON.parse(line.slice(6)));
  const error = events.find((event) => event.type === "error");
  assert(!error, error?.message || "AI generation failed");
  const done = events.findLast((event) => event.type === "done");
  assert(done?.md?.trim(), "stream did not return final Markdown");
  return { markdown: done.md, events };
}

async function runPool(items, concurrency, worker) {
  const output = new Array(items.length);
  let next = 0;
  async function consume() {
    while (next < items.length) {
      const index = next++;
      output[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, consume));
  return output;
}

const brief = {
  materialType: "topic",
  material: "OmniWriter 是一个本地优先的多平台写作工具。用户给出素材和判断，AI 生成母稿，再适配公众号、X、知乎、小红书、B站、CSDN、Reddit、Hacker News、Product Hunt。文章保存在浏览器，可导出 HTML、Markdown、图片和 ZIP。",
  angle: "AI 应该替人处理重复改写，但不能替人做判断。",
  voice: "relaxed",
  length: "short",
  platforms: ["wechat", "x", "zhihu", "xiaohongshu", "bilibili", "csdn", "reddit", "hacker-news", "product-hunt"],
  bilingual: true,
  cta: "邀请读者分享自己的跨平台创作流程",
  agentId: "opinion",
};

try {
  const health = await request("/api/health").then((response) => response.json());
  assert(health.status === "ok", "health endpoint did not return ok");
  record("服务健康检查", true, health.version ? `version ${health.version}` : "ok");

  const aiStatus = await request("/api/ai-status").then((response) => response.json());
  record("AI 配置状态", aiStatus.configured === true, aiStatus.configured ? "configured" : "not configured");

  let master = "# OmniWriter 全渠道写作验证\n\n这是一篇用于自动化验证的母稿。";
  if (runAI) {
    const handshake = await postJson("/api/ai-test", {}, 90_000);
    record("真实 AI 握手", handshake.ok === true, handshake.model || "model connected");
    const generated = await generateMaster(brief);
    master = generated.markdown;
    const stageNames = new Set(generated.events.filter((event) => event.type === "stage").map((event) => event.stage));
    const missingStages = ["source", "rules", "waiting", "streaming", "checking"].filter((stage) => !stageNames.has(stage));
    assert(missingStages.length === 0, `missing stream stages: ${missingStages.join(", ")}`);
    assert(master.includes("## English Version"), "bilingual master is missing English separator");
    record("双语母稿流式生成", true, `${master.length} chars; ${generated.events.length} SSE events`);

    const refined = await postJson("/api/refine", {
      brief,
      master: `${master}\n\n![持续改稿验收图片](https://example.com/omniwriter-preserve.png)\n\n图片来源：OmniWriter 自动化验收。`,
      instruction: "把标题改得更克制、更具体；保留完整事实、来源链接与中英双语结构。",
    }, 180_000);
    assert(/^#\s+\S+/m.test(refined.md || ""), "refinement is missing the Markdown title");
    assert(refined.md.includes("## English Version"), "refinement lost the bilingual structure");
    assert(refined.md.includes("https://example.com/omniwriter-preserve.png"), "refinement lost an existing article image");
    assert(refined.md.length >= Math.floor(master.length * 0.55), "refinement unexpectedly discarded most of the article");
    record("对话式持续改稿", true, `${refined.md.length} chars`);

    const platformIds = brief.platforms.filter((id) => id !== "wechat");
    const adapted = await runPool(platformIds, 2, async (platformId) => {
      let lastError;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        process.stdout.write(`RUN  渠道格式：${platformId}（第 ${attempt} 次）\n`);
        try {
          const payload = await postJson("/api/adapt", { platform: platformId, master, brief: { ...brief, bilingual: false } }, 100_000);
          assert(payload.text?.trim(), `${platformId} returned empty content`);
          return { platformId, content: payload.text.trim() };
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError;
    });
    assert(new Set(adapted.map(({ content }) => content)).size === adapted.length, "two or more platform drafts are identical");
    const formatSignals = {
      x: (text) => text.length <= 240,
      zhihu: (text) => /^#\s/m.test(text) && text.length >= 300,
      xiaohongshu: (text) => /#[^\s#]+/.test(text),
      bilibili: (text) => /(标题|口播|标签|置顶)/.test(text),
      csdn: (text) => /^#\s/m.test(text) && /```|##\s/m.test(text),
      reddit: (text) => /^#\s/m.test(text),
      "hacker-news": (text) => /Show HN/i.test(text),
      "product-hunt": (text) => /(tagline|topics|maker)/i.test(text),
    };
    for (const item of adapted) {
      assert(formatSignals[item.platformId]?.(item.content), `${item.platformId} output does not satisfy its format contract`);
      record(`渠道格式：${item.platformId}`, true, `${item.content.length} chars`);
    }
  }

  const imageSearch = await postJson("/api/images/search", { query: "AI writing workspace", limit: 3 }, 90_000);
  assert(Array.isArray(imageSearch.results), "image search did not return a results array");
  assert(imageSearch.results.length > 0, `image search returned no image: ${imageSearch.warning || ""}`);
  const proxyUrl = imageSearch.results[0].proxyUrl;
  assert(proxyUrl?.startsWith("/api/images/proxy"), "image result is missing local proxy URL");
  const proxied = await request(proxyUrl, {}, 90_000);
  const proxiedBytes = await proxied.arrayBuffer();
  assert(proxied.ok && proxied.headers.get("content-type")?.startsWith("image/"), "image proxy did not return an image");
  assert(proxiedBytes.byteLength > 1_000, "proxied image is unexpectedly small");
  record("图片搜索与本地代理", true, `${imageSearch.results.length} results; ${proxiedBytes.byteLength} bytes`);

  const pixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  for (const templateId of templateIds) {
    const templateFixture = `${master}\n\n## 模板二级标题\n\n正文层级验证。\n\n### 模板三级标题\n\n> 引用、代码和图片也必须继承模板。\n\n\`inlineCode()\``;
    const response = await request("/api/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: `OmniWriter ${templateId} 验证`,
        md: `${templateFixture}\n\n<img src="${pixel}" alt="测试配图">`,
        templateId,
        images: [{ src: pixel, dataUrl: pixel, file: "images/01_img.png" }],
      }),
    }, 120_000);
    assert(response.ok, `export ${templateId} returned ${response.status}`);
    const zip = await JSZip.loadAsync(await response.arrayBuffer());
    for (const entry of ["article.html", "article.md", "images/01_img.png"]) assert(zip.file(entry), `${templateId} ZIP is missing ${entry}`);
    const html = await zip.file("article.html").async("string");
    const markdown = await zip.file("article.md").async("string");
    assert(html.includes(`data-template="${templateId}"`), `${templateId} export used the wrong template`);
    assert(html.includes("navigator.clipboard.write"), `${templateId} export is missing rich-copy support`);
    assert(html.includes("images/01_img.png"), `${templateId} HTML did not rewrite embedded image`);
    assert(markdown.includes("images/01_img.png"), `${templateId} Markdown did not rewrite embedded image`);
    const headingStyles = ["h1", "h2", "h3"].map((tag) => html.match(new RegExp(`<${tag}[^>]*style="([^"]+)"`, "i"))?.[1] || "");
    assert(headingStyles.every(Boolean), `${templateId} export is missing inline H1/H2/H3 styles`);
    assert(new Set(headingStyles).size === 3, `${templateId} export does not distinguish H1/H2/H3`);
    record(`模板导出：${templateId}`, true, `${Object.keys(zip.files).length} ZIP entries`);
  }
} catch (error) {
  record("测试运行", false, error instanceof Error ? error.message : String(error));
}

const failed = results.filter((result) => !result.ok);
process.stdout.write(`\n${results.length - failed.length}/${results.length} checks passed\n`);
if (failed.length > 0) process.exitCode = 1;
