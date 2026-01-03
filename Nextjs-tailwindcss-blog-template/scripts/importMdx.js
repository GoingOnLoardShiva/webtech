/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import slugify from 'slugify';
import dbConnect from '@/src/lib/mongoose.js';
import Post from '@/src/models/Post.js';

async function readBlogsDir() {
  const blogsDir = path.join(process.cwd(), 'content', 'blogs');
  const items = await fs.promises.readdir(blogsDir, { withFileTypes: true });
  const folders = items.filter((i) => i.isDirectory()).map((d) => d.name);
  return folders.map((f) => path.join(blogsDir, f));
}

async function importOne(folder) {
  const indexFile = path.join(folder, 'index.mdx');
  if (!fs.existsSync(indexFile)) {
    console.log('Skipping (no index.mdx):', folder);
    return null;
  }

  const raw = await fs.promises.readFile(indexFile, 'utf-8');
  const parsed = matter(raw);
  const front = parsed.data || {};
  const content = parsed.content || '';

  const title = front.title || front.slug || path.basename(folder);
  const slug = front.slug || slugify(title, { lower: true, strict: true });
  const excerpt = front.description || front.excerpt || '';
  const image = front.image || front.cover || '';
  const tags = Array.isArray(front.tags) ? front.tags : (front.tags ? String(front.tags).split(',').map((t) => t.trim()) : []);
  const isPublished = front.isPublished === true || front.isPublished === 'true';
  const publishedAt = front.publishedAt ? new Date(front.publishedAt) : (isPublished ? new Date() : null);

  const doc = {
    title,
    slug,
    excerpt,
    description: front.description || '',
    content,
    image,
    tags,
    isPublished,
    publishedAt,
  };

  // upsert by slug
  const existing = await Post.findOne({ slug });
  if (existing) {
    existing.set(doc);
    await existing.save();
    return { action: 'updated', slug };
  }

  const created = new Post(doc);
  await created.save();
  return { action: 'created', slug };
}

async function run() {
  await dbConnect();
  const folders = await readBlogsDir();
  console.log(`Found ${folders.length} blog folders`);

  const results = [];
  for (const folder of folders) {
    try {
      const r = await importOne(folder);
      if (r) results.push(r);
    } catch (err) {
      console.error('Error importing', folder, err);
    }
  }

  console.log('Import results:', results);
  console.log('Done');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});