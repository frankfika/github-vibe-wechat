// 客户端图片工具：收集文章内图片为 dataURL（供 ZIP 打包）、本地降采样压缩。
// 仅客户端使用（依赖 FileReader / Image / canvas）。

export interface ContentImage {
  src: string; // 文章 HTML 里的原始 src
  dataUrl: string; // dataURL（blob: 已转成 dataURL）
  file: string; // ZIP 内路径，如 images/01_img.jpg
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
export async function downscaleImage(file: Blob, maxDim = 1600, quality = 0.82): Promise<string> {
  const dataUrl = await blobToDataUrl(file);
  return downscaleDataUrl(dataUrl, maxDim, quality);
}

export async function downscaleDataUrl(dataUrl: string, maxDim = 1600, quality = 0.82): Promise<string> {
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
  ctx.drawImage(img, 0, 0, w, h);
  const isPng = /^data:image\/png/i.test(dataUrl) || /^data:image\/gif/i.test(dataUrl);
  const mime = isPng ? 'image/png' : 'image/jpeg';
  return canvas.toDataURL(mime, quality);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = src;
  });
}
