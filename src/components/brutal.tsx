import { Link } from "@tanstack/react-router";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import type { Status } from "@/lib/types";

export function Btn({
  variant = "default",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "dark" | "blue" | "ghost";
}) {
  return (
    <button
      {...props}
      className={cn(
        "press border-2 border-foreground px-4 py-2 text-xs font-bold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-40",
        variant === "default" && "bg-background hover:bg-muted",
        variant === "primary" && "hard-shadow-sm bg-primary text-primary-foreground",
        variant === "dark" && "bg-foreground text-background",
        variant === "blue" && "bg-secondary text-secondary-foreground",
        variant === "ghost" && "border-transparent hover:border-foreground",
        className,
      )}
    />
  );
}

export function Panel({
  children,
  className,
  thick,
}: {
  children: ReactNode;
  className?: string;
  thick?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-background",
        thick ? "hard-shadow border-4 border-foreground" : "border-2 border-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b-4 border-foreground pb-3">
      <h2 className="font-display text-4xl uppercase leading-none tracking-tight md:text-5xl">
        {children}
      </h2>
      {right}
    </div>
  );
}

const statusStyle: Record<Status, string> = {
  Idea: "bg-background",
  Draft: "bg-muted",
  Ready: "bg-primary",
  Published: "bg-secondary text-secondary-foreground",
};

export function StatusChip({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "border-2 border-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-colors",
        statusStyle[status],
      )}
    >
      {status}
    </span>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "bg-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-background",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full border-2 border-foreground bg-background px-3 py-2 font-mono text-sm outline-none focus:bg-primary/20 focus:ring-0";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputCls, "leading-relaxed", props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputCls, "appearance-none", props.className)} />;
}

export function LinkBtn({
  to,
  children,
  variant = "default",
}: {
  to: string;
  children: ReactNode;
  variant?: "default" | "primary" | "dark";
}) {
  return (
    <Link
      to={to}
      className={cn(
        "press inline-block border-2 border-foreground px-4 py-2 text-xs font-bold uppercase tracking-wide",
        variant === "default" && "bg-background hover:bg-muted",
        variant === "primary" && "hard-shadow-sm bg-primary",
        variant === "dark" && "bg-foreground text-background",
      )}
    >
      {children}
    </Link>
  );
}
