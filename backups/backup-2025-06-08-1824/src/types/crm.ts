export interface Client {
  id: string;
  name: string;
}

export interface Deal {
  id: string;
  name: string;
}

export interface User {
  id: string;
  full_name: string;
}

export interface CommunicationItem {
  id: string;
  type: string;
  subject: string;
  content: string;
  created_at: string;
  related_client: Client[];
  related_deal: Deal[];
  user: User[];
}
