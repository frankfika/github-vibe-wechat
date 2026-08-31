export type WechatTemplateElement =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'p'
  | 'blockquote'
  | 'img'
  | 'figure'
  | 'figcaption'
  | 'strong'
  | 'em'
  | 'a'
  | 'ul'
  | 'ol'
  | 'li'
  | 'code'
  | 'pre'
  | 'hr';

export interface WechatTemplate {
  id: string;
  name: string;
  tagline: string;
  description: string;
  tags: string[];
  status: 'built-in' | 'market';
  preview: {
    background: string;
    ink: string;
    muted: string;
    line: string;
  };
  styles: {
    css: string;
    wrapper: string;
    eyebrow: string;
    author: string;
    quoteParagraph: string;
    captionParagraph: string;
    elements: Record<WechatTemplateElement, string>;
  };
}

export const DEFAULT_WECHAT_TEMPLATE_ID = 'graphite';

const GRAPHITE_TEMPLATE: WechatTemplate = {
  id: DEFAULT_WECHAT_TEMPLATE_ID,
  name: '石墨',
  tagline: '克制、清晰、适合长文',
  description: '黑白灰编辑风格，强调标题层级、阅读节奏和公众号复制兼容性。',
  tags: ['长文', '观点', '科技'],
  status: 'built-in',
  preview: {
    background: '#ffffff',
    ink: '#0a0a0a',
    muted: '#86868b',
    line: '#d2d2d7',
  },
  styles: {
    css: `
body{margin:0;padding:0;background:#fff;color:#1d1d1f;-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;}
#wechat-content{box-sizing:border-box;max-width:100%;margin:0 auto;padding:42px 22px 56px;background:#fff;color:#1d1d1f;font-size:16px;line-height:1.9;letter-spacing:0;}
h1{margin:0 0 32px;padding:22px 0 0;border-top:6px solid #0a0a0a;color:#0a0a0a;font-size:32px;line-height:1.32;font-weight:720;letter-spacing:-0.035em;}
h2{margin:62px 0 24px;padding:0 0 14px;border-bottom:1px solid #d2d2d7;color:#0a0a0a;font-size:23px;line-height:1.45;font-weight:650;letter-spacing:-0.025em;}
p{margin:0 0 22px;color:#29292c;font-size:16px;line-height:1.9;text-align:left;letter-spacing:0;}
blockquote{box-sizing:border-box;margin:30px 0 36px;padding:20px 22px;background:#f5f5f7;border:0;border-left:3px solid #1d1d1f;border-radius:2px;color:#1d1d1f;font-size:17px;line-height:1.8;font-weight:600;}
img{display:block;box-sizing:border-box;width:100%;max-width:100%;height:auto;margin:32px auto 8px;border-radius:4px;}
figure{display:block;margin:32px 0 36px;padding:0;}
figcaption{margin:0;color:#86868b;font-size:12px;line-height:1.65;text-align:left;letter-spacing:0;}
a{color:#1d1d1f;text-decoration:none;border-bottom:1px solid #86868b;}
ul,ol{margin:20px 0 28px;padding-left:24px;color:#29292c;}
li{margin:0 0 12px;padding-left:3px;line-height:1.85;}
code{font-family:"SFMono-Regular",Consolas,"Liberation Mono",monospace;background:#f5f5f7;padding:2px 6px;border-radius:3px;font-size:0.92em;}
hr{height:1px;margin:48px 0;border:0;background:#d2d2d7;}
`.trim(),
    wrapper: "box-sizing:border-box;max-width:100%;margin:0 auto;padding:42px 22px 56px;background-color:#ffffff;color:#1d1d1f;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;font-size:16px;line-height:1.9;letter-spacing:0;",
    eyebrow: "display:inline-block;margin:0 0 20px;padding:0;color:#6e6e73;font-family:'SF Mono','Menlo','Courier New',monospace;font-size:11px;line-height:1.4;font-weight:600;letter-spacing:0.12em;",
    author: 'margin-top:42px;padding-top:18px;border-top:1px solid #d2d2d7;color:#86868b;font-size:13px;line-height:1.7;',
    quoteParagraph: 'margin:0;color:#1d1d1f;font-size:17px;line-height:1.8;text-align:left;',
    captionParagraph: 'margin:8px 0 36px;color:#86868b;font-size:12px;line-height:1.65;text-align:left;letter-spacing:0;',
    elements: {
      h1: 'margin:0 0 32px;padding:22px 0 0;border:0;border-top:6px solid #0a0a0a;color:#0a0a0a;font-size:32px;line-height:1.32;font-weight:720;letter-spacing:-0.035em;',
      h2: 'margin:62px 0 24px;padding:0 0 14px;border-bottom:1px solid #d2d2d7;color:#0a0a0a;font-size:23px;line-height:1.45;font-weight:650;letter-spacing:-0.025em;',
      h3: 'margin:38px 0 18px;padding:0;color:#0a0a0a;font-size:19px;line-height:1.55;font-weight:650;letter-spacing:-0.015em;',
      p: 'margin:0 0 22px;color:#29292c;font-size:16px;line-height:1.9;text-align:left;letter-spacing:0;',
      blockquote: 'box-sizing:border-box;margin:30px 0 36px;padding:20px 22px;background-color:#f5f5f7;border:0;border-left:3px solid #1d1d1f;border-radius:2px;color:#1d1d1f;font-size:17px;line-height:1.8;font-weight:600;',
      img: 'display:block;box-sizing:border-box;width:100%;max-width:100%;height:auto;margin:32px auto 8px;border-radius:4px;',
      figure: 'display:block;margin:32px 0 36px;padding:0;',
      figcaption: 'margin:0;color:#86868b;font-size:12px;line-height:1.65;text-align:left;letter-spacing:0;',
      strong: 'color:#0a0a0a;font-weight:700;',
      em: 'color:#86868b;font-style:normal;',
      a: 'color:#1d1d1f;text-decoration:none;border-bottom:1px solid #86868b;',
      ul: 'margin:20px 0 28px;padding-left:24px;color:#29292c;',
      ol: 'margin:20px 0 28px;padding-left:24px;color:#29292c;',
      li: 'margin:0 0 12px;padding-left:3px;line-height:1.85;',
      code: "font-family:'JetBrains Mono',ui-monospace,monospace;background:#f5f5f7;padding:2px 6px;border-radius:3px;font-size:0.92em;",
      pre: 'box-sizing:border-box;margin:28px 0;padding:18px 20px;overflow-wrap:anywhere;background:#f5f5f7;color:#29292c;font-size:13px;line-height:1.7;white-space:pre-wrap;',
      hr: 'height:1px;margin:48px 0;border:0;background-color:#d2d2d7;',
    },
  },
};

