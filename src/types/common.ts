/**
 * Menyimpan tipe utilitas universal yang digunakan lintas modul.
 */

/**
 * Tipe ini mengatasi konflik dan ketidakkonsistenan saat melempar
 * data dari Firestore (yang memiliki method toDate() dan toMillis())
 * ke Redux/Zustand/State yang telah terserialisasi (string/number),
 * atau bahkan objek Date natif.
 * 
 * Diadopsi dari praktik terbaik Flash Global.
 */
export type FirebaseTimestamp = 
  | { toDate?: () => Date; toMillis?: () => number; seconds?: number } 
  | Date 
  | string 
  | number 
  | null 
  | undefined;
