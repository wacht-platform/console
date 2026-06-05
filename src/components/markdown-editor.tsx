import { useEffect, useRef } from "react";
import { Crepe } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
    /** Initial markdown. The editor is uncontrolled after mount — drive
     *  state from `onChange`, not by pushing new `value` props. */
    value: string;
    onChange?: (markdown: string) => void;
    /** Fires once after init with the editor's *normalized* markdown — use it
     *  as the dirty-comparison baseline (Milkdown re-serializes on load). */
    onReady?: (markdown: string) => void;
    placeholder?: string;
    className?: string;
}

/**
 * Notion-style WYSIWYG markdown editor (Milkdown Crepe). Renders + edits in one
 * surface (slash menu, inline toolbar) and emits clean markdown. Colors are
 * mapped to our design tokens in index.css (`.wa-prompt-editor .milkdown`), so
 * it follows light/dark automatically.
 */
export function MarkdownEditor({
    value,
    onChange,
    onReady,
    placeholder,
    className,
}: MarkdownEditorProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const onReadyRef = useRef(onReady);
    onReadyRef.current = onReady;

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const crepe = new Crepe({
            root,
            defaultValue: value,
            featureConfigs: placeholder
                ? { [Crepe.Feature.Placeholder]: { text: placeholder } }
                : undefined,
        });

        crepe.on((api) => {
            api.markdownUpdated((_ctx, markdown) => {
                onChangeRef.current?.(markdown);
            });
        });

        void crepe.create().then(() => {
            onReadyRef.current?.(crepe.getMarkdown());
        });

        return () => {
            void crepe.destroy();
        };
        // Mount once — uncontrolled after init (see prop docs).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div ref={rootRef} className={cn("wa-prompt-editor", className)} />;
}
