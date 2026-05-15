import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

function toHtml(stored: string): string {
  if (!stored) return '';
  if (stored.trim().startsWith('<')) return stored;
  return stored
    .split('\n')
    .map((line) => `<p>${line || '<br/>'}</p>`)
    .join('');
}

export interface RichEditorHandle {
  openImagePicker: () => void;
}

interface Props {
  value: string;
  placeholder?: string;
  onChange: (html: string) => void;
}

const RichEditor = forwardRef<RichEditorHandle, Props>(function RichEditor(
  { value, placeholder, onChange },
  ref
) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    openImagePicker: () => fileInputRef.current?.click(),
  }));

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: placeholder ?? 'Write something…' }),
    ],
    content: toHtml(value),
    autofocus: false,
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? '' : editor.getHTML());
    },
    editorProps: {
      attributes: { class: 'rich-editor-content outline-none' },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) continue;
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              view.dispatch(
                view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.image.create({ src })
                )
              );
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const t = setTimeout(() => editor.commands.focus('end'), 300);
    return () => clearTimeout(t);
  }, [editor]);

  const insertImageFile = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      editor.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ overscrollBehavior: 'none' }}>
      <EditorContent editor={editor} className="rich-editor-wrap px-10 py-5" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={insertImageFile}
      />
    </div>
  );
});

export default RichEditor;
