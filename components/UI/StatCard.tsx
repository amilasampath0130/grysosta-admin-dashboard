import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "neutral" | "info" | "warning" | "success" | "danger";

export type StatCardProps = {
  title: string;
  value?: ReactNode;
  helperText?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  variant?: Variant;
  loading?: boolean;
  className?: string;
};

const variantStyles: Record<Variant, { accent: string; icon: string }> = {
  neutral: { accent: "border-l-gray-300", icon: "text-gray-600" },
  info: { accent: "border-l-blue-500", icon: "text-blue-600" },
  warning: { accent: "border-l-yellow-500", icon: "text-yellow-700" },
  success: { accent: "border-l-emerald-500", icon: "text-emerald-600" },
  danger: { accent: "border-l-red-500", icon: "text-red-600" },
};

export default function StatCard({
  title,
  value,
  helperText,
  icon: Icon,
  variant = "neutral",
  loading = false,
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border-l-4",
        styles.accent,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-gray-600 text-sm truncate">{title}</p>

          {loading ? (
            <div className="mt-3 h-9 w-28 rounded bg-gray-200 animate-pulse" />
          ) : (
            <h2 className="text-3xl font-bold mt-2 text-gray-900">
              {value ?? "—"}
            </h2>
          )}

          {helperText ? (
            loading ? (
              <div className="mt-3 h-4 w-40 rounded bg-gray-200 animate-pulse" />
            ) : (
              <p className="mt-2 text-xs text-gray-500">{helperText}</p>
            )
          ) : null}
        </div>

        {Icon ? (
          <div className="shrink-0 rounded-lg bg-gray-50 border border-gray-200 p-2">
            <Icon className={cn("w-5 h-5", styles.icon)} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
