import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function getSessionFromReq(req, res) {
  return await getServerSession(req, res, authOptions);
}

export async function getSessionServerSide(ctx) {
  // for compatibility; ctx can be { req, res }
  return await getServerSession(ctx?.req, ctx?.res, authOptions);
}