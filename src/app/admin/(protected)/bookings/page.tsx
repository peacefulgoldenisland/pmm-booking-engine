"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, where, limit } from 'firebase/firestore';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { 
  Search, Eye, CheckCircle2, 
  AlertCircle, Clock, XCircle, Download, Plus, ChevronDown, Check,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

import { AdminTable } from '@/components/admin/ui/AdminTable';
import { AdminBadge } from '@/components/admin/ui/AdminBadge';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminSelect } from '@/components/admin/ui/AdminSelect';
import { AdminModal } from '@/components/admin/ui/AdminModal';
import { AdminDatePicker } from '@/components/admin/ui/AdminDatePicker';
import type { Booking, BookingStatus } from '@/types/booking';
import { logAuditTrail } from '@/lib/auditLogger';
import { useAuthStore } from '@/store/useAuthStore';

const MobileDropdownChip = ({ value, options, onChange, labelPrefix }: { value: string, options: {value:string, label:string}[], onChange: (val: string) => void, labelPrefix?: string }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const selectedLabel = options.find(o => o.value === value)?.label || value;

  return (
    <>
      <div className="relative shrink-0 snap-start">
        <button 
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-sm px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-700 outline-none focus:border-[var(--color-gold-400)] shadow-sm active:bg-gray-50 transition-colors"
        >
          <span>{labelPrefix ? `${labelPrefix}: ${selectedLabel}` : selectedLabel}</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-[var(--color-navy-900)]/60 backdrop-blur-sm"
              />

              {/* Bottom Sheet Menu */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-white rounded-t-sm sm:rounded-sm shadow-luxury overflow-hidden flex flex-col pb-8 pt-3 px-4 max-h-[85vh]"
              >
                {/* Drag Handle (Visual only) */}
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 shrink-0" />
                
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2 text-center">
                  {labelPrefix ? `SELECT ${labelPrefix}` : "SELECT OPTION"}
                </h3>
                
                <div className="overflow-y-auto px-2 pb-2 admin-scrollbar">
                  {options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { onChange(opt.value); setIsOpen(false); }}
                      className={`w-full flex items-center justify-between px-5 py-4 text-xs font-bold uppercase tracking-wider transition-colors rounded-sm mb-2 border ${value === opt.value ? 'bg-[var(--color-navy-900)] border-[var(--color-navy-900)] text-white shadow-md' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'}`}
                    >
                      {opt.label}
                      {value === opt.value && <Check className="w-4 h-4 text-[var(--color-gold-400)]" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

const MobileDateChip = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  
  const initialDate = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = React.useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  React.useEffect(() => { setMounted(true); }, []);
  React.useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const handleSelectDate = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${d}`);
    setIsOpen(false);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <>
      <div className="relative shrink-0 snap-start cursor-pointer">
        <button 
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-sm px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-700 shadow-sm transition-colors active:bg-gray-50"
        >
          <span>{value ? new Date(value).toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : 'DATE: ALL'}</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-[var(--color-navy-900)]/60 backdrop-blur-sm"
              />

              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-white rounded-t-sm sm:rounded-sm shadow-luxury overflow-hidden flex flex-col pb-8 pt-3 px-6 max-h-[85vh]"
              >
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 shrink-0" />
                
                {/* Custom Calendar UI */}
                <div className="flex justify-between items-center mb-6">
                  <button type="button" onClick={handlePrevMonth} className="p-2 bg-gray-50 rounded-sm hover:bg-gray-200 text-[var(--color-navy-900)] transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-serif font-bold text-lg text-[var(--color-navy-900)]">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h3>
                  <button type="button" onClick={handleNextMonth} className="p-2 bg-gray-50 rounded-sm hover:bg-gray-200 text-[var(--color-navy-900)] transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                  {daysOfWeek.map(day => (
                    <div key={day} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isSelected = value && parseInt(value.split('-')[2]) === day && parseInt(value.split('-')[1]) - 1 === currentMonth.getMonth() && parseInt(value.split('-')[0]) === currentMonth.getFullYear();
                    const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth.getMonth() && new Date().getFullYear() === currentMonth.getFullYear();
                    
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleSelectDate(day)}
                        className={cn(
                          "aspect-square flex items-center justify-center text-sm font-bold rounded-sm transition-all mx-auto w-10 h-10",
                          isSelected 
                            ? "bg-[var(--color-navy-900)] text-white shadow-md scale-110" 
                            : isToday
                              ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                              : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                
                <div className="mt-8 flex gap-3">
                   <button type="button" onClick={() => { onChange(""); setIsOpen(false); }} className="flex-1 py-3 rounded-sm border border-gray-200 text-gray-600 font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 active:bg-gray-100 transition-colors">
                     Clear
                   </button>
                   <button type="button" onClick={() => setIsOpen(false)} className="flex-1 py-3 rounded-sm bg-[var(--color-navy-900)] text-white font-bold text-[10px] uppercase tracking-widest hover:bg-[var(--color-navy-800)] active:bg-[var(--color-navy-700)] transition-colors shadow-sm">
                     Close
                   </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default function AdminBookingsPage() {
  const { user: currentUser } = useAuthStore();
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
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC' | 'CABIN_ASC'>('DATE_DESC');
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
      
      // We no longer sort locally here, it is done in filteredBookings
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
        return <AdminBadge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</AdminBadge>;
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
  }).sort((a, b) => {
    if (sortBy === 'DATE_DESC') {
      const timeA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : (a.createdAt as any)?.toMillis?.() || 0;
      const timeB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : (b.createdAt as any)?.toMillis?.() || 0;
      return timeB - timeA;
    } else if (sortBy === 'DATE_ASC') {
      const timeA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : (a.createdAt as any)?.toMillis?.() || 0;
      const timeB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : (b.createdAt as any)?.toMillis?.() || 0;
      return timeA - timeB;
    } else if (sortBy === 'CABIN_ASC') {
      const cabinA = a.cabinClass || '';
      const cabinB = b.cabinClass || '';
      return cabinA.localeCompare(cabinB);
    }
    return 0;
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
      { width: 25 },  // C: KELAS
      { width: 5 },   // D: F/M
      { width: 14 },  // E: UMUR (THN)
      { width: 15 },  // F: NO PASSPOR
      { width: 15 },  // G: KEBANGSAAN
    ] : [
      { width: 5 },   // A: NO
      { width: 18 },  // B: TANGGAL DIBUAT
      { width: 30 },  // C: NAMA
      { width: 25 },  // D: KELAS
      { width: 5 },   // E: F/M
      { width: 14 },  // F: UMUR (THN)
      { width: 15 },  // G: NO PASSPOR
      { width: 15 },  // H: KEBANGSAAN
      { width: 15 },  // I: AGENT/WEB
      { width: 15 },  // J: AREA
      { width: 15 },  // K: BASE PRICE
      { width: 12 },  // L: DISC/PAX
      { width: 15 },  // M: NET/PAX (OFFICE)
      { width: 15 },  // N: NET/PAX (AGENT)
      { width: 15 }   // O: NET/PAX (WEB)
    ];

    // Build Syahbandar specific header format
    worksheet.addRow(["NAMA KAPAL", null, ": PULAU MAS 88", null, "PELABUHAN ASAL", null, null, ": LOMBOK"]);
    worksheet.addRow(["GT", null, ": 119", null, "PELABUHAN TUJUAN", null, null, ": LABUAN BAJO"]);
    worksheet.addRow(["JUMLAH ABK", null, ": 8 ORANG", null, "TANGGAL", null, null, `: ${formattedTanggal}`]);
    
    worksheet.addRow([]);
    
    // Style Header rows 1-3 to be bold
    [1, 2, 3].forEach(rowNum => {
      worksheet.getRow(rowNum).font = { bold: true };
    });

    const headerFields = isSyahbandar 
      ? ["NO.", "NAMA ", "KELAS", "F/M", "UMUR (THN)", "NO. PASSPOR", "KEBANGSAAN"]
      : ["NO.", "TANGGAL DIBUAT", "NAMA ", "KELAS", "F/M", "UMUR (THN)", "NO. PASSPOR", "KEBANGSAAN", "AGENT/WEB", "AREA", "BASE PRICE", "DISC/PAX", "NET/PAX (OFFICE)", "NET/PAX (AGENT)", "NET/PAX (WEB)"];

    const headerRow = worksheet.addRow(headerFields);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Apply borders to headerRow (only columns that have text or are part of the table body)
    const columnsWithBorder = isSyahbandar 
      ? [1, 2, 3, 4, 5, 6, 7]
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
      
    columnsWithBorder.forEach(colNum => {
       const cell = headerRow.getCell(colNum);
       cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });
    
    worksheet.addRow([]); // Empty row
    
    let paxNo = 1;
    let totalPriceSum = 0;
    
    // Aggregation objects for Summary
    const sourceSummary: Record<string, { gross: number, net: number }> = {
      AGENT: { gross: 0, net: 0 },
      OFFICE: { gross: 0, net: 0 },
      WEB: { gross: 0, net: 0 }
    };
    const cabinSummary: Record<string, number> = {};

    filteredBookings.forEach((b) => {
      const bookingGross = b.basePrice || b.totalAmount;
      const bookingNet = b.totalAmount;
      
      if (b.source === 'AGENT') {
         sourceSummary.AGENT.gross += bookingGross;
         sourceSummary.AGENT.net += bookingNet;
      } else if (b.source === 'OFFICE') {
         sourceSummary.OFFICE.gross += bookingGross;
         sourceSummary.OFFICE.net += bookingNet;
      } else {
         sourceSummary.WEB.gross += bookingGross;
         sourceSummary.WEB.net += bookingNet;
      }
      
      const cabinClass = b.cabinClass || 'UNKNOWN';
      if (!cabinSummary[cabinClass]) cabinSummary[cabinClass] = 0;
      cabinSummary[cabinClass] += bookingGross;
      const basePerPax = b.paxCount > 0 ? (b.basePrice || b.totalAmount) / b.paxCount : 0;
      const discPerPax = b.paxCount > 0 ? (b.discountAmount || 0) / b.paxCount : 0;
      const pricePerPax = b.paxCount > 0 ? b.totalAmount / b.paxCount : 0;
      
      const netOffice = b.source === 'OFFICE' ? pricePerPax : null;
      const netAgent = b.source === 'AGENT' ? pricePerPax : null;
      const netWeb = (b.source !== 'OFFICE' && b.source !== 'AGENT') ? pricePerPax : null;
      
      const sourceLabel = b.source === 'AGENT' ? `${b.agentName || 'UNKNOWN'}` : 
                          b.source === 'OFFICE' ? 'OFFICE WALK-IN' : 'WEB';

      (b.passengersManifest || []).forEach((pax: any) => {
        const orderDate = b.createdAt 
          ? new Date(typeof b.createdAt === 'string' || typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt as any).toDate?.() || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
          : '-';

        const rowData = isSyahbandar 
          ? [
              paxNo++,
              pax.fullName || '',
              b.cabinClass || '',
              pax.gender || '',
              pax.age ? `${pax.age} THN` : '',
              pax.passportNumber || '',
              pax.nationality || ''
            ]
          : [
              paxNo++,
              orderDate,
              pax.fullName || '',
              b.cabinClass || '',
              pax.gender || '',
              pax.age ? `${pax.age} THN` : '',
              pax.passportNumber || '',
              pax.nationality || '',
              sourceLabel,
              b.pickupLocation || '',
              basePerPax,
              discPerPax,
              netOffice,
              netAgent,
              netWeb
            ];

        const dataRow = worksheet.addRow(rowData);
        
        // Add borders to data row
        columnsWithBorder.forEach(colNum => {
           dataRow.getCell(colNum).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });
        
        const centerColumns = isSyahbandar ? [1, 3, 4, 5] : [1, 2, 5, 6];
        centerColumns.forEach(colNum => {
           dataRow.getCell(colNum).alignment = { horizontal: 'center' };
        });
        
        totalPriceSum += pricePerPax;
      });
    });

    if (!isSyahbandar) {
      const sumRow = worksheet.addRow([null, null, null, null, null, null, null, null, null, "TOTAL", null, null, sourceSummary.OFFICE.net, sourceSummary.AGENT.net, sourceSummary.WEB.net]);
      sumRow.getCell(10).font = { bold: true };
      sumRow.getCell(10).alignment = { horizontal: 'right' };
      sumRow.getCell(13).font = { bold: true };
      sumRow.getCell(13).alignment = { horizontal: 'right' };
      sumRow.getCell(14).font = { bold: true };
      sumRow.getCell(14).alignment = { horizontal: 'right' };
      sumRow.getCell(15).font = { bold: true };
      sumRow.getCell(15).alignment = { horizontal: 'right' };
      
      [10, 11, 12, 13, 14, 15].forEach(colNum => {
         sumRow.getCell(colNum).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      });
      worksheet.addRow([]);
      worksheet.addRow([]);

      // 1. REVENUE SUMMARY
      let totalGrossAll = sourceSummary.OFFICE.gross + sourceSummary.AGENT.gross + sourceSummary.WEB.gross;
      
      const titleRow = worksheet.addRow([]);
      worksheet.mergeCells(`B${titleRow.number}:C${titleRow.number}`);
      titleRow.getCell(2).value = "REVENUE SUMMARY";
      titleRow.getCell(2).font = { bold: true, size: 12 };
      titleRow.getCell(2).alignment = { horizontal: 'center' };
      
      const addSummaryRow = (label: string, value: number) => {
         const r = worksheet.addRow([]);
         r.getCell(2).value = label;
         r.getCell(2).font = { bold: true };
         r.getCell(2).alignment = { horizontal: 'left' };
         r.getCell(2).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
         r.getCell(3).value = value;
         r.getCell(3).font = { bold: true };
         r.getCell(3).alignment = { horizontal: 'right' };
         r.getCell(3).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      };

      addSummaryRow("KOTOR (GROSS)", totalGrossAll);
      addSummaryRow("AGENT", sourceSummary.AGENT.net);
      addSummaryRow("WEB", sourceSummary.WEB.net);
      addSummaryRow("OFFICE", sourceSummary.OFFICE.net);
      addSummaryRow("OFFICE + WEB", sourceSummary.OFFICE.net + sourceSummary.WEB.net);

      worksheet.addRow([]);
      worksheet.addRow([]);

      // 2. GROSS REVENUE BY CABIN CLASS
      const cabinHeaderRow = worksheet.addRow([null, "GROSS REVENUE BY CABIN CLASS", null]);
      cabinHeaderRow.getCell(2).font = { bold: true, size: 12 };
      cabinHeaderRow.getCell(2).alignment = { horizontal: 'left' };
      worksheet.mergeCells(`B${cabinHeaderRow.number}:C${cabinHeaderRow.number}`);

      const cabinTableHeaderRow = worksheet.addRow([null, "CABIN CLASS", "GROSS REVENUE (IDR)"]);
      cabinTableHeaderRow.font = { bold: true };
      cabinTableHeaderRow.getCell(2).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      cabinTableHeaderRow.getCell(3).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };

      let cabinGrossTotal = 0;
      Object.keys(cabinSummary).sort().forEach(cabin => {
         const gross = cabinSummary[cabin];
         cabinGrossTotal += gross;
         const dataRow = worksheet.addRow([null, cabin, gross]);
         dataRow.getCell(2).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
         dataRow.getCell(3).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      });
      
      const cabinTotalRow = worksheet.addRow([null, "TOTAL", cabinGrossTotal]);
      cabinTotalRow.font = { bold: true };
      cabinTotalRow.getCell(2).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      cabinTotalRow.getCell(3).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };

      worksheet.addRow([]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = isSyahbandar 
      ? `MANIFEST SYAHBANDAR PM88 ${formattedTanggal}.xlsx`
      : `RECAP PENUMPANG PM88 ${formattedTanggal}.xlsx`;
    saveAs(blob, filename);

    await logAuditTrail({
      action: 'EXPORT_MANIFEST',
      module: 'Bookings',
      details: `Exported ${type} to Excel for voyage ${formattedTanggal}`,
      actor: currentUser
    });
  };

  return (
    <div className="pb-20">
      {/* Mobile Floating Action Button */}
      <div className="md:hidden fixed bottom-[80px] right-4 z-40">
        <Link href="/admin/bookings/new" className="flex items-center justify-center w-14 h-14 bg-[var(--color-gold-500)] text-[var(--color-navy-900)] rounded-sm shadow-[0_8px_16px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-transform">
          <Plus className="w-6 h-6" />
        </Link>
      </div>

      {/* Mobile Page Header */}
      <div className="md:hidden mb-4 mt-2">
        <h1 className="text-3xl font-serif text-[var(--color-navy-900)] mb-1">Bookings</h1>
        <p className="text-xs text-gray-500">
          Showing {filteredBookings.length} {filteredBookings.length === 1 ? 'reservation' : 'reservations'}.
        </p>
      </div>

      <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
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

      {/* Mobile-only Search & Filters (Not sticky anymore) */}
      <div className="md:hidden bg-transparent -mx-4 px-4 pb-4">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search reference or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-none rounded-sm pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-400)] shadow-sm font-medium text-[var(--color-navy-900)] placeholder:text-gray-400"
            />
          </div>
          <button 
             onClick={() => setIsPreviewModalOpen(true)}
             className="w-[44px] h-[44px] shrink-0 flex items-center justify-center bg-[var(--color-navy-900)] rounded-sm text-white shadow-luxury active:scale-95 transition-transform"
          >
             <Download className="w-5 h-5" />
          </button>
        </div>
        
        {/* Horizontal Filter Chips */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 snap-x">
          <MobileDateChip 
            value={voyageFilter}
            onChange={(val) => setVoyageFilter(val)}
          />

          <MobileDropdownChip 
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as BookingStatus | 'ALL')}
            options={[
              { value: 'ALL', label: 'ALL STATUS' },
              { value: 'WAITING_VERIFICATION', label: 'WAITING VERIFY' },
              { value: 'PAID', label: 'PAID' },
              { value: 'PENDING', label: 'PENDING' },
              { value: 'CANCELLED', label: 'CANCELLED' }
            ]}
          />

          <MobileDropdownChip 
            value={sortBy}
            onChange={(val) => setSortBy(val as any)}
            labelPrefix="SORT"
            options={[
              { value: 'DATE_DESC', label: 'NEWEST' },
              { value: 'DATE_ASC', label: 'OLDEST' },
              { value: 'CABIN_ASC', label: 'CABIN CLASS' }
            ]}
          />
        </div>
      </div>

      {/* Control Panel (Desktop) */}
      <div className="hidden md:flex bg-white p-4 rounded-sm border border-gray-200/60 shadow-sm mb-6 flex-col xl:flex-row gap-4 xl:items-end justify-between">
        
        {/* Left Side: Filters */}
        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
          {/* Voyage Filter */}
          <div className="flex flex-col gap-1 w-full md:w-48 shrink-0">
            <label className="text-[9px] font-bold text-[var(--color-navy-900)] uppercase tracking-widest px-1">Sailing Date (Filter)</label>
            <AdminDatePicker 
              value={voyageFilter}
              onChange={(val) => setVoyageFilter(val)}
              placeholder="All Dates"
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
                { value: 'PAID', label: 'Paid / Approved' },
                { value: 'PENDING', label: 'Pending / Awaiting Fund' },
                { value: 'CANCELLED', label: 'Terminated' }
              ]}
            />
          </div>

          {/* Sorting */}
          <div className="flex flex-col gap-1 w-full md:w-40 shrink-0">
            <label className="text-[9px] font-bold text-[var(--color-navy-900)] uppercase tracking-widest px-1">Sort By</label>
            <AdminSelect 
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
              options={[
                { value: 'DATE_DESC', label: 'Order Date (Newest)' },
                { value: 'DATE_ASC', label: 'Order Date (Oldest)' },
                { value: 'CABIN_ASC', label: 'Cabin Class' }
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

      {/* Registry Table (Desktop) & Cards (Mobile) */}
      <div className="hidden md:block">
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
                  
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    ORDERED: {b.createdAt 
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
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden flex flex-col gap-3 min-h-[50vh]">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 bg-white rounded-sm border border-gray-100 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))
        ) : filteredBookings.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-sm border border-gray-100 shadow-sm flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <Search className="w-5 h-5 text-gray-300" />
            </div>
            <p className="font-medium text-gray-600">No bookings found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          filteredBookings.map((b) => (
            <Link key={b.id} href={`/admin/bookings/${b.id}`} className="block bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden active:bg-blue-50 transition-colors">
              <div className="p-4 relative">
                <div className="flex justify-between items-start mb-2">
                  <div className="pr-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="font-mono text-[10px] font-bold text-[var(--color-navy-900)] bg-gray-100 px-1.5 py-0.5 rounded-sm">{b.bookingId}</div>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {b.createdAt ? new Date(typeof b.createdAt === 'string' || typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt as any).toDate?.() || new Date()).toLocaleDateString('id-ID', {day:'numeric', month:'short', year: 'numeric'}) : ''}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[var(--color-navy-900)] truncate max-w-[200px]">{b.contactEmail}</div>
                  </div>
                  <div className="shrink-0 scale-90 origin-top-right">{getStatusBadge(b.status)}</div>
                </div>
                
                <div className="flex items-end justify-between mt-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      {b.source === 'AGENT' ? (
                        <span className="text-[9px] font-bold text-[var(--color-gold-600)] flex items-center gap-1 uppercase tracking-widest"><CheckCircle2 className="w-3 h-3"/> AGENT</span>
                      ) : b.source === 'OFFICE' ? (
                        <span className="text-[9px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-widest">OFFICE</span>
                      ) : (
                        <span className="text-[9px] font-bold text-blue-500 flex items-center gap-1 uppercase tracking-widest">WEB APP</span>
                      )}
                      <span className="text-gray-300">|</span>
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{b.cabinClass}</span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      <span className="font-medium text-gray-700">{b.paxCount}</span> Passenger(s)
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-[9px] text-gray-400 uppercase tracking-widest mb-0.5 font-bold">Total Amount</div>
                    <div className="text-sm font-serif font-bold text-[var(--color-navy-900)]">IDR {b.totalAmount?.toLocaleString('id-ID')}</div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <AdminModal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} title="Export Preview" maxWidth="full">
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-hidden">
          <div className="bg-yellow-50 p-3 text-xs text-yellow-800 rounded-md border border-yellow-200">
            <strong>Catatan:</strong> Preview ini hanya gambaran kasar. Hasil Export Excel yang sebenarnya akan lebih rapi dan presisi (termasuk tebal huruf, ukuran kolom, dan garis border).
          </div>
          <div className="overflow-auto border border-gray-300 rounded-md bg-white">
            <table className="w-full text-xs whitespace-nowrap min-w-[1200px]">
              <thead className="bg-gray-100 border-b-2 border-gray-300 sticky top-0">
                <tr className="[&>th]:px-2 [&>th]:py-1 [&>th]:border-r [&>th]:border-gray-300">
                  <th>NO.</th>
                  <th className="text-center">TANGGAL DIBUAT</th>
                  <th className="text-left">NAMA</th>
                  <th>KELAS</th>
                  <th>F/M</th>
                  <th>UMUR (THN)</th>
                  <th>NO. PASSPOR</th>
                  <th>KEBANGSAAN</th>
                  <th>AGENT/WEB</th>
                  <th>AREA</th>
                  <th className="text-right">BASE PRICE</th>
                  <th className="text-right">DISCOUNT</th>
                  <th className="text-right">NET/PAX (OFFICE)</th>
                  <th className="text-right">NET/PAX (AGENT)</th>
                  <th className="text-right">NET/PAX (WEB)</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b, bIdx) => {
                  const basePerPax = b.paxCount > 0 ? (b.basePrice || b.totalAmount) / b.paxCount : 0;
                  const discPerPax = b.paxCount > 0 ? (b.discountAmount || 0) / b.paxCount : 0;
                  const pricePerPax = b.paxCount > 0 ? b.totalAmount / b.paxCount : 0;
                  
                  const netOffice = b.source === 'OFFICE' ? pricePerPax : 0;
                  const netAgent = b.source === 'AGENT' ? pricePerPax : 0;
                  const netWeb = (b.source !== 'OFFICE' && b.source !== 'AGENT') ? pricePerPax : 0;
                  
                  const sourceLabel = b.source === 'AGENT' ? `${b.agentName || 'UNKNOWN'}` : 
                                      b.source === 'OFFICE' ? 'OFFICE WALK-IN' : 'WEB';
                  return (b.passengersManifest || []).map((pax: any, pIdx: number) => (
                    <tr key={`${bIdx}-${pIdx}`} className="border-b border-gray-200 hover:bg-blue-50 [&>td]:px-2 [&>td]:py-1 [&>td]:border-r [&>td]:border-gray-200">
                      <td className="text-center">{pIdx + 1 + (bIdx * 10) /* Rough ID */}</td>
                      <td className="text-center">{b.createdAt ? new Date(typeof b.createdAt === 'string' || typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt as any).toDate?.() || new Date()).toLocaleDateString('id-ID') : '-'}</td>
                      <td>{pax.fullName}</td>
                      <td>{b.cabinClass}</td>
                      <td className="text-center">{pax.gender}</td>
                      <td className="text-center">{pax.age ? `${pax.age} THN` : ''}</td>
                      <td>{pax.passportNumber}</td>
                      <td>{pax.nationality}</td>
                      <td>{sourceLabel}</td>
                      <td>{b.pickupLocation}</td>
                      <td className="text-right">Rp {basePerPax.toLocaleString('id-ID')}</td>
                      <td className="text-right text-red-600">Rp {discPerPax.toLocaleString('id-ID')}</td>
                      <td className="text-right text-blue-600">{netOffice > 0 ? `Rp ${netOffice.toLocaleString('id-ID')}` : '-'}</td>
                      <td className="text-right text-emerald-600">{netAgent > 0 ? `Rp ${netAgent.toLocaleString('id-ID')}` : '-'}</td>
                      <td className="text-right font-bold text-[var(--color-navy-900)]">{netWeb > 0 ? `Rp ${netWeb.toLocaleString('id-ID')}` : '-'}</td>
                    </tr>
                  ));
                })}
              </tbody>
              <tfoot className="bg-gray-100 font-bold sticky bottom-0 shadow-[0_-2px_5px_rgba(0,0,0,0.05)] text-right">
                <tr>
                  <td colSpan={10} className="px-4 py-2">TOTAL SUMMARY</td>
                  <td className="px-2 py-2 text-gray-500 text-xs font-normal">
                     (Gross) Rp {filteredBookings.reduce((sum, b) => sum + (b.basePrice || b.totalAmount), 0).toLocaleString('id-ID')}
                  </td>
                  <td className="px-2 py-2"></td>
                  <td className="px-2 py-2 text-blue-600">
                     Rp {filteredBookings.filter(b => b.source === 'OFFICE').reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString('id-ID')}
                  </td>
                  <td className="px-2 py-2 text-emerald-600">
                     Rp {filteredBookings.filter(b => b.source === 'AGENT').reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString('id-ID')}
                  </td>
                  <td className="px-2 py-2 text-[var(--color-navy-900)]">
                     Rp {filteredBookings.filter(b => b.source !== 'OFFICE' && b.source !== 'AGENT').reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString('id-ID')}
                  </td>
                </tr>
                <tr className="bg-white">
                  <td colSpan={14} className="px-4 py-2 border-t border-gray-300">TOTAL PENDAPATAN OFFICE + WEB:</td>
                  <td className="px-2 py-2 border-t border-gray-300 text-[var(--color-navy-900)]">
                     Rp {filteredBookings.filter(b => b.source !== 'AGENT').reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 shrink-0 mt-2">
            <AdminButton variant="outline" onClick={() => setIsPreviewModalOpen(false)} className="w-full sm:w-auto order-3 sm:order-1">
              Cancel
            </AdminButton>
            <AdminButton variant="primary" onClick={() => { setIsPreviewModalOpen(false); exportToExcel('RECAP'); }} className="w-full sm:w-auto order-2">
              <Download className="w-4 h-4 mr-2" /> Download Recap (Internal)
            </AdminButton>
            <AdminButton variant="success" onClick={() => { setIsPreviewModalOpen(false); exportToExcel('SYAHBANDAR'); }} className="w-full sm:w-auto order-1 sm:order-3">
              <Download className="w-4 h-4 mr-2" /> Download Manifest (Syahbandar)
            </AdminButton>
          </div>
        </div>
      </AdminModal>

    </div>
  );
}
