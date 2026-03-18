import { getSupabaseServer } from '@/lib/db/supabase-server';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/';

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const supabase = await getSupabaseServer();

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as 'email' | 'signup',
  });

  if (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
