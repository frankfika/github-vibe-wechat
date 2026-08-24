// 导出工具（客户端安全）：Markdown → 公众号兼容 HTML、行内样式注入、富文本复制、HTML → Markdown。
// 不依赖 Node-only 包（无 JSZip）。ZIP 打包走 src/lib/export-zip.ts（服务端）。

export const WECHAT_INLINE_CSS = `
body{margin:0;padding:0;background:#fff;color:#1d1d1f;-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;}
h1{font-size:22px;font-weight:700;line-height:1.32;color:#1d1d1f;margin:0 0 14px;letter-spacing:-0.011em;}
h2{font-size:18px;font-weight:650;color:#1d1d1f;margin:28px 0 10px;padding-bottom:6px;border-bottom:1px solid #d2d2d7;}
p{margin:0 0 14px;font-size:16px;line-height:1.9;color:#29292c;}
blockquote{background:#f5f5f7;border-left:3px solid #1d1d1f;padding:10px 14px;margin:16px 0;color:#29292c;border-radius:0 4px 4px 0;}
img{display:block;width:100%;height:auto;border-radius:4px;margin:18px 0;}
figure{margin:18px 0;}
figcaption{font-size:13px;color:#86868b;margin-top:6px;line-height:1.5;}
a{color:#1d1d1f;text-decoration:underline;text-decoration-color:#d2d2d7;text-underline-offset:3px;}
ul,ol{padding-left:1.4em;margin:0 0 14px;}
li{margin:4px 0;}
code{font-family:"JetBrains Mono",ui-monospace,monospace;background:#f5f5f7;padding:2px 6px;border-radius:3px;font-size:0.92em;}
hr{border:none;border-top:1px solid #d2d2d7;margin:24px 0;}
`.trim();

// 行内样式映射（与 WECHAT_INLINE_CSS 视觉一致）。
// 公众号编辑器会剥离 <style>，所以复制/导出时每个元素必须自带 style 属性。
export const INLINE_STYLES: Record<string, string> = {
  h1: 'font-size:22px;font-weight:700;line-height:1.32;color:#1d1d1f;margin:0 0 14px;letter-spacing:-0.011em;',
  h2: 'font-size:18px;font-weight:650;color:#1d1d1f;margin:28px 0 10px;padding-bottom:6px;border-bottom:1px solid #d2d2d7;',
  h3: 'font-size:16px;font-weight:600;color:#1d1d1f;margin:20px 0 8px;',
  p: 'margin:0 0 14px;font-size:16px;line-height:1.9;color:#29292c;',
  blockquote: 'background:#f5f5f7;border-left:3px solid #1d1d1f;padding:10px 14px;margin:16px 0;color:#29292c;border-radius:0 4px 4px 0;',
  img: 'display:block;width:100%;height:auto;border-radius:4px;margin:18px 0;',
  figure: 'margin:18px 0;',
  figcaption: 'font-size:13px;color:#86868b;margin-top:6px;line-height:1.5;',
  a: 'color:#1d1d1f;text-decoration:underline;text-decoration-color:#d2d2d7;text-underline-offset:3px;',
  ul: 'padding-left:1.4em;margin:0 0 14px;',
  ol: 'padding-left:1.4em;margin:0 0 14px;',
  li: 'margin:4px 0;',
  code: 'font-family:"JetBrains Mono",ui-monospace,monospace;background:#f5f5f7;padding:2px 6px;border-radius:3px;font-size:0.92em;',
  hr: 'border:none;border-top:1px solid #d2d2d7;margin:24px 0;',
};

export interface BuildOptions {
  title: string;
  eyebrow?: string;
  author?: string;
  mdBody: string; // Markdown 或已渲染 HTML
  images?: Record<string, string>; // 文件名 → dataURL（写入 ZIP 的 images/）
  imageSrcMap?: Record<string, string>; // 原 src → 新 src（用于把内嵌图改写为 images/ 路径）
}

// ---- 基础转义 ----
function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/'/g, '&#39;');
}
function escapeText(s: string) {
  return s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
export function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/g, ' ');
}

