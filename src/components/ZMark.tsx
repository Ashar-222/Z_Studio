import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const TEXT = "Z_Studio";

/** Animated Z Studio wordmark: first-view drop-in, hover jitter, click burst. */
export function ZMark({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  const [intro, setIntro] = useState(false);
  const [burst, setBurst] = useState(0);
  const seen = useRef(false);

  useEffect(() => {
    if (seen.current) return;
    seen.current = true;
    const key = "zstudio-mark-seen";
    const already =
      typeof sessionStorage !== "undefined" && sessionStorage.getItem(key) === "1";
    setIntro(true);
    if (!already) {
      try {
        sessionStorage.setItem(key, "1");
      } catch {
        /* ignore */
      }
    }
    const t = setTimeout(() => setIntro(false), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <span
      className={cn(
        "zmark relative inline-block cursor-pointer select-none overflow-hidden font-display uppercase tracking-tighter",
        intro && "zmark-intro",
        className,
      )}
      onClick={() => {
        setBurst((b) => b + 1);
        onClick?.();
      }}
    >
      {TEXT.split("").map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          className={cn(
            "zmark-letter transition-colors duration-150",
            "hover:text-primary",
          )}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {ch}
        </span>
      ))}
      {burst > 0 && (
        <>
          <span
            key={`b${burst}`}
            aria-hidden
            className="zmark-burst pointer-events-none absolute inset-0 border-4 border-primary"
          />
          <span
            key={`s${burst}`}
            aria-hidden
            className="zmark-sweep pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-primary/40"
          />
        </>
      )}
    </span>
  );
}
