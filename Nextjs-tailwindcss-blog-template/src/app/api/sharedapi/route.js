import { NextResponse } from 'next/server';
import ConnectDb from '@/src/lib/mongoose';
import Post from '@/src/models/Post';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

///create  a shared api for sharing my posts with cecking blog_user_secret_key match my secret key//
export async function POST(req) {
    try{
        const body = await req.json();
        const { blog_user_secret_key } = body;
        if (!blog_user_secret_key) return NextResponse.json({ error: 'Missing secret key' }, { status: 400 });
        const secretKey = process.env.BLOG_USER_SECRET_KEY
        //compare the secret key with env secret key//
        if(blog_user_secret_key !== secretKey){
            return NextResponse.json({ error: 'Invalid secret key' }, { status: 401 });
        }
        //find the letest blog post //
        await ConnectDb();
        const post = await Post.findOne().sort({ createdAt: -1 }).select('-password');
        if(!post){
            return NextResponse.json({ error: 'No post found' }, { status: 404 });
        }
        return NextResponse.json({ post }, { status: 200 });
    }catch(err){
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}