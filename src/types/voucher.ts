import { FirebaseTimestamp } from './common';

/**
 * Tipe diskon yang didukung oleh sistem promosi.
 * - PERCENTAGE: Diskon dalam persentase (%)
 * - FIXED: Diskon dalam nominal rupiah tetap (IDR)
 */
export type DiscountType = 'PERCENTAGE' | 'FIXED';

/**
 * Status operasional sebuah voucher.
 */
export type VoucherStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

/**
 * Model Promosi / Voucher / Promo Code.
 * Menggantikan array state 'any[]' di halaman manajemen voucher Admin.
 */
export interface Voucher {
  id: string; // Document ID
  code: string; // Kode unik promo (misal: SUMMERDEALS)
  name: string; // Nama kampanye (misal: Summer Vacation Discount 2026)
  
  discountType: DiscountType;
  discountValue: number; // Persentase (contoh: 10) atau Nominal Rupiah (contoh: 500000)
  minTransaction: number; // Batas minimal nilai transaksi untuk menggunakan kode ini
  
  status: VoucherStatus;
  validUntil: Date | FirebaseTimestamp | string; // Tenggat waktu berlakunya kode
  usageCount: number; // Jumlah total berapa kali kode telah digunakan
  
  createdAt: Date | FirebaseTimestamp;
  
  // Menangkap properti tak terduga (transisi)
  [key: string]: unknown;
}

/**
 * Model Item Katalog Reward.
 */
export interface RewardCatalogItem {
  id: string;
  name: string;
  desc: string;
  cost: number;
  value: number;
  iconName: string;
  [key: string]: unknown;
}

/**
 * Model Reward milik Pengguna (Voucher yang telah ditukar).
 */
export interface UserReward {
  id: string;
  userId: string;
  rewardId: string;
  rewardName: string;
  cost: number;
  discountValue: number;
  status: 'ACTIVE' | 'USED';
  redeemedAt: string | Date | FirebaseTimestamp;
  [key: string]: unknown;
}
