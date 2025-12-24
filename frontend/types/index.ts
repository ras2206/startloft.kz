export interface Tournament {
  _id: string;
  slug: string;
  title: string;
  subtitle?: string;
  status: 'draft' | 'published' | 'finished';
  registration_open: boolean;
  dates: {
    start: string;
    end: string;
    start_time?: string;
  };
  location: {
    city: string;
    country: string;
    venue_name: string;
    address: string;
  };
  fees: {
    entry_fee: number;
    currency: string;
  };
  prize: {
    fund: number;
    prizes_text: string;
    items?: {
      label?: string;
      amount?: number;
      from?: number;
      to?: number;
    }[];
  };
  brackets?: {
    label?: string;
    size?: number;
  }[];
  poster_image_url?: string;
  description: string;
  format_text: string;
  required_fields: string[];
  max_participants: number;
  contact: {
    phone: string;
    whatsapp_phone: string;
  };
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegistrationForm {
  tournament_id: string;
  fio: string;
  birthDate: string;  // YYYY-MM-DD format
  phone: string;
  category: 'Профессионал' | 'Любитель';
  rank: 'Не выбрано' | 'КМС' | 'МС' | 'МСМК' | 'ЗМС';
  city_country: string;
  comment?: string;
  consent: boolean;
  honeypot?: string;
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  whatsapp_link: string;
  registration_id?: string;
}

export interface ClubSettings {
  club_name: string;
  city: string;
  address: string;
  work_hours: string;
  phones: string[];
  whatsapp_phone: string;
  instagram_url: string;
  two_gis_url: string;
  hero_title: string;
  hero_subtitle: string;
  about_text: string;
  advantages: string[];
}

export interface Participant {
  fio: string;
  rank: string;
  category: string;
  city_country: string;
}
