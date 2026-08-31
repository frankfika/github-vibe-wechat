import { create } from 'zustand';
import type { Article, Brief, PlatformId } from './types';
import { loadConfig } from './config';
import { mergeArticles } from './backup';

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
let pendingResult: ((ok: boolean) => void) | null = null;

function queueSave(articles: Article[], onResult: (ok: boolean) => void) {
  pending = articles;
  pendingResult = onResult;
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    if (pending) {
      const ok = saveAll(pending);
      pending = null;
      pendingResult?.(ok);
      pendingResult = null;
    }
  }, SAVE_DEBOUNCE_MS);
}

// A structural write must supersede any older debounced keystroke snapshot.
// Otherwise an old timer can resurrect a deleted article or drop a newly-created one.
function cancelPendingSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  pending = null;
  pendingResult = null;
}

function flushPendingSave(): boolean {
  if (!pending) return true;
  if (saveTimer) clearTimeout(saveTimer);
  const articles = pending;
  const onResult = pendingResult;
  saveTimer = null;
  pending = null;
  pendingResult = null;
  const ok = saveAll(articles);
  onResult?.(ok);
  return ok;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

interface Store {
  articles: Article[];
  hydrated: boolean;
  saveState: 'saved' | 'saving' | 'error';
  hydrate: () => void;
  flush: () => boolean;
  create: (brief: Brief) => Article;
  get: (id: string) => Article | undefined;
  update: (id: string, patch: Partial<Article>) => void;
  setContent: (id: string, content: string) => void;
  setDraft: (id: string, platform: PlatformId, draft: string) => void;
  remove: (id: string) => void;
  restore: (articles: Article[]) => { total: number; saved: boolean };
}

export const useArticleStore = create<Store>((set, get) => ({
  articles: [],
  hydrated: false,
  saveState: 'saved',
  hydrate: () => {
    if (get().hydrated) return;
    set({ articles: loadAll(), hydrated: true });
  },
  flush: () => flushPendingSave(),
  create: (brief) => {
    const article: Article = {
      id: uid(),
      title: '未命名文章',
      brief,
      content: '',
      platformDrafts: {},
      templateId: loadConfig().defaultTemplateId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const articles = [article, ...get().articles];
    cancelPendingSave();
    const saved = saveAll(articles);
    set({ articles, saveState: saved ? 'saved' : 'error' });
    return article;
  },
  get: (id) => get().articles.find((a) => a.id === id),
  update: (id, patch) => {
    const articles = get().articles.map((a) =>
      a.id === id ? { ...a, ...patch, updatedAt: Date.now() } : a,
    );
    set({ articles, saveState: 'saving' });
    queueSave(articles, (saved) => set({ saveState: saved ? 'saved' : 'error' }));
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
    cancelPendingSave();
    const saved = saveAll(articles);
    set({ articles, saveState: saved ? 'saved' : 'error' });
  },
  restore: (incoming) => {
    flushPendingSave();
    cancelPendingSave();
    const articles = mergeArticles(get().articles, incoming);
    const saved = saveAll(articles);
    set({ articles, saveState: saved ? 'saved' : 'error' });
    return { total: articles.length, saved };
  },
}));
