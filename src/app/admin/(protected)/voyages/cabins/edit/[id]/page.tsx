"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ArrowLeft, Save, Upload, X, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminCard, AdminCardContent } from '@/components/admin/ui/AdminCard';
import type { MasterCabin } from '@/types/voyage';
import { logAuditTrail } from '@/lib/auditLogger';
import { useAuthStore } from '@/store/useAuthStore';

export default function EditCabinPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user: currentUser } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
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

  useEffect(() => {
    const fetchCabin = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as MasterCabin;
          setFormData({
            name: data.name || '',
            description: data.description || '',
            price: data.price ? data.price.toString() : '',
            maxCapacity: data.maxCapacity ? data.maxCapacity.toString() : '',
            totalUnits: data.totalUnits ? data.totalUnits.toString() : '',
            popular: data.popular || false,
          });
          setImages(data.images || []);
        } else {
          router.push('/admin/voyages');
        }
      } catch (error) {
        console.error("Error fetching cabin:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCabin();
  }, [id, router]);

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
        }
      }
      
      setImages(newImageUrls);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.maxCapacity || !formData.totalUnits) return;
    
    setIsSubmitting(true);
    
    try {
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, {
        name: formData.name,
        description: formData.description,
        price: parseInt(formData.price.replace(/,/g, '')),
        maxCapacity: parseInt(formData.maxCapacity),
        totalUnits: parseInt(formData.totalUnits),
        popular: formData.popular,
        images: images,
        updatedAt: serverTimestamp()
      });
      
      await logAuditTrail({
        action: 'UPDATE_CABIN',
        module: 'Cabins',
        targetId: id,
        details: `Updated cabin specifications/pricing for: ${formData.name}`,
        actor: currentUser
      });

      router.push('/admin/voyages');
    } catch (error) {
      console.error("Error updating cabin:", error);
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this Cabin? This cannot be undone.')) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'products', id));
      
      await logAuditTrail({
        action: 'DELETE_CABIN',
        module: 'Cabins',
        targetId: id,
        details: `Deleted cabin class: ${formData.name}`,
        actor: currentUser
      });

      router.push('/admin/voyages');
    } catch (error) {
      console.error("Error deleting cabin:", error);
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="pb-20 max-w-4xl mx-auto flex justify-center py-32">
        <div className="w-8 h-8 border-2 border-[var(--color-gold-500)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-20 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/voyages">
            <button className="w-10 h-10 bg-white border border-gray-200 rounded-sm flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500 hover:text-[var(--color-navy-900)]">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-serif text-[var(--color-navy-900)]">Edit Cabin Details</h1>
            <p className="text-xs text-gray-500 mt-1">Modify cabin specifications and pricing.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-2 space-y-6">
            <AdminCard>
              <AdminCardContent className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-navy-900)] uppercase tracking-widest mb-2">Cabin Name</label>
                  <AdminInput 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-[var(--color-navy-900)] uppercase tracking-widest mb-2">Description</label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
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
                    required 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-navy-900)] uppercase tracking-widest mb-2">Max Capacity (Pax / Unit)</label>
                    <AdminInput 
                      name="maxCapacity" 
                      type="number"
                      value={formData.maxCapacity} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-navy-900)] uppercase tracking-widest mb-2">Total Units (Inventory)</label>
                    <AdminInput 
                      name="totalUnits" 
                      type="number"
                      value={formData.totalUnits} 
                      onChange={handleInputChange} 
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

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:shadow-none md:relative md:bottom-auto md:bg-transparent md:border-none md:p-0 pb-[calc(1rem+env(safe-area-inset-bottom))] flex gap-3">
              <button 
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting || isUploading}
                className="flex items-center justify-center w-14 h-[56px] shrink-0 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                title="Delete Cabin"
              >
                {isDeleting ? <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-5 h-5" />}
              </button>

              <AdminButton 
                type="submit" 
                variant="primary" 
                className="flex-1 shadow-luxury !py-4 rounded-xl"
                disabled={isSubmitting || isUploading || isDeleting}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                )}
              </AdminButton>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
