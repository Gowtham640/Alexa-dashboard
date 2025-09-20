import { supabase } from './supabase-client';

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

export const checkAuthAndRedirect = async (router: any) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    router.push("/login");
    return false;
  }
  
  return true;
};
