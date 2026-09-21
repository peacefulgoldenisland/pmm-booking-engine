import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | PGI Booking',
  description: 'Privacy Policy and Terms of Service for PGI Booking',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-sm shadow-sm border border-gray-200">
        <h1 className="text-3xl font-serif text-[var(--color-navy-900)] mb-6">Privacy Policy</h1>
        
        <div className="prose prose-sm text-gray-600 space-y-4">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-lg font-bold text-gray-900 mt-6">1. Introduction</h2>
          <p>Welcome to Peaceful Golden Island (PGI Booking). We respect your privacy and are committed to protecting your personal data.</p>
          
          <h2 className="text-lg font-bold text-gray-900 mt-6">2. Data We Collect</h2>
          <p>When you use Google Sign-In, we collect your basic profile information such as your name, email address, and profile picture to create and manage your account.</p>
          
          <h2 className="text-lg font-bold text-gray-900 mt-6">3. How We Use Your Data</h2>
          <p>We use your data to:</p>
          <ul className="list-disc pl-5">
            <li>Process your bookings and payments.</li>
            <li>Send you important updates regarding your trips.</li>
            <li>Provide customer support.</li>
          </ul>
          
          <h2 className="text-lg font-bold text-gray-900 mt-6">4. Data Protection</h2>
          <p>We implement strict security measures to ensure your data is safe and not shared with unauthorized third parties.</p>
          
          <h2 className="text-lg font-bold text-gray-900 mt-6">5. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at peacefulgoldenisland@gmail.com.</p>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-100">
          <Link href="/" className="text-sm font-bold uppercase tracking-widest text-[var(--color-gold-500)] hover:text-[var(--color-gold-600)] transition-colors">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
