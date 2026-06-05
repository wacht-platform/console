import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
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

// Code theme bound to the app's design tokens (adapts light/dark via CSS vars).
const wachtEditorTheme = EditorView.theme({
    "&": {
        color: "var(--foreground)",
        backgroundColor: "transparent",
        fontSize: "12px",
    },
    "&.cm-focused": { outline: "none" },
    ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.65" },
    ".cm-content": {
        fontFamily: "var(--font-mono)",
        caretColor: "var(--foreground)",
        padding: "12px 0",
    },
    ".cm-line": { padding: "0 16px" },
    ".cm-gutters": {
        backgroundColor: "transparent",
        color: "var(--muted-foreground)",
        border: "none",
    },
    ".cm-lineNumbers .cm-gutterElement": {
        padding: "0 8px 0 14px",
        color: "color-mix(in oklch, var(--muted-foreground) 55%, transparent)",
    },
    ".cm-foldGutter": { display: "none" },
    ".cm-activeLine": { backgroundColor: "transparent" },
    ".cm-activeLineGutter": { backgroundColor: "transparent" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--foreground)" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
        {
            backgroundColor: "color-mix(in oklch, var(--primary) 22%, transparent)",
        },
});

const wachtHighlightStyle = HighlightStyle.define([
    {
        tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier, t.self],
        color: "var(--code-keyword)",
    },
    { tag: [t.string, t.special(t.string), t.regexp], color: "var(--code-string)" },
    { tag: [t.number, t.bool, t.null, t.atom], color: "var(--code-number)" },
    {
        tag: [t.lineComment, t.blockComment, t.comment],
        color: "var(--code-comment)",
        fontStyle: "italic",
    },
    {
        tag: [t.function(t.variableName), t.function(t.propertyName)],
        color: "var(--code-fn)",
    },
    {
        tag: [t.typeName, t.className, t.namespace, t.tagName],
        color: "var(--code-type)",
    },
    { tag: [t.variableName], color: "var(--foreground)" },
    {
        tag: [t.propertyName, t.attributeName, t.definition(t.propertyName)],
        color: "var(--code-type)",
    },
    {
        tag: [t.punctuation, t.bracket, t.separator, t.operator],
        color: "var(--muted-foreground)",
    },
    { tag: t.meta, color: "var(--muted-foreground)" },
]);

const wachtCodeTheme: Extension[] = [
    wachtEditorTheme,
    syntaxHighlighting(wachtHighlightStyle),
];

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

export function detectCodeLanguage(
    path: string,
    mimeType?: string,
): CodeLanguage {
    const normalizedPath = path.toLowerCase();
    const normalizedMime = (mimeType || "").toLowerCase();

    if (
        normalizedPath.endsWith(".md") ||
        normalizedPath.endsWith(".markdown") ||
        normalizedMime.includes("markdown")
    ) {
        return "markdown";
    }
    if (
        normalizedPath.endsWith(".ts") ||
        normalizedPath.endsWith(".tsx") ||
        normalizedPath.endsWith(".mts") ||
        normalizedPath.endsWith(".cts")
    ) {
        return "typescript";
    }
    if (
        normalizedPath.endsWith(".js") ||
        normalizedPath.endsWith(".jsx") ||
        normalizedPath.endsWith(".mjs") ||
        normalizedPath.endsWith(".cjs")
    ) {
        return "javascript";
    }
    if (
        normalizedPath.endsWith(".json") ||
        normalizedPath.endsWith(".jsonc") ||
        normalizedMime.includes("json")
    ) {
        return "json";
    }
    if (
        normalizedPath.endsWith(".html") ||
        normalizedPath.endsWith(".htm") ||
        normalizedMime.includes("html")
    ) {
        return "html";
    }
    if (
        normalizedPath.endsWith(".css") ||
        normalizedPath.endsWith(".scss") ||
        normalizedPath.endsWith(".less") ||
        normalizedMime.includes("css")
    ) {
        return "css";
    }
    if (
        normalizedPath.endsWith(".xml") ||
        normalizedPath.endsWith(".svg") ||
        normalizedMime.includes("xml")
    ) {
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
    if (
        normalizedPath.endsWith(".yaml") ||
        normalizedPath.endsWith(".yml") ||
        normalizedMime.includes("yaml")
    ) {
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
    const resolvedLanguage =
        language || detectCodeLanguage(path || "", mimeType);
    const extensions = useMemo(
        () => [...extensionsForLanguage(resolvedLanguage), ...wachtCodeTheme],
        [resolvedLanguage],
    );

    return (
        <div
            className={
                chrome === "flush"
                    ? "overflow-hidden"
                    : "overflow-hidden rounded-xl border border-border/70 bg-background"
            }
        >
            <CodeMirror
                value={value}
                onChange={onChange}
                onCreateEditor={onCreateEditor}
                theme="none"
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
