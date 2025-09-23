import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const userSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const domains = ['technical', 'creatives', 'business', 'events'];
    const domainCounts: { [key: string]: number } = {};

    for (const domain of domains) {
      // Count registrations where domain1 OR domain2 matches the current domain
      const { count, error: countError } = await userSupabase
        .from('recruitment_25')
        .select('*', { count: 'exact' })
        .or(`domain1.ilike.%${domain}%,domain2.ilike.%${domain}%`);

      if (countError) {
        console.error(`Error counting ${domain} registrations:`, countError);
        domainCounts[domain] = 0;
      } else {
        domainCounts[domain] = count || 0;
      }
    }

    return NextResponse.json({ domainCounts });
    
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
