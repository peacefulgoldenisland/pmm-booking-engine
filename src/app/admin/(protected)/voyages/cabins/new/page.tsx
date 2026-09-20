"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import Link from 'next/link';

import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminCard, AdminCardContent } from '@/components/admin/ui/AdminCard';
import { logAuditTrail } from '@/lib/auditLogger';
import { useAuthStore } from '@/store/useAuthStore';

export default function NewCabinPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    maxCapacity: '',
    totalUnits: '',
    popular: false,
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, popular: e.target.checked }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    try {
      const newImageUrls = [...images];
      
      // Upload each file sequentially
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const formDataPayload = new FormData();
        formDataPayload.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataPayload
        });
        
        if (response.ok) {
          const data = await response.json();
          newImageUrls.push(data.url);
        } else {
          console.error("Failed to upload image");
        }
      }
      
      setImages(newImageUrls);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = ''; // Reset input
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.maxCapacity) return;
    
    setIsSubmitting(true);
    
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        name: formData.name,
        description: formData.description,
        price: parseInt(formData.price.replace(/,/g, '')),
        maxCapacity: parseInt(formData.maxCapacity),
        totalUnits: parseInt(formData.totalUnits),
        popular: formData.popular,
        images: images,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      await logAuditTrail({
        action: 'CREATE_CABIN',
        module: 'Cabins',
        targetId: docRef.id,
        details: `Created new cabin class: ${formData.name}`,
        actor: currentUser
      });

      router.push('/admin/voyages');
    } catch (error) {
      console.error("Error adding cabin:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-20 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/voyages">
          <button className="w-10 h-10 bg-white border border-gray-200 rounded-sm flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500 hover:text-[var(--color-navy-900)]">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-serif text-[var(--color-navy-900)]">Add New Cabin</h1>
          <p className="text-xs text-gray-500 mt-1">Register a new cabin type to the fleet.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            <AdminCard>
              <AdminCardContent className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-navy-900)] uppercase tracking-widest mb-2">Cabin Name</label>
                  <AdminInput 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder="e.g. Private Cabin Sea View" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-[var(--color-navy-900)] uppercase tracking-widest mb-2">Description</label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    placeholder="Describe the cabin features and experience..." 
                    className="w-full min-h-[120px] p-4 bg-gray-50/50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-[var(--color-gold-500)] focus:ring-1 focus:ring-[var(--color-gold-500)]/20 transition-all resize-y"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-navy-900)] uppercase tracking-widest mb-2">Price per Cabin (IDR)</label>
                  <AdminInput 
                    name="price" 
                    type="number"
                    value={formData.price} 
                    onChange={handleInputChange} 
                    placeholder="e.g. 4600000" 
                    required 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Max Capacity (Pax / Unit)</label>
                    <AdminInput 
                      type="number"
                      placeholder="e.g. 2"
                      value={formData.maxCapacity}
                      onChange={(e) => setFormData({...formData, maxCapacity: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Total Units (Inventory)</label>
                    <AdminInput 
                      type="number"
                      placeholder="e.g. 4"
                      value={formData.totalUnits}
                      onChange={(e) => setFormData({...formData, totalUnits: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <input 
                    type="checkbox" 
                    id="popular" 
                    name="popular" 
                    checked={formData.popular}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 text-[var(--color-gold-500)] border-gray-300 rounded focus:ring-[var(--color-gold-500)]"
                  />
                  <label htmlFor="popular" className="text-sm font-medium text-[var(--color-navy-900)] cursor-pointer">
                    Mark as Popular
                  </label>
                </div>
              </AdminCardContent>
            </AdminCard>
          </div>

          {/* Media & Actions */}
          <div className="space-y-6">
            <AdminCard>
              <AdminCardContent className="p-6">
                <label className="block text-xs font-bold text-[var(--color-navy-900)] uppercase tracking-widest mb-4">Cabin Gallery</label>
                
                <div className="space-y-4">
                  {images.map((url, idx) => (
                    <div key={idx} className="relative rounded-sm overflow-hidden border border-gray-200 aspect-video group bg-gray-100">
                      <img src={url} alt={`Cabin preview ${idx}`} className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 w-7 h-7 bg-white/90 text-red-500 rounded-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleImageUpload} 
                      disabled={isUploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                    />
                    <div className={`w-full aspect-video border-2 border-dashed rounded-sm flex flex-col items-center justify-center gap-2 transition-colors ${isUploading ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-[var(--color-gold-500)] hover:bg-[var(--color-gold-500)]/5'}`}>
                      {isUploading ? (
                        <div className="w-6 h-6 border-2 border-[var(--color-gold-500)] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-gray-400" />
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Upload Images</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </AdminCardContent>
            </AdminCard>

            <AdminButton 
              type="submit" 
              variant="primary" 
              className="w-full shadow-luxury !py-4"
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save Cabin</>
              )}
            </AdminButton>
          </div>

        </div>
      </form>
    </div>
  );
}
