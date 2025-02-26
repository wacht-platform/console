import { useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { DYNAMIC_VARIABLES, PREVIEW_MODES, TINYMCE_CONFIG } from '../utils/constants';
import { convertToEjs } from '../utils/template-parser';
import type { EditorProps } from '../types/rich-text-editor';
import { Button } from './ui/button';
import { CodeBracketIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const EmailEditor: React.FC<EditorProps> = ({ initialContent = '', onChange }) => {
  const editorRef = useRef<any>(null);
  const [previewMode, setPreviewMode] = useState(PREVIEW_MODES[0]);
  const [showHtml, setShowHtml] = useState(false);
  const [content, setContent] = useState(initialContent);

  const handleEditorChange = (content: string) => {
    setContent(content);
    const ejsContent = convertToEjs(content);
    if (onChange) {
      onChange(content, ejsContent);
    }
  };

  const insertVariable = (variable: string) => {
    if (editorRef.current) {
      editorRef.current.insertContent(`[${variable}]`);
    }
  };

  const setupEditor = (editor: any) => {
    editor.ui.registry.addMenuButton('variables', {
      text: 'Variables',
      fetch: (callback: (items: any[]) => void) => {
        const items = Object.keys(DYNAMIC_VARIABLES).map(variable => ({
          type: 'menuitem',
          text: variable,
          onAction: () => insertVariable(variable)
        }));
        callback(items);
      }
    });
  };

  const getHtmlContent = () => {
    const ejsTemplate = convertToEjs(content);
    return ejsTemplate;
  };

  return (
    <div className="flex flex-col">

      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200 rounded-t-lg">
        <div className="flex gap-2">
          {PREVIEW_MODES.map((mode) => (
            <Button outline
              key={mode.name}
              onClick={() => setPreviewMode(mode)}
              className={`${previewMode.name === mode.name
                ? 'bg-gray-100'
                : ''
                }`}
              aria-label={`Switch to ${mode.name} mode`}
            >
              <span className="flex items-center gap-2">
                {mode.icon}
                <span className="text-sm">{mode.name}</span>
              </span>
            </Button>
          ))}
        </div>

        <Button outline
          onClick={() => setShowHtml(!showHtml)}
          className={`${showHtml
            ? 'bg-gray-100'
            : ''
            }`}
          aria-label={showHtml ? 'Switch to Rich Text Editor' : 'Switch to HTML Editor'}
        >
          {showHtml ? (
            <DocumentTextIcon className="w-5 h-5" />
          ) : (
            <CodeBracketIcon className="w-5 h-5" />
          )}
        </Button>
      </div>

      <div className="flex items-center justify-center mt-4 bg-gray-50">
        <div style={{ width: previewMode.width }}>
          {showHtml ? (
            <div className="w-full">
              <textarea
                value={getHtmlContent()}
                onChange={(e) => handleEditorChange(e.target.value)}
                className="w-full h-[500px] font-mono text-sm p-4 border rounded"
                style={{
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word'
                }}
              />
            </div>
          ) : (
            <Editor
              apiKey="727jg9e6yh3lx2re9uhp3i0lkhxsyj8zwtdav45rc440krm3"
              onInit={(_, editor) => {
                editorRef.current = editor;
              }}
              value={content}
              init={{
                ...TINYMCE_CONFIG,
                setup: setupEditor,
              }}
              onEditorChange={handleEditorChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailEditor;