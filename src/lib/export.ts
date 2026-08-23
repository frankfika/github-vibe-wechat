// 导出：构建公众号石墨风 HTML、一键复制载荷（rich clipboard）、ZIP 打包。
// 吸收原 wechat-silicon-editor/build_wechat_article.py 的核心规则（行内样式 + 复制按钮 + 嵌入图片）。

import JSZip from 'jszip';

// 公众号石墨风 CSS（行内；构建产物不依赖外部样式表，因为公众号会剥离 <style>）
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

export interface BuildOptions {
  title: string;
  eyebrow?: string;
  author?: string;
  mdBody: string;        // 母稿 Markdown
  images?: Record<string, string>; // filename -> dataURL or http URL
}

// 极简 Markdown → 行内样式的 HTML（够公众号用；不追求完整 GFM）
export function markdownToInlineHtml(md: string): string {
  let html = md;
  // 图片：![alt](src)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    const figure = `<figure><img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}"/><figcaption>${escapeText(alt)}</figcaption></figure>`;
    return figure;
  });
  // 链接：[t](u)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // 引用
  html = html.replace(/^>\s?(.*)$/gm, '<blockquote>$1</blockquote>');
  // 标题
  html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');
  // 列表
  html = html.replace(/(^|\n)(- .+(?:\n- .+)*)/g, (_, p, block) => {
    const items = block.split('\n').map((l: string) => l.replace(/^- /, '').trim());
    return `${p}<ul>${items.map((i: string) => `<li>${i}</li>`).join('')}</ul>`;
  });
  // 分隔线
  html = html.replace(/^---+$/gm, '<hr/>');
  // 粗体 / 斜体
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // 段落（按空行分段）
  const blocks = html.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  html = blocks
    .map((b) => {
      if (/^<(h\d|figure|blockquote|ul|ol|hr|pre|img)/.test(b)) return b;
      return `<p>${b.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');
  return html;
}

function escapeAttr(s: string) { return s.replace(/"/g, '&quot;'); }
function escapeText(s: string) { return s.replace(/[<>]/g, (c) => (c === '<' ? '&lt;' : '&gt;')); }

// 构建带复制按钮的预览 HTML（本地打开即可用：file:// 下 Clipboard API + execCommand fallback）
export function buildWechatHtml(opts: BuildOptions): string {
  const body = markdownToInlineHtml(opts.mdBody);
  const eyebrow = opts.eyebrow ? `<div style="font-size:11px;letter-spacing:1.5px;color:#86868b;margin-bottom:18px;">${escapeText(opts.eyebrow.toUpperCase())}</div>` : '';
  const author = opts.author ? `<div style="font-size:13px;color:#86868b;margin-top:32px;padding-top:16px;border-top:1px solid #d2d2d7;">${escapeText(opts.author)}</div>` : '';
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
${eyebrow}
<div id="__pcl_body">${body}</div>
${author}
<script>${TOOLBAR_SCRIPT}</script>
</body>
</html>`;
}

// 富文本复制载荷（HTML + 纯文本双格式；图片以 dataURL 嵌入以便公众号后台粘贴）
export async function buildRichClipboardPayload(
  md: string,
  images: Record<string, string> = {},
): Promise<{ html: string; text: string }> {
  let processed = md;
  for (const [filename, dataUrl] of Object.entries(images)) {
    const re = new RegExp(`\\(images/${escapeRegex(filename)}\\)`, 'g');
    processed = processed.replace(re, `(${dataUrl})`);
  }
  const html = markdownToInlineHtml(processed);
  const text = mdToPlainText(md);
  return { html, text };
}

function mdToPlainText(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*`]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeRegex(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ZIP 打包：HTML + 图片 + 母稿 md
export async function buildZip(opts: BuildOptions & { mdRaw: string }): Promise<Blob> {
  const zip = new JSZip();
  zip.file('article.md', opts.mdRaw);
  zip.file('article.html', buildWechatHtml(opts));
  if (opts.images) {
    const folder = zip.folder('images');
    if (folder) {
      for (const [name, src] of Object.entries(opts.images)) {
        if (src.startsWith('data:')) {
          const m = src.match(/^data:[^;]+;base64,(.+)$/);
          if (m) folder.file(name, m[1], { base64: true });
        } else {
          folder.file(name, src);
        }
      }
    }
  }
  return zip.generateAsync({ type: 'blob' });
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
  } catch {/* fallthrough */}
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) return false;
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    await navigator.clipboard.write([new ClipboardItem({ [blob.type || 'image/png']: blob })]);
    return true;
  } catch {
    return false;
  }
}
