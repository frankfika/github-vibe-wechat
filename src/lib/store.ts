import { create } from 'zustand';
import type { Article, Brief, PlatformId } from './types';

const STORAGE_KEY = 'pencil:articles:v1';
const SAVE_DEBOUNCE_MS = 400;

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

// 配额（QuotaExceededError）等写入失败不抛未捕获异常：内容仍保留在内存里，
// 控制台给出提示，避免整篇文章丢失 / 编辑器崩溃。
function saveAll(articles: Article[]): boolean {
  if (typeof window === 'undefined') return true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    return true;
  } catch (e) {
    console.warn('[OmniWriter] 本地保存失败（可能超出 localStorage 配额）：', e);
    return false;
  }
}

// 内容类更新（击键）做防抖批量落盘，结构性操作（新建/删除）立即落盘
let pending: Article[] | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function queueSave(articles: Article[]) {
  pending = articles;
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    if (pending) {
      saveAll(pending);
      pending = null;
    }
  }, SAVE_DEBOUNCE_MS);
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
    saveAll(articles);
    set({ articles });
    return article;
  },
  get: (id) => get().articles.find((a) => a.id === id),
  update: (id, patch) => {
    const articles = get().articles.map((a) =>
      a.id === id ? { ...a, ...patch, updatedAt: Date.now() } : a,
    );
    queueSave(articles);
    set({ articles });
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
    saveAll(articles);
    set({ articles });
  },
}));
