"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase-client";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === "/login") {
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      console.log("🔐 AuthWrapper: Checking authentication...");
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log("🔐 AuthWrapper: Session data:", {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        accessToken: session?.access_token ? "Present" : "Missing",
        expiresAt: session?.expires_at,
        error: error?.message
      });
      
      if (error) {
        console.error("🔐 AuthWrapper: Session error:", error);
        router.push("/login");
        return;
      }
      
      if (!session) {
        console.log("🔐 AuthWrapper: No session found, redirecting to login");
        router.push("/login");
        return;
      }

      console.log("🔐 AuthWrapper: Authentication successful, user:", session.user.email);
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔐 AuthWrapper: Auth state change:", { event, hasSession: !!session });
        if (event === 'SIGNED_OUT' || !session) {
          console.log("🔐 AuthWrapper: User signed out, redirecting to login");
          router.push("/login");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}