const PAPER_TEMPLATE: WechatTemplate = {
  ...GRAPHITE_TEMPLATE,
  id: 'paper',
  name: '纸页',
  tagline: '温润、松弛、适合随笔',
  description: '暖白纸张与宋体标题，适合人物、随笔和叙事型长文。',
  tags: ['随笔', '人物', '叙事'],
  preview: {
    background: '#fbf8f1',
    ink: '#302a25',
    muted: '#8a7f73',
    line: '#ded6ca',
  },
  styles: {
    ...GRAPHITE_TEMPLATE.styles,
    css: `
body{margin:0;padding:0;background:#fbf8f1;color:#3f3832;-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;}
#wechat-content{box-sizing:border-box;max-width:100%;margin:0 auto;padding:44px 24px 58px;background:#fbf8f1;color:#3f3832;font-size:16px;line-height:2;letter-spacing:.015em;}
h1{margin:0 0 32px;color:#302a25;font-family:"Songti SC","STSong",serif;font-size:31px;line-height:1.4;font-weight:700;letter-spacing:.02em;}
h2{margin:58px 0 24px;padding-left:13px;border-left:3px solid #a06f3b;color:#302a25;font-family:"Songti SC","STSong",serif;font-size:22px;line-height:1.5;font-weight:700;}
p{margin:0 0 23px;color:#3f3832;font-size:16px;line-height:2;text-align:left;}
blockquote{margin:30px 0 36px;padding:20px 22px;background:#f3ede3;border:0;color:#5f5145;font-family:"Songti SC","STSong",serif;font-size:17px;line-height:1.9;}
img{display:block;box-sizing:border-box;width:100%;height:auto;margin:34px auto 9px;border-radius:2px;}
figcaption{margin:0;color:#8a7f73;font-size:12px;line-height:1.7;text-align:center;}
`.trim(),
    wrapper: "box-sizing:border-box;max-width:100%;margin:0 auto;padding:44px 24px 58px;background-color:#fbf8f1;color:#3f3832;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;font-size:16px;line-height:2;letter-spacing:0.015em;",
    eyebrow: "display:inline-block;margin:0 0 22px;color:#a06f3b;font-family:'Songti SC','STSong',serif;font-size:12px;line-height:1.4;font-weight:700;letter-spacing:0.12em;",
    author: 'margin-top:44px;padding-top:18px;border-top:1px solid #ded6ca;color:#8a7f73;font-size:13px;line-height:1.8;',
    quoteParagraph: "margin:0;color:#5f5145;font-family:'Songti SC','STSong',serif;font-size:17px;line-height:1.9;text-align:left;",
    captionParagraph: 'margin:9px 0 36px;color:#8a7f73;font-size:12px;line-height:1.7;text-align:center;',
    elements: {
      ...GRAPHITE_TEMPLATE.styles.elements,
      h1: "margin:0 0 32px;padding:0;color:#302a25;font-family:'Songti SC','STSong',serif;font-size:31px;line-height:1.4;font-weight:700;letter-spacing:0.02em;",
      h2: "margin:58px 0 24px;padding:0 0 0 13px;border:0;border-left:3px solid #a06f3b;color:#302a25;font-family:'Songti SC','STSong',serif;font-size:22px;line-height:1.5;font-weight:700;",
      h3: "margin:36px 0 18px;color:#5f5145;font-family:'Songti SC','STSong',serif;font-size:19px;line-height:1.6;font-weight:700;",
      p: 'margin:0 0 23px;color:#3f3832;font-size:16px;line-height:2;text-align:left;letter-spacing:0.015em;',
      blockquote: "box-sizing:border-box;margin:30px 0 36px;padding:20px 22px;background-color:#f3ede3;border:0;color:#5f5145;font-family:'Songti SC','STSong',serif;font-size:17px;line-height:1.9;",
      img: 'display:block;box-sizing:border-box;width:100%;max-width:100%;height:auto;margin:34px auto 9px;border-radius:2px;',
      figcaption: 'margin:0;color:#8a7f73;font-size:12px;line-height:1.7;text-align:center;',
      strong: 'color:#302a25;font-weight:700;',
      a: 'color:#8a5527;text-decoration:none;border-bottom:1px solid #c8aa8b;',
      hr: 'height:1px;margin:48px 0;border:0;background-color:#ded6ca;',
    },
  },
};

