import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String },
    description: { type: String },
    content: { type: String }, // store MDX or HTML
    image: { type: String },
    featuredImage: { type: String },
    images: [
      {
        url: { type: String },
        alt: { type: String },
        public_id: { type: String },
      },
    ],
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
export default Post;
