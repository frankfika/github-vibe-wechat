import type { WechatTemplate } from '@/src/lib/templates';

export function TemplateMiniature({ template, scale = 0.6 }: { template: WechatTemplate; scale?: number }) {
  return (
    <div
      aria-hidden="true"
      className="relative shrink-0 overflow-hidden border border-black/10 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
      style={{ width: 340 * scale, height: 285 * scale }}
    >
      <div
        className="absolute left-0 top-0 w-[340px] origin-top-left"
        style={{ transform: `scale(${scale})` }}
        dangerouslySetInnerHTML={{ __html: miniatureTemplateHtml(template) }}
      />
    </div>
  );
}

function miniatureTemplateHtml(template: WechatTemplate) {
  const { elements } = template.styles;
  return `<section style="${template.styles.wrapper}width:340px;min-height:285px;padding:26px 28px;background-color:${template.preview.background};">
    <div style="${template.styles.eyebrow}margin-bottom:12px;">OMNIWRITER / 预览</div>
    <h1 style="${elements.h1}margin-top:0;margin-bottom:18px;font-size:25px;">一级标题：文章主题</h1>
    <h2 style="${elements.h2}margin-top:22px;margin-bottom:12px;font-size:18px;">二级标题：章节重点</h2>
    <p style="${elements.p}margin-bottom:12px;font-size:12px;line-height:1.7;">正文通过层级、间距和色彩建立稳定的阅读节奏。</p>
    <h3 style="${elements.h3}margin-top:18px;margin-bottom:10px;font-size:14px;">三级标题：段落提示</h3>
  </section>`;
}