const FOCUS_TEMPLATE: WechatTemplate = {
  ...GRAPHITE_TEMPLATE,
  id: 'focus',
  name: '焦点',
  tagline: '醒目、利落、适合产品与科技',
  description: '深靛蓝强调与紧凑信息层级，适合产品发布、科技解读和教程。',
  tags: ['产品', '科技', '教程'],
  preview: {
    background: '#ffffff',
    ink: '#17172b',
    muted: '#6b6b80',
    line: '#dcdcf0',
  },
  styles: {
    ...GRAPHITE_TEMPLATE.styles,
    css: `
body{margin:0;padding:0;background:#fff;color:#29293d;-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;}
#wechat-content{box-sizing:border-box;max-width:100%;margin:0 auto;padding:40px 22px 56px;background:#fff;color:#29293d;font-size:16px;line-height:1.88;}
h1{margin:0 0 32px;padding:0 0 18px;border-bottom:2px solid #4f46e5;color:#17172b;font-size:33px;line-height:1.28;font-weight:760;letter-spacing:-.035em;}
h2{margin:58px 0 22px;padding:1px 0 1px 14px;background:transparent;border:0;border-left:5px solid #4f46e5;color:#25235c;font-size:22px;line-height:1.45;font-weight:720;}
p{margin:0 0 21px;color:#29293d;font-size:16px;line-height:1.88;}
blockquote{margin:28px 0 34px;padding:18px 20px;background:#f6f7ff;border:1px solid #dcdcf0;border-radius:6px;color:#312e81;font-size:16px;line-height:1.8;font-weight:600;}
img{display:block;box-sizing:border-box;width:100%;height:auto;margin:30px auto 8px;border-radius:6px;}
figcaption{margin:0;color:#6b6b80;font-size:12px;line-height:1.65;text-align:left;}
`.trim(),
    wrapper: "box-sizing:border-box;max-width:100%;margin:0 auto;padding:40px 22px 56px;background-color:#ffffff;color:#29293d;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;font-size:16px;line-height:1.88;letter-spacing:0;",
    eyebrow: "display:inline-block;margin:0 0 20px;padding:5px 9px;background-color:#312e81;color:#ffffff;font-family:'SF Mono','Menlo','Courier New',monospace;font-size:10px;line-height:1.4;font-weight:700;letter-spacing:0.12em;border-radius:3px;",
    author: 'margin-top:42px;padding-top:18px;border-top:1px solid #dcdcf0;color:#6b6b80;font-size:13px;line-height:1.7;',
    quoteParagraph: 'margin:0;color:#312e81;font-size:16px;line-height:1.8;text-align:left;font-weight:600;',
    captionParagraph: 'margin:8px 0 34px;color:#6b6b80;font-size:12px;line-height:1.65;text-align:left;',
    elements: {
      ...GRAPHITE_TEMPLATE.styles.elements,
      h1: 'margin:0 0 32px;padding:0 0 18px;border:0;border-bottom:2px solid #4f46e5;color:#17172b;font-size:33px;line-height:1.28;font-weight:760;letter-spacing:-0.035em;',
      h2: 'margin:58px 0 22px;padding:1px 0 1px 14px;background-color:transparent;border:0;border-left:5px solid #4f46e5;color:#25235c;font-size:22px;line-height:1.45;font-weight:720;',
      h3: 'margin:34px 0 16px;padding:0 0 7px;border:0;border-bottom:1px solid #c7d2fe;color:#4338ca;font-size:16px;line-height:1.5;font-weight:750;letter-spacing:0.08em;',
      p: 'margin:0 0 21px;color:#29293d;font-size:16px;line-height:1.88;text-align:left;',
      blockquote: 'box-sizing:border-box;margin:28px 0 34px;padding:18px 20px;background-color:#f6f7ff;border:1px solid #dcdcf0;border-radius:6px;color:#312e81;font-size:16px;line-height:1.8;font-weight:600;',
      img: 'display:block;box-sizing:border-box;width:100%;max-width:100%;height:auto;margin:30px auto 8px;border-radius:6px;',
      figcaption: 'margin:0;color:#6b6b80;font-size:12px;line-height:1.65;text-align:left;',
      strong: 'color:#312e81;font-weight:750;',
      a: 'color:#4f46e5;text-decoration:none;border-bottom:1px solid #a5b4fc;',
      code: "font-family:'JetBrains Mono',ui-monospace,monospace;background:#eef2ff;color:#312e81;padding:2px 6px;border-radius:3px;font-size:0.92em;",
      pre: 'box-sizing:border-box;margin:28px 0;padding:18px 20px;overflow-wrap:anywhere;background:#17172b;color:#eef2ff;font-size:13px;line-height:1.7;white-space:pre-wrap;border-radius:6px;',
      hr: 'height:1px;margin:46px 0;border:0;background-color:#dcdcf0;',
    },
  },
};

