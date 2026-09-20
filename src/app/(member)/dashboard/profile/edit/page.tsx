"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Phone, Globe, CreditCard, Utensils, 
  CheckCircle, Loader2, ArrowLeft, ChevronDown 
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { AvatarUploader } from '@/components/profile/AvatarUploader';
import { DocumentUploader } from '@/components/profile/DocumentUploader';

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
    } catch (error: unknown) {
      const err = error as Error;
      console.error(`Error uploading ${type}:`, err);
      alert(err.message || "Connection error during upload.");
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
                <ArrowLeft className="w-4 h-4" /> Back to Profile
            </button>
            <h1 className="text-3xl md:text-4xl font-serif text-[var(--color-navy-900)]">Edit Profile</h1>
            <p className="text-gray-500 font-light text-sm mt-2">Please keep your details up to date.</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 mt-12">
        <form onSubmit={handleSubmit} className="space-y-16">
          
          {/* SECTION 1: AVATAR (SPLIT LAYOUT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 border-b border-gray-200 pb-16">
            <div className="lg:col-span-4">
              <h2 className="text-xl font-serif text-[var(--color-navy-900)] mb-2">Profile Picture</h2>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Upload a photo to help us recognize you during your stay.
              </p>
            </div>
            <AvatarUploader 
              photoUrl={formData.photoUrl} 
              isUploading={uploadingPhoto} 
              onUpload={(e) => handleFileChange(e, 'photo')} 
            />
          </div>

          {/* SECTION 2: PERSONAL DOSSIER (SPLIT LAYOUT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 border-b border-gray-200 pb-16">
            <div className="lg:col-span-4">
              <h2 className="text-xl font-serif text-[var(--color-navy-900)] mb-2">Personal Details</h2>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Make sure your information matches your official travel documents.
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
              <h2 className="text-xl font-serif text-[var(--color-navy-900)] mb-2">Travel Document</h2>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Upload a clear scan or photo of your passport or ID.
              </p>
            </div>
            <DocumentUploader 
              passportFileUrl={formData.passportFileUrl} 
              isUploading={uploadingPassport} 
              onUpload={(e) => handleFileChange(e, 'passport')} 
            />
          </div>

          {/* ACTION BUTTON SUBMIT */}
          <div className="flex justify-end pt-4">
            <Button 
              type="submit"
              disabled={isSaving || uploadingPhoto || uploadingPassport}
              className="w-full md:w-auto !rounded-sm !py-4 !px-10 text-sm uppercase tracking-widest"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving Changes</>
              ) : (
                <>Save Profile <CheckCircle className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>

        </form>
      </main>
    </div>
  );
}