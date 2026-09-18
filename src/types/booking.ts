import { FirebaseTimestamp } from './common';

/**
 * Status siklus hidup sebuah pemesanan (booking).
 */
export type BookingStatus = 'PENDING' | 'WAITING_VERIFICATION' | 'PAID' | 'CANCELLED';

export type BookingSource = 'APP' | 'AGENT' | 'OFFICE';

/**
 * Informasi detail identitas penumpang yang terdaftar dalam manifest kapal (Standar Syahbandar).
 */
export interface Passenger {
  fullName: string;
  gender: 'M' | 'F' | string;
  age: number;
  passportNumber: string;
  nationality: string;
  passportFileUrl?: string; 
  [key: string]: unknown; // Allow extra fields from checkout (e.g. cabinId, dietaryRequirements)
}

/**
 * Model Pemesanan Utama (Booking) yang menghubungkan pengguna dengan jadwal pelayaran.
 * Menggantikan semua objek 'any' di modul pemesanan Admin.
 */
export interface Booking {
  id: string; // Document ID
  bookingId: string; // Format manusia (e.g. PMM-12345)
  userId: string; // Relasi ke dokumen User
  
  status: BookingStatus;
  
  // Tracking Source
  source?: BookingSource;
  agentName?: string; // Khusus jika source === 'AGENT'
  
  dateOfDeparture: Date | FirebaseTimestamp | string;
  cabinClass: string;
  pickupLocation?: string;
  paxCount: number;
  
  passengersManifest: Passenger[];
  
  contactEmail: string;
  contactPhone: string;
  
  // Financials
  basePrice: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  
  // Verification System
  paymentProofUrl?: string | null;
  rejectReason?: string;
  
  // Audit & Timestamps
  createdAt: Date | FirebaseTimestamp;
  verifiedAt?: Date | FirebaseTimestamp | string;
  rejectedAt?: Date | FirebaseTimestamp | string;
  
  // Menangkap properti lain (menghindari error TS saat masa transisi)
  [key: string]: unknown;
}
