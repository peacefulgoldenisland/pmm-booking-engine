"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Phone, Globe, CreditCard, Utensils, 
  Camera, UploadCloud, CheckCircle, Loader2, ArrowLeft, FileText, ChevronDown, CheckCircle2
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import Image from 'next/image';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

export default function EditProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState("");

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingPassport, setUploadingPassport] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    nationality: '',
    passportNumber: '',
    dietaryRequirements: 'None',
    gender: 'Male',
    photoUrl: '',
    passportFileUrl: '',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.uid);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setFormData({
            fullName: data.fullName || '',
            phone: data.phone || '',
            nationality: data.nationality || '',
            passportNumber: data.passportNumber || '',
            dietaryRequirements: data.dietaryRequirements || 'None',
            gender: data.gender || 'Male',
            photoUrl: data.photoUrl || '',
            passportFileUrl: data.passportFileUrl || '',
          });
        }
      } catch (error) {
        console.error("Error fetching profile for edit:", error);
      } finally {
        setTimeout(() => setIsLoading(false), 500);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'passport') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'photo') setUploadingPhoto(true);
    if (type === 'passport') setUploadingPassport(true);

    try {
      const data = new FormData();
      data.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const textResponse = await response.text();
      let result;

      try {
        result = JSON.parse(textResponse);
      } catch (err) {
        console.error("Response bermasalah:", textResponse);
        throw new Error("Failed to process server response.");
      }

      if (response.ok && result.url) {
        setFormData(prev => ({
          ...prev,
          [type === 'photo' ? 'photoUrl' : 'passportFileUrl']: result.url
        }));
      } else {
        alert(`Upload failed: ${result.error || 'Server error'}`);
      }
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      alert(error.message || "Connection error during upload.");
    } finally {
      if (type === 'photo') setUploadingPhoto(false);
      if (type === 'passport') setUploadingPassport(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, formData);
      router.push('/dashboard/profile');
    } catch (error) {
      console.error("Error updating profile doc:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-50)] font-sans pb-24">
        <DashboardHeader />
        <main className="max-w-5xl mx-auto px-4 md:px-6 pt-32">
          <Skeleton className="w-1/3 h-10 mb-12" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4 space-y-4">
               <Skeleton className="w-full h-8" />
               <Skeleton className="w-5/6 h-4" />
            </div>
            <div className="lg:col-span-8 space-y-6">
              <Skeleton className="w-full h-[300px] rounded-sm" />
              <Skeleton className="w-full h-[400px] rounded-sm" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-50)] font-sans pb-24">
      <DashboardHeader />

      {/* HEADER MINIMALIS */}
      <header className="bg-white pt-32 pb-8 px-4 md:px-6 border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
            <button 
                onClick={() => router.push('/dashboard/profile')} 
                className="text-[var(--color-navy-900)] hover:text-[var(--color-gold-500)] text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 mb-6"
            >
                <ArrowLeft className="w-4 h-4" /> Return to Dossier
            </button>
            <h1 className="text-3xl md:text-4xl font-serif text-[var(--color-navy-900)]">Modify Identity</h1>
            <p className="text-gray-500 font-light text-sm mt-2">Ensure your details match your travel documents exactly for harbor clearance.</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 mt-12">
        <form onSubmit={handleSubmit} className="space-y-16">
          
          {/* SECTION 1: AVATAR (SPLIT LAYOUT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 border-b border-gray-200 pb-16">
            <div className="lg:col-span-4">
              <h2 className="text-xl font-serif text-[var(--color-navy-900)] mb-2">Profile Portrait</h2>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Used for crew recognition during boarding and personalized concierge services on board.
              </p>
            </div>
            <div className="lg:col-span-8">
              <div className="bg-white p-8 border border-gray-200 rounded-sm shadow-sm flex items-center gap-8">
                <div className="relative w-24 h-24 bg-[var(--color-surface-50)] rounded-full p-1 border border-gray-200 group overflow-hidden shrink-0">
                  {formData.photoUrl ? (
                    <Image 
                      src={formData.photoUrl} 
                      alt="Avatar Preview" 
                      width={96} 
                      height={96} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-300" />
                    </div>
                  )}

                  <label className="absolute inset-0 bg-[var(--color-navy-900)]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[9px] font-bold tracking-widest uppercase rounded-full">
                    <Camera className="w-4 h-4 text-[var(--color-gold-500)] mb-1" />
                    {uploadingPhoto ? "Wait" : "Change"}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, 'photo')} 
                      disabled={uploadingPhoto}
                    />
                  </label>

                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-[var(--color-navy-900)]/80 flex items-center justify-center rounded-full z-10">
                      <Loader2 className="w-5 h-5 text-[var(--color-gold-500)] animate-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--color-navy-900)] mb-1">Recommended Format</h3>
                  <p className="text-xs text-gray-500 font-light mb-4">Square image, Max 2MB (JPG, PNG)</p>
                  <label className="bg-[var(--color-surface-50)] hover:bg-[var(--color-gold-50)] border border-gray-200 hover:border-[var(--color-gold-300)] text-[var(--color-navy-900)] px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer inline-block">
                    {uploadingPhoto ? "Uploading..." : "Upload New Portrait"}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, 'photo')} 
                      disabled={uploadingPhoto}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: PERSONAL DOSSIER (SPLIT LAYOUT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 border-b border-gray-200 pb-16">
            <div className="lg:col-span-4">
              <h2 className="text-xl font-serif text-[var(--color-navy-900)] mb-2">Personal Details</h2>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Please ensure this information matches your official travel documents perfectly to avoid delays during harbor clearance.
              </p>
            </div>
            <div className="lg:col-span-8">
              <div className="bg-white p-8 border border-gray-200 rounded-sm shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  
                  <Input 
                    label="Full Name (As in Passport)" 
                    name="fullName"
                    type="text" 
                    required 
                    value={formData.fullName} 
                    onChange={handleChange} 
                    placeholder="e.g. John Doe"
                    icon={<User className="w-4 h-4" />} 
                  />

                  <Input 
                    label="WhatsApp / Contact Number" 
                    name="phone"
                    type="tel" 
                    required 
                    value={formData.phone} 
                    onChange={handleChange} 
                    placeholder="+62 812..."
                    icon={<Phone className="w-4 h-4" />} 
                  />

                  <Input 
                    label="Nationality" 
                    name="nationality"
                    type="text" 
                    required 
                    value={formData.nationality} 
                    onChange={handleChange} 
                    placeholder="e.g. United Kingdom"
                    icon={<Globe className="w-4 h-4" />} 
                  />

                  <Input 
                    label="Passport / ID Number" 
                    name="passportNumber"
                    type="text" 
                    required 
                    value={formData.passportNumber} 
                    onChange={handleChange} 
                    placeholder="A1234567"
                    className="uppercase tracking-widest font-mono text-sm"
                    icon={<CreditCard className="w-4 h-4" />} 
                  />

                  {/* Custom Styled Selects */}
                  <div className="flex flex-col w-full relative">
                    <label className="text-xs font-medium text-gray-500 mb-1.5">Gender</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 text-gray-400 pointer-events-none"><User className="w-4 h-4" /></div>
                      <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-[var(--color-surface-50)] border border-gray-200 hover:border-[var(--color-gold-400)] focus:border-[var(--color-gold-500)] focus:ring-4 focus:ring-[var(--color-gold-500)]/15 text-[var(--color-navy-900)] px-4 py-3.5 pl-11 rounded-xl appearance-none outline-none transition-all cursor-pointer">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                      <div className="absolute right-4 text-gray-400 pointer-events-none"><ChevronDown className="w-4 h-4" /></div>
                    </div>
                  </div>

                  <div className="flex flex-col w-full relative">
                    <label className="text-xs font-medium text-gray-500 mb-1.5">Dietary Restrictions</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 text-gray-400 pointer-events-none"><Utensils className="w-4 h-4" /></div>
                      <select name="dietaryRequirements" value={formData.dietaryRequirements} onChange={handleChange} className="w-full bg-[var(--color-surface-50)] border border-gray-200 hover:border-[var(--color-gold-400)] focus:border-[var(--color-gold-500)] focus:ring-4 focus:ring-[var(--color-gold-500)]/15 text-[var(--color-navy-900)] px-4 py-3.5 pl-11 rounded-xl appearance-none outline-none transition-all cursor-pointer">
                        <option value="None">None (No Restrictions)</option>
                        <option value="Vegetarian">Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                        <option value="Halal">Halal</option>
                        <option value="Gluten-Free">Gluten-Free</option>
                      </select>
                      <div className="absolute right-4 text-gray-400 pointer-events-none"><ChevronDown className="w-4 h-4" /></div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: TRAVEL DOCUMENT (SPLIT LAYOUT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 border-b border-gray-200 pb-16">
            <div className="lg:col-span-4">
              <h2 className="text-xl font-serif text-[var(--color-navy-900)] mb-2">Clearance Document</h2>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Upload a clear, legible scan or photo of your primary passport page. This file is encrypted and required by maritime law.
              </p>
            </div>
            <div className="lg:col-span-8">
              {formData.passportFileUrl ? (
                <div className="bg-green-50/50 border border-green-200 p-8 rounded-sm shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="bg-green-100 p-3 rounded-full text-green-600 shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-serif text-[var(--color-navy-900)] text-lg mb-0.5">Document Vaulted</p>
                      <p className="text-xs text-gray-500 font-light">Your passport is securely stored on our servers.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <a 
                      href={formData.passportFileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] font-bold text-[var(--color-navy-900)] hover:text-[var(--color-gold-600)] transition-colors uppercase tracking-widest underline underline-offset-4 w-1/2 md:w-auto text-center"
                    >
                      Inspect File
                    </a>
                    <label className="bg-white border border-gray-200 text-[var(--color-navy-900)] hover:border-[var(--color-gold-400)] hover:text-[var(--color-gold-600)] px-6 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all cursor-pointer w-1/2 md:w-auto text-center">
                      {uploadingPassport ? "Processing..." : "Update File"}
                      <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        className="hidden" 
                        onChange={(e) => handleFileChange(e, 'passport')} 
                        disabled={uploadingPassport}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="block bg-[var(--color-surface-50)] hover:bg-[var(--color-gold-50)]/50 border-2 border-dashed border-gray-200 hover:border-[var(--color-gold-400)] rounded-sm p-12 flex flex-col items-center text-center cursor-pointer transition-colors group relative">
                  {uploadingPassport ? (
                    <Loader2 className="w-8 h-8 text-[var(--color-gold-500)] animate-spin mb-4" />
                  ) : (
                    <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-[var(--color-gold-500)] group-hover:scale-110 transition-all mb-4" />
                  )}
                  <p className="text-sm font-medium text-[var(--color-navy-900)] mb-1">
                    {uploadingPassport ? "Encrypting and Uploading..." : "Click or drag file to upload"}
                  </p>
                  <p className="text-[11px] text-gray-400 font-light">Supports JPG, PNG, or PDF up to 5MB</p>
                  <input 
                    type="file" 
                    accept="image/*,application/pdf" 
                    className="hidden" 
                    onChange={(e) => handleFileChange(e, 'passport')} 
                    disabled={uploadingPassport}
                  />
                </label>
              )}
            </div>
          </div>

          {/* ACTION BUTTON SUBMIT */}
          <div className="flex justify-end pt-4">
            <Button 
              type="submit"
              disabled={isSaving || uploadingPhoto || uploadingPassport}
              className="w-full md:w-auto !rounded-sm !py-4 !px-10 text-sm uppercase tracking-widest"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving Configuration</>
              ) : (
                <>Finalize Identity Profile <CheckCircle className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>

        </form>
      </main>
    </div>
  );
}