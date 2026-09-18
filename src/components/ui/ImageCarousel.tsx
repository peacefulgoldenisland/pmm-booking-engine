// src/components/ui/ImageCarousel.tsx
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  className?: string;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ 
  images, 
  alt = "Cabin Image", 
  className = "" 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Jika tidak ada gambar, tampilkan skeleton/placeholder
  if (!images || images.length === 0) {
    return (
      <div className={`w-full bg-gray-100 flex items-center justify-center rounded-2xl ${className}`}>
        <span className="text-gray-400 font-medium">No Images Available</span>
      </div>
    );
  }

  // Animasi Slide Kanan Kiri
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = images.length - 1;
      if (nextIndex >= images.length) nextIndex = 0;
      return nextIndex;
    });
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl group bg-navy-900 ${className}`}>
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={images[currentIndex]}
            alt={`${alt} - Slide ${currentIndex + 1}`}
            fill
            className="object-cover"
            priority={currentIndex === 0} // Prioritaskan loading gambar pertama
            unoptimized={true} // Bypasses Next.js image optimizer to avoid MODULE_UNPARSABLE with Cloudflare R2
          />
          {/* Overlay Gradient Halus dari Bawah */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-navy-900)]/60 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Tombol Navigasi (Hanya muncul saat di-hover di Desktop) */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); paginate(-1); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-[var(--color-navy-800)] z-10"
          >
            <ChevronLeft className="w-6 h-6 ml-[-2px]" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); paginate(1); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-[var(--color-navy-800)] z-10"
          >
            <ChevronRight className="w-6 h-6 mr-[-2px]" />
          </button>

          {/* Indikator Titik-Titik di Bawah (Dots) */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? 'w-6 h-2 bg-[var(--color-gold-500)]'
                    : 'w-2 h-2 bg-white/50 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};