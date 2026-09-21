import { FirebaseTimestamp } from './common';
import type { Booking } from './booking'; // Nanti akan diimport saat booking.ts selesai dibuat

/**
 * Role yang tersedia di dalam sistem PGI Booking Engine.
 */
export type Role = 'superadmin' | 'admin' | 'member' | 'agent';

/**
 * Tipe data untuk konfigurasi preferensi atau notifikasi user
 */
export interface UserPreferences {
  marketingEmails?: boolean;
  whatsappNotifications?: boolean;
}

/**
 * Model User Utama, merepresentasikan data authentication dan profil pengguna
 * yang tersimpan di dalam koleksi `users`.
 */
export interface User {
  id: string; // Document ID (Sama dengan Firebase Auth UID)
  uid?: string; // Alternatif mapping
  email: string;
  fullName: string;
  role: Role;
  
  // Profil Tambahan
  phone?: string;
  photoUrl?: string;
  photoURL?: string; // Legacy support
  pointsBalance?: number;
  gender?: string;
  nationality?: string;
  passportNumber?: string;
  dietaryRequirements?: string;
  passportFileUrl?: string;
  
  preferences?: UserPreferences;
  // RBAC & Audit
  allowedMenus?: string[];
  isSuspended?: boolean;

  // Metadata
  createdAt: Date | FirebaseTimestamp;
  updatedAt?: Date | FirebaseTimestamp;
  
  // Penanganan fleksibilitas tipe sementara
  [key: string]: unknown;
}

/**
 * GuestProfile merepresentasikan profil tamu (pelanggan) 
 * yang mencakup profil dasarnya (User) ditambah dengan 
 * riwayat pemesanan yang ditarik dari koleksi `bookings`.
 * Sangat berguna untuk view model pada halaman detail Guest.
 */
export interface GuestProfile extends User {
  bookingHistory?: Booking[]; // Relasi array pemesanan
  totalSpent?: number;
  lastBookingDate?: Date | FirebaseTimestamp;
}
