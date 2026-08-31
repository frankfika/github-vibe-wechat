export type ContentLanguage = 'zh' | 'en';

export interface BilingualContent {
  zh: string;
  en: string;
  hasEnglish: boolean;
  separator?: string;
}

// MiniMax may return either Markdown or Tiptap HTML. Keep the original separator
// so switching tabs and editing one language never rewrites the other language.
export function splitBilingualContent(content: string): BilingualContent {
  const htmlMarker = /<h([1-3])\b[^>]*>\s*(?:<[^>]+>\s*)*English\s+Version\s*(?:<[^>]+>\s*)*<\/h\1>/i;
  const markdownMarker = /^\s*#{1,3}\s+English\s+Version\s*$/im;
  const match = htmlMarker.exec(content) ?? markdownMarker.exec(content);

  if (!match || match.index === undefined) {
    return { zh: content, en: '', hasEnglish: false };
  }

  return {
    zh: content.slice(0, match.index).trimEnd(),
    en: content.slice(match.index + match[0].length).trimStart(),
    hasEnglish: true,
    separator: match[0],
  };
}

export function joinBilingualContent(
  zh: string,
  en: string,
  separator = '<h2>English Version</h2>',
): string {
  const chinese = zh.trimEnd();
  const english = en.trimStart();
  if (!english) return chinese;

  const spacing = separator.trimStart().startsWith('<') ? '' : '\n\n';
  return `${chinese}${spacing}${separator}${spacing}${english}`;
}

export function extractContentTitle(content: string): string | null {
  const html = content.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (html) return decodeBasicEntities(html[1].replace(/<[^>]+>/g, '').trim());
  const markdown = content.match(/^#\s+(.*)$/m);
  return markdown ? markdown[1].trim() : null;
}

export function replaceContentTitle(content: string, title: string): string {
  const htmlHeading = /<h1(\b[^>]*)>[\s\S]*?<\/h1>/i;
  if (htmlHeading.test(content)) {
    return content.replace(htmlHeading, (_full, attrs: string) => `<h1${attrs}>${escapeHtml(title)}</h1>`);
  }

  const markdownHeading = /^#\s+.*$/m;
  if (markdownHeading.test(content)) return content.replace(markdownHeading, `# ${title}`);
  if (!title) return content;

  return `<h1>${escapeHtml(title)}</h1>${content}`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]!));
}

function decodeBasicEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
