import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface MarkdownMathProps {
  text: string;
  className?: string;
  inline?: boolean;
}

function MarkdownMath({ text, className, inline = false }: MarkdownMathProps) {
  const Wrapper = inline ? "span" : "div";
  return (
    <Wrapper className={className}>
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

export function MathText({ text, className }: { text: string; className?: string }) {
  return <MarkdownMath text={text} className={className} />;
}

export function ChoiceText({ text }: { text: string }) {
  const looksLikeMath = /[\\^_{}]|\\[a-zA-Z]+/.test(text);
  const normalizedText = looksLikeMath && !/^\$.*\$$/.test(text.trim()) ? `$${text.trim()}$` : text;
  return <MarkdownMath text={normalizedText} className="inline" inline />;
}
