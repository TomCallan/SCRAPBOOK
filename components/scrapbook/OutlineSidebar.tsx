"use client";

import React from 'react';
import { X, ChevronRight } from 'lucide-react';

interface OutlineItem {
  level: number;
  text: string;
  id: string;
  lineIndex: number;
}

interface OutlineSidebarProps {
  outline: OutlineItem[];
  jumpToLine: (line: number) => void;
  setShowOutline: (show: boolean) => void;
}

export const OutlineSidebar = ({
  outline,
  jumpToLine,
  setShowOutline
}: OutlineSidebarProps) => {
  return (
    <aside className="w-64 border-r border-stone-200 bg-white flex flex-col shrink-0 no-print animate-in slide-in-from-left duration-300">
      <div className="p-4 border-b border-stone-100 flex items-center justify-between">
        <span className="text-[10px] font-black text-stone-400 tracking-widest">OUTLINE</span>
        <X size={14} className="cursor-pointer text-stone-300 hover:text-stone-600" onClick={() => setShowOutline(false)} />
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {outline.length === 0 ? (
          <div className="p-4 text-center text-xs text-stone-400 italic">No headers yet</div>
        ) : (
          outline.map((h, i) => (
            <button
              key={i}
              onClick={() => jumpToLine(h.lineIndex)}
              className={`w-full text-left p-2 rounded-md hover:bg-stone-50 transition-colors text-xs flex items-start gap-2 group ${h.level === 1 ? 'font-bold text-stone-800' : 'text-stone-500 pl-4'}`}
            >
              <ChevronRight size={12} className="mt-0.5 opacity-0 group-hover:opacity-100" />
              <span className="truncate">{h.text}</span>
            </button>
          ))
        )}
      </nav>
    </aside>
  );
};
