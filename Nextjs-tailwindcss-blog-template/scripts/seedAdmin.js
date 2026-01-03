/* eslint-disable no-console */
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import dbConnect from '@/src/lib/mongoose.js';
import User from '@/src/models/User.js';

dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.INITIAL_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.INITIAL_ADMIN_PASSWORD || 'password123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

async function seed() {
  await dbConnect();

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log('Admin user already exists:', ADMIN_EMAIL);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const user = new User({ name: ADMIN_NAME, email: ADMIN_EMAIL, passwordHash, role: 'admin' });
  await user.save();

  console.log('Seeded admin user:', ADMIN_EMAIL);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
