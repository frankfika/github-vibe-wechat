// 服务端 ZIP 打包。仅在 API routes 使用（runtime = nodejs），不进客户端 bundle。
// buildZip 内部只构建一次 article.html，避免双重嵌套。
import JSZip from 'jszip';
import { buildWechatHtml, type BuildOptions } from './export-html';

export async function buildZip(opts: BuildOptions & { mdRaw: string }): Promise<Blob> {
  const zip = new JSZip();
  zip.file('article.md', opts.mdRaw);
  zip.file('article.html', buildWechatHtml(opts));
  if (opts.images) {
    const folder = zip.folder('images');
    if (folder) {
      for (const [name, src] of Object.entries(opts.images)) {
        // 客户端传来的 file 可能带 images/ 前缀，这里统一放进 images/ 目录
        const base = name.replace(/^images\//, '');
        if (src.startsWith('data:')) {
          const m = src.match(/^data:[^;]+;base64,(.+)$/);
          if (m) folder.file(base, m[1], { base64: true });
        } else {
          folder.file(base, src);
        }
      }
    }
  }
  return zip.generateAsync({ type: 'blob' });
}
