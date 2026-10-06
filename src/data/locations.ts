import { Barangay } from "../types";

// Fallback for Expo Go when a phone cannot reach the local Django server.
// Purok remains optional; Django resolves this official barangay name during
// registration, so database-specific IDs are not required.
const names = [
  "Abuno", "Acmac-Mariano Badelles Sr.", "Bagong Silang", "Bonbonon", "Bunawan", "Buru-un", "Dalipuga", "Del Carmen", "Digkilaan", "Ditucalan", "Dulag", "Hinaplanon", "Hindang", "Kabacsanan", "Kalilangan", "Kiwalan", "Lanipao", "Luinab", "Mahayahay", "Mainit", "Mandulog", "Maria Cristina", "Palao", "Panoroganan", "Poblacion", "Puga-an", "Rogongon", "San Miguel", "San Roque", "Santa Elena", "Santa Filomena", "Santiago", "Santo Rosario", "Saray", "Suarez", "Tambacan", "Tibanga", "Tipanoy", "Tomas L. Cabili", "Tubod", "Ubaldo Laya", "Upper Hinaplanon", "Upper Tominobo", "Villa Verde",
];

export const offlineBarangays: Barangay[] = names.map((name, index) => ({
  id: -(index + 1), name, latitude: null, longitude: null, puroks: [],
}));
