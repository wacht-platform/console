import { CodeEditor, detectCodeLanguage } from "@/components/code-editor";

export function CodeFileViewer({
  path,
  mimeType,
  value,
}: {
  path: string;
  mimeType?: string;
  value: string;
}) {
  return (
    <CodeEditor
      value={value}
      path={path}
      mimeType={mimeType}
      language={detectCodeLanguage(path, mimeType)}
      readOnly
      minHeight={480}
    />
  );
}