// 输入是否已经是 HTML（Tiptap 输出等）→ 直接走直通分支，避免二次 markdown 化
function looksLikeHtml(s: string): boolean {
  return /<(h[1-6]|p|div|blockquote|img|figure|ul|ol|li|pre|code|br|strong|em|a|hr)[\s>]/i.test(s);
}

// 只转义标签外的文本节点（保留已有实体，避免 &amp; → &amp;amp;）
function escapeTextNodes(html: string): string {
  let out = '';
  let inTag = false;
  let inRaw = 0; // >0 表示在 <pre>/<code> 内（内容已转义，跳过）
  let i = 0;
  const n = html.length;
  while (i < n) {
    const c = html[i];
    if (inTag) {
      out += c;
      i++;
      if (c === '>') inTag = false;
      continue;
    }
    if (c === '<') {
      const m = html.slice(i).match(/^<(\/?)([a-zA-Z][a-zA-Z0-9-]*)/);
      const tag = m?.[2]?.toLowerCase();
      if (tag === 'pre' || tag === 'code') inRaw += m?.[1] ? -1 : 1;
      out += c;
      i++;
      inTag = true;
      continue;
    }
    if (inRaw > 0) {
      out += c;
      i++;
      continue;
    }
    if (c === '&' && /^&[a-zA-Z0-9#]{1,8};/.test(html.slice(i))) {
      out += c;
      i++;
      continue;
    }
    if (c === '&') out += '&amp;';
    else if (c === '<') out += '&lt;';
    else if (c === '>') out += '&gt;';
    else out += c;
    i++;
  }
  return out;
}

// 给已知标签注入行内样式（合并已有 style 属性，已有属性优先保留）
export function applyInlineStyles(html: string): string {
  return html.replace(/<(h[1-6]|p|blockquote|figure|figcaption|img|a|ul|ol|li|code|hr)\b([^>]*)>/gi, (full, tag, rest) => {
    const style = INLINE_STYLES[tag.toLowerCase()];
    if (!style) return full;
    const restStr = (rest ?? '').trim();
    const selfClose = /\/$/.test(restStr);
    const attrs = selfClose ? restStr.slice(0, -1).trim() : restStr;
    const styleMatch = attrs.match(/\bstyle="([^"]*)"/i);
    let attrsOut: string;
    if (styleMatch) {
      const merged = `${styleMatch[1].replace(/;?\s*$/, ';')}${style}`;
      attrsOut = attrs.replace(styleMatch[0], `style="${merged}"`);
    } else if (attrs) {
      attrsOut = `${attrs} style="${style}"`;
    } else {
      attrsOut = `style="${style}"`;
    }
    return `<${tag} ${attrsOut}${selfClose ? '/' : ''}>`;
  });
}

// Markdown → 语义 HTML（不做行内样式；输入已是 HTML 时直通，保证幂等）
export function markdownToInlineHtml(md: string): string {
  if (!md) return '';
  if (looksLikeHtml(md)) return escapeTextNodes(md);
  return escapeTextNodes(mdToHtml(md));
}

