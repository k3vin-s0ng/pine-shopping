'use client';

import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Download, FileText } from 'lucide-react';
import {Button} from "./components/ui/button"
import { Search } from "lucide-react"

export default function WordProcessor() {
  const [content, setContent] = useState('');
  const [fontSize, setFontSize] = useState('16');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    editorRef.current?.focus();
  }, []);

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateActiveFormats();
  };

  const updateActiveFormats = () => {
    const formats = new Set<string>();
    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    if (document.queryCommandState('justifyLeft')) formats.add('justifyLeft');
    if (document.queryCommandState('justifyCenter')) formats.add('justifyCenter');
    if (document.queryCommandState('justifyRight')) formats.add('justifyRight');
    if (document.queryCommandState('insertUnorderedList')) formats.add('insertUnorderedList');
    if (document.queryCommandState('insertOrderedList')) formats.add('insertOrderedList');
    setActiveFormats(formats);

    // Update word and character count
    const text = editorRef.current?.innerText || '';
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharCount(text.length);
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = e.target.value;
    setFontSize(size);
    executeCommand('fontSize', '7');
    const fontElements = editorRef.current?.querySelectorAll('font[size="7"]');
    fontElements?.forEach(el => {
      el.removeAttribute('size');
      (el as HTMLElement).style.fontSize = size + 'px';
    });
  };

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const family = e.target.value;
    setFontFamily(family);
    executeCommand('fontName', family);
  };

  const downloadAsHTML = () => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Document</title>
  <style>
    body { font-family: ${fontFamily}; font-size: ${fontSize}px; padding: 40px; max-width: 8.5in; margin: 0 auto; }
  </style>
</head>
<body>
  ${editorRef.current?.innerHTML || ''}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsText = () => {
    const text = editorRef.current?.innerText || '';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper function to get document text programmatically
  const getDocumentText = () => {
    return editorRef.current?.innerText || '';
  };

  // Helper function to get document HTML programmatically
  const getDocumentHTML = () => {
    return editorRef.current?.innerHTML || '';
  };

  // Example function showing how to use the text
  const analyzeDocument = () => {
    const text = getDocumentText();
    console.log('Document text:', text);
    console.log('Word count:', text.trim().split(/\s+/).filter(w => w.length > 0).length);

    // You can do anything with the text here:
    // - Send to an API
    // - Save to database
    // - Analyze sentiment
    // - Check grammar
    // etc.
  };

  return (
    <div className="flex flex-row min-h-screen">
      {/* Sidebar */}
      <aside className="w-25 bg-gray-100 text-black flex flex-col items-center p-4">
        <Button variant="outline">
          <Search className = "h-4 w-4"/>
        </Button>
      </aside>
      <main className="flex-1">
        <div className="min-h-screen bg-white-100">
          <div className="flex-1 bg-white flex flex-col">
            {/* Toolbar */}
            <div className="p-3 sticky top-0 z-10">
              <div className="flex flex-wrap items-center gap-2">
                {/* Font controls */}
                <select
                  value={fontFamily}
                  onChange={handleFontFamilyChange}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                </select>

                <select
                  value={fontSize}
                  onChange={handleFontSizeChange}
                  className="px-2 py-1 border border-gray-300 rounded text-sm w-16"
                >
                  {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Heading formats */}
                <select
                  onChange={(e) => executeCommand('formatBlock', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                  defaultValue="p"
                >
                  <option value="p">Normal</option>
                  <option value="h1">Heading 1</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                </select>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Text formatting */}
                <button
                  onClick={() => executeCommand('bold')}
                  className={`p-2 rounded ${activeFormats.has('bold') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
                  title="Bold"
                >
                  <Bold size={18} />
                </button>
                <button
                  onClick={() => executeCommand('italic')}
                  className={`p-2 rounded ${activeFormats.has('italic') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
                  title="Italic"
                >
                  <Italic size={18} />
                </button>
                <button
                  onClick={() => executeCommand('underline')}
                  className={`p-2 rounded ${activeFormats.has('underline') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
                  title="Underline"
                >
                  <Underline size={18} />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Alignment */}
                <button
                  onClick={() => executeCommand('justifyLeft')}
                  className={`p-2 rounded ${activeFormats.has('justifyLeft') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
                  title="Align Left"
                >
                  <AlignLeft size={18} />
                </button>
                <button
                  onClick={() => executeCommand('justifyCenter')}
                  className={`p-2 rounded ${activeFormats.has('justifyCenter') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
                  title="Align Center"
                >
                  <AlignCenter size={18} />
                </button>
                <button
                  onClick={() => executeCommand('justifyRight')}
                  className={`p-2 rounded ${activeFormats.has('justifyRight') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
                  title="Align Right"
                >
                  <AlignRight size={18} />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Lists */}
                <button
                  onClick={() => executeCommand('insertUnorderedList')}
                  className={`p-2 rounded ${activeFormats.has('insertUnorderedList') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
                  title="Bullet List"
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => executeCommand('insertOrderedList')}
                  className={`p-2 rounded ${activeFormats.has('insertOrderedList') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
                  title="Numbered List"
                >
                  <ListOrdered size={18} />
                </button>

                <div className="flex-1" />

                {/* Download options */}
                <button
                  onClick={downloadAsText}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1 text-sm"
                  title="Download as Text"
                >
                  <FileText size={16} />
                  .txt
                </button>
                <button
                  onClick={downloadAsHTML}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1 text-sm"
                  title="Download as HTML"
                >
                  <Download size={16} />
                  .html
                </button>
              </div>
            </div>

            {/* Editor */}
            <div
              ref={editorRef}
              contentEditable
              onInput={(e) => setContent(e.currentTarget.innerHTML)}
              onMouseUp={updateActiveFormats}
              onKeyUp={updateActiveFormats}
              className="flex-1 p-16 focus:outline-none overflow-auto min-h-[600px]"
              style={{
                fontFamily: fontFamily,
                fontSize: fontSize + 'px',
                lineHeight: '1.6'
              }}
              suppressContentEditableWarning
            >
            </div>
          </div>
        </div>
      </main>
    </div>

  );
}