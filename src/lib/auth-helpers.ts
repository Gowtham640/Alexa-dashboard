import { supabase } from './supabase-client';
import { AppRouterInstance } from 'next/dist/shared/lib/router-context.shared-runtime';

export const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No active session');
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  };
};

export const checkAuthAndRedirect = async (router: AppRouterInstance) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    router.push("/login");
    return false;
  }
  
  return true;
};