function mdToHtml(md: string): string {
  let html = md;
  const codeSpans: string[] = [];
  const preBlocks: string[] = [];

  // 代码块：先保护，避免被后续正则破坏
  html = html.replace(/```([\w+-]*)\s*\n?([\s\S]*?)(?:```|$)/g, (_m, _lang, code) => {
    const inner = escapeHtml(code.replace(/\s+$/, ''));
    preBlocks.push(`<pre><code>${inner}</code></pre>`);
    return `\u0000PRE${preBlocks.length - 1}\u0000`;
  });
  // 行内代码：占位保护
  html = html.replace(/`([^`]+)`/g, (_m, c) => {
    codeSpans.push(escapeHtml(c));
    return `\u0000CODE${codeSpans.length - 1}\u0000`;
  });

  // 图片
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, src) =>
    `<figure><img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}"/><figcaption>${escapeText(alt)}</figcaption></figure>`);
  // 链接（href 转义，防属性注入）
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, href) =>
    `<a href="${escapeAttr(href)}">${escapeText(text)}</a>`);
  // 多行引用（合并连续引用行为一个 blockquote）
  html = html.replace(/(^|\n)(>)[^\n]*(?:\n(>)[^\n]*)*/g, (block: string) => {
    const clean = block.replace(/^\n+|\n+$/g, '');
    const lines = clean.split('\n').map((l: string) => l.replace(/^\s*>\s?/, ''));
    return `<blockquote>${lines.map((l: string) => `<p>${l}</p>`).join('')}</blockquote>`;
  });
  // 标题
  html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');
  // 无序列表
  html = html.replace(/(^|\n)(- .+(?:\n- .+)*)/g, (_m: string, p: string, block: string) => {
    const items = block.split('\n').map((l: string) => l.replace(/^- /, '').trim());
    return `${p}<ul>${items.map((i: string) => `<li>${i}</li>`).join('')}</ul>`;
  });
  // 有序列表
  html = html.replace(/(^|\n)(\d+\. .+(?:\n\d+\. .+)*)/g, (_m: string, p: string, block: string) => {
    const items = block.split('\n').map((l: string) => l.replace(/^\d+\. /, '').trim());
    return `${p}<ol>${items.map((i: string) => `<li>${i}</li>`).join('')}</ol>`;
  });
  // 分割线
  html = html.replace(/^---+$/gm, '<hr/>');
  // 加粗 / 斜体（占位符含 \u0000，不会被匹配）
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // 恢复行内代码与代码块（代码块在段落包裹之前恢复，避免被包进 <p>）
  html = html.replace(/\u0000CODE(\d+)\u0000/g, (_m, i) => `<code>${codeSpans[+i]}</code>`);
  html = html.replace(/\u0000PRE(\d+)\u0000/g, (_m, i) => preBlocks[+i]);
  // 段落（段落内混入块级元素时拆出，如紧贴段落的引用）
  const blocks = html.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  html = blocks
    .map((b: string) => {
      if (/^<(h\d|figure|blockquote|ul|ol|hr|pre)/.test(b)) return b;
      const parts = b.split(/(?=<(?:blockquote|ul|ol|pre|figure|h[1-6]|hr)\b)/);
      return parts
        .filter((part: string) => part.trim().length > 0)
        .map((part: string) => (/^<(h\d|figure|blockquote|ul|ol|hr|pre)/.test(part) ? part : `<p>${part.trim().replace(/\n/g, '<br/>')}</p>`))
        .join('');
    })
    .join('\n');
  return html;
}

// 公众号正文（含行内样式 + 可选 Eyebrow / 署名）——预览与复制共用同一份
export function wechatBody(mdOrHtml: string, opts: { eyebrow?: string; author?: string } = {}): string {
  const body = applyInlineStyles(markdownToInlineHtml(mdOrHtml || ''));
  const eyebrowHtml = opts.eyebrow
    ? `<div style="font-size:11px;letter-spacing:1.5px;color:#86868b;margin-bottom:18px;">${escapeText(opts.eyebrow.toUpperCase())}</div>`
    : '';
  const authorHtml = opts.author
    ? `<div style="font-size:13px;color:#86868b;margin-top:32px;padding-top:16px;border-top:1px solid #d2d2d7;">${escapeText(opts.author)}</div>`
    : '';
  return eyebrowHtml + body + authorHtml;
}

// 把 HTML 里的图片 src 按映射改写（导出时把内嵌 blob/dataURL 指向 images/ 下的文件）
export function rewriteImageSrcs(html: string, map: Record<string, string>): string {
  let out = html;
  for (const [oldSrc, newSrc] of Object.entries(map)) {
    out = out.split(`src="${oldSrc}"`).join(`src="${newSrc}"`);
  }
  return out;
}

