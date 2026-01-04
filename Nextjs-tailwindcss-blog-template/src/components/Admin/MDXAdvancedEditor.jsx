"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import MDXPreview from "./MDXPreview";
import { generateTOC } from "@/src/utils/markdown";
import slugify from "slugify";

// Simple helper to debounce
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
  const [active, setActive] = useState(null);
  const [showToc, setShowToc] = useState(false);
  const [isFull, setIsFull] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [split, setSplit] = useState(50); // percentage for editor area
  const [theme, setTheme] = useState("light");
  const taRef = useRef(null);
  const previewRef = useRef(null);
  const autosaveTimerRef = useRef(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    // load autosaved content if present and current value empty
    try {
      const saved = localStorage.getItem(autosaveKey);
      if ((!value || value === "") && saved) setContent(saved);
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => setContent(value || ""), [value]);

  useEffect(() => {
    const { toc: t, counts: c } = generateTOC(content || "");
    setToc(t);
    setCounts(c);
    debouncedLocalSave(content);
  }, [content]);

  const debouncedLocalSave = useCallback(
    debounce((val) => {
      try {
        localStorage.setItem(autosaveKey, val);
      } catch (e) {}
    }, 1000),
    [autosaveKey]
  );

  // periodic server autosave (if onSave provided). run every autosaveInterval while editing
  useEffect(() => {
    if (!onSave) return;
    if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current);
    autosaveTimerRef.current = setInterval(() => {
      onSave({ autosave: true, skipUploads: true });
    }, autosaveInterval);
    return () => clearInterval(autosaveTimerRef.current);
  }, [onSave, autosaveInterval]);

  // handle dragging for split
  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const rect = e.target?.closest(".editor-split")?.getBoundingClientRect();
      if (!rect) return;
      const percent = ((clientX - rect.left) / rect.width) * 100;
      if (percent < 20) setSplit(20);
      else if (percent > 80) setSplit(80);
      else setSplit(Math.round(percent));
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  // keyboard shortcuts (additional)
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        wrapSelection("**");
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        wrapSelection("*");
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave && onSave({ autosave: false, skipUploads: true });
      }
      if (e.key === "F11") {
        e.preventDefault();
        setIsFull((s) => !s);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setShowPreview((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSave]);

  // apply formatting helpers
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

  const insertHeading = (level) =>
    insertAtCursor(`\n${"#".repeat(level)} New heading\n\n`);
  const insertCodeBlock = () => insertAtCursor("\n```\ncode\n```\n\n");
  const insertLink = () => insertAtCursor("[link text](https://example.com)");
  const insertUl = () => insertAtCursor("\n- item\n- item\n\n");
  const insertOl = () => insertAtCursor("\n1. item\n2. item\n\n");

  // image upload
  const handleImageUpload = async (file) => {
    if (!file) return;
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      insertAtCursor(`![alt text](${json.url})`); // insert markdown image
    } catch (e) {
      console.error("Upload failed", e);
    }
  };

  const onPaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const fileItem = items.find(
      (it) => it.type && it.type.startsWith("image/")
    );
    if (fileItem) {
      const file = fileItem.getAsFile();
      handleImageUpload(file);
      e.preventDefault();
    }
  };

  // keyboard shortcuts
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
      onSave && onSave({ autosave: false, skipUploads: true });
    }
  };

  // TOC active heading via IntersectionObserver on preview area
  useEffect(() => {
    const root = previewRef.current;
    if (!root) return;
    const headings = Array.from(
      root.querySelectorAll("h1[id],h2[id],h3[id],h4[id]")
    );
    if (headings.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      {
        root: null,
        rootMargin: "-40% 0px -40% 0px",
        threshold: [0, 0.25, 0.5, 1],
      }
    );
    headings.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, [content]);

  const scrollToId = (id) => {
    const root = previewRef.current;
    if (!root) return;
    const el = root.querySelector(`#${CSS.escape(id)}`);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const offset = 80; // header offset
    window.scrollTo({ top: top - offset, behavior: "smooth" });
  };

  const clearAutosave = () => {
    try {
      localStorage.removeItem(autosaveKey);
    } catch (e) {}
  };

  return (
    <div
      className={`w-full min-h-screen flex flex-col lg:flex-row gap-4 ${
        isFull ? "fixed inset-0 z-[999] bg-white" : ""
      }`}
    >
      {/* ===================== */}
      {/* MAIN EDITOR SECTION */}
      {/* ===================== */}
      <main className="flex-1 flex flex-col gap-4">
        {/* Toolbar */}
        <div className="sticky top-0 z-20 bg-white border rounded-lg p-2 flex items-center gap-2">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => wrapSelection("**")} className="editor-btn">
              Bold
            </button>
            <button onClick={() => wrapSelection("*")} className="editor-btn">
              Italic
            </button>
            <button onClick={insertLink} className="editor-btn">
              Link
            </button>
            <button onClick={() => insertHeading(2)} className="editor-btn">
              H2
            </button>
            <button onClick={() => insertHeading(3)} className="editor-btn">
              H3
            </button>
            <button onClick={insertCodeBlock} className="editor-btn">
              Code
            </button>
            <button onClick={insertUl} className="editor-btn">
              UL
            </button>
            <button onClick={insertOl} className="editor-btn">
              OL
            </button>
            <button
              onClick={() => setShowToc((s) => !s)}
              className="editor-btn lg:hidden"
            >
              TOC
            </button>
            <label className="editor-btn cursor-pointer">
              Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files?.[0])}
              />
            </label>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              className="editor-btn"
              onClick={() => setShowPreview((s) => !s)}
            >
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
            <button className="editor-btn" onClick={() => setIsFull((s) => !s)}>
              {isFull ? "Exit Full" : "Full"}
            </button>
            <button
              className="editor-btn"
              onClick={() =>
                setTheme((t) => (t === "light" ? "dark" : "light"))
              }
            >
              {theme === "light" ? "Dark" : "Light"}
            </button>
            <button
              onClick={() => onSave?.({ autosave: false, skipUploads: true })}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              Save
            </button>
            <button
              onClick={() => onSave?.({ autosave: false, skipUploads: false })}
              className="px-3 py-1 bg-green-600 text-white rounded"
            >
              Publish
            </button>
          </div>
        </div>

        {/* Split editor/preview */}
        <div
          className="editor-split w-full flex flex-col lg:flex-row bg-transparent rounded-lg overflow-hidden border"
          style={{ minHeight: 300 }}
        >
          <div
            className="editor-panel flex-1"
            style={{ flexBasis: `${split}%`, minWidth: 0 }}
          >
            <textarea
              ref={taRef}
              rows={18}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={onPaste}
              className={`w-full h-full min-h-[300px] border-0 p-4 font-mono text-sm resize-none focus:outline-none ${
                theme === "dark"
                  ? "bg-gray-900 text-gray-100"
                  : "bg-white text-gray-900"
              }`}
            />
          </div>

          {/* resizer */}
          <div
            role="separator"
            aria-orientation="vertical"
            onMouseDown={() => (draggingRef.current = true)}
            onTouchStart={() => (draggingRef.current = true)}
            className="w-2 cursor-col-resize bg-gray-100 hover:bg-gray-200 hidden lg:block"
          />

          {showPreview && (
            <div
              className="preview-panel p-0 flex-1"
              style={{ flexBasis: `${100 - split}%`, minWidth: 0 }}
            >
              <div
                ref={previewRef}
                className={`h-full w-full ${
                  theme === "dark" ? "bg-gray-800" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <div className="text-sm font-medium">Preview</div>
                  <div className="text-xs text-gray-500">
                    Words:{" "}
                    {content
                      ? content.trim().split(/\s+/).filter(Boolean).length
                      : 0}
                  </div>
                </div>
                <div className="p-4 overflow-auto h-[40vh] lg:h-[60vh]">
                  <MDXPreview value={content} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile TOC */}
        {showToc && (
          <section className="lg:hidden border rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-semibold mb-2">Table of Contents</h3>
            <ul className="space-y-1 text-sm">
              {toc.length === 0 && (
                <li className="text-gray-500">No headings</li>
              )}
              {toc.map((it) => (
                <li key={it.url}>
                  <button
                    className={`w-full text-left ${
                      active === it.url.slice(1) ? "text-blue-600" : ""
                    }`}
                    onClick={() => {
                      scrollToId(it.url.slice(1));
                      setShowToc(false);
                    }}
                  >
                    {it.title}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* ===================== */}
      {/* DESKTOP TOC SIDEBAR */}
      {/* ===================== */}
      <aside className="hidden lg:block w-72 sticky top-6 h-fit border rounded-lg bg-gray-50 p-4 overflow-y-auto max-h-[80vh]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Content Summary</h3>
          <div className="flex items-center gap-2">
            <button
              className="text-xs px-2 py-0.5 bg-gray-100 rounded"
              onClick={() =>
                setTheme((t) => (t === "light" ? "dark" : "light"))
              }
            >
              {theme === "light" ? "Dark" : "Light"}
            </button>
            <button
              className="text-xs px-2 py-0.5 bg-gray-100 rounded"
              onClick={() => setIsFull((s) => !s)}
            >
              {isFull ? "Exit" : "Full"}
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-600 mb-4">
          Headings: <strong>{counts.total}</strong>
          <br />
          H2: {counts.h2 || 0} · H3: {counts.h3 || 0}
        </div>

        <h4 className="text-sm font-medium mb-2">Table of Contents</h4>
        <ul className="space-y-1 text-sm">
          {toc.length === 0 && <li className="text-gray-500">No headings</li>}
          {toc.map((it) => (
            <li key={it.url}>
              <button
                className={`w-full text-left p-1 rounded ${
                  active === it.url.slice(1) ? "bg-blue-100 text-blue-600" : ""
                }`}
                onClick={() => scrollToId(it.url.slice(1))}
              >
                {it.title}
              </button>
            </li>
          ))}
        </ul>

        {/* Status bar */}
        <div className="mt-4 text-xs text-gray-500 border-t pt-3">
          <div>
            Words:{" "}
            {content ? content.trim().split(/\s+/).filter(Boolean).length : 0}
          </div>
          <div>Chars: {content ? content.length : 0}</div>
        </div>
      </aside>
    </div>
  );
}