const CITRUS_TEMPLATE: WechatTemplate = {
  ...GRAPHITE_TEMPLATE,
  id: 'citrus',
  name: '橙心',
  tagline: '明快、亲和、适合经验分享',
  description: '参考经典 Markdown 编辑器的橙色主题，以编号感标题和轻量色块强化阅读层级。',
  tags: ['教程', '经验', '清单'],
  status: 'market',
  preview: { background: '#fffdf9', ink: '#3a2418', muted: '#9a6b4c', line: '#f0c8a8' },
  styles: {
    ...GRAPHITE_TEMPLATE.styles,
    css: `
body{margin:0;padding:0;background:#fffdf9;color:#3f3028;-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue","PingFang SC","Microsoft YaHei",sans-serif;}
#wechat-content{box-sizing:border-box;max-width:100%;margin:0 auto;padding:42px 22px 56px;background:#fffdf9;color:#3f3028;font-size:16px;line-height:1.92;}
h1{margin:0 0 32px;padding:0 0 18px;border-bottom:2px solid #e76f2e;color:#2c1b12;font-size:32px;line-height:1.3;font-weight:750;}
h2{margin:58px 0 24px;padding:9px 14px;background:#fff0e5;border-left:4px solid #e76f2e;color:#6f3216;font-size:22px;line-height:1.45;font-weight:700;}
h3{margin:36px 0 17px;padding:0 0 8px;border-bottom:1px dashed #e7b38f;color:#9a4c22;font-size:18px;line-height:1.55;font-weight:700;}
`.trim(),
    wrapper: "box-sizing:border-box;max-width:100%;margin:0 auto;padding:42px 22px 56px;background-color:#fffdf9;color:#3f3028;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue','PingFang SC','Microsoft YaHei',sans-serif;font-size:16px;line-height:1.92;letter-spacing:0;",
    eyebrow: "display:inline-block;margin:0 0 20px;padding:4px 9px;background-color:#e76f2e;color:#ffffff;font-family:'SF Mono','Menlo',monospace;font-size:10px;line-height:1.4;font-weight:700;letter-spacing:0.12em;border-radius:2px;",
    author: 'margin-top:42px;padding-top:18px;border-top:1px solid #f0c8a8;color:#9a6b4c;font-size:13px;line-height:1.7;',
    quoteParagraph: 'margin:0;color:#704326;font-size:16px;line-height:1.85;text-align:left;',
    captionParagraph: 'margin:8px 0 34px;color:#9a6b4c;font-size:12px;line-height:1.65;text-align:center;',
    elements: {
      ...GRAPHITE_TEMPLATE.styles.elements,
      h1: 'margin:0 0 32px;padding:0 0 18px;border:0;border-bottom:2px solid #e76f2e;color:#2c1b12;font-size:32px;line-height:1.3;font-weight:750;letter-spacing:-0.025em;',
      h2: 'margin:58px 0 24px;padding:9px 14px;background-color:#fff0e5;border:0;border-left:4px solid #e76f2e;color:#6f3216;font-size:22px;line-height:1.45;font-weight:700;',
      h3: 'margin:36px 0 17px;padding:0 0 8px;border:0;border-bottom:1px dashed #e7b38f;color:#9a4c22;font-size:18px;line-height:1.55;font-weight:700;',
      p: 'margin:0 0 22px;color:#3f3028;font-size:16px;line-height:1.92;text-align:left;',
      blockquote: 'box-sizing:border-box;margin:28px 0 34px;padding:18px 20px;background-color:#fff6ef;border:0;border-left:3px solid #e76f2e;color:#704326;font-size:16px;line-height:1.85;',
      strong: 'color:#9a4c22;font-weight:750;',
      a: 'color:#c4541f;text-decoration:none;border-bottom:1px solid #e7b38f;',
      code: "font-family:'JetBrains Mono',ui-monospace,monospace;background:#fff0e5;color:#9a4c22;padding:2px 6px;border-radius:3px;font-size:0.92em;",
      pre: 'box-sizing:border-box;margin:28px 0;padding:18px 20px;overflow-wrap:anywhere;background:#2c1b12;color:#fff5ed;font-size:13px;line-height:1.7;white-space:pre-wrap;border-radius:4px;',
      hr: 'height:1px;margin:46px 0;border:0;background-color:#f0c8a8;',
    },
  },
};

