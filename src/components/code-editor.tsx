import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { markdown } from "@codemirror/lang-markdown";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { xml } from "@codemirror/lang-xml";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import { yaml } from "@codemirror/lang-yaml";
import type { Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { useTheme } from "@/lib/providers/theme";

export type CodeLanguage =
  | "markdown"
  | "typescript"
  | "javascript"
  | "json"
  | "html"
  | "css"
  | "xml"
  | "python"
  | "rust"
  | "sql"
  | "yaml"
  | "text";

export function extensionsForLanguage(language: CodeLanguage): Extension[] {
  switch (language) {
    case "markdown":
      return [markdown()];
    case "typescript":
      return [javascript({ typescript: true, jsx: true })];
    case "javascript":
      return [javascript({ jsx: true })];
    case "json":
      return [json()];
    case "html":
      return [html()];
    case "css":
      return [css()];
    case "xml":
      return [xml()];
    case "python":
      return [python()];
    case "rust":
      return [rust()];
    case "sql":
      return [sql()];
    case "yaml":
      return [yaml()];
    default:
      return [];
  }
}

export function detectCodeLanguage(path: string, mimeType?: string): CodeLanguage {
  const normalizedPath = path.toLowerCase();
  const normalizedMime = (mimeType || "").toLowerCase();

  if (normalizedPath.endsWith(".md") || normalizedPath.endsWith(".markdown") || normalizedMime.includes("markdown")) {
    return "markdown";
  }
  if (normalizedPath.endsWith(".ts") || normalizedPath.endsWith(".tsx") || normalizedPath.endsWith(".mts") || normalizedPath.endsWith(".cts")) {
    return "typescript";
  }
  if (normalizedPath.endsWith(".js") || normalizedPath.endsWith(".jsx") || normalizedPath.endsWith(".mjs") || normalizedPath.endsWith(".cjs")) {
    return "javascript";
  }
  if (normalizedPath.endsWith(".json") || normalizedPath.endsWith(".jsonc") || normalizedMime.includes("json")) {
    return "json";
  }
  if (normalizedPath.endsWith(".html") || normalizedPath.endsWith(".htm") || normalizedMime.includes("html")) {
    return "html";
  }
  if (normalizedPath.endsWith(".css") || normalizedPath.endsWith(".scss") || normalizedPath.endsWith(".less") || normalizedMime.includes("css")) {
    return "css";
  }
  if (normalizedPath.endsWith(".xml") || normalizedPath.endsWith(".svg") || normalizedMime.includes("xml")) {
    return "xml";
  }
  if (normalizedPath.endsWith(".py") || normalizedMime.includes("python")) {
    return "python";
  }
  if (normalizedPath.endsWith(".rs") || normalizedMime.includes("rust")) {
    return "rust";
  }
  if (normalizedPath.endsWith(".sql") || normalizedMime.includes("sql")) {
    return "sql";
  }
  if (normalizedPath.endsWith(".yaml") || normalizedPath.endsWith(".yml") || normalizedMime.includes("yaml")) {
    return "yaml";
  }
  return "text";
}

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: CodeLanguage;
  path?: string;
  mimeType?: string;
  readOnly?: boolean;
  minHeight?: number;
  onCreateEditor?: (view: EditorView) => void;
  chrome?: "default" | "flush";
}

export function CodeEditor({
  value,
  onChange,
  language,
  path,
  mimeType,
  readOnly = false,
  minHeight = 320,
  onCreateEditor,
  chrome = "default",
}: CodeEditorProps) {
  const { actualTheme } = useTheme();
  const resolvedLanguage = language || detectCodeLanguage(path || "", mimeType);
  const extensions = useMemo(() => extensionsForLanguage(resolvedLanguage), [resolvedLanguage]);

  return (
    <div
      className={
        chrome === "flush"
          ? "overflow-hidden bg-background"
          : "overflow-hidden rounded-xl border border-border/70 bg-background"
      }
    >
      <CodeMirror
        value={value}
        onChange={onChange}
        onCreateEditor={onCreateEditor}
        theme={actualTheme === "dark" ? oneDark : undefined}
        extensions={extensions}
        editable={!readOnly}
        readOnly={readOnly}
        basicSetup={{
          autocompletion: !readOnly,
          foldGutter: true,
          highlightActiveLine: !readOnly,
          highlightActiveLineGutter: !readOnly,
          lineNumbers: true,
        }}
        style={{ minHeight }}
      />
    </div>
  );
}
