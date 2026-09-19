"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, where, limit } from 'firebase/firestore';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { 
  Search, Eye, CheckCircle2, 
  AlertCircle, Clock, XCircle, Download, Plus
} from 'lucide-react';

import { AdminTable } from '@/components/admin/ui/AdminTable';
import { AdminBadge } from '@/components/admin/ui/AdminBadge';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminSelect } from '@/components/admin/ui/AdminSelect';
import { AdminModal } from '@/components/admin/ui/AdminModal';
import type { Booking, BookingStatus } from '@/types/booking';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const getNextSaturday = () => {
    const d = new Date();
    d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7);
    return d.toISOString().split('T')[0];
  };

  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [voyageFilter, setVoyageFilter] = useState<string>(getNextSaturday());
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Real-time listener using onSnapshot
  useEffect(() => {
    setIsLoading(true);
    let q;
    if (voyageFilter) {
      q = query(collection(db, 'bookings'), where('dateOfDeparture', '==', voyageFilter));
    } else {
      q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(200));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];
      
      // Sort locally by createdAt desc
      data.sort((a, b) => {
         const timeA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : (a.createdAt as any)?.toMillis?.() || 0;
         const timeB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : (b.createdAt as any)?.toMillis?.() || 0;
         return timeB - timeA;
      });
      setBookings(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching bookings real-time:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [voyageFilter]);

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'PAID':
        return <AdminBadge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Secured</AdminBadge>;
      case 'WAITING_VERIFICATION':
        return <AdminBadge variant="warning" className="gap-1 animate-pulse"><AlertCircle className="w-3 h-3" /> Verify Remittance</AdminBadge>;
      case 'PENDING':
        return <AdminBadge variant="default" className="gap-1"><Clock className="w-3 h-3" /> Awaiting Fund</AdminBadge>;
      case 'CANCELLED':
        return <AdminBadge variant="danger" className="gap-1"><XCircle className="w-3 h-3" /> Terminated</AdminBadge>;
      default:
        return <AdminBadge variant="outline">{status}</AdminBadge>;
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchStatus = filterStatus === 'ALL' || b.status === filterStatus;
    const matchSearch = (b.bookingId || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (b.contactEmail || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const tableHeaders = [
    "Reference No.",
    "Guest Contact",
    "Sailing Date",
    "Invoice Total",
    "Status",
    "Action"
  ];

  const exportToExcel = async (type: 'RECAP' | 'SYAHBANDAR' = 'RECAP') => {
    if (filteredBookings.length === 0) {
      alert("No data available to export.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Manifest');
    
    // Format date string for TANGGAL header
    let formattedTanggal = voyageFilter;
    if (voyageFilter) {
      const d = new Date(voyageFilter);
      if (!isNaN(d.getTime())) {
         const months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
         formattedTanggal = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
      }
    }

    const isSyahbandar = type === 'SYAHBANDAR';

    // Set Column Widths (matching standard Syahbandar)
    worksheet.columns = isSyahbandar ? [
      { width: 5 },   // A: NO
      { width: 30 },  // B: NAMA
      { width: 3 },   // C: empty space
      { width: 25 },  // D: KELAS
      { width: 5 },   // E: F/M
      { width: 14 },  // F: UMUR (THN)
      { width: 15 },  // G: NO PASSPOR
      { width: 15 },  // H: KEBANGSAAN
    ] : [
      { width: 5 },   // A: NO
      { width: 30 },  // B: NAMA
      { width: 3 },   // C: empty space
      { width: 25 },  // D: KELAS
      { width: 5 },   // E: F/M
      { width: 14 },  // F: UMUR (THN)
      { width: 15 },  // G: NO PASSPOR
      { width: 15 },  // H: KEBANGSAAN
      { width: 15 },  // I: AGENT/WEB
      { width: 15 },  // J: AREA
      { width: 15 },  // K: PRICE
      { width: 5 },   // L: empty space
      { width: 15 },  // M: LAHIR
      { width: 10 }   // N: HARI
    ];

    // Build Syahbandar specific header format
    worksheet.addRow(["NAMA KAPAL", null, ": PULAU MAS 88", null, "PELABUHAN ASAL", null, null, ": LOMBOK"]);
    worksheet.addRow(["GT", null, ": 119", null, "PELABUHAN TUJUAN", null, null, ": LABUAN BAJO"]);
    worksheet.addRow(["JUMLAH ABK", null, ": 8 ORANG", null, "TANGGAL", null, null, `: ${formattedTanggal}`]);
    
    if (!isSyahbandar) {
      worksheet.addRow([null, null, null, null, null, null, null, null, null, null, null, null, "BLN/TGL/THN", null]);
      // Format "BLN/TGL/THN" explicitly to match the document styling
      const blnTglThnCell = worksheet.getRow(4).getCell(13);
      blnTglThnCell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      blnTglThnCell.alignment = { horizontal: 'center', vertical: 'middle' };
      blnTglThnCell.font = { bold: true };
    } else {
      worksheet.addRow([]);
    }
    
    // Style Header rows 1-3 to be bold
    [1, 2, 3].forEach(rowNum => {
      worksheet.getRow(rowNum).font = { bold: true };
    });

    const headerFields = isSyahbandar 
      ? ["NO.", "NAMA ", null, "KELAS", "F/M", "UMUR (THN)", "NO. PASSPOR", "KEBANGSAAN"]
      : ["NO.", "NAMA ", null, "KELAS", "F/M", "UMUR (THN)", "NO. PASSPOR", "KEBANGSAAN", "AGENT/WEB", "AREA", "PRICE", null, "LAHIR", "Hari "];

    const headerRow = worksheet.addRow(headerFields);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Apply borders to headerRow (only columns that have text or are part of the table body)
    const columnsWithBorder = isSyahbandar 
      ? [1, 2, 4, 5, 6, 7, 8]
      : [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14];
      
    columnsWithBorder.forEach(colNum => {
       const cell = headerRow.getCell(colNum);
       cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });
    
    worksheet.addRow([]); // Empty row
    
    let paxNo = 1;
    let totalPriceSum = 0;

    filteredBookings.forEach((b) => {
      const pricePerPax = b.paxCount > 0 ? b.totalAmount / b.paxCount : 0;
      const sourceLabel = b.source === 'AGENT' ? `${b.agentName || 'UNKNOWN'}` : 
                          b.source === 'OFFICE' ? 'OFFICE WALK-IN' : 'WEB';

      (b.passengersManifest || []).forEach((pax: any) => {
        let dayName = '';
        let birthDateFormatted = pax.dateOfBirth || '';
        
        if (pax.dateOfBirth) {
           const d = new Date(pax.dateOfBirth);
           if (!isNaN(d.getTime())) {
              const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
              dayName = days[d.getDay()];
              birthDateFormatted = `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;
           }
        }

        const rowData = isSyahbandar 
          ? [
              paxNo++,
              pax.fullName || '',
              null,
              b.cabinClass || '',
              pax.gender || '',
              pax.age ? `${pax.age} THN` : '',
              pax.passportNumber || '',
              pax.nationality || ''
            ]
          : [
              paxNo++,
              pax.fullName || '',
              null,
              b.cabinClass || '',
              pax.gender || '',
              pax.age ? `${pax.age} THN` : '',
              pax.passportNumber || '',
              pax.nationality || '',
              sourceLabel,
              b.pickupLocation || '',
              pricePerPax,
              null,
              birthDateFormatted,
              dayName
            ];

        const dataRow = worksheet.addRow(rowData);
        
        // Add borders to data row
        columnsWithBorder.forEach(colNum => {
           dataRow.getCell(colNum).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });
        
        // Center alignment for specific columns
        const centerColumns = isSyahbandar ? [1, 4, 5, 6] : [1, 4, 5, 6, 13, 14];
        centerColumns.forEach(colNum => {
           dataRow.getCell(colNum).alignment = { horizontal: 'center' };
        });
        
        totalPriceSum += pricePerPax;
      });
    });

    worksheet.addRow([]); // Empty row
    
    if (!isSyahbandar) {
      const sumRow = worksheet.addRow([null, null, null, null, null, null, null, null, null, "TOTAL", totalPriceSum, null, null, null]);
      sumRow.getCell(10).font = { bold: true };
      sumRow.getCell(10).alignment = { horizontal: 'right' };
      sumRow.getCell(11).font = { bold: true };
      sumRow.getCell(11).alignment = { horizontal: 'center' };
      worksheet.addRow([]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = isSyahbandar 
      ? `MANIFEST SYAHBANDAR PM88 ${formattedTanggal}.xlsx`
      : `RECAP PENUMPANG PM88 ${formattedTanggal}.xlsx`;
    saveAs(blob, filename);
  };

  return (
    <div className="pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-[var(--color-navy-900)]">Bookings</h1>
          <p className="text-xs text-gray-500 mt-1">Real-time view of all bookings.</p>
        </div>
        <Link href="/admin/bookings/new">
          <AdminButton variant="primary" className="shadow-luxury">
            <Plus className="w-4 h-4 mr-2" /> Create Booking
          </AdminButton>
        </Link>
      </div>

      {/* Control Panel */}
      <div className="bg-white p-4 rounded-sm border border-gray-200/60 shadow-sm mb-6 flex flex-col xl:flex-row gap-4 xl:items-end justify-between">
        
        {/* Left Side: Filters */}
        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
          {/* Voyage Filter */}
          <div className="flex flex-col gap-1 w-full md:w-48 shrink-0">
            <label className="text-[9px] font-bold text-[var(--color-navy-900)] uppercase tracking-widest px-1">Sailing Date (Filter)</label>
            <AdminInput 
              type="date"
              value={voyageFilter}
              onChange={(e) => setVoyageFilter(e.target.value)}
            />
          </div>

          {/* Status Filters */}
          <div className="flex flex-col gap-1 w-full md:w-48 shrink-0">
            <label className="text-[9px] font-bold text-[var(--color-navy-900)] uppercase tracking-widest px-1">Status</label>
            <AdminSelect 
              value={filterStatus}
              onChange={(val) => setFilterStatus(val as BookingStatus | 'ALL')}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'WAITING_VERIFICATION', label: 'Waiting Verification' },
                { value: 'PAID', label: 'Paid / Secured' },
                { value: 'PENDING', label: 'Pending / Awaiting Fund' },
                { value: 'CANCELLED', label: 'Terminated' }
              ]}
            />
          </div>
        </div>

        {/* Right Side: Search & Action */}
        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
          <div className="flex flex-col gap-1 w-full md:w-80">
            <label className="text-[9px] font-bold text-transparent uppercase tracking-widest px-1 hidden md:block">Search</label>
            <AdminInput 
              leftIcon={<Search className="w-4 h-4" />}
              type="text" 
              placeholder="Search Reference or Email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1 w-full md:w-auto">
            <label className="text-[9px] font-bold text-transparent uppercase tracking-widest px-1 hidden md:block">Action</label>
            <AdminButton variant="success" onClick={() => setIsPreviewModalOpen(true)} className="whitespace-nowrap w-full px-4 py-2.5 h-[42px] text-[10px] uppercase tracking-widest font-bold flex items-center justify-center">
               <Eye className="w-4 h-4 mr-2"/> Preview Excel
            </AdminButton>
          </div>
        </div>
      </div>

      {/* Registry Table */}
      <AdminTable headers={tableHeaders} isLoading={isLoading}>
        {filteredBookings.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">
              No reservations found matching current parameters.
            </td>
          </tr>
        ) : (
          filteredBookings.map((b) => (
            <tr key={b.id} className="hover:bg-[var(--color-surface-50)] transition-colors group">
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1.5 items-start">
                  <div className="font-mono text-xs font-bold text-[var(--color-navy-900)] leading-none">{b.bookingId}</div>
                  
                  {b.source === 'AGENT' ? (
                    <span className="bg-[var(--color-gold-500)]/10 text-[var(--color-gold-600)] border border-[var(--color-gold-500)]/20 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm whitespace-nowrap">
                      AGENT: {b.agentName || 'UNKNOWN'}
                    </span>
                  ) : b.source === 'OFFICE' ? (
                    <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm whitespace-nowrap">
                      OFFICE WALK-IN
                    </span>
                  ) : (
                    <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm whitespace-nowrap">
                      WEB / APP
                    </span>
                  )}
                  
                  <div className="text-[10px] text-gray-400">
                    {b.createdAt 
                      ? new Date(
                          typeof b.createdAt === 'string' || typeof b.createdAt === 'number' 
                            ? b.createdAt 
                            : (b.createdAt as any).toDate?.() || new Date()
                        ).toLocaleDateString('id-ID') 
                      : '-'}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-xs font-medium text-[var(--color-navy-900)] truncate max-w-[200px]">{b.contactEmail}</div>
                <div className="text-[10px] text-gray-500 mt-1">{b.contactPhone}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-xs font-medium text-[var(--color-navy-900)]">
                  {b.dateOfDeparture 
                    ? new Date(
                        typeof b.dateOfDeparture === 'string' || typeof b.dateOfDeparture === 'number' 
                          ? b.dateOfDeparture 
                          : (b.dateOfDeparture as any).toDate?.() || new Date()
                      ).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '-'}
                </div>
                <div className="text-[10px] text-gray-500 mt-1 uppercase">{b.cabinClass} ({b.paxCount} Pax)</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-serif text-[var(--color-navy-900)]">IDR {b.totalAmount?.toLocaleString('id-ID')}</div>
                <div className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{b.paymentMethod?.replace('_', ' ')}</div>
              </td>
              <td className="px-6 py-4">
                {getStatusBadge(b.status)}
              </td>
              <td className="px-6 py-4 text-right">
                <Link 
                  href={`/admin/bookings/${b.id}`}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-sm bg-white border border-gray-200 text-gray-500 hover:text-[var(--color-gold-600)] hover:border-[var(--color-gold-400)] shadow-sm transition-all"
                >
                  <Eye className="w-4 h-4" />
                </Link>
              </td>
            </tr>
          ))
        )}
      </AdminTable>

      <AdminModal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} title="Export Preview (Syahbandar)" maxWidth="full">
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-hidden">
          <div className="bg-yellow-50 p-3 text-xs text-yellow-800 rounded-md border border-yellow-200">
            <strong>Catatan:</strong> Preview ini hanya gambaran kasar. Hasil Export Excel yang sebenarnya akan lebih rapi dan presisi (termasuk tebal huruf, ukuran kolom, dan garis border).
          </div>
          <div className="overflow-auto border border-gray-300 rounded-md bg-white">
            <table className="w-full text-xs whitespace-nowrap min-w-[1200px]">
              <thead className="bg-gray-100 border-b-2 border-gray-300 sticky top-0">
                <tr className="[&>th]:px-2 [&>th]:py-1 [&>th]:border-r [&>th]:border-gray-300">
                  <th>NO.</th>
                  <th className="text-left">NAMA</th>
                  <th>KELAS</th>
                  <th>F/M</th>
                  <th>UMUR (THN)</th>
                  <th>NO. PASSPOR</th>
                  <th>KEBANGSAAN</th>
                  <th>AGENT/WEB</th>
                  <th>AREA</th>
                  <th>PRICE</th>
                  <th>LAHIR</th>
                  <th>Hari</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b, bIdx) => {
                  const pricePerPax = b.paxCount > 0 ? b.totalAmount / b.paxCount : 0;
                  const sourceLabel = b.source === 'AGENT' ? `${b.agentName || 'UNKNOWN'}` : 
                                      b.source === 'OFFICE' ? 'OFFICE WALK-IN' : 'WEB';
                  return (b.passengersManifest || []).map((pax: any, pIdx: number) => (
                    <tr key={`${bIdx}-${pIdx}`} className="border-b border-gray-200 hover:bg-blue-50 [&>td]:px-2 [&>td]:py-1 [&>td]:border-r [&>td]:border-gray-200">
                      <td className="text-center">{pIdx + 1 + (bIdx * 10) /* Rough ID */}</td>
                      <td>{pax.fullName}</td>
                      <td>{b.cabinClass}</td>
                      <td className="text-center">{pax.gender}</td>
                      <td className="text-center">{pax.age ? `${pax.age} THN` : ''}</td>
                      <td>{pax.passportNumber}</td>
                      <td>{pax.nationality}</td>
                      <td>{sourceLabel}</td>
                      <td>{b.pickupLocation}</td>
                      <td className="text-right">Rp {pricePerPax.toLocaleString('id-ID')}</td>
                      <td className="text-center">{pax.dateOfBirth}</td>
                      <td className="text-center">-</td>
                    </tr>
                  ));
                })}
              </tbody>
              <tfoot className="bg-gray-100 font-bold sticky bottom-0">
                <tr>
                  <td colSpan={9} className="text-right px-4 py-2">TOTAL</td>
                  <td className="text-right px-2 py-2">
                     Rp {filteredBookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString('id-ID')}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="flex justify-end gap-2 shrink-0">
            <AdminButton variant="outline" onClick={() => setIsPreviewModalOpen(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" onClick={() => { setIsPreviewModalOpen(false); exportToExcel('RECAP'); }}>
              <Download className="w-4 h-4 mr-2" /> Download Recap (Internal)
            </AdminButton>
            <AdminButton variant="success" onClick={() => { setIsPreviewModalOpen(false); exportToExcel('SYAHBANDAR'); }}>
              <Download className="w-4 h-4 mr-2" /> Download Manifest (Syahbandar)
            </AdminButton>
          </div>
        </div>
      </AdminModal>

    </div>
  );
}
