import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  minLength = 6,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minLength?: number;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="group relative flex border-2 border-foreground bg-background focus-within:bg-primary/20">
      <input
        type={show ? "text" : "password"}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full bg-transparent px-3 py-2 font-mono text-sm outline-none",
          show ? "tracking-normal" : "tracking-[0.15em]",
          "transition-[letter-spacing] duration-300 ease-out-expo",
        )}
      />
      <button
        type="button"
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        title={show ? "Hide password" : "Show password"}
        onClick={() => setShow((s) => !s)}
        className={cn(
          "press relative flex w-12 shrink-0 items-center justify-center overflow-hidden border-l-2 border-foreground",
          "transition-colors duration-200",
          show ? "bg-foreground text-background" : "bg-background hover:bg-primary",
        )}
      >
        <span className="relative block h-4 w-4">
          <Eye
            className={cn(
              "absolute inset-0 h-4 w-4 transition-all duration-300 ease-out-expo",
              show ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0",
            )}
          />
          <EyeOff
            className={cn(
              "absolute inset-0 h-4 w-4 transition-all duration-300 ease-out-expo",
              show ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100",
            )}
          />
        </span>
        <span
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-secondary transition-transform duration-300 ease-out-expo",
            show ? "translate-y-0" : "translate-y-full",
          )}
        />
      </button>
      <span
        className={cn(
          "pointer-events-none absolute -top-2 right-12 mr-1 border-2 border-foreground bg-primary px-1 text-[9px] font-bold uppercase tracking-widest text-primary-foreground",
          "transition-all duration-200 ease-out-expo",
          show ? "translate-y-0 scale-100 opacity-100" : "translate-y-1 scale-90 opacity-0",
        )}
      >
        Visible
      </span>
    </div>
  );
}
