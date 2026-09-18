"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, UploadCloud, CheckCircle2, MessageSquareQuote, Lock, Calendar, Edit3, Loader2, Camera, Sparkles } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Booking } from '@/types/booking';
import type { GuestProfile } from '@/types/user';

interface ReviewManagerProps {
  booking: Booking;
  userProfile: GuestProfile | null;
}

export function ReviewManager({ booking, userProfile }: ReviewManagerProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  
  // Form States
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewImage, setReviewImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Hitung hari berjalan (Day 1 - 4)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const depDateRaw = booking.dateOfDeparture || booking.date; 
  const depDate = typeof depDateRaw === 'string' || typeof depDateRaw === 'number'
    ? new Date(depDateRaw)
    : (depDateRaw as any)?.toDate?.() || new Date();
  depDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - depDate.getTime();
  const currentTripDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const fetchReviews = async () => {
    try {
      const q = query(collection(db, 'reviews'), where('bookingId', '==', booking.id));
      const snap = await getDocs(q);
      const fetchedReviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(fetchedReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [booking.id]);

  // UPLOAD MENGGUNAKAN API BACKEND (R2)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setReviewImage(data.url);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert('Upload failed due to network error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const openReviewModal = (day: number, existingReview?: any) => {
    setSelectedDay(day);
    if (existingReview) {
      setEditingReviewId(existingReview.id);
      setRating(existingReview.rating);
      setComment(existingReview.comment);
      setReviewImage(existingReview.imageUrls?.[0] || '');
    } else {
      setEditingReviewId(null);
      setRating(5);
      setComment('');
      setReviewImage('');
    }
    setIsModalOpen(true);
  };

  const submitReview = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile?.uid || booking.userId,
          bookingId: booking.id,
          tripDay: selectedDay,
          userName: userProfile?.fullName || 'Esteemed Guest',
          rating,
          comment,
          imageUrls: reviewImage ? [reviewImage] : [],
          reviewId: editingReviewId 
        })
      });
      const result = await response.json();
      if (response.ok) {
        if (!editingReviewId) {
          // Alert native bisa diganti toast notification nanti, untuk sekarang biarkan alert
          alert(`Voyage log sealed. You have been awarded ${result.earnedPoints} Gold Points.`);
        }
        setIsModalOpen(false);
        fetchReviews(); 
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-8 border-t border-gray-200 pt-8 animate-pulse">
         <div className="h-4 bg-gray-200 w-48 rounded mb-6" />
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="h-24 bg-gray-100 rounded-sm" />
           <div className="h-24 bg-gray-100 rounded-sm" />
           <div className="h-24 bg-gray-100 rounded-sm" />
           <div className="h-24 bg-gray-100 rounded-sm" />
         </div>
      </div>
    );
  }

  // Render 4 Hari Trip
  return (
    <div className="mt-8 border-t border-gray-200 pt-8">
      <h4 className="text-[10px] font-bold text-[var(--color-navy-900)] uppercase tracking-widest mb-6 flex items-center gap-2">
        <Calendar className="w-3.5 h-3.5 text-[var(--color-gold-500)]" /> Captain's Logbook
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((day) => {
          const isUnlocked = currentTripDay >= day;
          const existingReview = reviews.find(r => r.tripDay === day);

          return (
            <div 
              key={day} 
              className={`p-5 rounded-sm border transition-all relative overflow-hidden flex flex-col justify-between min-h-[110px] ${
                existingReview 
                  ? 'bg-[var(--color-surface-50)] border-[var(--color-gold-300)]' 
                  : isUnlocked 
                    ? 'bg-white border-gray-200 shadow-sm hover:border-[var(--color-gold-400)]' 
                    : 'bg-gray-50 border-gray-100 opacity-60'
              }`}
            >
              {existingReview && <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-gold-500)]" />}
              
              <div className="flex justify-between items-start mb-4">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Day {day}</span>
                {!isUnlocked && !existingReview && <Lock className="w-3 h-3 text-gray-300" />}
                {existingReview && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-gold-600)]" />}
              </div>

              {existingReview ? (
                <div className="mt-auto">
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(existingReview.rating)].map((_, i) => <Star key={i} className="w-3 h-3 text-[var(--color-gold-500)] fill-[var(--color-gold-500)]" />)}
                  </div>
                  <button onClick={() => openReviewModal(day, existingReview)} className="text-[9px] font-bold text-[var(--color-navy-900)] hover:text-[var(--color-gold-600)] uppercase tracking-widest flex items-center gap-1 transition-colors">
                    <Edit3 className="w-3 h-3" /> Amend Log
                  </button>
                </div>
              ) : isUnlocked ? (
                <button 
                  onClick={() => openReviewModal(day)} 
                  className="w-full mt-auto bg-[var(--color-navy-900)] hover:bg-[var(--color-navy-800)] text-white text-[9px] font-bold uppercase tracking-widest py-2 rounded-sm transition-colors flex justify-center items-center gap-1.5"
                >
                  <MessageSquareQuote className="w-3 h-3" /> Append (+50 Pts)
                </button>
              ) : (
                <div className="mt-auto">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Classified</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Day ${selectedDay} Logbook Entry`}>
        <div className="space-y-8">
          
          {!editingReviewId && (
            <div className="bg-[var(--color-surface-50)] border border-[var(--color-gold-200)] p-4 rounded-sm flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-[var(--color-gold-600)] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[var(--color-navy-900)] leading-relaxed">
                Chronicle your maritime experiences for Day {selectedDay}. Detailed entries with imagery will be rewarded with up to <strong className="text-[var(--color-gold-600)]">75 Mileage Points</strong>.
              </p>
            </div>
          )}

          <div>
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 block text-center">Voyage Rating</label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star} 
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star 
                    className={`w-8 h-8 ${rating >= star ? 'text-[var(--color-gold-500)] fill-[var(--color-gold-500)] drop-shadow-sm' : 'text-gray-200'}`} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Captain's Notes</label>
            <textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chronicle the ocean breeze, the manta rays, the exquisite dining..."
              className="w-full bg-[var(--color-surface-50)] border border-gray-200 hover:border-[var(--color-gold-300)] focus:border-[var(--color-gold-500)] focus:ring-1 focus:ring-[var(--color-gold-500)] rounded-sm p-4 text-[var(--color-navy-900)] text-sm outline-none min-h-[120px] resize-none transition-all"
            />
          </div>

          <div>
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-between">
              Visual Documentation
              {!editingReviewId && <span className="text-[var(--color-gold-600)]">+25 Bonus Points</span>}
            </label>
            <div className="relative h-36 border border-dashed border-gray-300 rounded-sm flex items-center justify-center bg-[var(--color-surface-50)] hover:bg-white hover:border-[var(--color-gold-400)] transition-colors overflow-hidden group">
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isUploadingPhoto || isSubmitting} />
              {reviewImage ? (
                <>
                  <img src={reviewImage} alt="Review Documentation" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white flex items-center gap-2"><Camera className="w-4 h-4"/> Replace Image</p>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  {isUploadingPhoto ? (
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--color-gold-500)]" />
                  ) : (
                    <UploadCloud className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-[var(--color-navy-800)] transition-colors" />
                  )}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-navy-900)]">
                    {isUploadingPhoto ? 'Encrypting File...' : 'Upload Photograph'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Button 
            onClick={submitReview} 
            isLoading={isSubmitting || isUploadingPhoto} 
            className="w-full !rounded-sm !py-4 uppercase tracking-widest text-xs shadow-luxury"
          >
            {editingReviewId ? 'Amend Logbook' : 'Seal Logbook Entry'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}