const GEEK_TEMPLATE: WechatTemplate = {
  ...GRAPHITE_TEMPLATE,
  id: 'geek',
  name: '极客黑',
  tagline: '高对比、代码感、适合技术文章',
  description: '黑色标题条、等宽辅助信息与深色代码块，为教程和工程复盘建立清晰扫描路径。',
  tags: ['代码', '工程', '复盘'],
  status: 'market',
  preview: { background: '#ffffff', ink: '#111827', muted: '#6b7280', line: '#111827' },
  styles: {
    ...GRAPHITE_TEMPLATE.styles,
    css: `
body{margin:0;padding:0;background:#fff;color:#20242b;-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue","PingFang SC","Microsoft YaHei",sans-serif;}
#wechat-content{box-sizing:border-box;max-width:100%;margin:0 auto;padding:40px 22px 56px;background:#fff;color:#20242b;font-size:16px;line-height:1.88;}
h1{margin:0 0 32px;padding:20px;background:#111827;color:#fff;font-size:31px;line-height:1.3;font-weight:750;}
h2{margin:58px 0 23px;padding:0 0 10px;border-bottom:3px solid #111827;color:#111827;font-size:22px;line-height:1.45;font-weight:750;}
h3{margin:34px 0 17px;padding-left:12px;border-left:3px solid #6b7280;color:#374151;font-size:18px;line-height:1.55;font-weight:700;}
`.trim(),
    wrapper: "box-sizing:border-box;max-width:100%;margin:0 auto;padding:40px 22px 56px;background-color:#ffffff;color:#20242b;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue','PingFang SC','Microsoft YaHei',sans-serif;font-size:16px;line-height:1.88;letter-spacing:0;",
    eyebrow: "display:inline-block;margin:0 0 12px;color:#c7ff5e;font-family:'SF Mono','Menlo','Courier New',monospace;font-size:10px;line-height:1.4;font-weight:700;letter-spacing:0.12em;",
    author: "margin-top:42px;padding-top:18px;border-top:1px solid #d1d5db;color:#6b7280;font-family:'SF Mono','Menlo',monospace;font-size:12px;line-height:1.7;",
    quoteParagraph: 'margin:0;color:#374151;font-size:16px;line-height:1.8;text-align:left;',
    captionParagraph: "margin:8px 0 34px;color:#6b7280;font-family:'SF Mono','Menlo',monospace;font-size:11px;line-height:1.65;text-align:left;",
    elements: {
      ...GRAPHITE_TEMPLATE.styles.elements,
      h1: 'margin:0 0 32px;padding:20px;background-color:#111827;border:0;color:#ffffff;font-size:31px;line-height:1.3;font-weight:750;letter-spacing:-0.025em;',
      h2: 'margin:58px 0 23px;padding:0 0 10px;background-color:transparent;border:0;border-bottom:3px solid #111827;color:#111827;font-size:22px;line-height:1.45;font-weight:750;',
      h3: 'margin:34px 0 17px;padding:0 0 0 12px;border:0;border-left:3px solid #6b7280;color:#374151;font-size:18px;line-height:1.55;font-weight:700;',
      p: 'margin:0 0 21px;color:#20242b;font-size:16px;line-height:1.88;text-align:left;',
      blockquote: 'box-sizing:border-box;margin:28px 0 34px;padding:18px 20px;background-color:#f3f4f6;border:1px solid #d1d5db;border-radius:0;color:#374151;font-size:16px;line-height:1.8;',
      strong: 'color:#111827;font-weight:800;',
      a: 'color:#111827;text-decoration:none;border-bottom:2px solid #9ca3af;',
      code: "font-family:'JetBrains Mono',ui-monospace,monospace;background:#eef0f2;color:#111827;padding:2px 6px;border-radius:2px;font-size:0.92em;",
      pre: "box-sizing:border-box;margin:28px 0;padding:20px;overflow-wrap:anywhere;background:#111827;color:#e5e7eb;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;line-height:1.72;white-space:pre-wrap;border-radius:0;border-left:4px solid #c7ff5e;",
      hr: 'height:3px;margin:46px 0;border:0;background-color:#111827;',
    },
  },
};

