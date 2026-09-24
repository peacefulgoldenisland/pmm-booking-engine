"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Search, ShieldAlert, Filter, 
  ChevronLeft, ChevronRight, Key, ShieldCheck,
  Globe
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminTable } from "@/components/admin/ui/AdminTable";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { AdminSelect } from "@/components/admin/ui/AdminSelect";

// Internal interface for AuditLog
interface AuditLog {
  id: string;
  action: string;
  module: string;
  targetId?: string;
  details: string;
  adminEmail: string;
  ipAddress?: string;
  timestamp: any;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModule, setFilterModule] = useState("All");
  
  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Real-time listener
  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData: AuditLog[] = snapshot.docs.map(d => {
        return { id: d.id, ...d.data() } as AuditLog;
      });
      setLogs(logsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Failed to load audit logs:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatTime = (ts?: any) => {
    if (!ts) return { date: "Processing...", time: "" };
    let dateObj: Date;
    
    if (ts.toDate) {
      dateObj = ts.toDate();
    } else {
      dateObj = new Date(ts);
    }
    
    return {
      date: dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  };

  const getActionTheme = (action: string = "") => {
    const act = action.toLowerCase();
    if (act.includes('delete') || act.includes('remove') || act.includes('suspend') || act.includes('reject')) {
      return "danger";
    }
    if (act.includes('create') || act.includes('add') || act.includes('approve') || act.includes('success')) {
      return "success";
    }
    if (act.includes('update') || act.includes('edit') || act.includes('modify')) {
      return "info";
    }
    return "default";
  };

  const uniqueModules = useMemo(() => {
    const modules = new Set(logs.map(l => l.module).filter(Boolean));
    return Array.from(modules).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    let res = [...logs];
    
    if (searchQuery.trim()) {
      const sq = searchQuery.toLowerCase();
      res = res.filter(l => 
        (l.adminEmail || "").toLowerCase().includes(sq) || 
        (l.action || "").toLowerCase().includes(sq) || 
        (l.targetId || "").toLowerCase().includes(sq) ||
        (l.module || "").toLowerCase().includes(sq)
      );
    }
    
    if (filterModule !== "All") {
      res = res.filter(l => l.module === filterModule);
    }
    
    return res;
  }, [logs, searchQuery, filterModule]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterModule]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const currentData = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Mobile Page Header */}
      <div className="md:hidden mb-4 mt-2">
        <div className="flex items-center gap-2 mb-2">
           <ShieldCheck className="w-5 h-5 text-[var(--color-gold-500)]" />
           <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Security</span>
        </div>
        <h1 className="text-3xl font-serif text-[var(--color-navy-900)] mb-1">Audit Trail</h1>
        <p className="text-xs text-gray-500">
          {logs.length.toLocaleString('en-US')} immutable system events.
        </p>
      </div>

      {/* HEADER HERO SECTION (Desktop Only) */}
      <div className="hidden md:flex bg-[var(--color-navy-900)] p-6 md:p-8 rounded-sm shadow-luxury flex-col md:flex-row justify-between md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-gold-500)]/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 w-full md:w-auto">
          <div className="flex items-center gap-2 mb-2 text-[var(--color-gold-400)] text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>Support / Security</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif text-white tracking-wide">
            Audit Trail
          </h1>
          <p className="text-gray-400 text-sm mt-1 max-w-2xl font-medium">
            Immutable log of system activities. Required for Level 3 compliance and accountability.
          </p>
        </div>

        <div className="relative z-10 flex gap-4 bg-white/5 p-4 rounded-sm border border-white/10 shrink-0 w-full md:w-auto">
          <div className="flex flex-col items-center px-4">
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Events</span>
            <span className="text-2xl font-mono text-white leading-none">{logs.length.toLocaleString('en-US')}</span>
          </div>
        </div>
      </div>

      {/* COMPLIANCE ALERT */}
      <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-sm flex items-start gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
        <ShieldCheck className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-red-600 font-medium leading-relaxed">
          <b className="font-bold tracking-wide">Immutable Data.</b> Every log on this page is generated by server-side functions. It cannot be manipulated, edited, or deleted by any admin to ensure absolute data integrity.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Control Panel (Search & Filter) */}
        <div className="md:static md:bg-white md:p-4 md:rounded-sm md:border md:border-gray-200/60 md:shadow-sm py-3 md:py-0 mb-6 flex flex-row items-center justify-between md:justify-end gap-2 md:gap-3 -mx-4 px-4 md:mx-0 md:px-0 md:shadow-none bg-transparent relative z-20">
          <div className="flex-1 md:w-96 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search email or ID..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full bg-white border border-gray-200/80 md:border-none rounded-sm pl-9 pr-3 py-3 md:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-400)] shadow-sm font-medium text-[var(--color-navy-900)] placeholder:text-gray-400 transition-shadow"
            />
          </div>
          
          <div className="w-[120px] md:w-auto shrink-0">
            <AdminSelect 
              value={filterModule} 
              onChange={(val) => setFilterModule(val)} 
              options={[
                { value: "All", label: "All Modules" },
                ...uniqueModules.map(mod => ({ value: mod, label: mod }))
              ]}
            />
          </div>
        </div>

        {/* LIST LOG AKTIVITAS (TABLE) & CARDS (Mobile) */}
        <div className="hidden md:block">
          <AdminCard className="overflow-hidden">
          <AdminTable 
            headers={["Timestamp", "Actor", "Module & Target", "Activity Details", "Action"]} 
            isLoading={isLoading} 
            skeletonCount={5}
          >
            {currentData.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-20 text-gray-400" />
                  <p className="font-bold text-sm">No Audit Logs Found</p>
                  <p className="text-xs">Try adjusting your filters or search keywords.</p>
                </td>
              </tr>
            ) : (
              currentData.map((log) => {
                const { date, time } = formatTime(log.timestamp);
                const badgeVariant = getActionTheme(log.action);
                
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 group">
                    <td className="px-6 py-4">
                      <div className="bg-gray-100 group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-gray-200 rounded px-2 py-1.5 w-fit transition-all">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">{date}</p>
                        <p className="text-sm font-mono font-bold text-[var(--color-navy-900)] tracking-tight leading-none">{time}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                          <Key className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-[var(--color-navy-900)] text-xs truncate max-w-[150px]" title={log.adminEmail}>
                            {log.adminEmail}
                          </p>
                          {log.ipAddress && (
                            <p className="text-[9px] text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                              <Globe className="w-2.5 h-2.5"/> {log.ipAddress}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-sm text-[9px] uppercase font-bold tracking-widest">
                        {log.module}
                      </span>
                      {log.targetId && (
                        <p className="text-[10px] font-mono text-gray-500 mt-2 flex items-center gap-1">
                          <span className="text-[8px] uppercase tracking-widest border border-gray-200 rounded px-1">ID</span> {log.targetId}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-600 max-w-xs" title={log.details}>
                        {log.details || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <AdminBadge variant={badgeVariant as any}>
                        {log.action}
                      </AdminBadge>
                    </td>
                  </tr>
                )
              })
            )}
            </AdminTable>
          </AdminCard>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden flex flex-col gap-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-sm border border-gray-200 p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))
          ) : currentData.length === 0 ? (
            <div className="bg-white rounded-sm border border-gray-200 p-8 text-center text-gray-500">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-20 text-gray-400" />
              <p className="font-bold text-sm">No Audit Logs Found</p>
            </div>
          ) : (
            currentData.map((log) => {
              const { date, time } = formatTime(log.timestamp);
              const badgeVariant = getActionTheme(log.action);
              
              return (
                <div key={log.id} className="bg-white rounded-sm border border-gray-200 p-4 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <div className="bg-gray-100 rounded px-2 py-1 flex items-center gap-2">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none">{date}</span>
                      <span className="text-xs font-mono font-bold text-[var(--color-navy-900)] tracking-tight leading-none">{time}</span>
                    </div>
                    <AdminBadge variant={badgeVariant as any}>
                      {log.action}
                    </AdminBadge>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Key className="w-3 h-3 text-gray-400" />
                    <p className="font-bold text-[var(--color-navy-900)] text-xs truncate max-w-[200px]" title={log.adminEmail}>
                      {log.adminEmail}
                    </p>
                  </div>

                  <div className="bg-[var(--color-surface-50)] p-2.5 rounded-sm mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-gray-500">{log.module}</span>
                      {log.targetId && (
                        <span className="text-[10px] font-mono text-gray-400 truncate max-w-[120px]">ID: {log.targetId}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {log.details || "-"}
                    </p>
                  </div>

                  {log.ipAddress && (
                    <p className="text-[9px] text-gray-400 font-mono flex items-center gap-1 border-t border-gray-100 pt-2">
                      <Globe className="w-2.5 h-2.5"/> {log.ipAddress}
                    </p>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <AdminCard className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Showing <span className="text-[var(--color-navy-900)] font-mono text-sm">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-[var(--color-navy-900)] font-mono text-sm">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> of <span className="text-[var(--color-navy-900)] font-mono text-sm">{filteredLogs.length}</span>
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <AdminButton 
                variant="outline" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-10 text-xs font-bold rounded-sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </AdminButton>
              <div className="h-10 px-4 flex items-center justify-center bg-gray-100 rounded-sm text-xs font-mono font-bold text-[var(--color-navy-900)] min-w-[80px]">
                {currentPage} / {totalPages}
              </div>
              <AdminButton 
                variant="outline" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-10 text-xs font-bold rounded-sm"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </AdminButton>
            </div>
          </AdminCard>
        )}

      </div>
    </div>
  );
}
