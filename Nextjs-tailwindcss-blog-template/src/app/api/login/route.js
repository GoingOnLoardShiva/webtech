import { NextResponse } from 'next/server';
import ConnectDb from '@/src/lib/mongoose';
import User from '@/src/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;
    if (!email || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });

    await ConnectDb();
    const user = await User.findOne({ email }).lean();
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const payload = { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'change_this_secret';
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });

    const res = NextResponse.json({ ok: true, user: { email: user.email, name: user.name, role: user.role }, token });

    // Do NOT set cookies ourselves - use NextAuth signIn instead to avoid incompatible JWE formats
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