const JADE_TEMPLATE: WechatTemplate = {
  ...GRAPHITE_TEMPLATE,
  id: 'jade',
  name: '青简',
  tagline: '清新、安静、适合知识科普',
  description: '低饱和青绿色与留白组合，三级标题分别采用下划线、竖线和胶囊标签。',
  tags: ['科普', '知识', '方法'],
  status: 'market',
  preview: { background: '#fbfefd', ink: '#173d36', muted: '#66837d', line: '#9dcfc2' },
  styles: {
    ...GRAPHITE_TEMPLATE.styles,
    css: `
body{margin:0;padding:0;background:#fbfefd;color:#29463f;-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue","PingFang SC","Microsoft YaHei",sans-serif;}
#wechat-content{box-sizing:border-box;max-width:100%;margin:0 auto;padding:42px 22px 56px;background:#fbfefd;color:#29463f;font-size:16px;line-height:1.94;}
h1{margin:0 0 32px;padding:0 0 16px;border-bottom:1px solid #72b7a6;color:#173d36;font-size:31px;line-height:1.34;font-weight:750;}
h2{margin:58px 0 23px;padding-left:13px;border-left:4px solid #3f927e;color:#1f5b4d;font-size:22px;line-height:1.48;font-weight:700;}
h3{margin:35px 0 17px;padding:0 0 7px;border-bottom:1px dashed #9dcfc2;color:#327563;font-size:17px;line-height:1.5;font-weight:720;letter-spacing:.04em;}
`.trim(),
    wrapper: "box-sizing:border-box;max-width:100%;margin:0 auto;padding:42px 22px 56px;background-color:#fbfefd;color:#29463f;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue','PingFang SC','Microsoft YaHei',sans-serif;font-size:16px;line-height:1.94;letter-spacing:0;",
    eyebrow: "display:inline-block;margin:0 0 20px;color:#3f927e;font-family:'SF Mono','Menlo',monospace;font-size:10px;line-height:1.4;font-weight:700;letter-spacing:0.14em;",
    author: 'margin-top:42px;padding-top:18px;border-top:1px solid #b9ddd4;color:#66837d;font-size:13px;line-height:1.7;',
    quoteParagraph: 'margin:0;color:#315f54;font-size:16px;line-height:1.85;text-align:left;',
    captionParagraph: 'margin:8px 0 34px;color:#66837d;font-size:12px;line-height:1.65;text-align:center;',
    elements: {
      ...GRAPHITE_TEMPLATE.styles.elements,
      h1: 'margin:0 0 32px;padding:0 0 16px;border:0;border-bottom:1px solid #72b7a6;color:#173d36;font-size:31px;line-height:1.34;font-weight:750;letter-spacing:-0.02em;',
      h2: 'margin:58px 0 23px;padding:0 0 0 13px;border:0;border-left:4px solid #3f927e;color:#1f5b4d;font-size:22px;line-height:1.48;font-weight:700;',
      h3: 'margin:35px 0 17px;padding:0 0 7px;background-color:transparent;border:0;border-bottom:1px dashed #9dcfc2;color:#327563;font-size:17px;line-height:1.5;font-weight:720;letter-spacing:0.04em;',
      p: 'margin:0 0 22px;color:#29463f;font-size:16px;line-height:1.94;text-align:left;',
      blockquote: 'box-sizing:border-box;margin:28px 0 34px;padding:18px 20px;background-color:#edf8f5;border:0;border-left:3px solid #72b7a6;color:#315f54;font-size:16px;line-height:1.85;',
      strong: 'color:#1f5b4d;font-weight:750;',
      a: 'color:#327563;text-decoration:none;border-bottom:1px solid #72b7a6;',
      code: "font-family:'JetBrains Mono',ui-monospace,monospace;background:#e6f5f0;color:#1f5b4d;padding:2px 6px;border-radius:3px;font-size:0.92em;",
      pre: 'box-sizing:border-box;margin:28px 0;padding:18px 20px;overflow-wrap:anywhere;background:#173d36;color:#e6f5f0;font-size:13px;line-height:1.72;white-space:pre-wrap;border-radius:4px;',
      hr: 'height:1px;margin:46px 0;border:0;background-color:#b9ddd4;',
    },
  },
};

