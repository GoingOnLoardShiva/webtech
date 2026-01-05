"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import MDXPreview from "./MDXPreview";
import { generateTOC } from "@/src/utils/markdown";

// Simple debounce helper
function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export default function MDXAdvancedEditor({
  value = "",
  onChange,
  onSave,
  autosaveKey = "post-draft",
  autosaveInterval = 30000,
}) {
  const [content, setContent] = useState(value || "");
  const [toc, setToc] = useState([]);
  const [counts, setCounts] = useState({ total: 0 });
  const [showToc, setShowToc] = useState(false);
  const [isFull, setIsFull] = useState(false);

  const taRef = useRef(null);
  const previewRef = useRef(null);
  const autosaveTimerRef = useRef(null);

  // Sync content with parent
  useEffect(() => {
    if (value !== content) setContent(value || "");
  }, [value]);

  const debouncedLocalSave = useCallback(
    debounce((val) => {
      try {
        localStorage.setItem(autosaveKey, val);
      } catch {}
    }, 1000),
    [autosaveKey]
  );

  const debouncedOnChange = useCallback(
    debounce((val) => onChange?.(val), 300),
    [onChange]
  );

  useEffect(() => {
    const { toc: t, counts: c } = generateTOC(content || "");
    setToc(t);
    setCounts(c);
    debouncedLocalSave(content);
    debouncedOnChange(content);
  }, [content, debouncedLocalSave, debouncedOnChange]);

  // Autosave
  useEffect(() => {
    if (!onSave) return;
    if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current);
    autosaveTimerRef.current = setInterval(() => {
      onSave({ autosave: true, skipUploads: true, content });
    }, autosaveInterval);
    return () => clearInterval(autosaveTimerRef.current);
  }, [onSave, autosaveInterval, content]);

  // Text formatting helpers
  const wrapSelection = (prefix, suffix = prefix) => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = content.slice(0, start);
    const sel = content.slice(start, end);
    const after = content.slice(end);
    const newVal = before + prefix + sel + suffix + after;
    setContent(newVal);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = end + prefix.length + suffix.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const insertAtCursor = (text) => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const newVal = before + text + after;
    setContent(newVal);
    requestAnimationFrame(() => {
      const pos = start + text.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  const insertHeading = (level) => insertAtCursor(`\n${"#".repeat(level)} Heading\n\n`);
  const insertCodeBlock = () => insertAtCursor("\n```\ncode\n```\n\n");
  const insertLink = () => insertAtCursor("[text](https://example.com)");
  const insertUl = () => insertAtCursor("\n- Item\n- Item\n\n");
  const insertOl = () => insertAtCursor("\n1. Item\n2. Item\n\n");

  const handleImageUpload = async (file) => {
    if (!file) return;
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      insertAtCursor(`![alt text](${json.url})`);
    } catch (e) {
      console.error("Upload failed", e);
    }
  };

  const onPaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const fileItem = items.find((it) => it.type && it.type.startsWith("image/"));
    if (fileItem) {
      const file = fileItem.getAsFile();
      handleImageUpload(file);
      e.preventDefault();
    }
  };

  const handleKeyDown = (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "b") {
      e.preventDefault();
      wrapSelection("**");
    }
    if (mod && e.key.toLowerCase() === "i") {
      e.preventDefault();
      wrapSelection("*");
    }
    if (mod && e.key.toLowerCase() === "s") {
      e.preventDefault();
      onSave?.({ autosave: false, skipUploads: true, content });
    }
  };

  const scrollToId = (id) => {
    const root = previewRef.current;
    if (!root) return;
    const el = root.querySelector(`#${CSS.escape(id)}`);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const offset = 80;
    window.scrollTo({ top: top - offset, behavior: "smooth" });
  };

  return (
    <div
      className={`flex flex-col lg:flex-col gap-4 w-full h-full ${
        isFull ? "fixed inset-0 z-[999] bg-white p-4" : "p-2"
      }`}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-2 justify-start">
        <button className="px-2 py-1 bg-blue-500 text-white rounded" onClick={() => wrapSelection("**")}>Bold</button>
        <button className="px-2 py-1 bg-blue-500 text-white rounded" onClick={() => wrapSelection("*")}>Italic</button>
        <button className="px-2 py-1 bg-green-500 text-white rounded" onClick={() => insertHeading(2)}>H2</button>
        <button className="px-2 py-1 bg-green-500 text-white rounded" onClick={() => insertHeading(3)}>H3</button>
        <button className="px-2 py-1 bg-purple-500 text-white rounded" onClick={insertCodeBlock}>Code</button>
        <button className="px-2 py-1 bg-yellow-500 text-white rounded" onClick={insertLink}>Link</button>
        <button className="px-2 py-1 bg-pink-500 text-white rounded" onClick={insertUl}>UL</button>
        <button className="px-2 py-1 bg-pink-500 text-white rounded" onClick={insertOl}>OL</button>
        <label className="cursor-pointer px-2 py-1 bg-gray-700 text-white rounded">
          Image
          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0])} />
        </label>
        <button className="px-2 py-1 bg-gray-800 text-white rounded" onClick={() => onSave?.({ autosave: false, skipUploads: true, content })}>Save</button>
        <button className="px-2 py-1 bg-indigo-600 text-white rounded lg:hidden" onClick={() => setShowToc(!showToc)}>TOC</button>
      </div>

      {/* Editor + Preview + TOC */}
      <div className="flex flex-col lg:flex-row w-full gap-2 h-[70vh] lg:h-[80vh]">
        {/* Editor */}
        <textarea
          ref={taRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={onPaste}
          className="w-full lg:w-1/2 h-64 lg:h-full border p-2 font-mono resize-none rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Write your Markdown here..."
        />

        {/* Preview */}
        <div
          ref={previewRef}
          className="w-full lg:w-1/2 h-64 lg:h-full border p-2 overflow-auto bg-gray-50 rounded shadow-sm"
        >
          <MDXPreview value={content} />
        </div>

        {/* Table of Contents (TOC) */}
        {showToc && toc.length > 0 && (
          <div className="w-full lg:w-1/4 border p-2 overflow-auto bg-white rounded shadow-md">
            <h3 className="font-bold mb-2">Table of Contents</h3>
            <ul className="space-y-1">
              {toc.map((item) => (
                <li key={item.id}>
                  <button
                    className="text-blue-600 hover:underline text-left w-full"
                    onClick={() => scrollToId(item.id)}
                  >
                    {item.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
