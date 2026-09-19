"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { 
  Ship, UsersRound, CreditCard, TicketPercent, 
  ArrowRight, Loader2, BellDot, CheckCircle2, Navigation, Anchor
} from 'lucide-react';
import Link from 'next/link';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

import { AdminCard, AdminCardContent } from '@/components/admin/ui/AdminCard';
import type { DashboardStats } from '@/types/admin';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    pendingVerifications: 0,
    totalBookings: 0,
    totalGuests: 0,
    activeVouchers: 0,
    revenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    // Set time-based greeting and date
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    setCurrentDate(new Date().toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    }));

    async function fetchStats() {
      try {
        // Calculate 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

        // Fetch Bookings (Only last 30 days for charts to save read quotas)
        const bookingsRef = collection(db, 'bookings');
        const recentBookingsQuery = query(bookingsRef, where('createdAt', '>=', thirtyDaysAgoStr));
        const bookingsSnap = await getDocs(recentBookingsQuery);
        
        let pending = 0;
        let totalRev30Days = 0;
        
        const revenueMap: Record<string, { display: string; value: number }> = {};
        let sourceAgent = 0;
        let sourceWeb = 0;
        let sourceOffice = 0;

        bookingsSnap.forEach(doc => {
          const data = doc.data();
          if (data.status === 'WAITING_VERIFICATION') pending++;
          
          if (data.status === 'PAID') {
            const amt = data.totalAmount || 0;
            totalRev30Days += amt;
            
            if (data.createdAt) {
              const d = new Date(data.createdAt);
              const sortKey = d.toISOString().split('T')[0];
              const display = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              
              if (!revenueMap[sortKey]) {
                revenueMap[sortKey] = { display, value: 0 };
              }
              revenueMap[sortKey].value += amt;
            }
          }

          const src = data.source || data.bookingSource || 'WEB';
          if (src === 'AGENT') sourceAgent++;
          else if (src === 'OFFICE') sourceOffice++;
          else sourceWeb++;
        });

        // Fill in missing days so the chart doesn't look broken
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const sortKey = d.toISOString().split('T')[0];
          const display = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!revenueMap[sortKey]) {
            revenueMap[sortKey] = { display, value: 0 };
          }
        }

        // Sort revenue by date
        const sortedDates = Object.keys(revenueMap).sort();
        const revenueTrend = sortedDates.map(key => ({
          label: revenueMap[key].display,
          value: revenueMap[key].value
        }));

        const bookingSources = [
          { name: 'Travel Agent', value: sourceAgent },
          { name: 'App / Web', value: sourceWeb },
          { name: 'Office Walk-in', value: sourceOffice },
        ].filter(s => s.value > 0);

        // Get Grand Totals using getCountFromServer
        const totalBookingsSnap = await getCountFromServer(collection(db, 'bookings'));
        const totalUsersSnap = await getCountFromServer(collection(db, 'users'));
        
        // Fetch Active Vouchers
        const vouchersRef = collection(db, 'promo_codes');
        const qVouchers = query(vouchersRef, where('status', '==', 'ACTIVE'));
        const vouchersSnap = await getDocs(qVouchers);

        // Fetch Occupancy for closest voyage
        const today = new Date().toISOString().split('T')[0];
        const voyagesSnap = await getDocs(query(collection(db, 'voyages'), where('departureDate', '>=', today)));
        let occupancyData: any[] = [];
        
        if (!voyagesSnap.empty) {
           const upcoming = voyagesSnap.docs.map(d => d.data());
           upcoming.sort((a, b) => a.departureDate.localeCompare(b.departureDate));
           const closest = upcoming[0];
           
           const productsSnap = await getDocs(collection(db, 'products'));
           occupancyData = productsSnap.docs.map(doc => {
              const cabin = doc.data();
              const capacity = cabin.totalUnits || 0;
              const remaining = closest.cabinQuotas?.[cabin.id] ?? capacity;
              return {
                 name: cabin.name,
                 capacity,
                 sold: Math.max(0, capacity - remaining),
                 remaining
              };
           });
        }

        setStats({
          pendingVerifications: pending,
          totalBookings: totalBookingsSnap.data().count,
          totalGuests: totalUsersSnap.data().count,
          activeVouchers: vouchersSnap.size,
          revenue: totalRev30Days,
          revenueTrend,
          bookingSources,
          occupancyData
        });

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Ship className="w-10 h-10 text-[var(--color-gold-500)] opacity-80" />
        </motion.div>
        <p className="mt-4 text-xs font-serif text-[var(--color-gold-600)] uppercase tracking-widest animate-pulse">
          Initializing Dashboard...
        </p>
      </div>
    );
  }

  // Define animation variants for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } }
  };

  return (
    <div className="pb-24 min-h-screen bg-gray-50/30">
      {/* 1. Dynamic Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8 p-8 rounded-2xl overflow-hidden bg-[var(--color-navy-900)] shadow-luxury"
      >
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-gold-500)] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[var(--color-gold-400)] text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <Anchor className="w-3 h-3" /> DASHBOARD
            </p>
            <h1 className="text-3xl md:text-4xl font-serif text-white">{greeting}, Admin.</h1>
            <p className="text-gray-400 text-sm mt-1">{currentDate}</p>
          </div>
          
          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
             <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
             <span className="text-xs text-white font-medium tracking-wide">All Systems Operational</span>
          </div>
        </div>
      </motion.div>

      {/* 2. High-Priority Action Banner */}
      <AnimatePresence>
        {stats.pendingVerifications > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="mb-8"
          >
            <Link href="/admin/bookings" className="block relative group overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 p-[1px] shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300">
              <div className="absolute inset-0 bg-white/20 group-hover:bg-white/0 transition-colors duration-300"></div>
              <div className="relative flex items-center justify-between bg-white rounded-[11px] p-5">
                <div className="flex items-center gap-5">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <div className="absolute inset-0 bg-amber-100 rounded-full animate-ping opacity-75"></div>
                    <div className="relative z-10 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 border border-amber-200">
                      <BellDot className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-navy-900)] uppercase tracking-widest flex items-center gap-2">
                      Verification Required
                      <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {stats.pendingVerifications} PENDING
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">There are payments awaiting your manual verification.</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* 3. KPI Metrics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <motion.div variants={itemVariants}>
            <AdminCard className="relative overflow-hidden group hover:border-[var(--color-gold-400)] transition-colors duration-500 bg-white shadow-sm hover:shadow-md">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
              <AdminCardContent className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Ship className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Total Bookings</p>
                <p className="text-3xl font-serif text-[var(--color-navy-900)]">{stats.totalBookings}</p>
              </AdminCardContent>
            </AdminCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <AdminCard className="relative overflow-hidden group hover:border-[var(--color-gold-400)] transition-colors duration-500 bg-white shadow-sm hover:shadow-md">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
              <AdminCardContent className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                    <UsersRound className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Registered Guests</p>
                <p className="text-3xl font-serif text-[var(--color-navy-900)]">{stats.totalGuests}</p>
              </AdminCardContent>
            </AdminCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <AdminCard className="relative overflow-hidden group hover:border-[var(--color-gold-400)] transition-colors duration-500 bg-white shadow-sm hover:shadow-md">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
              <AdminCardContent className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                    <TicketPercent className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Active Promos</p>
                <p className="text-3xl font-serif text-[var(--color-navy-900)]">{stats.activeVouchers}</p>
              </AdminCardContent>
            </AdminCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <AdminCard className="relative overflow-hidden group border-[var(--color-gold-400)] bg-gradient-to-br from-[var(--color-navy-900)] to-[var(--color-navy-800)] shadow-luxury">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-gold-500)] opacity-10 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-700"></div>
              <AdminCardContent className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-[var(--color-gold-400)] border border-white/10 group-hover:scale-110 transition-transform duration-300">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                    <span className="text-[9px] text-white font-medium">Last 30 Days</span>
                  </div>
                </div>
                <p className="text-[10px] text-[var(--color-gold-400)] uppercase tracking-widest font-bold mb-1">Total Revenue</p>
                <div className="flex items-end gap-1.5">
                  <span className="text-sm text-gray-400 mb-1.5 font-medium">IDR</span>
                  <p className="text-3xl font-serif text-white">{stats.revenue.toLocaleString('id-ID')}</p>
                </div>
              </AdminCardContent>
            </AdminCard>
          </motion.div>

        </div>

        {/* 4. Analytics Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          
          {/* Revenue Trend (Spans 2 columns on extra large screens) */}
          <motion.div variants={itemVariants} className="xl:col-span-2">
            <AdminCard className="h-full bg-white shadow-sm hover:shadow-md transition-shadow">
              <AdminCardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-bold text-[var(--color-navy-900)] uppercase tracking-widest">Revenue Trajectory</h3>
                  <div className="bg-[var(--color-surface-50)] px-3 py-1 rounded-full border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-500">IDR (Millions)</span>
                  </div>
                </div>
                
                <div className="flex-1 min-h-[300px] w-full relative">
                  {stats.revenueTrend && stats.revenueTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.revenueTrend} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-navy-900)" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="var(--color-navy-900)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                          dataKey="label" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#9ca3af' }} 
                          dy={10} 
                          minTickGap={30}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#9ca3af' }}
                          tickFormatter={(value) => `${(value/1000000).toFixed(0)}M`}
                        />
                        <RechartsTooltip 
                          formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Revenue']}
                          contentStyle={{ 
                            backgroundColor: 'var(--color-navy-900)', 
                            borderRadius: '12px', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)',
                            color: 'white'
                          }}
                          itemStyle={{ color: 'var(--color-gold-400)', fontWeight: 'bold' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="var(--color-navy-900)" 
                          strokeWidth={3} 
                          dot={{ fill: 'white', stroke: 'var(--color-navy-900)', strokeWidth: 2, r: 4 }} 
                          activeDot={{ fill: 'var(--color-gold-500)', stroke: 'white', strokeWidth: 2, r: 7 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                      <CreditCard className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm font-medium">Insufficient Data Pipeline</p>
                    </div>
                  )}
                </div>
              </AdminCardContent>
            </AdminCard>
          </motion.div>

          {/* Right Column Stack (Occupancy & Sources) */}
          <div className="flex flex-col gap-6 xl:col-span-1">
            
            {/* Occupancy */}
            <motion.div variants={itemVariants} className="flex-1">
              <AdminCard className="h-full bg-white shadow-sm hover:shadow-md transition-shadow">
                <AdminCardContent className="p-6 h-full flex flex-col">
                  <h3 className="text-sm font-bold text-[var(--color-navy-900)] uppercase tracking-widest mb-6">Upcoming Schedule</h3>
                  <div className="flex-1 min-h-[180px] w-full relative">
                    {stats.occupancyData && stats.occupancyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.occupancyData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                          <XAxis type="number" hide />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 'bold' }} 
                            width={100}
                          />
                          <RechartsTooltip 
                            cursor={{ fill: 'var(--color-surface-50)' }}
                            contentStyle={{ 
                              backgroundColor: 'white',
                              borderRadius: '12px', 
                              border: '1px solid #e5e7eb', 
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            }}
                          />
                          <Bar dataKey="sold" name="Allocated" stackId="a" fill="var(--color-navy-900)" radius={[0, 0, 0, 0]} barSize={16} />
                          <Bar dataKey="remaining" name="Available" stackId="a" fill="var(--color-gold-300)" radius={[0, 4, 4, 0]} barSize={16} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                        <Ship className="w-10 h-10 mb-3 opacity-20" />
                        <p className="text-xs font-medium">No active trips</p>
                      </div>
                    )}
                  </div>
                </AdminCardContent>
              </AdminCard>
            </motion.div>

            {/* Booking Sources */}
            <motion.div variants={itemVariants} className="flex-1">
              <AdminCard className="h-full bg-[var(--color-surface-50)] shadow-sm hover:shadow-md transition-shadow border-none">
                <AdminCardContent className="p-6 h-full flex flex-col items-center justify-center">
                  <h3 className="text-sm font-bold text-[var(--color-navy-900)] uppercase tracking-widest mb-2 w-full text-left">Traffic Source</h3>
                  <div className="flex-1 w-full relative min-h-[160px]">
                    {stats.bookingSources && stats.bookingSources.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.bookingSources}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {stats.bookingSources.map((entry, index) => {
                              const colors = ['var(--color-navy-900)', 'var(--color-gold-500)', '#9ca3af'];
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                            })}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value: any) => [`${value} Guests`, 'Volume']}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '8px 12px' }}
                          />
                          <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                        <Navigation className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-xs">No routing data</p>
                      </div>
                    )}
                  </div>
                </AdminCardContent>
              </AdminCard>
            </motion.div>

          </div>
        </div>

        {/* 5. Quick Feature Hub */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-gold-100)] flex items-center justify-center">
              <Navigation className="w-4 h-4 text-[var(--color-gold-600)]" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-navy-900)]">Quick Links</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/admin/bookings" className="group relative overflow-hidden bg-white border border-gray-200 p-5 rounded-2xl hover:border-[var(--color-gold-400)] hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[var(--color-surface-50)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-surface-50)] group-hover:bg-[var(--color-gold-500)] flex items-center justify-center transition-colors duration-300">
                    <Ship className="w-5 h-5 text-[var(--color-navy-900)] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-navy-900)]">Bookings</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Manage Bookings</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-[var(--color-gold-400)] group-hover:bg-[var(--color-gold-50)] transition-all">
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[var(--color-gold-600)]" />
                </div>
              </div>
            </Link>

            <Link href="/admin/guests" className="group relative overflow-hidden bg-white border border-gray-200 p-5 rounded-2xl hover:border-[var(--color-gold-400)] hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[var(--color-surface-50)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-surface-50)] group-hover:bg-[var(--color-gold-500)] flex items-center justify-center transition-colors duration-300">
                    <UsersRound className="w-5 h-5 text-[var(--color-navy-900)] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-navy-900)]">Guest Directory</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">View Client Profiles</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-[var(--color-gold-400)] group-hover:bg-[var(--color-gold-50)] transition-all">
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[var(--color-gold-600)]" />
                </div>
              </div>
            </Link>

            <Link href="/admin/vouchers" className="group relative overflow-hidden bg-white border border-gray-200 p-5 rounded-2xl hover:border-[var(--color-gold-400)] hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[var(--color-surface-50)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-surface-50)] group-hover:bg-[var(--color-gold-500)] flex items-center justify-center transition-colors duration-300">
                    <TicketPercent className="w-5 h-5 text-[var(--color-navy-900)] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-navy-900)]">Promo & Vouchers</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Marketing Campaigns</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-[var(--color-gold-400)] group-hover:bg-[var(--color-gold-50)] transition-all">
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[var(--color-gold-600)]" />
                </div>
              </div>
            </Link>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
