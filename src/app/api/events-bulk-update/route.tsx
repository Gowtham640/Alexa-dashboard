import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase-client';

interface BulkUpdateRequest {
  registrationNumbers: string[];
  round: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: BulkUpdateRequest = await req.json();
    const { registrationNumbers, round } = body;

    if (!registrationNumbers || !Array.isArray(registrationNumbers) || registrationNumbers.length === 0) {
      return NextResponse.json({ error: 'Registration numbers array is required' }, { status: 400 });
    }

    if (!round || round < 1 || round > 3) {
      return NextResponse.json({ error: 'Valid round number (1-3) is required' }, { status: 400 });
    }

    // Update the database for events domain participants
    const { data, error } = await supabase
      .from('recruitment_25')
      .update({ round: round })
      .in('registration_number', registrationNumbers)
      .or('domain1.ilike.%events%,domain2.ilike.%events%');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get the updated records to return
    const { data: updatedData, error: fetchError } = await supabase
      .from('recruitment_25')
      .select('*')
      .in('registration_number', registrationNumbers)
      .or('domain1.ilike.%events%,domain2.ilike.%events%');

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
