import React from 'react';
import { UploadCloud, CheckCircle2, Loader2 } from 'lucide-react';

interface DocumentUploaderProps {
  passportFileUrl?: string | null;
  isUploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DocumentUploader({ passportFileUrl, isUploading, onUpload }: DocumentUploaderProps) {
  return (
    <div className="lg:col-span-8">
      {passportFileUrl ? (
        <div className="bg-green-50/50 border border-green-200 p-8 rounded-sm shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-green-100 p-3 rounded-full text-green-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="font-serif text-[var(--color-navy-900)] text-lg mb-0.5">Document Uploaded</p>
              <p className="text-xs text-gray-500 font-light">Your passport has been uploaded successfully.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <a 
              href={passportFileUrl as string} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[10px] font-bold text-[var(--color-navy-900)] hover:text-[var(--color-gold-600)] transition-colors uppercase tracking-widest underline underline-offset-4 w-1/2 md:w-auto text-center"
            >
              View File
            </a>
            <label className="bg-white border border-gray-200 text-[var(--color-navy-900)] hover:border-[var(--color-gold-400)] hover:text-[var(--color-gold-600)] px-6 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all cursor-pointer w-1/2 md:w-auto text-center">
              {isUploading ? "Processing..." : "Update File"}
              <input 
                type="file" 
                accept="image/*,application/pdf" 
                className="hidden" 
                onChange={onUpload} 
                disabled={isUploading}
              />
            </label>
          </div>
        </div>
      ) : (
        <label className="block bg-[var(--color-surface-50)] hover:bg-[var(--color-gold-50)]/50 border-2 border-dashed border-gray-200 hover:border-[var(--color-gold-400)] rounded-sm p-12 flex flex-col items-center text-center cursor-pointer transition-colors group relative">
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-[var(--color-gold-500)] animate-spin mb-4" />
          ) : (
            <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-[var(--color-gold-500)] group-hover:scale-110 transition-all mb-4" />
          )}
          <p className="text-sm font-medium text-[var(--color-navy-900)] mb-1">
            {isUploading ? "Uploading..." : "Click or drag file to upload"}
          </p>
          <p className="text-[11px] text-gray-400 font-light">Supports JPG, PNG, or PDF up to 5MB</p>
          <input 
            type="file" 
            accept="image/*,application/pdf" 
            className="hidden" 
            onChange={onUpload} 
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
}
