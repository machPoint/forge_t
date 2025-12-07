
import React, { useEffect, useState, useMemo, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useJournal } from "@/hooks/useJournal";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import "@/styles/quill-custom.css"; // Import custom Quill styles
import "@/styles/quill-font.css"; // Import font styles for Quill

// Quill doesn't properly register fonts without this import
import Quill from 'quill'

interface JournalRichEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  disableAutoSave?: boolean;
}

// Configure Quill Font whitelist
const configureFonts = () => {
  // Import Font Attributor
  const Font = Quill.import('formats/font');
  
  // Set up the font whitelist
  Font.whitelist = ['arial', 'helvetica', 'roboto', 'calibri', 'garamond'];
  
  // Register the updated Font configuration
  Quill.register(Font, true);
  
  return Font.whitelist;
};

// Custom spellcheck handler
const SpellcheckHandler = () => {
  return {
    icon: `<svg viewBox="0 0 18 18" width="18" height="18">
      <path class="ql-fill" d="M9,0A9,9,0,1,0,18,9,9,9,0,0,0,9,0ZM14.7,7.1l-5.4,5.4a1,1,0,0,1-1.4,0L4.3,9a1,1,0,0,1,1.4-1.4L8,10.2l4.3-4.3A1,1,0,0,1,14.7,7.1Z"/>
    </svg>`,
    handler: function() {
      const editor = this.quill.root;
      const currentSpellcheck = editor.spellcheck;
      editor.spellcheck = !currentSpellcheck;
      
      // Toggle visual indicator
      const button = document.querySelector('.ql-spellcheck') as HTMLElement;
      if (button) {
        if (editor.spellcheck) {
          button.classList.add('ql-active');
          button.title = 'Spellcheck: ON';
        } else {
          button.classList.remove('ql-active');
          button.title = 'Spellcheck: OFF';
        }
      }
    }
  };
};

// Define modules with toolbar options
const getModules = (fontList) => ({
  toolbar: {
    container: [
      [{ header: [1, 2, 3, false] }],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ font: fontList }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      ["link", "image"],
      ["spellcheck"],
      ["clean"],
    ],
    handlers: {
      spellcheck: SpellcheckHandler().handler
    }
  }
});

const formats = [
  "header",
  "size",
  "font",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "link",
  "image",
  "color",
  "background",
];

const JournalRichEditor: React.FC<JournalRichEditorProps> = ({
  content = "",
  onChange,
  placeholder = "Start writing here...",
  className,
  disableAutoSave = false,
}) => {
  // Ensure content is always a string
  const safeContent = typeof content === 'string' ? content : '';
  const [editorContent, setEditorContent] = useState(safeContent);
  const { selectedEntry, updateEntry } = useJournal();
  const quillRef = useRef<ReactQuill>(null);
  
  // Set up font configuration
  const fontWhitelist = useMemo(() => configureFonts(), []);
  const modules = useMemo(() => getModules(fontWhitelist), [fontWhitelist]);

  // Initialize spellcheck icon after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      const spellcheckBtn = document.querySelector('.ql-spellcheck');
      if (spellcheckBtn && !spellcheckBtn.innerHTML) {
        spellcheckBtn.innerHTML = SpellcheckHandler().icon;
        spellcheckBtn.setAttribute('title', 'Toggle Spellcheck');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Safety check to ensure content is always a string
    const newContent = typeof content === 'string' ? content : '';
    setEditorContent(newContent);
  }, [content]);

  const handleChange = (value: string) => {
    if (typeof value !== 'string') {
      value = '';
    }
    
    setEditorContent(value);
    
    if (onChange) {
      onChange(value);
    }
    
    // Only auto-save for regular journal entries, not guided entries
    if (!disableAutoSave && selectedEntry?.id) {
      updateEntry(selectedEntry.id, { content: value });
    }
  };

  return (
    <Card className={cn("border-none shadow-none bg-transparent h-full flex flex-col", className)}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={editorContent}
        onChange={handleChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        className="flex-1 flex flex-col h-full journal-content quill-brighter-toolbar"
      />
    </Card>
  );
};

export default JournalRichEditor;
