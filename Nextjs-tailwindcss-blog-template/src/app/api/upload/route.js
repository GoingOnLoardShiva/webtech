import cloudinary from '@/src/lib/cloudinary';

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!file) return new Response('File is required', { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'blog_images',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });

    return new Response(JSON.stringify({ url: result.secure_url, public_id: result.public_id }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response('Upload failed', { status: 500 });
  }
}
