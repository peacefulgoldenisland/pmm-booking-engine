"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Ticket } from 'lucide-react';
import Link from 'next/link';

import { AdminCard, AdminCardContent } from '@/components/admin/ui/AdminCard';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminSelect } from '@/components/admin/ui/AdminSelect';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import type { DiscountType } from '@/types/voucher';

export default function CreateVoucherPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    discountType: 'PERCENTAGE' as DiscountType,
    discountValue: '',
    minTransaction: '',
    validUntil: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Auto-uppercase code field and remove spaces
    if (name === 'code') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase().replace(/\s/g, '') }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.discountValue || !formData.validUntil) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'promo_codes'), {
        code: formData.code,
        name: formData.name,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minTransaction: Number(formData.minTransaction || 0),
        validUntil: new Date(formData.validUntil).toISOString(),
        status: 'ACTIVE',
        usageCount: 0,
        createdAt: serverTimestamp()
      });

      router.push('/admin/vouchers');
    } catch (error) {
      console.error("Error creating promo code:", error);
      alert("Failed to create promo code. Please check console.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-24 max-w-4xl mx-auto">
      {/* Header Area */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/admin/vouchers"
          className="w-10 h-10 rounded-sm bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[var(--color-navy-900)] hover:border-[var(--color-gold-400)] transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-serif text-[var(--color-navy-900)]">Create Promotional Code</h1>
          <p className="text-xs text-gray-500 mt-1">Configure a new generic voucher for broad campaign use.</p>
        </div>
      </div>

      <AdminCard className="overflow-hidden">
        <div className="h-2 w-full bg-[var(--color-gold-500)]" />
        <AdminCardContent className="p-8 md:p-12">
          
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100">
            <div className="w-14 h-14 bg-[var(--color-surface-50)] rounded-full flex items-center justify-center">
              <Ticket className="w-6 h-6 text-[var(--color-gold-500)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Campaign Details</h2>
              <p className="text-xs text-gray-500">All fields below determine how the promo engine calculates the discount.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Identity Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Promo Code <span className="text-red-500">*</span></label>
                <AdminInput 
                  type="text" 
                  name="code"
                  required
                  placeholder="e.g. SUMMERDEALS"
                  value={formData.code}
                  onChange={handleChange}
                  className="font-mono text-lg text-[var(--color-navy-900)] bg-gray-50 border-gray-200 focus-visible:bg-white"
                />
                <p className="text-[10px] text-gray-400 mt-1">No spaces. Auto-capitalized.</p>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Campaign Name <span className="text-red-500">*</span></label>
                <AdminInput 
                  type="text" 
                  name="name"
                  required
                  placeholder="e.g. Summer Vacation Discount 2026"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-gray-50 border-gray-200 focus-visible:bg-white"
                />
              </div>
            </div>

            {/* Mechanics Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Discount Type <span className="text-red-500">*</span></label>
                <AdminSelect 
                  value={formData.discountType}
                  onChange={(val) => setFormData(prev => ({ ...prev, discountType: val as DiscountType }))}
                  options={[
                    { label: "Percentage (%)", value: "PERCENTAGE" },
                    { label: "Fixed Amount (IDR)", value: "FIXED" }
                  ]}
                  className="bg-gray-50 hover:bg-white"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Discount Value <span className="text-red-500">*</span></label>
                <AdminInput 
                  leftIcon={<span className="text-[var(--color-navy-900)] font-bold">{formData.discountType === 'PERCENTAGE' ? '%' : 'Rp'}</span>}
                  type="number" 
                  name="discountValue"
                  required
                  min="1"
                  placeholder={formData.discountType === 'PERCENTAGE' ? "10" : "500000"}
                  value={formData.discountValue}
                  onChange={handleChange}
                  className="bg-gray-50 border-gray-200 focus-visible:bg-white pl-12"
                />
              </div>
            </div>

            {/* Rules Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Minimum Transaction (IDR)</label>
                <AdminInput 
                  type="number" 
                  name="minTransaction"
                  min="0"
                  placeholder="e.g. 1000000 (Optional)"
                  value={formData.minTransaction}
                  onChange={handleChange}
                  className="bg-gray-50 border-gray-200 focus-visible:bg-white"
                />
              </div>

               <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Expiration Date <span className="text-red-500">*</span></label>
                <AdminInput 
                  type="date" 
                  name="validUntil"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.validUntil}
                  onChange={handleChange}
                  className="bg-gray-50 border-gray-200 focus-visible:bg-white text-gray-500 focus-visible:text-[var(--color-navy-900)]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-8 border-t border-gray-100 flex items-center justify-end gap-4">
              <Link href="/admin/vouchers">
                <AdminButton variant="ghost" type="button" className="px-8">
                  Cancel
                </AdminButton>
              </Link>
              <AdminButton type="submit" variant="primary" isLoading={isSubmitting} className="px-8">
                Launch Campaign
              </AdminButton>
            </div>

          </form>
        </AdminCardContent>
      </AdminCard>
    </div>
  );
}
