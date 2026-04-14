import type { ReactNode } from "react";

type FeedbackAlertProps = {
  type: "success" | "error" | "info";
  title?: string;
  message: string;
  action?: ReactNode;
};

export function FeedbackAlert({
  type,
  title,
  message,
  action,
}: FeedbackAlertProps) {
  const palette =
    type === "success"
      ? {
          wrapper: "border-emerald-200 bg-emerald-50/90",
          dot: "bg-emerald-500",
          title: "text-emerald-900",
          body: "text-emerald-800",
        }
      : type === "info"
        ? {
            wrapper: "border-amber-200 bg-amber-50/90",
            dot: "bg-amber-500",
            title: "text-amber-900",
            body: "text-amber-800",
          }
        : {
            wrapper: "border-red-200 bg-red-50/90",
            dot: "bg-red-500",
            title: "text-red-900",
            body: "text-red-800",
          };

  return (
    <div
      role="alert"
      className={`rounded-[24px] border px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:px-5 ${palette.wrapper}`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${palette.dot}`}
        />
        <div className="min-w-0 flex-1">
          {title ? (
            <p className={`text-sm font-semibold ${palette.title}`}>{title}</p>
          ) : null}
          <p className={`text-sm leading-6 ${palette.body}`}>{message}</p>
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
