import React from 'react';
import Image from 'next/image';
import { Camera, User, Loader2 } from 'lucide-react';

interface AvatarUploaderProps {
  photoUrl: string;
  isUploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AvatarUploader({ photoUrl, isUploading, onUpload }: AvatarUploaderProps) {
  return (
    <div className="lg:col-span-8">
      <div className="bg-white p-8 border border-gray-200 rounded-sm shadow-sm flex items-center gap-8">
        <div className="relative w-24 h-24 bg-[var(--color-surface-50)] rounded-full p-1 border border-gray-200 group overflow-hidden shrink-0">
          {photoUrl ? (
            <Image 
              src={photoUrl} 
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
            {isUploading ? "Wait" : "Change"}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={onUpload} 
              disabled={isUploading}
            />
          </label>

          {isUploading && (
            <div className="absolute inset-0 bg-[var(--color-navy-900)]/80 flex items-center justify-center rounded-full z-10">
              <Loader2 className="w-5 h-5 text-[var(--color-gold-500)] animate-spin" />
            </div>
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium text-[var(--color-navy-900)] mb-1">Recommended Format</h3>
          <p className="text-xs text-gray-500 font-light mb-4">Square image, Max 2MB (JPG, PNG)</p>
          <label className="bg-[var(--color-surface-50)] hover:bg-[var(--color-gold-50)] border border-gray-200 hover:border-[var(--color-gold-300)] text-[var(--color-navy-900)] px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer inline-block">
            {isUploading ? "Uploading..." : "Upload New Portrait"}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={onUpload} 
              disabled={isUploading}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
