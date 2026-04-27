"use client";

import React, { useState, useRef } from 'react';
import { getSmoothPath } from '@/lib/utils';
import { Annotation } from '@/types/scrapbook';

interface AnnotationOverlayProps {
  pageIdx: number;
  annotations: Annotation;
  updateAnnotations: (pageIdx: number, newAnnotations: Partial<Annotation>) => void;
  activeTool: string;
  isExporting: boolean;
  includeMarkup: boolean;
}

export const AnnotationOverlay = ({ 
  pageIdx, 
  annotations, 
  updateAnnotations, 
  activeTool, 
  isExporting, 
  includeMarkup 
}: AnnotationOverlayProps) => {
  const [currentStroke, setCurrentStroke] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getCoordinates = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeTool === 'none' || !includeMarkup) return;
    
    // Ignore middle/right clicks
    if (e.button && e.button !== 0) return;
    
    if (activeTool === 'sticky') {
      const { x, y } = getCoordinates(e);
      const newNote = { id: Date.now(), x, y, text: '' };
      updateAnnotations(pageIdx, { notes: [...(annotations.notes || []), newNote] });
      return;
    }

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      (e.target as Element).setPointerCapture(e.pointerId);
      const coord = getCoordinates(e);
      setCurrentStroke({ 
        id: Date.now(), 
        tool: activeTool,
        points: [coord] 
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (currentStroke) {
      const coord = getCoordinates(e);
      setCurrentStroke((prev: any) => ({ ...prev, points: [...prev.points, coord] }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (currentStroke) {
      updateAnnotations(pageIdx, { strokes: [...(annotations.strokes || []), currentStroke] });
      setCurrentStroke(null);
    }
  };

  if (!includeMarkup) return null;

  const strokes = annotations.strokes || [];
  const notes = annotations.notes || [];

  return (
    <div 
      className="absolute inset-0 z-30 pointer-events-none" 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ 
        touchAction: activeTool !== 'none' ? 'none' : 'auto', 
        pointerEvents: activeTool !== 'none' || notes.length > 0 ? 'auto' : 'none' 
      }}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {strokes.map(stroke => (
          <path 
            key={stroke.id} 
            d={getSmoothPath(stroke.points)} 
            stroke={stroke.tool === 'highlighter' ? "rgba(253, 224, 71, 0.4)" : "#3a3632"} 
            strokeWidth={stroke.tool === 'highlighter' ? 24 : 2}
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none"
            style={{ mixBlendMode: stroke.tool === 'highlighter' ? 'multiply' : 'normal' }}
          />
        ))}
        {currentStroke && (
          <path 
            d={getSmoothPath(currentStroke.points)} 
            stroke={currentStroke.tool === 'highlighter' ? "rgba(253, 224, 71, 0.4)" : "#3a3632"} 
            strokeWidth={currentStroke.tool === 'highlighter' ? 24 : 2}
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none"
            style={{ mixBlendMode: currentStroke.tool === 'highlighter' ? 'multiply' : 'normal' }}
          />
        )}
      </svg>
      {notes.map(note => (
        <div 
          key={note.id}
          className="absolute bg-yellow-200/90 shadow-md p-2 border border-yellow-300 w-48 min-h-[100px] pointer-events-auto flex flex-col"
          style={{ top: note.y, left: note.x }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {!isExporting && (
            <div className="flex justify-between items-center mb-1 no-print font-sans text-stone-500 font-bold tracking-widest uppercase pb-1 border-b border-yellow-300/50 shrink-0" style={{ fontSize: '10px' }}>
              <span>Note</span>
              <button 
                className="text-stone-400 hover:text-stone-700 font-bold px-1"
                onClick={() => {
                  const newNotes = notes.filter(n => n.id !== note.id);
                  updateAnnotations(pageIdx, { notes: newNotes });
                }}
              >×</button>
            </div>
          )}
          {isExporting ? (
            <div className="w-full text-sm text-stone-800 font-sans whitespace-pre-wrap flex-1">{note.text}</div>
          ) : (
            <textarea
              className="w-full bg-transparent resize-none outline-none font-sans text-sm text-stone-800 placeholder-stone-500/50 flex-1 min-h-0"
              value={note.text}
              placeholder="Type note..."
              onChange={(e) => {
                const newNotes = notes.map(n => n.id === note.id ? { ...n, text: e.target.value } : n);
                updateAnnotations(pageIdx, { notes: newNotes });
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};
