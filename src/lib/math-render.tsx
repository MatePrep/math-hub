import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

// Render text with $...$ inline math and $$...$$ block math.
// Also supports **bold** and paragraph breaks on blank lines.
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
      try {
        return <InlineMath key={`${keyPrefix}-${i}`} math={part.slice(1, -1)} />;
      } catch {
        return <span key={`${keyPrefix}-${i}`}>{part}</span>;
      }
    }
    // bold
    const bold = part.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={`${keyPrefix}-${i}`}>
        {bold.map((b, j) =>
          b.startsWith("**") && b.endsWith("**") ? (
            <strong key={j}>{b.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{b}</span>
          ),
        )}
      </span>
    );
  });
}

export function MathText({ text, className }: { text: string; className?: string }) {
  // Split block math first
  const blocks = text.split(/(\$\$[^$]+\$\$)/g);
  return (
    <div className={className}>
      {blocks.map((block, bi) => {
        if (block.startsWith("$$") && block.endsWith("$$")) {
          const inner = block.slice(2, -2).trim();
          try {
            return <BlockMath key={bi} math={inner} />;
          } catch {
            return <pre key={bi}>{block}</pre>;
          }
        }
        const paragraphs = block.split(/\n\n+/);
        return paragraphs.map((p, pi) => (
          <p key={`${bi}-${pi}`} className="leading-relaxed [&:not(:first-child)]:mt-3">
            {renderInline(p, `${bi}-${pi}`)}
          </p>
        ));
      })}
    </div>
  );
}

// For short content like answer choices: render entirely as inline math if it looks like math.
export function ChoiceText({ text }: { text: string }) {
  const looksLikeMath = /[\\^_{}]|\\[a-zA-Z]+/.test(text);
  if (looksLikeMath) {
    try {
      return <InlineMath math={text} />;
    } catch {
      return <span>{text}</span>;
    }
  }
  return <MathText text={text} className="inline" />;
}
