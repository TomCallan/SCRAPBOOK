"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  FileText,
  Book,
  Eye,
  Edit3,
  UploadCloud,
  Trash2,
  Maximize2,
  CheckSquare,
  Square,
  File,
  Plus,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Layers,
  Info,
  Calendar,
  MapPin,
  X,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  Link,
  Scissors,
  Sparkles,
  Wand2,
  Menu,
  ChevronRight,
  GripVertical,
  MousePointer2,
  PenTool,
  Highlighter,
  StickyNote,
  Settings,
  Search
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

// External libraries via CDN
const MARKED_SCRIPT = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
const PDFJS_SCRIPT = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


const apiKey = ""; // Provided by environment

const cosineSimilarity = (a, b) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

const getSmoothPath = (points) => {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }
  return path;
};

const AnnotationOverlay = ({ pageIdx, annotations, updateAnnotations, activeTool, isExporting, includeMarkup }) => {
  const [currentStroke, setCurrentStroke] = useState(null);
  const containerRef = useRef(null);

  const getCoordinates = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
  };

  const handlePointerDown = (e) => {
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
      e.target.setPointerCapture(e.pointerId);
      const coord = getCoordinates(e);
      setCurrentStroke({ 
        id: Date.now(), 
        tool: activeTool,
        points: [coord] 
      });
    }
  };

  const handlePointerMove = (e) => {
    if (currentStroke) {
      const coord = getCoordinates(e);
      setCurrentStroke(prev => ({ ...prev, points: [...prev.points, coord] }));
    }
  };

  const handlePointerUp = (e) => {
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

const BOOK_COLORS = [
  'bg-stone-300',
  'bg-red-400',
  'bg-orange-400',
  'bg-amber-400',
  'bg-emerald-400',
  'bg-cyan-400',
  'bg-blue-400',
  'bg-indigo-400',
  'bg-fuchsia-400',
  'bg-rose-400'
];

const App = () => {
  const [mode, setMode] = useState('edit');
  const [activeMobileTab, setActiveMobileTab] = useState('editor');
  
  const [books, setBooks] = useState([{ id: 1, title: 'Untitled Scrapbook', color: 'bg-stone-300', markdown: '', assets: {}, annotations: {} }]);
  const [activeBookId, setActiveBookId] = useState(1);

  const activeBook = books.find(b => b.id === activeBookId) || books[0];
  const markdown = activeBook.markdown;
  const assets = activeBook.assets;
  const annotations = activeBook.annotations || {};

  const setMarkdown = (value) => {
    setBooks(prev => prev.map(b => b.id === activeBookId ? { ...b, markdown: typeof value === 'function' ? value(b.markdown) : value } : b));
  };
  const setAssets = (value) => {
    setBooks(prev => prev.map(b => b.id === activeBookId ? { ...b, assets: typeof value === 'function' ? value(b.assets) : value } : b));
  };
  const updateAnnotations = (pageIdx, newAnnotations) => {
    setBooks(prev => prev.map(b => {
      if (b.id !== activeBookId) return b;
      const pages = b.annotations || {};
      const pageAnnotations = pages[pageIdx] || { strokes: [], notes: [] };
      return {
        ...b,
        annotations: {
          ...pages,
          [pageIdx]: { ...pageAnnotations, ...newAnnotations }
        }
      };
    }));
  };

  const cycleColor = (bookId, currentColor) => {
    const currentIndex = BOOK_COLORS.indexOf(currentColor || 'bg-stone-300');
    const nextColor = BOOK_COLORS[(currentIndex + 1) % BOOK_COLORS.length];
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, color: nextColor } : b));
  };

  const [editingAsset, setEditingAsset] = useState(null);
  const [isDraggingOverEditor, setIsDraggingOverEditor] = useState(false);
  const [markedLoaded, setMarkedLoaded] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isDraggingOverLibrary, setIsDraggingOverLibrary] = useState(false);
  const [aiError, setAIError] = useState(null);
  const [showOutline, setShowOutline] = useState(true);
  const [showBooks, setShowBooks] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTool, setActiveTool] = useState('none');
  const [includeMarkup, setIncludeMarkup] = useState(true);

  const [settings, setSettings] = useState({ 
    aiProvider: 'gemini', 
    aiModel: 'gemini-2.5-flash-preview-09-2025',
    geminiApiKey: apiKey, 
    groqApiKey: '',
    enableVectorSearch: true 
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [localExtractor, setLocalExtractor] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@huggingface/transformers').then(({ pipeline, env }) => {
        env.allowLocalModels = false;
        pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2').then(extractor => {
          setLocalExtractor(() => extractor);
        }).catch(err => console.error("Error loading local extractor:", err));
      }).catch(err => console.error("Error importing transformers:", err));
    }
  }, []);

  const getEmbedding = async (text) => {
    // If we have an API key, prefer Gemini
    if (settings.aiProvider === 'gemini' && settings.geminiApiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${settings.geminiApiKey}`;
        const payload = { model: "models/text-embedding-004", content: { parts: [{ text }] } };
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.embedding?.values) {
          return result.embedding.values;
        }
      } catch (e) {
        console.error("Gemini embedding failed", e);
      }
    }

    // Fallback to local transformers
    if (localExtractor) {
      try {
        const output = await localExtractor(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
      } catch (e) {
        console.error("Local embedding failed", e);
      }
    }
    
    return null;
  };

  const callAI = async (payload, systemPrompt, imageBase64, mimeType, retries = 5) => {
    if (settings.aiProvider === 'none') throw new Error("AI features are disabled in Settings.");

    for (let i = 0; i < retries; i++) {
      try {
        if (settings.aiProvider === 'gemini') {
          if (!settings.geminiApiKey) throw new Error("Gemini API Key required.");
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.aiModel || 'gemini-2.5-flash-preview-09-2025'}:generateContent?key=${settings.geminiApiKey}`;
          
          let geminiPayload = {};
          if (imageBase64) {
             geminiPayload = {
               contents: [{ role: "user", parts: [{ text: payload }, { inlineData: { mimeType, data: imageBase64 } }] }],
               generationConfig: { responseMimeType: "application/json" }
             };
          } else {
             geminiPayload = {
               contents: [{ parts: [{ text: payload }] }],
               systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined
             };
          }

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
          });
          if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
          const result = await response.json();
          return result.candidates?.[0]?.content?.parts?.[0]?.text;
        } 
        else if (settings.aiProvider === 'groq' || settings.aiProvider === 'local') {
          const isLocal = settings.aiProvider === 'local';
          if (!isLocal && !settings.groqApiKey) throw new Error("Groq API Key required.");
          
          const url = isLocal ? 'http://localhost:11434/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
          const headers = { 'Content-Type': 'application/json' };
          if (!isLocal) headers['Authorization'] = `Bearer ${settings.groqApiKey}`;

          const messages = [];
          if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });

          if (imageBase64) {
            messages.push({
              role: 'user',
              content: [
                { type: "text", text: payload },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
              ]
            });
          } else {
            messages.push({ role: 'user', content: payload });
          }

          const openAiPayload = {
            model: settings.aiModel || (isLocal ? 'llama3' : 'llama3-8b-8192'),
            messages: messages,
            response_format: imageBase64 ? { type: "json_object" } : undefined
          };

          const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(openAiPayload) });
          if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
          const result = await response.json();
          return result.choices?.[0]?.message?.content;
        }
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000));
      }
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const results = [];
    const queryLower = searchQuery.toLowerCase();
    
    // Quick search across title/markdown/assets
    books.forEach(b => {
      if (b.title.toLowerCase().includes(queryLower)) {
         results.push({ bookId: b.id, bookTitle: b.title, text: b.title, type: 'exact (title)', score: 1 });
      }
      if (b.markdown) {
         const paragraphs = b.markdown.split(/\n\n+/);
         paragraphs.forEach((p, idx) => {
            if (p.toLowerCase().includes(queryLower)) {
               results.push({ bookId: b.id, bookTitle: b.title, text: p.substring(0, 100) + '...', type: 'exact (text)', score: 1 });
            }
         });
      }
      Object.keys(b.assets || {}).forEach(filename => {
         const asset = b.assets[filename];
         if (filename.toLowerCase().includes(queryLower) || 
             (asset.caption && asset.caption.toLowerCase().includes(queryLower)) ||
             (asset.location && asset.location.toLowerCase().includes(queryLower))) {
            results.push({ bookId: b.id, bookTitle: b.title, text: `Asset: ${filename} - ${asset.caption || ''}`, type: 'exact (asset)', score: 1 });
         }
      });
    });

    // Vector specific search
    if (settings.enableVectorSearch) {
      const qEmbedding = await getEmbedding(searchQuery);
      if (qEmbedding) {
        books.forEach(b => {
          (b.chunks || []).forEach(chunk => {
             if (!chunk.text.toLowerCase().includes(queryLower)) {
               const sim = cosineSimilarity(qEmbedding, chunk.embedding);
               if (sim > 0.6) {
                 results.push({ bookId: b.id, bookTitle: b.title, text: chunk.text.substring(0, 100) + '...', type: 'concept', score: sim });
               }
             }
          });
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    setSearchResults(results.slice(0, 15));
    setIsSearching(false);
  }, [searchQuery, books, settings]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) handleSearch();
    }, 600);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  useEffect(() => {
    if (!settings.enableVectorSearch || !activeBook.markdown) return;
    const indexActiveBook = async () => {
      const textChunks = activeBook.markdown.split(/\n\n+/).filter(c => c.trim().length > 10);
      const existingChunks = activeBook.chunks || [];
      const newChunks = [];
      let updated = false;
      
      for (const text of textChunks) {
        let existing = existingChunks.find(c => c.text === text);
        if (!existing) {
           const embedding = await getEmbedding(text);
           if (embedding) {
             newChunks.push({ text, embedding });
             updated = true;
           }
        } else {
           newChunks.push(existing);
        }
      }
      
      if (updated) {
        setBooks(prev => prev.map(b => b.id === activeBookId ? { ...b, chunks: newChunks } : b));
      }
    };
    
    const timer = setTimeout(() => {
      indexActiveBook();
    }, 2000); // 2 second debounce for indexing
    
    return () => clearTimeout(timer);
  }, [markdown, activeBookId, settings.enableVectorSearch, settings.apiKey, localExtractor]);

  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    const preventFileDrop = (e) => {
      if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
        e.preventDefault();
      }
    };
    window.addEventListener('dragover', preventFileDrop);
    window.addEventListener('drop', preventFileDrop);

    const loadScripts = async () => {
      const s1 = document.createElement('script');
      s1.src = MARKED_SCRIPT;
      s1.onload = () => setMarkedLoaded(true);
      document.head.appendChild(s1);

      const s2 = document.createElement('script');
      s2.src = PDFJS_SCRIPT;
      s2.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      };
      document.head.appendChild(s2);


    };
    loadScripts();

    return () => {
      window.removeEventListener('dragover', preventFileDrop);
      window.removeEventListener('drop', preventFileDrop);
    };
  }, []);

  // --- Smart Editor Logic ---
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const textarea = editorRef.current;
      const start = textarea.selectionStart;
      const text = textarea.value;
      const lastNewLine = text.lastIndexOf('\n', start - 1);
      const currentLine = text.substring(lastNewLine + 1, start);

      // Match checklist items or bullet points
      const checklistMatch = currentLine.match(/^(\s*-\s\[[ xX]\]\s)(.*)/);
      const bulletMatch = currentLine.match(/^(\s*-\s)(.*)/);

      if (checklistMatch) {
        e.preventDefault();
        const prefix = checklistMatch[1];
        const content = checklistMatch[2].trim();

        if (content === "") {
          // Double enter: remove the checkbox prefix
          const newText = text.substring(0, lastNewLine + 1) + text.substring(start);
          setMarkdown(newText);
          setTimeout(() => textarea.setSelectionRange(lastNewLine + 1, lastNewLine + 1), 0);
        } else {
          // Continue checklist
          const newPrefix = prefix.includes('[x]') || prefix.includes('[X]') ? prefix.replace(/\[[xX]\]/, '[ ]') : prefix;
          insertAtCursor('\n' + newPrefix);
        }
      } else if (bulletMatch) {
        e.preventDefault();
        const prefix = bulletMatch[1];
        const content = bulletMatch[2].trim();

        if (content === "") {
          // Double enter: remove bullet
          const newText = text.substring(0, lastNewLine + 1) + text.substring(start);
          setMarkdown(newText);
          setTimeout(() => textarea.setSelectionRange(lastNewLine + 1, lastNewLine + 1), 0);
        } else {
          insertAtCursor('\n' + prefix);
        }
      }
    }
  };

  // Improved Drag Caret logic for Textarea
  const handleDragOver = (e) => {
    setIsDraggingOverEditor(true);
    if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      e.preventDefault();
    }
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.focus();
    }
  };

  // --- Gemini API ---
  const analyzeImage = async (assetName) => {
    const asset = assets[assetName];
    if (!asset || asset.type !== 'image' || isAILoading) return;
    setIsAILoading(true);
    setAIError(null);
    try {
      // Decode ObjectURL to Base64 for the Gemini payload natively
      const blob = await fetch(asset.data).then(r => r.blob());
      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result;
          resolve(typeof res === 'string' ? res.split(',')[1] : null);
        };
        reader.readAsDataURL(blob);
      });
      const mimeType = blob.type;
      const prompt = "Analyze this photo for a visa application evidence booklet. Suggest a formal caption (max 15 words), a likely date (if visible or inferable), and a location. Format your response strictly as JSON with keys: 'caption', 'date', 'location'.";
      const responseText = await callAI(prompt, null, base64Data, mimeType);
      const parsed = JSON.parse(responseText);
      setAssets(prev => ({
        ...prev,
        [assetName]: { ...prev[assetName], ...parsed }
      }));
    } catch (err) {
      setAIError("Failed to analyze image.");
    } finally {
      setIsAILoading(false);
    }
  };

  const improveWriting = async () => {
    if (!markdown.trim() || isAILoading) return;
    setIsAILoading(true);
    setAIError(null);
    try {
      const systemPrompt = "You are a professional immigration assistant. Improve the user's markdown narrative to sound formal, organized, and persuasive for a CR1 visa application. Maintain the original structure and standard Markdown syntax. Output ONLY improved markdown.";
      const improved = await callAI(markdown, systemPrompt, null, null);
      if (improved) setMarkdown(improved);
    } catch (err) {
      setAIError("Failed to polish narrative.");
    } finally {
      setIsAILoading(false);
    }
  };

  // --- Document Logic ---
  const outline = useMemo(() => {
    const lines = markdown.split('\n');
    const items = [];
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,3})\s+(.*)$/);
      if (match) {
        items.push({
          level: match[1].length,
          text: match[2],
          id: `heading-${items.length}`,
          lineIndex: index
        });
      }
    });
    return items;
  }, [markdown]);

  const processFile = async (file) => {
    return new Promise(async (resolve) => {
      const objectUrl = URL.createObjectURL(file);

      if (file.type.startsWith('image/')) {
        resolve({
          name: file.name,
          type: 'image',
          data: objectUrl,
          thumbnail: objectUrl,
          caption: '', date: '', location: ''
        });
        return;
      }

      let pages = [];
      let numPages = 0;
      if (file.type === 'application/pdf' && window.pdfjsLib) {
        try {
          const loadingTask = window.pdfjsLib.getDocument(objectUrl);
          const pdf = await loadingTask.promise;
          numPages = pdf.numPages;
          for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 3.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            pages.push(canvas.toDataURL('image/jpeg', 0.95));
          }
        } catch (err) { console.error(err); }
        
        resolve({
          name: file.name,
          type: 'pdf',
          data: objectUrl,
          thumbnail: pages[0] || objectUrl,
          pages: pages,
          numPages: numPages,
          caption: '', date: '', location: ''
        });
        return;
      }

      resolve(null);
    });
  };

  const handleFiles = async (files, insertIntoEditor = true) => {
    setIsProcessingFiles(true);
    const newAssets = { ...assets };
    let insertionText = "";
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const processed = await processFile(file);
        if (processed) {
          newAssets[file.name] = processed;
          insertionText += processed.type === 'pdf' ? `\n:::pdf file=${file.name}:::\n` : `\n[[file:${file.name}]]\n`;
        }
      }
    }
    setAssets(newAssets);
    if (insertIntoEditor) {
      insertAtCursor(insertionText);
    }
    setIsProcessingFiles(false);
  };

  const insertAtCursor = (textToInsert) => {
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

  const wrapSelection = (prefix, suffix = prefix) => {
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

  const toggleCheckbox = (index) => {
    let count = 0;
    // We use a more robust way to match checkboxes specifically in lines that look like markdown lists
    const newMarkdown = markdown.replace(/^(\s*-\s\[)([ xX])(\]\s)/gm, (match, p1, char, p3) => {
      if (count++ === index) return p1 + (char.toLowerCase() === 'x' ? ' ' : 'x') + p3;
      return match;
    });
    setMarkdown(newMarkdown);
  };

  const updateAssetMetadata = (name, key, value) => {
    setAssets(prev => ({ ...prev, [name]: { ...prev[name], [key]: value } }));
  };

  const deleteAsset = (name) => {
    const next = { ...assets };
    delete next[name];
    setAssets(next);
    setMarkdown(prev => prev
      .replace(`[[file:${name}]]`, '')
      .replace(`:::pdf file=${name}:::`, '')
    );
  };

  // --- Rendering ---
  const renderContent = () => {
    if (!markedLoaded || !window.marked) return null;
    const renderer = new window.marked.Renderer();
    let cbCount = 0;
    let hCount = 0;

    // Ensure page splitters are always surrounded by newlines so marked.js parses them as <hr>
    const processedMarkdown = markdown.replace(/^---+$/gm, '\n\n---\n\n');

    // Fixed Checklist Sync: Ensure inputs have correct indices and classes
    renderer.checkbox = (checkedArg) => {
      const isChecked = typeof checkedArg === 'object' ? checkedArg.checked : checkedArg;
      const idx = cbCount++;
      return `<input type="checkbox" data-checkbox-index="${idx}" ${isChecked ? 'checked' : ''} class="checkbox-sync" />`;
    };

    // Fixed Header IDs: Return strings, not objects
    renderer.heading = (textArg, levelArg) => {
      const text = typeof textArg === 'object' ? textArg.text : textArg;
      const level = typeof textArg === 'object' ? textArg.depth : levelArg;
      const id = `heading-${hCount++}`;
      return `<h${level} id="${id}">${text}</h${level}>`;
    };

    const fullHtml = window.marked.parse(processedMarkdown, { renderer });
    const segments = fullHtml.split(/<hr\s*\/?>/i);

    const renderedPages = [];

    segments.forEach((segHtml) => {
      const regex = /(\[\[file:(.*?)\]\]|:::pdf file=(.*?):::)/g;
      let last = 0, match;
      let currentPageParts = [];

      while ((match = regex.exec(segHtml)) !== null) {
        const htmlBefore = segHtml.substring(last, match.index);
        if (htmlBefore.trim() || htmlBefore.includes('<')) {
          currentPageParts.push({ type: 'html', content: htmlBefore });
        }

        const fileName = match[2] || match[3];
        const asset = assets[fileName];

        if (asset && asset.type === 'pdf') {
          if (currentPageParts.length > 0) {
            renderedPages.push({ type: 'mixed', parts: currentPageParts });
            currentPageParts = [];
          }
          asset.pages.forEach((pUrl, idx) => {
            renderedPages.push({ type: 'pdf-page', url: pUrl, assetName: asset.name, pageNum: idx + 1 });
          });
        } else {
          currentPageParts.push({ type: 'asset', fileName });
        }
        last = regex.lastIndex;
      }

      const htmlAfter = segHtml.substring(last);
      // Even if strictly empty, let marked output empty paragraphs or whitespace.
      if (htmlAfter) {
        currentPageParts.push({ type: 'html', content: htmlAfter });
      }

      if (currentPageParts.length > 0) {
        renderedPages.push({ type: 'mixed', parts: currentPageParts });
      } else if (!segHtml.includes(':::pdf')) {
        renderedPages.push({ type: 'mixed', parts: [] });
      }
    });

    return renderedPages.map((pageData, pageIdx) => {
      if (pageData.type === 'pdf-page') {
        return (
          <div key={`page-${pageIdx}`} className={`scrapbook-page pdf-page-container relative bg-[#fcfaf7] overflow-hidden transition-all !w-full mx-auto ${isExporting ? 'p-0 my-0' : 'shadow-xl mb-12 border border-stone-200 rounded-sm'}`} style={{ maxWidth: '210mm', minHeight: '297mm', padding: 0, breakAfter: 'page', pageBreakAfter: 'always' }}>
            <img src={pageData.url} className="w-full h-full object-contain" alt={`${pageData.assetName} page ${pageData.pageNum}`} />
            <AnnotationOverlay pageIdx={pageIdx} annotations={annotations[pageIdx] || {}} updateAnnotations={updateAnnotations} activeTool={activeTool} isExporting={isExporting} includeMarkup={includeMarkup} />
            <div className="absolute bottom-4 right-8 text-[10px] text-stone-300 font-bold tracking-widest print:text-stone-500 z-50 pointer-events-none">PAGE {pageIdx + 1}</div>
          </div>
        );
      }

      return (
        <div key={`page-${pageIdx}`} className={`scrapbook-page relative bg-[#fcfaf7] transition-all overflow-hidden !w-full mx-auto html2pdf-pagebreak ${isExporting ? 'p-[60px] my-0' : 'shadow-xl mb-12 border border-stone-200 rounded-sm p-8 md:p-[60px]'}`} style={{ maxWidth: '210mm', minHeight: '297mm', breakAfter: 'page', pageBreakAfter: 'always' }}>
          {!isExporting && <div className="absolute inset-0 opacity-[0.03] no-print pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }}></div>}
          <AnnotationOverlay pageIdx={pageIdx} annotations={annotations[pageIdx] || {}} updateAnnotations={updateAnnotations} activeTool={activeTool} isExporting={isExporting} includeMarkup={includeMarkup} />
          <div className="relative z-10 pointer-events-none">
            {pageData.parts.map((p, i) => {
              if (p.type === 'html') {
                return (
                  <div
                    key={i}
                    dangerouslySetInnerHTML={{ __html: p.content }}
                    onClick={(e) => {
                      if (e.target.tagName === 'INPUT') {
                        const idx = parseInt(e.target.getAttribute('data-checkbox-index'));
                        if (!isNaN(idx)) toggleCheckbox(idx);
                      }
                    }}
                    className="prose prose-stone max-w-none pointer-events-auto prose-headings:font-extrabold prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl"
                  />
                );
              }

              const asset = assets[p.fileName];
              if (!asset) return <div key={i} className="text-red-500 font-mono text-xs my-4 p-2 bg-red-50 rounded">Missing asset: {p.fileName}</div>;

              if (asset.type === 'image') {
                return (
                  <div key={i} className="my-10 flex flex-col items-center">
                    <div className="bg-white p-3 shadow-2xl border border-stone-200 transform rotate-1 transition-transform max-w-full">
                      <img src={asset.data} className="max-h-[500px] object-contain" alt="" />
                      <div className="mt-4 text-center border-t border-stone-100 pt-3">
                        {asset.caption && <p className="font-serif italic text-stone-700">"{asset.caption}"</p>}
                        {(asset.date || asset.location) && (
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">
                            {asset.date} {asset.location && `• ${asset.location}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
          <div className="absolute bottom-4 right-8 text-[10px] text-stone-300 font-bold tracking-widest print:text-stone-500 pointer-events-none z-50">PAGE {pageIdx + 1}</div>
        </div>
      );
    });
  };

  const triggerPDFExport = () => {
    setMode('render');
    setIsExporting(true);

    // Wait for preview mode to fully render, then capture each page
    setTimeout(async () => {
      try {
        const container = previewRef.current;
        if (!container) throw new Error('Preview not ready');

        const pages = container.querySelectorAll('.scrapbook-page');
        if (pages.length === 0) throw new Error('No pages to export');

        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = 210; // A4 mm
        const pageHeight = 297;

        for (let i = 0; i < pages.length; i++) {
          const canvas = await html2canvas(pages[i] as HTMLElement, {
            scale: 2,
            useCORS: true,
            logging: false,
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          // Scale image to fit A4 page width, let height flow naturally
          const imgH = (canvas.height * pageWidth) / canvas.width;

          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, Math.min(imgH, pageHeight));
        }

        pdf.save(`${activeBook?.title || 'exported'}.pdf`);
      } catch (err) {
        console.error('PDF export failed:', err);
        alert('PDF export failed. Please try again.');
      } finally {
        setIsExporting(false);
      }
    }, 800);
  };

  const jumpToLine = (line) => {
    // Find the heading by its index in the outline
    const outlineIndex = outline.findIndex(h => h.lineIndex === line);
    const el = document.getElementById(`heading-${outlineIndex}`);

    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }

    if (editorRef.current) {
      const lines = markdown.split('\n');
      let offset = 0;
      for (let i = 0; i < line; i++) offset += lines[i].length + 1;
      editorRef.current.focus();
      editorRef.current.setSelectionRange(offset, offset);
    }
  };

  return (
    <div className="h-screen bg-stone-50 text-stone-900 font-sans flex flex-col overflow-hidden">
      <input type="file" multiple ref={fileInputRef} onChange={(e) => e.target.files && handleFiles(e.target.files)} className="hidden" accept="image/*,application/pdf,.pdf" />

      {/* Top Header */}
      <header className="h-14 bg-white border-b border-stone-200 px-4 flex items-center justify-between no-print shadow-sm shrink-0 z-50">
        <div className="flex items-center gap-3">
          <button title="Scrapbooks" onClick={() => setShowBooks(!showBooks)} className={`p-2 rounded-lg transition-colors ${showBooks ? 'bg-stone-100 text-stone-900' : 'hover:bg-stone-100 text-stone-500'}`}>
            <Book size={20} />
          </button>
          <button title="Outline" onClick={() => setShowOutline(!showOutline)} className={`p-2 rounded-lg transition-colors ${showOutline ? 'bg-stone-100 text-stone-900' : 'hover:bg-stone-100 text-stone-500'}`}>
            <Menu size={20} />
          </button>
          <button title="Search" onClick={() => setShowSearch(true)} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors">
            <Search size={20} />
          </button>
          <button title="Settings" onClick={() => setShowSettings(true)} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors">
            <Settings size={20} />
          </button>
          <div className="bg-stone-800 p-1.5 rounded-lg text-white ml-2">
            <FileText size={18} />
          </div>
          <input 
            type="text" 
            value={activeBook?.title || ""} 
            onChange={(e) => {
              setBooks(prev => prev.map(b => b.id === activeBookId ? { ...b, title: e.target.value } : b));
            }}
            className="font-black text-xs md:text-base tracking-tight uppercase bg-transparent outline-none ring-0 w-48 focus:border-b-2 focus:border-stone-800"
          />
        </div>

        <div className="flex items-center gap-2">
          {mode === 'render' && (
            <div className="bg-stone-50 p-1 rounded-full flex mr-2 items-center gap-1 border border-stone-200 shadow-sm">
              <button 
                onClick={() => setActiveTool('none')} 
                className={`p-1.5 rounded-full transition-colors ${activeTool === 'none' ? 'bg-white shadow-sm text-stone-900 border border-stone-200' : 'text-stone-400 hover:text-stone-600'}`} 
                title="Hand Focus"
              >
                <MousePointer2 size={14} />
              </button>
              <button 
                onClick={() => { setActiveTool('pen'); setIncludeMarkup(true); }} 
                className={`p-1.5 rounded-full transition-colors ${activeTool === 'pen' ? 'bg-white shadow-sm text-stone-900 border border-stone-200' : 'text-stone-400 hover:text-stone-600'}`} 
                title="Pen Tool"
              >
                <PenTool size={14} />
              </button>
              <button 
                onClick={() => { setActiveTool('highlighter'); setIncludeMarkup(true); }} 
                className={`p-1.5 rounded-full transition-colors ${activeTool === 'highlighter' ? 'bg-white shadow-sm text-stone-900 border border-stone-200' : 'text-stone-400 hover:text-stone-600'}`} 
                title="Highlighter Tool"
              >
                <Highlighter size={14} />
              </button>
              <button 
                onClick={() => { setActiveTool('sticky'); setIncludeMarkup(true); }} 
                className={`p-1.5 rounded-full transition-colors ${activeTool === 'sticky' ? 'bg-white shadow-sm text-stone-900 border border-stone-200' : 'text-stone-400 hover:text-stone-600'}`} 
                title="Sticky Note"
              >
                <StickyNote size={14} />
              </button>
              <div className="w-px h-4 bg-stone-200 mx-1"></div>
              <label className="flex items-center gap-1.5 text-[9px] font-black text-stone-500 uppercase tracking-widest px-2 cursor-pointer no-print mr-1">
                <input 
                  type="checkbox" 
                  checked={includeMarkup} 
                  onChange={e => {
                    setIncludeMarkup(e.target.checked);
                    if (!e.target.checked && activeTool !== 'none') {
                      setActiveTool('none');
                    }
                  }} 
                  className="accent-stone-800" 
                />
                Markup
              </label>
            </div>
          )}
          <div className="bg-stone-100 p-1 rounded-full flex">
            <button onClick={() => setMode('edit')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'edit' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}>Edit</button>
            <button onClick={() => { setMode('render'); setActiveTool('none'); }} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'render' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}>Preview</button>
          </div>
          <button 
            disabled={isExporting} 
            onClick={triggerPDFExport} 
            className="bg-stone-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
            {isExporting ? "Generating PDF..." : "Export"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Books Sidebar */}
        {showBooks && (
          <aside className="w-64 border-r border-stone-200 bg-[#f7f5f2] flex flex-col shrink-0 no-print animate-in slide-in-from-left duration-300">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <span className="text-[10px] font-black text-stone-400 tracking-widest uppercase">My Scrapbooks</span>
              <button 
                onClick={() => {
                  const newId = Date.now();
                  setBooks(prev => [...prev, { id: newId, title: `Scrapbook ${prev.length + 1}`, color: 'bg-stone-300', markdown: '', assets: {}, annotations: {} }]);
                  setActiveBookId(newId);
                }}
                className="p-1 hover:bg-stone-200 rounded text-stone-600"
                title="New Scrapbook"
              >
                <Plus size={14} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
              {books.map(book => (
                <div key={book.id} className={`group flex items-center justify-between p-2 rounded-md transition-colors text-sm cursor-pointer ${activeBookId === book.id ? 'bg-white shadow-sm font-bold text-stone-900 border border-stone-200' : 'hover:bg-stone-200/50 text-stone-600'}`} onClick={() => setActiveBookId(book.id)}>
                  <div className="flex items-center gap-2 truncate">
                    <button 
                      onClick={(e) => { e.stopPropagation(); cycleColor(book.id, book.color); }}
                      className={`w-3 h-3 rounded-full shrink-0 ${book.color || 'bg-stone-300'} border border-black/10 hover:scale-110 transition-transform`}
                    />
                    <Book size={14} className={activeBookId === book.id ? "text-stone-800" : "text-stone-400"} />
                    <span className="truncate">{book.title}</span>
                  </div>
                  {books.length > 1 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setBooks(prev => prev.filter(b => b.id !== book.id));
                        if (activeBookId === book.id) setActiveBookId(books.find(b => b.id !== book.id).id);
                      }} 
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded text-stone-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </nav>
          </aside>
        )}

        {/* Outline Sidebar */}
        {showOutline && (
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
        )}

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {mode === 'edit' ? (
            <div className="flex flex-1 overflow-hidden">
              <div className={`flex-1 flex flex-col min-w-0 ${activeMobileTab === 'editor' ? 'flex' : 'hidden md:flex'}`}>
                {/* Toolbar */}
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
                  {/* <button onClick={improveWriting} disabled={isAILoading} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-200 text-stone-700 rounded-full text-[10px] font-bold shadow-sm hover:shadow-md transition-all active:scale-95">
                    {isAILoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="text-amber-500" />}
                    <span>AI Polish</span>
                  </button> */}
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
                    onSelect={(e) => setCursorPos(e.target.selectionStart)}
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

              {/* Asset Sidebar (Desktop) */}
              <div 
                className={`w-80 border-l border-stone-200 bg-stone-50 flex flex-col shrink-0 relative transition-colors ${activeMobileTab === 'assets' ? 'fixed inset-0 z-40 bg-white' : 'hidden md:flex'} ${isDraggingOverLibrary ? 'bg-stone-100 ring-2 ring-inset ring-stone-300' : ''}`}
                onDragOver={(e) => {
                  setIsDraggingOverLibrary(true);
                  if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
                    e.preventDefault();
                  }
                }}
                onDragLeave={() => setIsDraggingOverLibrary(false)}
                onDrop={(e) => {
                  setIsDraggingOverLibrary(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    e.preventDefault();
                    handleFiles(e.dataTransfer.files, false);
                  }
                }}
              >
                <div className="p-4 border-b border-stone-200 bg-white flex items-center justify-between">
                  <span className="text-[10px] font-black text-stone-400 tracking-widest uppercase flex items-center gap-2">
                    Asset Library
                    {isProcessingFiles && <span className="text-stone-400 flex items-center gap-1 lowercase"><Loader2 size={10} className="animate-spin" /> loading...</span>}
                  </span>
                  <button onClick={() => setActiveMobileTab('editor')} className="md:hidden p-2 text-stone-400"><X size={18} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar scrollbar-thin">
                  {Object.values(assets).map((asset) => (
                    <div
                      key={asset.name}
                      draggable
                      onDragStart={(e) => {
                        const tag = asset.type === 'pdf' ? `:::pdf file=${asset.name}:::` : `[[file:${asset.name}]]`;
                        e.dataTransfer.setData("text/plain", tag);
                      }}
                      className={`p-3 bg-white border rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-stone-400 transition-all group ${editingAsset === asset.name ? 'ring-2 ring-stone-900' : ''}`}
                      onClick={() => setEditingAsset(editingAsset === asset.name ? null : asset.name)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200">
                          <img src={asset.thumbnail} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black truncate text-stone-800">{asset.name}</p>
                          <p className="text-[9px] text-stone-400 font-bold uppercase">{asset.type} • {asset.numPages || 1}p</p>
                        </div>
                        <GripVertical size={14} className="text-stone-300" />
                        <button onClick={(e) => { e.stopPropagation(); deleteAsset(asset.name); }} className="text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>

                      {editingAsset === asset.name && (
                        <div className="mt-3 pt-3 border-t border-stone-100 space-y-2 animate-in fade-in" onClick={e => e.stopPropagation()}>
                          {/* {asset.type === 'image' && (
                            <button onClick={() => analyzeImage(asset.name)} disabled={isAILoading} className="w-full py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-stone-100 transition-colors">
                              {isAILoading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} className="text-amber-500" />}
                              ✨ AI Suggestion
                            </button>
                          )} */}
                          <input type="text" placeholder="Caption" value={asset.caption} onChange={e => updateAssetMetadata(asset.name, 'caption', e.target.value)} className="w-full p-2 text-[10px] border border-stone-200 rounded-md outline-none focus:ring-1 focus:ring-stone-400 transition-all" />
                          <div className="flex gap-2">
                            <input type="text" placeholder="Date" value={asset.date} onChange={e => updateAssetMetadata(asset.name, 'date', e.target.value)} className="w-1/2 p-2 text-[10px] border border-stone-200 rounded-md outline-none focus:ring-1 focus:ring-stone-400 transition-all" />
                            <input type="text" placeholder="Location" value={asset.location} onChange={e => updateAssetMetadata(asset.name, 'location', e.target.value)} className="w-1/2 p-2 text-[10px] border border-stone-200 rounded-md outline-none focus:ring-1 focus:ring-stone-400 transition-all" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {Object.keys(assets).length === 0 && (
                    <div className="text-center py-20 opacity-20 flex flex-col items-center border-2 border-dashed border-stone-300 rounded-2xl m-2">
                      <UploadCloud size={40} className="mb-2" />
                      <p className="text-[10px] font-black uppercase">Drop files here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 md:p-12 scroll-smooth bg-stone-200/50 print:bg-white print:p-0">
              <div className="max-w-4xl mx-auto pb-20 print:pb-0" ref={previewRef}>
                {renderContent()}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Navigation Tabs */}
      <nav className="md:hidden h-16 bg-white border-t border-stone-200 grid grid-cols-2 no-print shrink-0 z-50">
        <button onClick={() => setActiveMobileTab('editor')} className={`flex flex-col items-center justify-center gap-1 ${activeMobileTab === 'editor' ? 'text-stone-900 font-bold' : 'text-stone-400'}`}>
          <Edit3 size={20} />
          <span className="text-[10px] uppercase">Editor</span>
        </button>
        <button onClick={() => setActiveMobileTab('assets')} className={`flex flex-col items-center justify-center gap-1 ${activeMobileTab === 'assets' ? 'text-stone-900 font-bold' : 'text-stone-400'}`}>
          <Layers size={20} />
          <span className="text-[10px] uppercase tracking-wider">Library</span>
        </button>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-stone-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg text-stone-900">App Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-stone-400 hover:text-stone-600 bg-stone-100 p-1 rounded-full"><X size={18} /></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">AI Provider</label>
                <select 
                  value={settings.aiProvider} 
                  onChange={e => setSettings({...settings, aiProvider: e.target.value})} 
                  className="w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-400 text-sm shadow-inner bg-stone-50"
                >
                  <option value="none">None</option>
                  <option value="local">Local (Ollama)</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="groq">Groq</option>
                </select>
              </div>

              {settings.aiProvider !== 'none' && (
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Model Name</label>
                  <input 
                    type="text" 
                    value={settings.aiModel} 
                    onChange={e => setSettings({...settings, aiModel: e.target.value})} 
                    placeholder="e.g. llama3-8b-8192 or gemini-2.5-flash-preview-09-2025" 
                    className="w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-400 text-sm shadow-inner bg-stone-50" 
                  />
                </div>
              )}

              {settings.aiProvider === 'gemini' && (
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Gemini API Key</label>
                  <input 
                    type="password" 
                    value={settings.geminiApiKey} 
                    onChange={e => setSettings({...settings, geminiApiKey: e.target.value})} 
                    placeholder="Paste Gemini AI key here..." 
                    className="w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-400 text-sm shadow-inner bg-stone-50" 
                  />
                  <p className="text-xs text-stone-400 mt-2 font-medium">Required for Magic Polish, Smart Import, and Concept Vector Search.</p>
                </div>
              )}

              {settings.aiProvider === 'groq' && (
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Groq API Key</label>
                  <input 
                    type="password" 
                    value={settings.groqApiKey} 
                    onChange={e => setSettings({...settings, groqApiKey: e.target.value})} 
                    placeholder="Paste Groq API key here..." 
                    className="w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-400 text-sm shadow-inner bg-stone-50" 
                  />
                  <p className="text-xs text-stone-400 mt-2 font-medium">Required for Magic Polish and Smart Import. Embeddings will use local engine.</p>
                </div>
              )}
              <div className="border-t border-stone-100 pt-4">
                <label className="flex items-center gap-3 text-sm font-bold text-stone-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.enableVectorSearch} 
                    onChange={e => setSettings({...settings, enableVectorSearch: e.target.checked})} 
                    className="w-5 h-5 accent-stone-800 rounded border-stone-300" 
                  />
                  Enable Concept Vector Search
                </label>
                <p className="text-[11px] text-stone-400 mt-2 ml-8 leading-relaxed">
                  When enabled, paragraphs are automatically indexed in the background to allow semantic meaning-based search instead of just exact text matches.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-50 flex items-start justify-center pt-16 md:pt-24 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] border border-stone-200/50">
            <div className="p-4 border-b border-stone-100 flex items-center gap-3 bg-stone-50/80 backdrop-blur">
              <Search size={22} className="text-stone-400" />
              <input 
                autoFocus 
                type="text" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="Search specifically or conceptually..." 
                className="flex-1 bg-transparent border-none outline-none text-xl font-medium text-stone-800 placeholder-stone-400" 
              />
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }} className="text-stone-400 hover:text-stone-600 bg-stone-200/50 hover:bg-stone-200 rounded-full p-1.5 transition-colors"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto p-3 scrollbar-thin flex-1 bg-[#fcfaf7]">
              {isSearching ? (
                <div className="p-12 text-center text-stone-400 flex flex-col items-center gap-3 justify-center h-full">
                  <Loader2 className="animate-spin text-stone-300" size={32} /> 
                  <span className="text-xs font-bold uppercase tracking-widest">Searching Knowledge Base...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((res, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 bg-white hover:bg-emerald-50/50 rounded-xl cursor-pointer border border-stone-100 hover:border-emerald-200 transition-all shadow-sm hover:shadow group"
                      onClick={() => {
                        setActiveBookId(res.bookId);
                        setShowSearch(false);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                          <span className="text-stone-800 bg-stone-100 px-2 py-0.5 rounded">{res.bookTitle}</span>
                          {res.type === 'concept' ? (
                            <span className="text-amber-600 flex items-center gap-1"><Sparkles size={10} /> CONCEPT MATCH</span>
                          ) : (
                            <span className="text-emerald-600">EXACT MATCH</span>
                          )}
                        </span>
                        <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 text-stone-300 transform group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-sm text-stone-600 font-serif leading-relaxed line-clamp-2">"{res.text.replace(/\ng/, ' ')}"</p>
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="p-12 text-center text-stone-400 h-full flex flex-col items-center justify-center">
                  <p className="font-serif italic text-lg mb-2">No echoes found.</p>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-50">Try different keywords</p>
                </div>
              ) : (
                <div className="p-12 text-center text-stone-400 h-full flex flex-col items-center justify-center space-y-4">
                  <Search size={48} className="text-stone-200" />
                  <div>
                    <h3 className="font-bold text-stone-700 mb-1">Global Knowledge Search</h3>
                    <p className="text-sm">Type anything to instantly locate exact matches or conceptual ideas across all your scrapbooks.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .prose h1 { @apply text-3xl md:text-5xl font-serif font-black mb-8 pb-4 border-b-4 border-stone-800; }
        .prose h2 { @apply text-xl md:text-2xl font-serif font-bold mt-12 mb-6 text-stone-700; }
        .prose h3 { @apply text-lg md:text-xl font-serif font-semibold mt-8 mb-4 text-stone-600; }
        .prose p { @apply text-sm md:text-base leading-relaxed mb-6 text-stone-600 font-light; }
        .prose ul { @apply space-y-2 mb-6 list-disc pl-6; }
        .prose li { @apply relative text-sm md:text-base; }
        .prose strong { @apply font-bold text-stone-900; }
        .prose em { @apply italic; }
        
        /* Checkbox Sync Styling */
        .prose input[type="checkbox"] { 
          @apply w-5 h-5 rounded border-stone-300 accent-stone-800 cursor-pointer transition-all;
          appearance: auto;
          margin-right: 0.5rem;
          vertical-align: middle;
        }
        .prose li:has(input[type="checkbox"]) { @apply list-none pl-0; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          /* Fix flexbox page-break bugs by making structural containers block elements */
          html, body, div.h-screen, main, .flex, .flex-1, .flex-col, .overflow-hidden, .overflow-y-auto { 
            height: auto !important; 
            overflow: visible !important; 
            display: block !important;
          }
          .scrapbook-page { 
            box-shadow: none !important; border: none !important; margin: 0 !important; 
            padding: 2.5cm !important; page-break-after: always; width: 100% !important;
            max-width: none !important;
            min-height: 0 !important;
            background: white !important;
          }
          .scrapbook-page.pdf-page-container {
            padding: 0 !important;
          }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </div>
  );
};

export default App;