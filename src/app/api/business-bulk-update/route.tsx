import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '../../../lib/supabase-server';

interface BulkUpdateRequest {
  registrationNumbers: string[];
  round: number;
}

export async function POST(req: NextRequest) {
  try {
    // Use server-side Supabase client with service role key
    const supabase = supabaseServer;

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

    const body: BulkUpdateRequest = await req.json();
    const { registrationNumbers, round } = body;

    if (!registrationNumbers || !Array.isArray(registrationNumbers) || registrationNumbers.length === 0) {
      return NextResponse.json({ error: 'Registration numbers array is required' }, { status: 400 });
    }

    if (!round || round < 1 || round > 3) {
      return NextResponse.json({ error: 'Valid round number (1-3) is required' }, { status: 400 });
    }

    // Update the database for business domain participants
    const { data, error } = await userSupabase
      .from('recruitment_25')
      .update({ round: round })
      .in('registration_number', registrationNumbers)
      .or('domain1.ilike.%business%,domain2.ilike.%business%');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get the updated records to return
    const { data: updatedData, error: fetchError } = await userSupabase
      .from('recruitment_25')
      .select('*')
      .in('registration_number', registrationNumbers)
      .or('domain1.ilike.%business%,domain2.ilike.%business%');

    if (fetchError) {
      console.error('Error fetching updated data:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Find which registration numbers were not found in the database
    const foundRegNumbers = updatedData?.map(item => item.registration_number) || [];
    const notFound = registrationNumbers.filter(regNum => !foundRegNumbers.includes(regNum));

    return NextResponse.json({
      success: true,
      updatedCount: foundRegNumbers.length,
      notFound: notFound,
      message: `${foundRegNumbers.length} participants moved to Round ${round}` + 
               (notFound.length ? `. Not found: ${notFound.join(", ")}` : "")
    });

  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}