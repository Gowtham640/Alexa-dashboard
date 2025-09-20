export type TeamMember = {
  id: string;
  name: string;
  registerNumber: string;
  email: string;
  phone: string;
};

export type TeamRegistration = {
  teamId: string;
  teamName: string;
  members: TeamMember[];
  registeredAt: string;
};

export type IndividualRegistration = {
  id: string;
  name: string;
  registerNumber: string;
  email: string;
  phone: string;
  registeredAt: string;
};

export type IndividualRegistrationWithRound = IndividualRegistration & {
  round: number;
  domain1: string;
  domain2: string | null;
  domain1_round: number;
  domain2_round: number | null;
};

export type Recruitment25Data = {
  id: number;
  created_at: string;
  name: string;
  registration_number: string;
  phone_number: string;
  srm_mail: string;
  github_link: string;
  linkedin_link: string;
  domain1: string;
  domain2: string | null;
  domain1_round: number;
  domain2_round: number | null;
};


export type Event = {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  isTeamEvent: boolean;
};