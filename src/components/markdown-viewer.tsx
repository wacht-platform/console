import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className="rounded-lg border bg-background px-5 py-4">
      <div className="space-y-4 text-sm leading-7 text-foreground [&_p_code]:align-[0.02em] [&_li_code]:align-[0.02em]">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1 className="text-xl font-semibold tracking-tight">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-semibold tracking-tight pt-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-semibold pt-1">{children}</h3>,
            p: ({ children }) => <p className="text-sm leading-7 text-foreground">{children}</p>,
            ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
            li: ({ children }) => <li className="text-sm leading-7">{children}</li>,
            blockquote: ({ children }) => <blockquote className="border-l-2 border-border pl-4 italic text-muted-foreground">{children}</blockquote>,
            code: (props) => {
              const inline = !String(props.className || "").includes("language-");
              return inline ? (
                <code className="mx-0.5 inline break-words rounded-md border border-border/70 bg-muted/80 px-1.5 py-0.5 font-mono text-[0.82em] font-medium leading-none text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                  {props.children}
                </code>
              ) : (
                <code className="block overflow-x-auto rounded-lg border border-border/70 bg-muted/60 p-3 font-mono text-[12px] leading-6 text-foreground">
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
            table: ({ children }) => <div className="overflow-x-auto"><table className="w-full border-collapse text-sm">{children}</table></div>,
            thead: ({ children }) => <thead className="bg-muted/40">{children}</thead>,
            th: ({ children }) => <th className="border border-border px-3 py-2 text-left font-medium">{children}</th>,
            td: ({ children }) => <td className="border border-border px-3 py-2 align-top">{children}</td>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
