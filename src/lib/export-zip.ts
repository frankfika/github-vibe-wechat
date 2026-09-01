// 服务端 ZIP 打包。仅在 API routes 使用（runtime = nodejs），不进客户端 bundle。
// buildZip 内部只构建一次 article.html，避免双重嵌套。
import JSZip from 'jszip';
import { buildWechatHtml, type BuildOptions } from './export-html';

// 允许的文件名：images/NN_xxx.ext 或 NN_xxx.ext，仅字母数字下划线连字符与点。
// 防止路径穿越（../、images/../ 等）与非法条目名，最终统一写入 images/ 目录。
const SAFE_IMAGE_NAME = /^(?:images\/)?[A-Za-z0-9._-]+$/;

export async function buildZip(opts: BuildOptions & { mdRaw: string }): Promise<Blob> {
  const zip = new JSZip();
  zip.file('article.md', opts.mdRaw);
  zip.file('article.html', buildWechatHtml(opts));
  if (opts.images) {
    const folder = zip.folder('images');
    if (folder) {
      for (const [name, src] of Object.entries(opts.images)) {
        // 客户端传来的 file 可能带 images/ 前缀，这里统一放进 images/ 目录。
        // 校验条目名，拒绝任何含路径分隔/点相对段的名称，避免 ZIP 条目逃逸目录。
        if (!SAFE_IMAGE_NAME.test(name)) {
          console.warn(`[buildZip] skip unsafe image name: ${JSON.stringify(name)}`);
          continue;
        }
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
