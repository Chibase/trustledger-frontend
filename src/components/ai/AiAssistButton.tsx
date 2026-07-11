type AiAssistButtonProps = {
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export function AiAssistButton({
  label = "Assist with AI",
  loading = false,
  disabled = false,
  onClick,
}: AiAssistButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium text-tl-ink hover:bg-tl-paper disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Analyzing…" : label}
    </button>
  );
}
