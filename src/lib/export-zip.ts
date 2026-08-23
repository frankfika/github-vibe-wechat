// 服务端 ZIP 打包。仅在 API routes 使用（runtime = nodejs），不进客户端 bundle。
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
