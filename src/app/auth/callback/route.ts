import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(new URL('/login?error=auth_callback_error', 'https://alexa-dashboard1.vercel.app'));
      }

      if (data.user) {
        // Check if user exists in users table, if not create them
        const { data: existingUser, error: existingError } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (existingError && existingError.code !== "PGRST116") {
          console.error('Error checking existing user:', existingError);
        }

        if (!existingUser) {
          const { error: insertError } = await supabase.from("users").insert({
            id: data.user.id,
            email: data.user.email,
            role: "public"
          });
          if (insertError) {
            console.error('Error creating user:', insertError);
          }
        }
      }

      // Always redirect to production login page after successful confirmation
      return NextResponse.redirect(new URL('/login?confirmed=true', 'https://alexa-dashboard1.vercel.app'));
      
    } catch (error) {
      console.error('Unexpected error in auth callback:', error);
      return NextResponse.redirect(new URL('/login?error=unexpected_error', 'https://alexa-dashboard1.vercel.app'));
    }
  }

  // If no code, redirect to production login
  return NextResponse.redirect(new URL('/login', 'https://alexa-dashboard1.vercel.app'));
}
