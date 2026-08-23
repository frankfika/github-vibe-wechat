import { create } from 'zustand';
import type { Article, Brief, PlatformId } from './types';

const STORAGE_KEY = 'pencil:articles:v1';

// —— 持久化安全层 ——
// 1) localStorage 爆配额（尤其内容含 base64 图片时）必须被吞掉，绝不冒泡打断 tiptap 打字或内存 set。
// 2) 文案每次击键都全量序列化很重，用 300ms 防抖合并写；unload 前冲刷，避免关页丢最后一段。

type SaveErrorHandler = (message: string) => void;
let saveErrorHandler: SaveErrorHandler | null = null;
export function setSaveErrorHandler(fn: SaveErrorHandler | null) {
  saveErrorHandler = fn;
}

function loadAll(): Article[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Article[];
  } catch {
    return [];
  }
}

function writeAll(articles: Article[]): boolean {
  if (typeof window === 'undefined') return true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    return true;
  } catch {
    saveErrorHandler?.('保存失败：浏览器本地存储空间不足。内容仍在内存中，请及时导出。');
    return false;
  }
}

let pendingSave: ReturnType<typeof setTimeout> | null = null;
let pendingData: Article[] | null = null;

function flushSave() {
  if (pendingSave) {
    clearTimeout(pendingSave);
    pendingSave = null;
  }
  if (pendingData === null) return;
  const data = pendingData;
  pendingData = null;
  writeAll(data);
}

function scheduleSave(articles: Article[]): boolean {
  pendingData = articles;
  if (pendingSave) return true;
  pendingSave = setTimeout(() => {
    pendingSave = null;
    flushSave();
  }, 300);
  return true;
}

// 关页 / 刷新前把最后一段补丁落盘，避免 300ms 窗口丢字。（模块只 eval 一次，直接挂监听即可）
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushSave);
  window.addEventListener('pagehide', flushSave);
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

interface Store {
  articles: Article[];
  hydrated: boolean;
  hydrate: () => void;
  create: (brief: Brief) => Article;
  get: (id: string) => Article | undefined;
  update: (id: string, patch: Partial<Article>) => void;
  setContent: (id: string, content: string) => void;
  setDraft: (id: string, platform: PlatformId, draft: string) => void;
  remove: (id: string) => void;
}

export const useArticleStore = create<Store>((set, get) => ({
  articles: [],
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    set({ articles: loadAll(), hydrated: true });
  },
  create: (brief) => {
    const article: Article = {
      id: uid(),
      title: '未命名文章',
      brief,
      content: '',
      platformDrafts: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const articles = [article, ...get().articles];
    set({ articles });
    scheduleSave(articles);
    return article;
  },
  get: (id) => get().articles.find((a) => a.id === id),
  update: (id, patch) => {
    const articles = get().articles.map((a) =>
      a.id === id ? { ...a, ...patch, updatedAt: Date.now() } : a,
    );
    set({ articles });
    scheduleSave(articles);
  },
  setContent: (id, content) => {
    get().update(id, { content });
  },
  setDraft: (id, platform, draft) => {
    const article = get().get(id);
    if (!article) return;
    const platformDrafts = { ...article.platformDrafts, [platform]: draft };
    get().update(id, { platformDrafts });
  },
  remove: (id) => {
    const articles = get().articles.filter((a) => a.id !== id);
    set({ articles });
    scheduleSave(articles);
  },
}));
