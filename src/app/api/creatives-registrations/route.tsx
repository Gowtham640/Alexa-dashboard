import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase-client';

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
    
    const { data, error } = await supabase
      .from('recruitment_25')
      .select('*')
      .or('domain1.ilike.%creatives%,domain2.ilike.%creatives%');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`Found ${data?.length || 0} technical registrations`);

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
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}