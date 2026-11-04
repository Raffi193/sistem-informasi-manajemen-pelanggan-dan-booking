/**
 * Text reveal per kata. Murni CSS agar tidak menambah beban JavaScript
 * dan tetap tampil normal jika animasi tidak didukung.
 */
export function TextReveal({
  text,
  className,
  delay = 0,
  step = 55,
}: {
  text: string;
  className?: string;
  delay?: number;
  step?: number;
}) {
  const words = text.split(" ");

  return (
    <span className={className}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`}>
          <span
            className="reveal-word"
            style={{ animationDelay: `${delay + index * step}ms` }}
          >
            {word}
          </span>
          {index < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}
