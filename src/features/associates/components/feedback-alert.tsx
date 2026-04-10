type FeedbackAlertProps = {
  type: "success" | "error";
  message: string;
};

export function FeedbackAlert({ type, message }: FeedbackAlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-2xl px-4 py-3 text-sm ${
        type === "success"
          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {message}
    </div>
  );
}
