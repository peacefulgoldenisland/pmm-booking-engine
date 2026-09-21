import { FirebaseTimestamp } from './common';

/**
 * Metrik yang dikumpulkan dari berbagai koleksi Firebase
 * untuk ditampilkan di Dashboard Admin.
 */
export interface DashboardStats {
  pendingVerifications: number;
  totalBookings: number;
  totalGuests: number;
  activeVouchers: number;
  revenue: number;
  
  revenueTrend?: ChartData[];
  bookingSources?: { name: string; value: number }[];
  occupancyData?: { name: string; capacity: number; sold: number; remaining: number }[];
  revenueSummary?: {
    gross: number;
    agent: number;
    web: number;
    office: number;
    officeAndWeb: number;
  };
  revenueByCabin?: Record<string, number>;
}

/**
 * Format standar untuk dataset grafik analitik (Bar Chart, Line Chart).
 * Memudahkan integrasi dengan library seperti Recharts atau Chart.js di masa depan.
 */
export interface ChartData {
  label: string; // Contoh: "Senin", "Booking #1"
  value: number; // Nilai data
  dateStr?: string; // Metadata tambahan jika dibutuhkan
}

/**
 * Rekam jejak (Audit Log) untuk mencatat semua tindakan sensitif
 * yang dilakukan oleh Superadmin atau Admin.
 */
export interface AuditLog {
  id: string; // Document ID log
  action: string; // Deskripsi singkat tindakan (Contoh: "Approve Payment", "Create Voucher")
  adminEmail: string; // Email admin yang mengeksekusi
  targetModule: string; // Nama modul yang terdampak (Contoh: "Bookings", "Vouchers")
  
  performedBy?: string; // UID admin
  targetId?: string; // ID entitas yang dimodifikasi (Contoh: Booking ID)
  details?: string; // Objek JSON string atau catatan tambahan
  
  ipAddress?: string;
  timestamp: FirebaseTimestamp | Date | string | number | null | undefined;
}
