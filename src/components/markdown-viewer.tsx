import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Skill docs (SKILL.md) lead with YAML frontmatter. Strip it so the closing
// "---" isn't parsed as a setext heading and the metadata isn't dumped as body.
function stripFrontmatter(content: string): string {
  return content.replace(
    /^﻿?\s*---\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/,
    "",
  );
}

export function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className="max-w-[70ch] space-y-4 text-sm leading-7 text-foreground [&_li_code]:align-[0.02em] [&_p_code]:align-[0.02em]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-[17px] font-semibold tracking-tight">{children}</h1>,
          h2: ({ children }) => <h2 className="pt-2 text-[15px] font-semibold tracking-tight">{children}</h2>,
          h3: ({ children }) => <h3 className="pt-1 text-sm font-semibold">{children}</h3>,
          p: ({ children }) => <p className="text-[13px] leading-6 text-foreground">{children}</p>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5 text-[13px] leading-6">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5 text-[13px] leading-6">{children}</ol>,
          li: ({ children }) => <li className="text-[13px] leading-6">{children}</li>,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-border pl-4 italic text-muted-foreground">{children}</blockquote>,
          code: (props) => {
            const inline = !String(props.className || "").includes("language-");
            return inline ? (
              <code className="mx-0.5 inline break-words rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-[0.82em] font-medium leading-none text-foreground">
                {props.children}
              </code>
            ) : (
              <code className="block overflow-x-auto rounded-lg border border-border bg-secondary p-3 font-mono text-[12px] leading-6 text-foreground">
                {props.children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="overflow-x-auto rounded-lg">{children}</pre>,
          a: ({ href, children }) => (
            <a href={href} className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => <div className="overflow-x-auto"><table className="w-full border-collapse text-[13px]">{children}</table></div>,
          thead: ({ children }) => <thead className="bg-secondary">{children}</thead>,
          th: ({ children }) => <th className="border border-border px-3 py-2 text-left font-medium">{children}</th>,
          td: ({ children }) => <td className="border border-border px-3 py-2 align-top">{children}</td>,
        }}
      >
        {stripFrontmatter(content)}
      </ReactMarkdown>
    </div>
  );
}
