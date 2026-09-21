import { FirebaseTimestamp } from './common';

/**
 * Master data untuk tipe kabin yang ditawarkan.
 * Harga ditentukan secara flat per kabin, bukan per pax.
 */
export interface MasterCabin {
  id: string; // Document ID di koleksi 'products'
  name: string;
  description: string;
  price: number; // Harga flat per kabin
  images: string[];
  maxCapacity: number; // Kapasitas maksimal pax dalam satu unit/kabin
  totalUnits: number; // Jumlah kuota aktual kamar/ranjang yang bisa dijual (Inventory)
  popular: boolean;
  facilities?: string[];

  createdAt?: Date | FirebaseTimestamp;
  updatedAt?: Date | FirebaseTimestamp;
  
  [key: string]: unknown;
}

/**
 * Status dari sebuah jadwal keberangkatan.
 */
export type VoyageStatus = 'SCHEDULED' | 'DEPARTED' | 'CANCELLED';

/**
 * Representasi dari jadwal pelayaran spesifik (1 Keberangkatan per Sabtu).
 */
export interface VoyageSchedule {
  id: string; // Format YYYY-MM-DD (contoh: '2026-10-15')
  departureDate: Date | FirebaseTimestamp | string;
  shipName: string; // Contoh: 'PGI Phinisi'
  status: VoyageStatus;
  
  /**
   * Peta yang melacak sisa kuota untuk setiap ID MasterCabin pada tanggal ini.
   * Key: cabinId (string)
   * Value: Sisa kuota kamar (number)
   */
  cabinQuotas: Record<string, number>;
  
  createdAt?: Date | FirebaseTimestamp;
  updatedAt?: Date | FirebaseTimestamp;
  
  [key: string]: unknown;
}
