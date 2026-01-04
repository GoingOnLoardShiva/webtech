"use client";
import React, { useEffect, useState, useRef } from "react";
import slugify from "slugify";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import MDXAdvancedEditor from "./MDXAdvancedEditor";

export default function PostForm({ initial = {}, isEdit = false }) {
  const router = useRouter();

  // --- State ---
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);
  const postSlugRef = useRef(null);

  // --- Sync initial prop ---
  useEffect(() => {
    if (!initial) return;
    setTitle(initial.title || "");
    setSlug(initial.slug || "");
    setExcerpt(initial.excerpt || "");
    setContent(initial.content || "");
    setTags((initial.tags || []).join(", "));
    setIsPublished(initial.isPublished || false);
    setImage(initial.image || "");
    postSlugRef.current = initial.slug || null;
  }, [initial]);

  // --- Auto-generate slug for new posts ---
  useEffect(() => {
    if (!isEdit && title) setSlug(slugify(title).toLowerCase());
  }, [title, isEdit]);

  // --- File upload ---
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Compress image
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      const form = new FormData();
      form.append("file", compressed);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setImage(json.url);
    } catch (err) {
      console.error(err);
      setError("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  // --- Submit (Create / Update) ---
  const submit = async (e) => {
    e?.preventDefault();
    setError("");
    setIsSaving(true);

    const payload = {
      title,
      slug,
      excerpt,
      content,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      isPublished,
      image,
    };

    try {
      const res = await fetch(isEdit ? `/api/posts/${initial.slug}` : "/api/posts", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      const post = await res.json();
      postSlugRef.current = post.slug;
      setMessage(isEdit ? "Post updated successfully" : "Post created successfully");

      if (!isEdit) router.push("/admin"); // redirect after create
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Delete ---
  const remove = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch(`/api/posts/${initial.slug}`, { method: "DELETE" });
      if (res.status === 204) router.push("/admin");
      else setError("Delete failed");
    } catch (err) {
      setError("Delete failed");
    }
  };

  return (
    <div className="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Form + Editor */}
        <div className="lg:col-span-8 space-y-6">
          {/* Post Meta */}
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
                disabled={isSaving || uploading}
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
            <MDXAdvancedEditor value={content} onChange={setContent} />
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
        </aside>
      </div>
    </div>
  );
}
