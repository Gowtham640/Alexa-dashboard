import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface BulkUpdateRequest {
  registrationNumbers: string[];
  round: number;
}

export async function POST(req: NextRequest) {
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

    const currentTime = new Date().toISOString();
    const modifierEmail = user.email || '';

    const body: BulkUpdateRequest = await req.json();
    const { registrationNumbers, round } = body;

    if (!registrationNumbers || !Array.isArray(registrationNumbers) || registrationNumbers.length === 0) {
      return NextResponse.json({ error: 'Registration numbers array is required' }, { status: 400 });
    }

    if (!round || round < 1 || round > 3) {
      return NextResponse.json({ error: 'Valid round number (1-3) is required' }, { status: 400 });
    }

    // First, get the current records to determine which domain round to update
    const { data: currentRecords, error: fetchCurrentError } = await userSupabase
      .from('recruitment_25')
      .select('*')
      .in('registration_number', registrationNumbers);

    if (fetchCurrentError) {
      return NextResponse.json({ error: fetchCurrentError.message }, { status: 500 });
    }

    // Update domain1_round for records where domain1 is business
    const businessDomain1Records = currentRecords?.filter(record => 
      record.domain1.toLowerCase().includes('business')
    ) || [];

    if (businessDomain1Records.length > 0) {
      const { error: domain1Error } = await userSupabase
        .from('recruitment_25')
        .update({ 
          domain1_round: round,
          modified_at: currentTime,
          modified_by1: modifierEmail
        })
        .in('registration_number', businessDomain1Records.map(r => r.registration_number));

      if (domain1Error) {
        return NextResponse.json({ error: domain1Error.message }, { status: 500 });
      }
    }

    // Update domain2_round for records where domain2 is business
    const businessDomain2Records = currentRecords?.filter(record => 
      record.domain2 && record.domain2.toLowerCase().includes('business')
    ) || [];

    if (businessDomain2Records.length > 0) {
      const { error: domain2Error } = await userSupabase
        .from('recruitment_25')
        .update({ 
          domain2_round: round,
          modified_at: currentTime,
          modified_by2: modifierEmail
        })
        .in('registration_number', businessDomain2Records.map(r => r.registration_number));

      if (domain2Error) {
        return NextResponse.json({ error: domain2Error.message }, { status: 500 });
      }
    }

    // Get the updated records to return
    const { data: updatedData, error: fetchError } = await userSupabase
      .from('recruitment_25')
      .select('*')
      .in('registration_number', registrationNumbers);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json(updatedData || []);
    
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}