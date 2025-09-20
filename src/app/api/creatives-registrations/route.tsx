import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Set the session for the request
    const token = authHeader.replace('Bearer ', '');
    
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
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { data, error } = await userSupabase
      .from('recruitment_25')
      .select('*')
      .or('domain1.ilike.%creatives%,domain2.ilike.%creatives%');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json([]);
    }

    const transformedData: IndividualRegistrationWithRound[] = (data as Recruitment25Data[]).map(item => ({
      id: item.id.toString(),
      name: item.name,
      registerNumber: item.registration_number,
      email: item.srm_mail,
      phone: item.phone_number,
      registeredAt: new Date(item.created_at).toLocaleDateString(),
      round: item.round
    }));

    return NextResponse.json(transformedData);
    
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}