const MAGAZINE_TEMPLATE: WechatTemplate = {
  ...GRAPHITE_TEMPLATE,
  id: 'magazine',
  name: '刊物',
  tagline: '编辑感、强层级、适合深度报道',
  description: '大标题、红色章节线和小号栏目标识，适合人物报道、行业观察与深度评论。',
  tags: ['报道', '商业', '评论'],
  status: 'market',
  preview: { background: '#ffffff', ink: '#191919', muted: '#777777', line: '#b4232c' },
  styles: {
    ...GRAPHITE_TEMPLATE.styles,
    css: `
body{margin:0;padding:0;background:#fff;color:#282828;-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue","PingFang SC","Microsoft YaHei",sans-serif;}
#wechat-content{box-sizing:border-box;max-width:100%;margin:0 auto;padding:42px 22px 58px;background:#fff;color:#282828;font-size:16px;line-height:1.92;}
h1{margin:0 0 34px;padding:0;color:#151515;font-family:"Songti SC","STSong",serif;font-size:34px;line-height:1.28;font-weight:800;}
h2{margin:62px 0 24px;padding:0 0 10px;border-bottom:4px solid #b4232c;color:#191919;font-size:23px;line-height:1.42;font-weight:800;}
h3{margin:36px 0 18px;color:#b4232c;font-size:15px;line-height:1.5;font-weight:800;letter-spacing:.12em;text-transform:uppercase;}
`.trim(),
    wrapper: "box-sizing:border-box;max-width:100%;margin:0 auto;padding:42px 22px 58px;background-color:#ffffff;color:#282828;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue','PingFang SC','Microsoft YaHei',sans-serif;font-size:16px;line-height:1.92;letter-spacing:0;",
    eyebrow: "display:inline-block;margin:0 0 18px;padding-top:5px;border-top:3px solid #b4232c;color:#b4232c;font-family:'SF Mono','Menlo',monospace;font-size:10px;line-height:1.4;font-weight:800;letter-spacing:0.14em;",
    author: 'margin-top:46px;padding-top:18px;border-top:1px solid #d7d7d7;color:#777777;font-size:13px;line-height:1.7;',
    quoteParagraph: "margin:0;color:#333333;font-family:'Songti SC','STSong',serif;font-size:18px;line-height:1.85;text-align:left;font-weight:600;",
    captionParagraph: 'margin:8px 0 36px;color:#777777;font-size:11px;line-height:1.65;text-align:right;letter-spacing:0.04em;',
    elements: {
      ...GRAPHITE_TEMPLATE.styles.elements,
      h1: "margin:0 0 34px;padding:0;border:0;color:#151515;font-family:'Songti SC','STSong',serif;font-size:34px;line-height:1.28;font-weight:800;letter-spacing:-0.025em;",
      h2: 'margin:62px 0 24px;padding:0 0 10px;border:0;border-bottom:4px solid #b4232c;color:#191919;font-size:23px;line-height:1.42;font-weight:800;',
      h3: 'margin:36px 0 18px;padding:0;border:0;color:#b4232c;font-size:15px;line-height:1.5;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;',
      p: 'margin:0 0 22px;color:#282828;font-size:16px;line-height:1.92;text-align:left;',
      blockquote: "box-sizing:border-box;margin:32px 0 38px;padding:4px 0 4px 20px;background-color:transparent;border:0;border-left:5px solid #b4232c;color:#333333;font-family:'Songti SC','STSong',serif;font-size:18px;line-height:1.85;font-weight:600;",
      strong: 'color:#151515;font-weight:800;',
      a: 'color:#b4232c;text-decoration:none;border-bottom:1px solid #b4232c;',
      code: "font-family:'JetBrains Mono',ui-monospace,monospace;background:#f2f2f2;color:#b4232c;padding:2px 6px;border-radius:0;font-size:0.92em;",
      pre: 'box-sizing:border-box;margin:30px 0;padding:20px;overflow-wrap:anywhere;background:#191919;color:#f5f5f5;font-size:13px;line-height:1.72;white-space:pre-wrap;border-radius:0;',
      hr: 'height:4px;margin:50px 0;border:0;background-color:#b4232c;',
    },
  },
};

// 模板市场只扩展这份注册表；预览、复制和导出会自动走同一个模板解析器。
export const WECHAT_TEMPLATES: WechatTemplate[] = [
  GRAPHITE_TEMPLATE,
  PAPER_TEMPLATE,
  FOCUS_TEMPLATE,
  CITRUS_TEMPLATE,
  GEEK_TEMPLATE,
  JADE_TEMPLATE,
  MAGAZINE_TEMPLATE,
];

export const WECHAT_TEMPLATE_MAP = Object.fromEntries(
  WECHAT_TEMPLATES.map((template) => [template.id, template]),
) as Record<string, WechatTemplate>;

export function resolveWechatTemplate(id?: string): WechatTemplate {
  return (id && WECHAT_TEMPLATE_MAP[id]) || WECHAT_TEMPLATE_MAP[DEFAULT_WECHAT_TEMPLATE_ID];
}
