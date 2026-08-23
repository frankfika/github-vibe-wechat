import { create } from 'zustand';
import type { Article, Brief, PlatformId } from './types';

const STORAGE_KEY = 'pencil:articles:v1';

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

function saveAll(articles: Article[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
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
    saveAll(articles);
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
