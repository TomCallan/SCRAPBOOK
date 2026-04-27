"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Book, Asset, Settings, Annotation } from '@/types/scrapbook';
import { cosineSimilarity, BOOK_COLORS } from '@/lib/utils';

const MARKED_SCRIPT = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
const PDFJS_SCRIPT = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

export const useScrapbook = () => {
  const [mode, setMode] = useState<string>('edit');
  const [activeMobileTab, setActiveMobileTab] = useState<string>('editor');
  
  const [books, setBooks] = useState<Book[]>([{ id: 1, title: 'Untitled Scrapbook', color: 'bg-stone-300', markdown: '', assets: {}, annotations: {} }]);
  const [activeBookId, setActiveBookId] = useState<number>(1);
  const [editingAsset, setEditingAsset] = useState<string | null>(null);
  const [isDraggingOverEditor, setIsDraggingOverEditor] = useState<boolean>(false);
  const [markedLoaded, setMarkedLoaded] = useState<boolean>(false);
  const [isAILoading, setIsAILoading] = useState<boolean>(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState<boolean>(false);
  const [isDraggingOverLibrary, setIsDraggingOverLibrary] = useState<boolean>(false);
  const [aiError, setAIError] = useState<string | null>(null);
  const [showOutline, setShowOutline] = useState<boolean>(true);
  const [showBooks, setShowBooks] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<string>('none');
  const [includeMarkup, setIncludeMarkup] = useState<boolean>(true);

  const [settings, setSettings] = useState<Settings>({ 
    aiProvider: 'gemini', 
    aiModel: 'gemini-2.5-flash-preview-09-2025',
    geminiApiKey: '', 
    groqApiKey: '',
    enableVectorSearch: true 
  });
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const [localExtractor, setLocalExtractor] = useState<any>(null);

  const activeBook = useMemo(() => books.find(b => b.id === activeBookId) || books[0], [books, activeBookId]);

  // Load books and settings on mount
  useEffect(() => {
    fetch('/api/books')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) setBooks(data);
      })
      .catch(err => console.error(err));

    fetch('/api/settings')
      .then(r => r.json())
      .then(data => setSettings((prev: any) => ({ ...prev, ...data })))
      .catch(err => console.error("Error loading settings:", err));
  }, []);

  // Auto-save active book
  useEffect(() => {
    if (activeBook && activeBook.id) {
      const timer = setTimeout(() => {
        fetch(`/api/books/${activeBook.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activeBook)
        }).catch(err => console.error('Failed to auto-save book:', err));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [activeBook]);

  // Load transformers and external scripts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@huggingface/transformers').then(({ pipeline, env }) => {
        env.allowLocalModels = false;
        pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2').then(extractor => {
          setLocalExtractor(() => extractor);
        }).catch(err => console.error("Error loading local extractor:", err));
      }).catch(err => console.error("Error importing transformers:", err));

      const loadScripts = async () => {
        const s1 = document.createElement('script');
        s1.src = MARKED_SCRIPT;
        s1.onload = () => setMarkedLoaded(true);
        document.head.appendChild(s1);

        const s2 = document.createElement('script');
        s2.src = PDFJS_SCRIPT;
        s2.onload = () => {
          (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        };
        document.head.appendChild(s2);
      };
      loadScripts();
    }
  }, []);

  const setMarkdown = useCallback((value: string | ((prev: string) => string)) => {
    setBooks(prev => prev.map(b => b.id === activeBookId ? { ...b, markdown: typeof value === 'function' ? value(b.markdown) : value } : b));
  }, [activeBookId]);

  const setAssets = useCallback((value: Record<string, Asset> | ((prev: Record<string, Asset>) => Record<string, Asset>)) => {
    setBooks(prev => prev.map(b => b.id === activeBookId ? { ...b, assets: typeof value === 'function' ? value(b.assets) : value } : b));
  }, [activeBookId]);

  const updateAnnotations = useCallback((pageIdx: number, newAnnotations: Partial<Annotation>) => {
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
  }, [activeBookId]);

  const cycleColor = useCallback((bookId: number, currentColor: string) => {
    const currentIndex = BOOK_COLORS.indexOf(currentColor || 'bg-stone-300');
    const nextColor = BOOK_COLORS[(currentIndex + 1) % BOOK_COLORS.length];
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, color: nextColor } : b));
  }, []);

  const getEmbedding = async (text: string): Promise<number[] | null> => {
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
        if (result.embedding?.values) return result.embedding.values;
      } catch (e) {
        console.error("Gemini embedding failed", e);
      }
    }

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

  const callAI = async (payload: string, systemPrompt: string | null, imageBase64: string | null, mimeType: string | null, retries = 5) => {
    if (settings.aiProvider === 'none') throw new Error("AI features are disabled in Settings.");

    for (let i = 0; i < retries; i++) {
      try {
        if (settings.aiProvider === 'gemini') {
          if (!settings.geminiApiKey) throw new Error("Gemini API Key required.");
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.aiModel || 'gemini-2.5-flash-preview-09-2025'}:generateContent?key=${settings.geminiApiKey}`;
          
          let geminiPayload: any = {};
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

          const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiPayload) });
          if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
          const result = await response.json();
          return result.candidates?.[0]?.content?.parts?.[0]?.text;
        } 
        else if (settings.aiProvider === 'groq' || settings.aiProvider === 'local') {
          const isLocal = settings.aiProvider === 'local';
          if (!isLocal && !settings.groqApiKey) throw new Error("Groq API Key required.");
          
          const url = isLocal ? 'http://localhost:11434/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
          const headers: any = { 'Content-Type': 'application/json' };
          if (!isLocal) headers['Authorization'] = `Bearer ${settings.groqApiKey}`;

          const messages: any[] = [];
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
    const results: any[] = [];
    const queryLower = searchQuery.toLowerCase();
    
    books.forEach(b => {
      if (b.title.toLowerCase().includes(queryLower)) {
         results.push({ bookId: b.id, bookTitle: b.title, text: b.title, type: 'exact (title)', score: 1 });
      }
      if (b.markdown) {
         const paragraphs = b.markdown.split(/\n\n+/);
         paragraphs.forEach((p) => {
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

  const processFile = async (file: File): Promise<Asset | null> => {
    let objectUrl = URL.createObjectURL(file);
    let finalDataUrl = objectUrl;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bookId", activeBookId.toString());
      const uploadRes = await fetch('/api/assets', { method: 'POST', body: formData });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        if (uploadData.url) finalDataUrl = uploadData.url;
      }
    } catch (e) {
      console.error('File upload failed', e);
    }


    if (file.type.startsWith('image/')) {
      return {
        name: file.name,
        type: 'image',
        data: finalDataUrl,
        thumbnail: finalDataUrl,
        caption: '', date: '', location: ''
      };
    }

    if (file.type === 'application/pdf' && (window as any).pdfjsLib) {
      try {
        const loadingTask = (window as any).pdfjsLib.getDocument(objectUrl);
        const pdf = await loadingTask.promise;
        const pages: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 3.0 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            pages.push(canvas.toDataURL('image/jpeg', 0.95));
          }
        }
        return {
          name: file.name,
          type: 'pdf',
          data: finalDataUrl,
          thumbnail: pages[0] || finalDataUrl,
          pages: pages,
          numPages: pdf.numPages,
          caption: '', date: '', location: ''
        };
      } catch (err) { console.error(err); }
    }
    return null;
  };

  const handleFiles = async (files: FileList | File[], insertIntoEditor = true, insertAtCursor: (text: string) => void) => {
    setIsProcessingFiles(true);
    const newAssets = { ...activeBook.assets };
    let insertionText = "";
    for (const file of Array.from(files)) {
      const processed = await processFile(file as File);
      if (processed) {
        newAssets[file.name] = processed;
        insertionText += processed.type === 'pdf' ? `\n:::pdf file=${file.name}:::\n` : `\n[[file:${file.name}]]\n`;
      }
    }
    setAssets(newAssets);
    if (insertIntoEditor) insertAtCursor(insertionText);
    setIsProcessingFiles(false);
  };

  const deleteAsset = (name: string) => {
    const next = { ...activeBook.assets };
    delete next[name];
    setAssets(next);
    setMarkdown((prev: string) => prev
      .replace(`[[file:${name}]]`, '')
      .replace(`:::pdf file=${name}:::`, '')
    );
  };

  const updateAssetMetadata = (name: string, key: string, value: string) => {
    setAssets((prev: any) => ({ ...prev, [name]: { ...prev[name], [key]: value } }));
  };

  const saveSettings = (newSettings: Settings) => {
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    }).then(() => {
      setSettings(newSettings);
      setShowSettings(false);
    }).catch(err => console.error("Error saving settings:", err));
  };

  const createNewBook = () => {
    const newId = Date.now();
    setBooks(prev => [...prev, { id: newId, title: `Scrapbook ${prev.length + 1}`, color: 'bg-stone-300', markdown: '', assets: {}, annotations: {} }]);
    setActiveBookId(newId);
  };

  const deleteBook = (id: number) => {
    if (books.length <= 1) return;
    setBooks(prev => prev.filter(b => b.id !== id));
    if (activeBookId === id) setActiveBookId(books.find(b => b.id !== id)!.id);
  };

  return {
    mode, setMode,
    activeMobileTab, setActiveMobileTab,
    books, setBooks,
    activeBookId, setActiveBookId,
    activeBook,
    editingAsset, setEditingAsset,
    isDraggingOverEditor, setIsDraggingOverEditor,
    markedLoaded,
    isAILoading,
    isProcessingFiles,
    isDraggingOverLibrary, setIsDraggingOverLibrary,
    aiError,
    showOutline, setShowOutline,
    showBooks, setShowBooks,
    cursorPos, setCursorPos,
    isExporting, setIsExporting,
    activeTool, setActiveTool,
    includeMarkup, setIncludeMarkup,
    settings, setSettings,
    showSettings, setShowSettings,
    showSearch, setShowSearch,
    searchQuery, setSearchQuery,
    searchResults,
    isSearching,
    setMarkdown,
    setAssets,
    updateAnnotations,
    cycleColor,
    handleFiles,
    deleteAsset,
    updateAssetMetadata,
    saveSettings,
    createNewBook,
    deleteBook,
    improveWriting: async () => {
        if (!activeBook.markdown.trim() || isAILoading) return;
        setIsAILoading(true);
        setAIError(null);
        try {
          const systemPrompt = "You are a professional immigration assistant. Improve the user's markdown narrative to sound formal, organized, and persuasive for a CR1 visa application. Maintain the original structure and standard Markdown syntax. Output ONLY improved markdown.";
          const improved = await callAI(activeBook.markdown, systemPrompt, null, null);
          if (improved) setMarkdown(improved);
        } catch (err) {
          setAIError("Failed to polish narrative.");
        } finally {
          setIsAILoading(false);
        }
      }
  };
};
