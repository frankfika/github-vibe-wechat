// 客户端图片工具：收集文章内图片为 dataURL（供 ZIP 打包）、本地降采样压缩。
// 仅客户端使用（依赖 FileReader / Image / canvas）。

export interface ContentImage {
  src: string; // 文章 HTML 里的原始 src
  dataUrl: string; // dataURL（blob: 已转成 dataURL）
  file: string; // ZIP 内路径，如 images/01_img.jpg
}

export interface ContentImageRef {
  src: string;
  alt: string;
  caption: string;
}

// 平台发布页使用的轻量图片清单。图片仍以文章为唯一事实源，避免每个平台重复存储 data URL。
export function extractContentImageRefs(content: string): ContentImageRef[] {
  const images: ContentImageRef[] = [];
  const seen = new Set<string>();
  const push = (src: string, alt = '文章配图', caption = '') => {
    const cleanSrc = decodeAttribute(src.trim());
    if (!cleanSrc || seen.has(cleanSrc)) return;
    seen.add(cleanSrc);
    images.push({
      src: cleanSrc,
      alt: decodeAttribute(stripTags(alt).trim()) || '文章配图',
      caption: decodeAttribute(stripTags(caption).trim()),
    });
  };

  let withoutFigures = content.replace(/<figure\b[^>]*>([\s\S]*?)<\/figure>/gi, (_figure, inner: string) => {
    const imageTag = inner.match(/<img\b[^>]*>/i)?.[0] ?? '';
    const src = readAttribute(imageTag, 'src');
    const alt = readAttribute(imageTag, 'alt');
    const caption = inner.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1] ?? '';
    if (src) push(src, alt, caption);
    return '';
  });
  withoutFigures = withoutFigures.replace(/<img\b[^>]*>/gi, (imageTag) => {
    const src = readAttribute(imageTag, 'src');
    if (src) push(src, readAttribute(imageTag, 'alt'));
    return '';
  });
  for (const match of withoutFigures.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) {
    push(match[2], match[1], match[1]);
  }
  return images;
}

export async function copyContentImage(src: string): Promise<boolean> {
  try {
    if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) return false;
    const blob = await loadContentImageBlob(src);
    const png = blob.type === 'image/png' ? blob : await imageBlobToPng(blob);
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
    return true;
  } catch {
    return false;
  }
}

export async function downloadContentImage(src: string, filename: string): Promise<boolean> {
  try {
    const blob = await loadContentImageBlob(src);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 100);
    return true;
  } catch {
    return false;
  }
}

async function loadContentImageBlob(src: string): Promise<Blob> {
  const response = /^https?:/i.test(src)
    ? await fetch('/api/images/proxy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: src }),
      })
    : await fetch(src);
  if (!response.ok) throw new Error('图片读取失败');
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) throw new Error('图片格式无效');
  return blob;
}

async function imageBlobToPng(blob: Blob): Promise<Blob> {
  const url = URL.createObjectURL(blob);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('无法转换图片');
    context.drawImage(image, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error('无法转换图片')), 'image/png');
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function readAttribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\b${name}=(['"])([\\s\\S]*?)\\1`, 'i'));
  return match?.[2] ?? '';
}

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, ' ');
}

function decodeAttribute(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(fr.error ?? new Error('读取图片失败'));
    fr.readAsDataURL(blob);
  });
}

// 扫描文章 HTML 里的 <img>，收集 data:/blob: 图片（外部 URL / 占位符保持原样）。
// 返回按出现顺序编号的图片列表，供导出时打包进 ZIP 并改写 src。
export async function collectContentImages(html: string): Promise<ContentImage[]> {
  const srcs = [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => m[1]);
  const out: ContentImage[] = [];
  const seen = new Set<string>();
  for (const src of srcs) {
    if (!src || seen.has(src)) continue;
    seen.add(src);
    let dataUrl: string | null = null;
    if (src.startsWith('data:')) {
      dataUrl = src;
    } else if (src.startsWith('blob:')) {
      try {
        const res = await fetch(src);
        if (!res.ok) continue;
        dataUrl = await blobToDataUrl(await res.blob());
      } catch {
        continue;
      }
    } else {
      continue; // http(s) 或 images/ 占位符
    }
    const mime = dataUrl.match(/^data:image\/([\w+-]+)/)?.[1] || 'png';
    const ext = mime === 'jpeg' ? 'jpg' : mime;
    const file = `images/${String(out.length + 1).padStart(2, '0')}_img.${ext}`;
    out.push({ src, dataUrl, file });
  }
  return out;
}

// 本地降采样 + 压缩，避免超大图撑爆 localStorage / 请求体。
export async function downscaleImage(file: Blob, maxDim = 1400, quality = 0.78): Promise<string> {
  const dataUrl = await blobToDataUrl(file);
  return downscaleDataUrl(dataUrl, maxDim, quality);
}

export async function downscaleDataUrl(dataUrl: string, maxDim = 1400, quality = 0.78): Promise<string> {
  if (typeof document === 'undefined') return dataUrl;
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  if (scale >= 1) return dataUrl; // 原图足够小
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  // 文章配图最终通常落在白色页面上。统一成 JPEG 可避免大尺寸 PNG
  // 在 localStorage、富文本剪贴板和适配请求里膨胀到数 MB。
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = src;
  });
}
