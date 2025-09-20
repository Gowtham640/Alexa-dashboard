import { useState, useEffect } from 'react';
import { supabase } from './supabase-client';

export function useUserRole() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.log("🔐 useUserRole: No session found");
          setUserRole(null);
          setLoading(false);
          return;
        }

        console.log("🔐 useUserRole: Getting user role for:", session.user.email);
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (userError) {
          console.error("🔐 useUserRole: Error fetching user role:", userError);
          setUserRole(null);
        } else {
          console.log("🔐 useUserRole: User role:", userData?.role);
          setUserRole(userData?.role || null);
        }
      } catch (err) {
        console.error("🔐 useUserRole: Error:", err);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    getUserRole();
  }, []);

  return { userRole, loading };
}