export function buildWechatHtml(opts: BuildOptions): string {
  let body = wechatBody(opts.mdBody, { eyebrow: opts.eyebrow, author: opts.author });
  if (opts.imageSrcMap) body = rewriteImageSrcs(body, opts.imageSrcMap);
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeText(opts.title)}</title>
<style>${WECHAT_INLINE_CSS}
body{padding:24px 20px 80px;}
.__pcl_toolbar{position:fixed;top:16px;right:16px;z-index:9;}
.__pcl_toolbar button{background:#1d1d1f;color:#fff;border:none;padding:8px 14px;border-radius:6px;font-size:13px;cursor:pointer;}
</style>
</head>
<body>
<div class="__pcl_toolbar"><button id="__pcl_copy">复制公众号正文</button></div>
<div id="__pcl_body">${body}</div>
<script>${TOOLBAR_SCRIPT}</script>
</body>
</html>`;
}

const TOOLBAR_SCRIPT = `
(function(){
  var btn=document.getElementById('__pcl_copy');
  if(!btn||!navigator.clipboard)return;
  btn.addEventListener('click',function(){
    var src=document.getElementById('__pcl_body');
    if(!src)return;
    var html=src.innerHTML;
    var plain=src.innerText;
    if(window.ClipboardItem&&navigator.clipboard.write){
      var item=new ClipboardItem({
        'text/html':new Blob([html],{type:'text/html'}),
        'text/plain':new Blob([plain],{type:'text/plain'})
      });
      navigator.clipboard.write([item]).then(function(){
        btn.textContent='已复制，去公众号粘贴';
      }).catch(function(){ fallback(plain,btn); });
    }else{
      fallback(plain,btn);
    }
  });
  function fallback(t,b){
    var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');b.textContent='已复制，去公众号粘贴';}catch(e){b.textContent='复制失败，请手动选择';}
    document.body.removeChild(ta);
  }
})();
`.trim();

// HTML（或 Markdown）→ 纯文本：复制到纯文本场景用
export function mdToPlainText(md: string): string {
  return md
    .replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g, (_m, c) => `\n${decodeHtml(c)}\n`)
    .replace(/!\[[^\]]*\]\(([^)]+)\)/g, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*`]/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// HTML → Markdown：导出 article.md 用（对应用内的受控 HTML 子集）
export function htmlToMarkdown(html: string): string {
  const decode = (t: string) => decodeHtml(t.replace(/<[^>]+>/g, '')).trim();
  let s = html;
  // 代码块
  s = s.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_m, c) => `\n\`\`\`\n${decodeHtml(c).replace(/\n+$/, '')}\n\`\`\`\n\n`);
  // 图片（figure 包裹优先；裸 <img> 兜底）
  s = s.replace(/<figure[^>]*>([\s\S]*?)<\/figure>/gi, (_m, fig) => {
    const img = fig.match(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/i);
    if (img) return `![${img[2] || '图'}](${img[1]})\n\n`;
    return `${decode(fig)}\n\n`;
  });
  s = s.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, (_m, src, alt) => `![${alt || '图'}](${src})`);
  // 标题
  s = s.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_m, t) => `# ${decode(t)}\n\n`);
  s = s.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_m, t) => `## ${decode(t)}\n\n`);
  s = s.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_m, t) => `### ${decode(t)}\n\n`);
  // 引用
  s = s.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, b) => {
    const lines = b.replace(/<\/p><p[^>]*>/gi, '\n').replace(/<[^>]+>/g, '').split('\n').map((l: string) => l.trim()).filter(Boolean).map((l: string) => `> ${l}`);
    return `\n${lines.join('\n')}\n\n`;
  });
  // 列表
  s = s.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_m, b) => {
    const items = [...b.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => `- ${decode(m[1])}`);
    return `\n${items.join('\n')}\n\n`;
  });
  s = s.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_m, b) => {
    const items = [...b.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m, i) => `${i + 1}. ${decode(m[1])}`);
    return `\n${items.join('\n')}\n\n`;
  });
  s = s.replace(/<hr[^>]*\/?>/gi, '\n---\n\n');
  // 链接 / 行内样式
  s = s.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, t) => `[${decode(t)}](${href})`);
  s = s.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, (_m, t) => `**${decode(t)}**`);
  s = s.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, (_m, t) => `*${decode(t)}*`);
  s = s.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, t) => `\`${decode(t)}\``);
  // 段落与换行
  s = s.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, t) => `${decode(t)}\n\n`);
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, (_m, t) => `${decode(t)}\n\n`);
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/\n{3,}/g, '\n\n').trim();
  return s ? `${s}\n` : '';
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export async function copyRichToClipboard(html: string, text: string): Promise<boolean> {
  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([item]);
      return true;
    }
  } catch {
    /* fallthrough */
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
