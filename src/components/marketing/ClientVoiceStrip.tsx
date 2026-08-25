import { quotesFor, type ClientVoiceBrand, type ClientVoiceSurface } from "@/data/clientVoice";

type ClientVoiceStripProps = {
  brand: ClientVoiceBrand;
  surface: ClientVoiceSurface;
  heading: string;
  kicker?: string;
};

export function ClientVoiceStrip({
  brand,
  surface,
  heading,
  kicker = "From review",
}: ClientVoiceStripProps) {
  const quotes = quotesFor(brand, surface);
  if (!quotes.length) return null;

  return (
    <section className="bg-tl-surface" aria-labelledby={`voice-${surface}-title`}>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-tl-trust">
          {kicker}
        </p>
        <h2
          id={`voice-${surface}-title`}
          className="mt-2 font-display text-2xl font-semibold text-tl-ink sm:text-3xl"
        >
          {heading}
        </h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {quotes.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-tl-line bg-tl-paper p-6"
            >
              <blockquote className="text-base leading-relaxed text-tl-ink">
                “{entry.quote}”
              </blockquote>
              <p className="mt-3 text-sm text-tl-ink-muted">{entry.attribution}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
