import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  emptyState,
  type AppState,
  type ContentFormat,
  type ContentItem,
  type ContentPack,
  type Goal,
  type Platform,
  type Profile,
  type ScriptSection,
  type Status,
  type Thumbnail,
} from "./types";

interface Ctx {
  ready: boolean;
  userId: string | null;
  email: string | null;
  state: AppState;
  setProfile: (p: Profile) => void;
  addItem: (i: Omit<ContentItem, "id" | "createdAt">) => ContentItem;
  updateItem: (id: string, patch: Partial<ContentItem>) => void;
  removeItem: (id: string) => void;
  getItem: (id: string) => ContentItem | undefined;
  signOut: () => Promise<void>;
  reset: () => void;
}

const StoreContext = createContext<Ctx | null>(null);

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

type Row = Record<string, unknown>;

function rowToItem(r: Row): ContentItem {
  const base: ContentItem = {
    id: String(r["id"]),
    title: String(r["title"] ?? ""),
    hook: String(r["hook"] ?? ""),
    angle: String(r["angle"] ?? ""),
    platform: (r["platform"] as Platform) ?? "YouTube",
    format: (r["format"] as ContentFormat) ?? "Short",
    status: (r["status"] as Status) ?? "Idea",
    createdAt: new Date(String(r["created_at"] ?? Date.now())).getTime(),
  };
  if (r["why"]) base.why = String(r["why"]);
  if (r["publish_date"]) base.publishDate = String(r["publish_date"]);
  if (r["script"]) base.script = r["script"] as ScriptSection[];
  if (r["pack"]) base.pack = r["pack"] as ContentPack;
  if (r["thumbnail"]) base.thumbnail = r["thumbnail"] as Thumbnail;
  if (r["metrics"]) base.metrics = r["metrics"] as Record<string, number>;
  return base;
}

function itemToRow(i: Partial<ContentItem>): Row {
  const row: Row = {};
  if (i.title !== undefined) row["title"] = i.title;
  if (i.hook !== undefined) row["hook"] = i.hook;
  if (i.angle !== undefined) row["angle"] = i.angle;
  if (i.why !== undefined) row["why"] = i.why;
  if (i.platform !== undefined) row["platform"] = i.platform;
  if (i.format !== undefined) row["format"] = i.format;
  if (i.status !== undefined) row["status"] = i.status;
  if (i.publishDate !== undefined) row["publish_date"] = i.publishDate || null;
  if (i.script !== undefined) row["script"] = i.script;
  if (i.pack !== undefined) row["pack"] = i.pack;
  if (i.thumbnail !== undefined) row["thumbnail"] = i.thumbnail;
  if (i.metrics !== undefined) row["metrics"] = i.metrics;
  return row;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState);
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load(uidValue: string | null) {
      if (!uidValue) {
        if (active) {
          setState(emptyState);
          setReady(true);
        }
        return;
      }
      const [{ data: profileRow }, { data: itemRows }] = await Promise.all([
        supabase.from("creator_profiles").select("*").eq("user_id", uidValue).maybeSingle(),
        supabase
          .from("content_items")
          .select("*")
          .eq("user_id", uidValue)
          .order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      const p = profileRow as Row | null;
      setState({
        profile: p
          ? {
              name: String(p["name"] ?? ""),
              niche: String(p["niche"] ?? ""),
              platforms: (p["platforms"] as Platform[]) ?? [],
              audience: String(p["audience"] ?? ""),
              contentType: (p["content_type"] as ContentFormat) ?? "Short",
              frequency: String(p["frequency"] ?? ""),
              goal: (p["goal"] as Goal) ?? "Grow audience",
            }
          : null,
        items: ((itemRows as Row[] | null) ?? []).map(rowToItem),
      });
      setReady(true);
    }

    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!active) return;
      setUserId(session?.user.id ?? null);
      setEmail(session?.user.email ?? null);
      void load(session?.user.id ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        setUserId(session?.user.id ?? null);
        setEmail(session?.user.email ?? null);
        setReady(false);
        void load(session?.user.id ?? null);
      },
    );

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const setProfile = useCallback(
    (profile: Profile) => {
      setState((s) => ({ ...s, profile }));
      if (!userId) return;
      void (async () => {
        const { error } = await supabase.from("creator_profiles").upsert(
          {
            user_id: userId,
            name: profile.name,
            niche: profile.niche,
            platforms: profile.platforms,
            audience: profile.audience,
            content_type: profile.contentType,
            frequency: profile.frequency,
            goal: profile.goal,
          },
          { onConflict: "user_id" },
        );
        if (error) console.error("profile save failed", error);
      })();
    },
    [userId],
  );

  const addItem = useCallback(
    (input: Omit<ContentItem, "id" | "createdAt">) => {
      const item: ContentItem = { ...input, id: uid(), createdAt: Date.now() };
      setState((s) => ({ ...s, items: [item, ...s.items] }));
      if (userId) {
        void (async () => {
          const { error } = await supabase
            .from("content_items")
            .insert({ id: item.id, user_id: userId, ...itemToRow(item) });
          if (error) console.error("item insert failed", error);
        })();
      }
      return item;
    },
    [userId],
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<ContentItem>) => {
      setState((s) => ({
        ...s,
        items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      }));
      if (userId) {
        void (async () => {
          const { error } = await supabase
            .from("content_items")
            .update(itemToRow(patch) as never)
            .eq("id", id);
          if (error) console.error("item update failed", error);
        })();
      }
    },
    [userId],
  );

  const removeItem = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }));
      if (userId)
        void (async () => {
          const { error } = await supabase.from("content_items").delete().eq("id", id);
          if (error) console.error("item delete failed", error);
        })();
    },
    [userId],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState(emptyState);
  }, []);

  const getItem = useCallback((id: string) => state.items.find((i) => i.id === id), [state.items]);

  const reset = useCallback(() => setState(emptyState), []);

  const value = useMemo(
    () => ({
      ready,
      userId,
      email,
      state,
      setProfile,
      addItem,
      updateItem,
      removeItem,
      getItem,
      signOut,
      reset,
    }),
    [
      ready,
      userId,
      email,
      state,
      setProfile,
      addItem,
      updateItem,
      removeItem,
      getItem,
      signOut,
      reset,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
