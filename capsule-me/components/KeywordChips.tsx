export function KeywordChips({
  keywords,
  className,
}: {
  keywords: string[];
  className?: string;
}) {
  if (keywords.length === 0) return null;

  return (
    <ul className={`flex flex-wrap gap-1.5 ${className ?? ""}`}>
      {keywords.map((word) => (
        <li
          key={word}
          className="rounded-full bg-white/80 px-2.5 py-1 text-xs text-stone-600 ring-1 ring-stone-200/80"
        >
          {word}
        </li>
      ))}
    </ul>
  );
}
