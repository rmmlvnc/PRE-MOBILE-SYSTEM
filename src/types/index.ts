export type Barangay = {
  id: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
  puroks: { id: number; name: string }[];
};

export type Resident = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  contact_number: string;
  address: string;
  role: "RESIDENT";
  account_status: string;
  barangay: { id: number; name: string } | null;
};

export type Hotspot = {
  id: number;
  barangay_id: number | null;
  barangay: string;
  forecast_period?: string;
  case_data_period?: string;
  predicted_cases?: number;
  current_cases?: number;
  case_change?: number;
  trend?: string;
  risk_score?: number | null;
  risk_level: string;
  rainfall_mm?: number;
  temperature_c?: number;
  humidity_pct?: number;
  recommendation?: string;
  historical_common_blood_type?: string;
  training_blood_type?: string;
  training_blood_type_share?: number;
  latitude: number | null;
  longitude: number | null;
};

export type DengueAlert = {
  id: number;
  title: string;
  message: string;
  risk_level: string;
  barangay: string;
  created_at: string;
  expires_at: string | null;
};

export type CommunityReport = {
  id: number;
  observation_type: string;
  description: string;
  barangay: string;
  purok: string | null;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  staff_response?: string;
  reviewed_at?: string | null;
  submitted_at: string;
};
