import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '../../../lib/supabase-server';

interface Recruitment25Data {
  id: number;
  name: string;
  registration_number: string;
  srm_mail: string;
  phone_number: string;
  created_at: string;
  round: number;
  domain1?: string;
  domain2?: string;
}

interface IndividualRegistrationWithRound {
  id: string;
  name: string;
  registerNumber: string;
  email: string;
  phone: string;
  registeredAt: string;
  round: number;
}

export async function GET(req: NextRequest) {
  try {
    console.log("🔧 API: Technical registrations endpoint called");
    
    // Use server-side Supabase client with service role key
    const supabase = supabaseServer;

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    console.log("🔧 API: Authorization header present:", !!authHeader);
    
    if (!authHeader) {
      console.log("🔧 API: No authorization header, returning 401");
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Set the session for the request
    const token = authHeader.replace('Bearer ', '');
    console.log("🔧 API: Token extracted, length:", token.length);
    
    // Create a client with the user's token for RLS context
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
    
    console.log("🔧 API: User authentication result:", {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message
    });
    
    if (authError || !user) {
      console.log("🔧 API: Authentication failed, returning 401");
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    console.log("🔧 API: Querying recruitment_25 table for technical domain");
    const { data, error } = await userSupabase
      .from('recruitment_25')
      .select('*')
      .or('domain1.ilike.%technical%,domain2.ilike.%technical%');

    console.log("🔧 API: Supabase query result:", {
      hasData: !!data,
      dataLength: data?.length || 0,
      error: error?.message
    });

    if (error) {
      console.error('🔧 API: Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`🔧 API: Found ${data?.length || 0} technical registrations`);

    if (!data || data.length === 0) {
      console.log("🔧 API: No data found, returning empty array");
      return NextResponse.json([]);
    }

    console.log("🔧 API: Transforming data...");
    const transformedData: IndividualRegistrationWithRound[] = (data as Recruitment25Data[]).map(item => ({
      id: item.id.toString(),
      name: item.name,
      registerNumber: item.registration_number,
      email: item.srm_mail,
      phone: item.phone_number,
      registeredAt: new Date(item.created_at).toLocaleDateString(),
      round: item.round
    }));

    console.log("🔧 API: Returning transformed data:", transformedData.length, "records");
    return NextResponse.json(transformedData);
    
  } catch (err) {
    console.error('🔧 API: Server error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}