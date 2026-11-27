// apps/admin/app/auth/signout/route.ts
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  // Check if a user's logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.signOut();
  }

  revalidatePath('/', 'layout');
  // Redirect to login page after signing out
  return NextResponse.redirect(new URL('/login', request.url), {
    status: 302,
  });
}
