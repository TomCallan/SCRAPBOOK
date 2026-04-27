"use client";

import React, { useRef } from 'react';
import { Bold, Italic, Heading1, Heading2, CheckSquare, List, Scissors, Plus, Sparkles, Loader2 } from 'lucide-react';

interface EditorViewProps {
  markdown: string;
  setMarkdown: (value: string | ((prev: string) => string)) => void;
  cursorPos: number;
  setCursorPos: (pos: number) => void;
  isDraggingOverEditor: boolean;
  setIsDraggingOverEditor: (dragging: boolean) => void;
  handleFiles: (files: FileList | File[]) => void;
  improveWriting: () => void;
  isAILoading: boolean;
  activeMobileTab: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const EditorView = ({
  markdown,
  setMarkdown,
  cursorPos,
  setCursorPos,
  isDraggingOverEditor,
  setIsDraggingOverEditor,
  handleFiles,
  improveWriting,
  isAILoading,
  activeMobileTab,
  fileInputRef
}: EditorViewProps) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = (textToInsert: string) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = text.substring(0, start) + textToInsert + text.substring(end);
    setMarkdown(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 0);
  };

  const wrapSelection = (prefix: string, suffix = prefix) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.substring(start, end);
    const newText = text.substring(0, start) + prefix + selection + suffix + text.substring(end);
    setMarkdown(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selection.length);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const textarea = editorRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const text = textarea.value;
      const lastNewLine = text.lastIndexOf('\n', start - 1);
      const currentLine = text.substring(lastNewLine + 1, start);

      const checklistMatch = currentLine.match(/^(\s*-\s\[[ xX]\]\s)(.*)/);
      const bulletMatch = currentLine.match(/^(\s*-\s)(.*)/);

      if (checklistMatch) {
        e.preventDefault();
        const prefix = checklistMatch[1];
        const content = checklistMatch[2].trim();
        if (content === "") {
          const newText = text.substring(0, lastNewLine + 1) + text.substring(start);
          setMarkdown(newText);
          setTimeout(() => textarea.setSelectionRange(lastNewLine + 1, lastNewLine + 1), 0);
        } else {
          const newPrefix = prefix.includes('[x]') || prefix.includes('[X]') ? prefix.replace(/\[[xX]\]/, '[ ]') : prefix;
          insertAtCursor('\n' + newPrefix);
        }
      } else if (bulletMatch) {
        e.preventDefault();
        const prefix = bulletMatch[1];
        const content = bulletMatch[2].trim();
        if (content === "") {
          const newText = text.substring(0, lastNewLine + 1) + text.substring(start);
          setMarkdown(newText);
          setTimeout(() => textarea.setSelectionRange(lastNewLine + 1, lastNewLine + 1), 0);
        } else {
          insertAtCursor('\n' + prefix);
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDraggingOverEditor(true);
    if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      e.preventDefault();
    }
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.focus();
    }
  };

  return (
    <div className={`flex-1 flex flex-col min-w-0 ${activeMobileTab === 'editor' ? 'flex' : 'hidden md:flex'}`}>
      <div className="flex items-center gap-1 p-2 bg-stone-50 border-b border-stone-200 overflow-x-auto no-scrollbar shrink-0">
        <button onClick={() => wrapSelection('**')} className="p-2 hover:bg-stone-200 rounded text-stone-600"><Bold size={16} /></button>
        <button onClick={() => wrapSelection('*')} className="p-2 hover:bg-stone-200 rounded text-stone-600"><Italic size={16} /></button>
        <div className="w-px h-6 bg-stone-200 mx-1"></div>
        <button onClick={() => wrapSelection('# ', '')} className="p-2 hover:bg-stone-200 rounded text-stone-600"><Heading1 size={16} /></button>
        <button onClick={() => wrapSelection('## ', '')} className="p-2 hover:bg-stone-200 rounded text-stone-600"><Heading2 size={16} /></button>
        <div className="w-px h-6 bg-stone-200 mx-1"></div>
        <button onClick={() => insertAtCursor('\n- [ ] ')} className="p-2 hover:bg-stone-200 rounded text-stone-600"><CheckSquare size={16} /></button>
        <button onClick={() => insertAtCursor('\n- ')} className="p-2 hover:bg-stone-200 rounded text-stone-600"><List size={16} /></button>
        <button title="Page Break" onClick={() => insertAtCursor('\n\n---\n\n')} className="p-2 hover:bg-stone-200 rounded text-stone-600"><Scissors size={16} /></button>
        <div className="flex-1"></div>
        <button onClick={improveWriting} disabled={isAILoading} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-200 text-stone-700 rounded-full text-[10px] font-bold shadow-sm hover:shadow-md transition-all active:scale-95">
          {isAILoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="text-amber-500" />}
          <span>AI Polish</span>
        </button>
      </div>

      <div
        className={`flex-1 relative transition-colors ${isDraggingOverEditor ? 'bg-stone-100 ring-2 ring-inset ring-stone-300' : 'bg-white'}`}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDraggingOverEditor(false)}
        onDrop={(e) => {
          setIsDraggingOverEditor(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }
        }}
      >
        <textarea
          onDrop={() => setIsDraggingOverEditor(false)}
          ref={editorRef}
          value={markdown}
          onKeyDown={handleKeyDown}
          onChange={(e) => setMarkdown(e.target.value)}
          onSelect={(e: any) => setCursorPos(e.target.selectionStart)}
          className="w-full h-full p-6 font-mono text-sm leading-relaxed resize-none focus:outline-none scrollbar-thin flex-1 min-h-0 relative z-10 pb-20"
          placeholder="Tell your story... Drag files here or from your library."
        />
        <div className="absolute bottom-6 left-6 z-20 pointer-events-none flex items-center gap-2">
          <div className="bg-white/80 backdrop-blur border border-stone-200 text-stone-500 text-[10px] font-bold px-3 py-1.5 rounded-md shadow-sm uppercase tracking-widest">
            Page {(markdown.substring(0, cursorPos).match(/(?:^|\n)---\s*(?:\n|$)/g) || []).length + 1} of {(markdown.match(/(?:^|\n)---\s*(?:\n|$)/g) || []).length + 1}
          </div>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-8 right-8 p-4 bg-stone-900 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-20">
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
};
