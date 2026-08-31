import { PLATFORM_ORDER } from './platforms';
import type { PlatformId } from './types';

const PLATFORM_ALIASES: Array<[PlatformId, RegExp]> = [
  ['wechat', /公众号|微信/],
  ['x', /(?:^|\s)X(?:\s|$)|Twitter|推特/i],
  ['reddit', /Reddit/i],
  ['hacker-news', /Hacker\s*News|Show\s*HN|\bHN\b/i],
  ['zhihu', /知乎/],
  ['csdn', /CSDN/i],
  ['product-hunt', /Product\s*Hunt|\bPH\b/i],
  ['bilibili', /B站|哔哩哔哩|Bilibili/i],
  ['xiaohongshu', /小红书/],
];

export function inferPlatformsFromInstruction(instruction: string): PlatformId[] {
  if (/全平台|一稿多投|所有平台|全网/.test(instruction)) return [...PLATFORM_ORDER];
  return PLATFORM_ALIASES.filter(([, pattern]) => pattern.test(instruction)).map(([platform]) => platform);
}

export function inferAgentId(instruction: string, urls: string[]): string {
  if (/只排版|保留原文|不要改写|原样排版/.test(instruction)) return 'copy-format';
  if (/Product\s*Hunt|\bPH\s*发布/i.test(instruction)) return 'ph-launch';
  if (/小红书/.test(instruction) && !/全平台|一稿多投|全网/.test(instruction)) return 'xiaohongshu';
  if (/B站|哔哩哔哩|Bilibili/i.test(instruction) && !/全平台|一稿多投|全网/.test(instruction)) return 'bilibili';
  if (urls.some((url) => /github\.com/i.test(url))) {
    return /我的|我们|自己|首发|发布|上线/.test(instruction) ? 'project-launch' : 'project-review';
  }
  if (urls.length > 0 || /新闻|报道|事件|资讯|快讯/.test(instruction)) return 'news-fast';
  return 'opinion';
}
