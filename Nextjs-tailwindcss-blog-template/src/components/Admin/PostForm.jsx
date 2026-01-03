"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import slugify from "slugify";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import MDXPreview from "./MDXPreview";
import MDXAdvancedEditor from "./MDXAdvancedEditor";
import MDXEditor from "./MDXEditor";
import Toaster from "../UI/Toaster";

export default function PostForm({ initial = {}, isEdit = false }) {
  const [title, setTitle] = useState(initial.title || "");
  const [slug, setSlug] = useState(initial.slug || "");
  const [excerpt, setExcerpt] = useState(initial.excerpt || "");
  const [content, setContent] = useState(initial.content || "");
  const [tags, setTags] = useState((initial.tags || []).join(", "));
  const [isPublished, setIsPublished] = useState(initial.isPublished || false);
  const [image, setImage] = useState(initial.image || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setImage(json.url);
    } catch (err) {
      setError("Upload failed");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!isEdit) setSlug(slugify(title || "")?.toLowerCase() || "");
  }, [title]);

  const xhrMapRef = useRef(new Map());
  const retryTimeoutsRef = useRef(new Map());
  const fileInputRef = useRef(null);
  const imageCompressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  // Validation + retry constants
  const MAX_FILE_SIZE_MB = 5; // reject files larger than this
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_RETRIES = 3;
  const BASE_RETRY_MS = 1000;

  const [imageQueue, setImageQueue] = useState([]); // { id, file, preview, status, progress, url, retryCount, alt }
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const uploadInProgress = imageQueue.some((i) =>
    ["compressing", "uploading", "retrying"].includes(i.status)
  );
  const overallProgress = imageQueue.length
    ? Math.round(
        imageQueue.reduce((s, i) => s + (i.progress || 0), 0) /
          imageQueue.length
      )
    : 0;

  const enqueueFiles = async (files) => {
    const raw = Array.from(files);
    const items = raw.map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
      progress: 0,
      url: null,
      retryCount: 0,
    }));
    setImageQueue((s) => [...s, ...items]);

    // Validate then compress each file in background and update status
    for (const item of items) {
      try {
        // Validation
        if (!ALLOWED_TYPES.includes(item.file.type)) {
          updateQueue(item.id, {
            status: "invalid",
            error: "Unsupported file type",
          });
          setError((prev) =>
            prev
              ? prev + "\n" + `${item.file.name}: Unsupported file type`
              : `${item.file.name}: Unsupported file type`
          );
          continue;
        }
        if (item.file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          updateQueue(item.id, {
            status: "invalid",
            error: `File too large (>${MAX_FILE_SIZE_MB}MB)`,
          });
          setError((prev) =>
            prev
              ? prev + "\n" + `${item.file.name}: File too large`
              : `${item.file.name}: File too large`
          );
          continue;
        }

        updateQueue(item.id, { status: "compressing" });
        const compressed = await imageCompression(
          item.file,
          imageCompressionOptions
        );
        const preview = URL.createObjectURL(compressed);
        updateQueue(item.id, { file: compressed, preview, status: "queued" });
      } catch (err) {
        console.error("Compression failed", err);
        updateQueue(item.id, { status: "failed", error: "Compression failed" });
        setError((prev) =>
          prev
            ? prev + "\n" + `Compression failed for ${item.file.name}`
            : `Compression failed for ${item.file.name}`
        );
      }
    }
  };

  const updateQueue = (id, patch) =>
    setImageQueue((s) => s.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const removeFromQueue = (id) =>
    setImageQueue((s) => s.filter((i) => i.id !== id));

  const cancelUpload = (id) => {
    const xhr = xhrMapRef.current.get(id);
    if (xhr) {
      try {
        xhr.abort();
      } catch (e) {
        /* ignore */
      }
      xhrMapRef.current.delete(id);
      updateQueue(id, { status: "cancelled" });
    } else {
      removeFromQueue(id);
    }
  };

  const postSlugRef = useRef(null);

  const startRetryNow = async (item) => {
    if (!postSlugRef.current) {
      setError("Save the post first to attach images");
      return;
    }
    updateQueue(item.id, { status: "queued", progress: 0, retryCount: 0 });
    try {
      // reuse uploadWithRetry by invoking submit-like flow for single item
      await (async function singleUpload() {
        let attempt = 0;
        while (attempt <= MAX_RETRIES) {
          try {
            updateQueue(item.id, { status: "uploading", retryCount: attempt });
            const uploaded = await new Promise((resolve, reject) => {
              const form = new FormData();
              form.append("file", item.file);
              const xhr = new XMLHttpRequest();
              xhr.open("POST", "/api/upload");
              xhrMapRef.current.set(item.id, xhr);

              xhr.onload = () => {
                xhrMapRef.current.delete(item.id);
                if (xhr.status >= 200 && xhr.status < 300)
                  resolve(JSON.parse(xhr.responseText));
                else reject(new Error(xhr.responseText || "Upload failed"));
              };
              xhr.onerror = () => {
                xhrMapRef.current.delete(item.id);
                reject(new Error("Upload failed"));
              };
              xhr.onabort = () => {
                xhrMapRef.current.delete(item.id);
                reject(new Error("Upload aborted"));
              };
              xhr.upload.onprogress = (ev) => {
                if (ev.lengthComputable)
                  updateQueue(item.id, {
                    progress: Math.round((ev.loaded / ev.total) * 100),
                  });
              };
              xhr.send(form);
            });
            updateQueue(item.id, {
              status: "uploaded",
              url: uploaded.url,
              progress: 100,
            });
            await fetch(`/api/posts/${postSlugRef.current}/images`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                images: [
                  {
                    url: uploaded.url,
                    public_id: uploaded.public_id,
                    alt: item.alt || "",
                  },
                ],
              }),
            });
            return;
          } catch (err) {
            attempt += 1;
            updateQueue(item.id, { retryCount: attempt });
            if (attempt > MAX_RETRIES) {
              updateQueue(item.id, { status: "failed" });
              throw err;
            }
            updateQueue(item.id, { status: "retrying" });
            const delay =
              BASE_RETRY_MS * Math.pow(2, attempt - 1) +
              Math.floor(Math.random() * 300);
            await new Promise((res) => {
              const t = setTimeout(res, delay);
              retryTimeoutsRef.current.set(item.id, t);
            });
            retryTimeoutsRef.current.delete(item.id);
          }
        }
      })();
    } catch (err) {
      setError((prev) =>
        prev
          ? prev + "\n" + `Upload failed for ${item.file.name}`
          : `Upload failed for ${item.file.name}`
      );
    }
  };

  const retryAllFailed = () => {
    setImageQueue((s) =>
      s.map((i) =>
        i.status === "failed"
          ? { ...i, status: "queued", progress: 0, retryCount: 0 }
          : i
      )
    );
    // if a post is saved, start immediate retries
    if (postSlugRef.current) {
      imageQueue
        .filter((i) => i.status === "failed")
        .forEach((it) => startRetryNow(it));
    }
  };

  const submit = async (
    e,
    { redirect = true, skipUploads = false, autosave = false } = {}
  ) => {
    e && e.preventDefault();
    setError("");
    setIsSaving(true);

    // 1) Create or update post as draft first
    const payload = {
      title,
      slug,
      excerpt,
      content,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      isPublished: !!isPublished,
      image,
    };

    try {
      let postRes = await fetch(
        isEdit ? `/api/posts/${initial.slug}` : "/api/posts",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!postRes.ok) throw new Error(await postRes.text());
      const post = await postRes.json();
      postSlugRef.current = post.slug;

      // helpers: upload functions are only used if skipUploads is false
      const uploadOnce = (item) => {
        return new Promise((resolve, reject) => {
          const form = new FormData();
          form.append("file", item.file);
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/upload");
          xhrMapRef.current.set(item.id, xhr);

          xhr.onload = () => {
            xhrMapRef.current.delete(item.id);
            if (xhr.status >= 200 && xhr.status < 300)
              resolve(JSON.parse(xhr.responseText));
            else reject(new Error(xhr.responseText || "Upload failed"));
          };
          xhr.onerror = () => {
            xhrMapRef.current.delete(item.id);
            reject(new Error("Upload failed"));
          };
          xhr.onabort = () => {
            xhrMapRef.current.delete(item.id);
            reject(new Error("Upload aborted"));
          };
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              const percent = Math.round((ev.loaded / ev.total) * 100);
              updateQueue(item.id, { progress: percent });
            }
          };
          xhr.send(form);
        });
      };

      const uploadWithRetry = async (item) => {
        let attempt = item.retryCount || 0;
        while (attempt <= MAX_RETRIES) {
          try {
            updateQueue(item.id, { status: "uploading", retryCount: attempt });
            const uploaded = await uploadOnce(item);
            updateQueue(item.id, {
              status: "uploaded",
              url: uploaded.url,
              progress: 100,
              retryCount: attempt,
            });
            // attach to post via API (include alt if user provided it)
            await fetch(`/api/posts/${post.slug}/images`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                images: [
                  {
                    url: uploaded.url,
                    public_id: uploaded.public_id,
                    alt: item.alt || "",
                  },
                ],
              }),
            });
            return uploaded;
          } catch (err) {
            attempt += 1;
            updateQueue(item.id, { retryCount: attempt });
            if (attempt > MAX_RETRIES) {
              updateQueue(item.id, { status: "failed" });
              throw err;
            }
            updateQueue(item.id, { status: "retrying" });
            const delay =
              BASE_RETRY_MS * Math.pow(2, attempt - 1) +
              Math.floor(Math.random() * 300);
            await new Promise((res) => {
              const t = setTimeout(res, delay);
              retryTimeoutsRef.current.set(item.id, t);
            });
            retryTimeoutsRef.current.delete(item.id);
            // continue loop
          }
        }
      };

      // 2) If there are queued images, upload them (with retry) and attach to post
      const toUpload = imageQueue.filter(
        (i) =>
          i.status === "queued" ||
          i.status === "retrying" ||
          i.status === "failed"
      );

      if (!skipUploads && toUpload.length > 0) {
        const uploadPromises = toUpload.map((item) => uploadWithRetry(item));

        const results = await Promise.allSettled(uploadPromises);
        const anyFailed = results.some((r) => r.status === "rejected");
        if (!anyFailed) setMessage("All attachments uploaded successfully");
      } else if (skipUploads) {
        // Don't start uploads during autosave; ensure queued items remain queued
        setImageQueue((s) =>
          s.map((i) =>
            i.status === "uploading" ? { ...i, status: "queued" } : i
          )
        );
      }

      if (redirect) {
        router.push("/admin");
      } else {
        setMessage(autosave ? "Draft autosaved" : "Saved (draft)");
      }
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/posts/${initial.slug}`, { method: "DELETE" });
    if (res.status === 204) router.push("/admin");
    else setError("Delete failed");
  };

  return (
    <div className="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Editor + Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Post Meta Form */}
          <form
            onSubmit={submit}
            className="bg-white rounded-xl border p-4 sm:p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold">Post Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium">Title</label>
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Slug</label>
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Tags</label>
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium">Excerpt</label>
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              Publish now
            </label>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isSaving || uploadInProgress}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg disabled:opacity-50"
              >
                {isSaving ? "Saving…" : isEdit ? "Update Post" : "Create Post"}
              </button>

              {isEdit && (
                <button
                  type="button"
                  onClick={remove}
                  className="bg-red-600 text-white px-5 py-2 rounded-lg"
                >
                  Delete
                </button>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-green-600">{message}</p>}
          </form>

          {/* MDX Editor */}
          <div className="bg-white rounded-xl border p-4 sm:p-6 w-full">
            <h2 className="text-lg font-semibold mb-2">Content (MDX)</h2>
            <MDXAdvancedEditor
              value={content}
              onChange={setContent}
              onSave={(opts) =>
                submit(null, {
                  redirect: false,
                  skipUploads: !!opts?.skipUploads,
                  autosave: !!opts?.autosave,
                })
              }
              autosaveKey={`post-draft:${slug || "new"}`}
            />
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          {/* Featured Image */}
          <div className="bg-white rounded-xl border p-4 sm:p-6">
            <h3 className="font-semibold mb-2">Featured Image</h3>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {uploading && <p className="text-sm mt-2">Uploading…</p>}
            {image && (
              <a
                href={image}
                target="_blank"
                className="block mt-2 text-blue-600 text-sm"
              >
                View image
              </a>
            )}
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-xl border p-4 sm:p-6">
            <h3 className="font-semibold mb-3">Attachments</h3>

            <div
              className="border-2 border-dashed rounded-lg p-4 text-center text-sm text-gray-500 hover:border-gray-400"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                enqueueFiles(e.dataTransfer.files);
              }}
            >
              Drag & drop images or
              <button
                type="button"
                className="text-blue-600 underline ml-1"
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => enqueueFiles(e.target.files)}
              />
            </div>

            <p className="text-xs mt-2 text-gray-500">
              {imageQueue.length} attachment(s)
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
