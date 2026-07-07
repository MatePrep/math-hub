import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

interface MarkdownMathProps {
  text: string;
  className?: string;
  inline?: boolean;
  clampLines?: number;
}

// Tailwind's JIT scanner needs each class literal to appear somewhere in the
// source; a computed `line-clamp-${n}` string wouldn't be picked up.
const CLAMP_CLASSES: Record<number, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
};

function MarkdownMath({ text, className, inline = false, clampLines }: MarkdownMathProps) {
  const Wrapper = inline ? "span" : "div";
  const clampClass = !inline && clampLines ? CLAMP_CLASSES[clampLines] : undefined;
  return (
    <Wrapper
      className={cn(
        // Long formulas (matrices, big fractions, systems) can render wider
        // than a phone screen; scroll them in place instead of overflowing
        // the page or getting clipped by a parent's overflow-hidden.
        // Clamped previews clip instead of scrolling: nesting an
        // overflow-x-auto box inside a -webkit-line-clamp ancestor breaks
        // the clamp in Safari, so the two modes must live on the same node.
        inline
          ? "inline-block max-w-full overflow-x-auto align-bottom"
          : clampClass
            ? `${clampClass} overflow-hidden`
            : "max-w-full overflow-x-auto",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ node, ...props }) =>
            inline ? <span {...props} /> : <p className="leading-relaxed [&:not(:first-child)]:mt-3" {...props} />,
        }}
      >
        {text}
      </ReactMarkdown>
    </Wrapper>
  );
}

export function MathText({
  text,
  className,
  clampLines,
}: {
  text: string;
  className?: string;
  clampLines?: number;
}) {
  return <MarkdownMath text={text} className={className} clampLines={clampLines} />;
}

export function ChoiceText({ text }: { text: string }) {
  const looksLikeMath = /[\\^_{}]|\\[a-zA-Z]+/.test(text);
  const normalizedText = looksLikeMath && !/^\$.*\$$/.test(text.trim()) ? `$${text.trim()}$` : text;
  return <MarkdownMath text={normalizedText} inline />;
}
