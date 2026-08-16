import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { emptyState, type AppState, type ContentItem, type Profile } from "./types";

const KEY = "studio-zero-state-v1";

interface Ctx {
  ready: boolean;
  state: AppState;
  setProfile: (p: Profile) => void;
  addItem: (i: Omit<ContentItem, "id" | "createdAt">) => ContentItem;
  updateItem: (id: string, patch: Partial<ContentItem>) => void;
  removeItem: (id: string) => void;
  getItem: (id: string) => ContentItem | undefined;
  reset: () => void;
}

const StoreContext = createContext<Ctx | null>(null);

export const uid = () => Math.random().toString(36).slice(2, 10);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setState({ ...emptyState, ...(JSON.parse(raw) as AppState) });
    } catch {
      /* corrupt payload — start clean */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, ready]);

  const setProfile = useCallback((profile: Profile) => {
    setState((s) => ({ ...s, profile }));
  }, []);

  const addItem = useCallback((input: Omit<ContentItem, "id" | "createdAt">) => {
    const item: ContentItem = { ...input, id: uid(), createdAt: Date.now() };
    setState((s) => ({ ...s, items: [item, ...s.items] }));
    return item;
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<ContentItem>) => {
    setState((s) => ({
      ...s,
      items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setState((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }));
  }, []);

  const getItem = useCallback(
    (id: string) => state.items.find((i) => i.id === id),
    [state.items],
  );

  const reset = useCallback(() => setState(emptyState), []);

  const value = useMemo(
    () => ({ ready, state, setProfile, addItem, updateItem, removeItem, getItem, reset }),
    [ready, state, setProfile, addItem, updateItem, removeItem, getItem, reset],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}