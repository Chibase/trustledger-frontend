export function OperatorBanner() {
  return (
    <div className="animate-[tl-banner-in_280ms_ease-out] bg-tl-ink text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-sm md:px-8">
        <p>
          <span className="font-semibold">Platform Operator</span>
          <span className="text-white/70">
            {" "}
            — sole live access. Customer seats stay closed until you lift lockdown.
          </span>
        </p>
      </div>
    </div>
  );
}
