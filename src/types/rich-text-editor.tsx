export interface DynamicVariable {
  name: string;
  description: string;
  example: string;
}

export interface PreviewMode {
  name: string;
  width: string;
  icon: string;
}

export interface EditorProps {
  initialContent?: string;
  onChange?: (rawContent: string, ejsContent: string) => void;
}

