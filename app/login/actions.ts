'use server';

import { getSupabaseServer } from '@/lib/db/supabase-server';

// Use untyped redirect to support dynamic return paths
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { redirect } = require('next/navigation') as {
  redirect: (url: string) => never;
};

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const next = (formData.get('next') as string) || '/';

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await getSupabaseServer();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Invalid email or password.' };
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();
  redirect('/login');
}
