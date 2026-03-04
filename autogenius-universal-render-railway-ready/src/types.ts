export interface Agent {
  id: number;
  name: string;
  email: string;
  status: string;
  leadCount?: number;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  interest: string;
  status: string;
  agent_id: number | null;
  agent_name?: string;
  history?: string;
  notes?: string;
  leadSource?: string;
  created_at: string;
}

export interface Appointment {
  id: number;
  lead_id: number;
  lead_name?: string;
  interest?: string;
  date: string;
  time: string;
  notes: string;
  status: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}
