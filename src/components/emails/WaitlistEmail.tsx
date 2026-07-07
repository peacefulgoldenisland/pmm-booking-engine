import * as React from 'react';
import { 
  Html, Head, Body, Container, Section, Text, Hr
} from '@react-email/components';

interface WaitlistEmailProps {
  customerName: string;
  departureDate: string;
  cabinClass: string;
  paxCount: number;
}

export const WaitlistEmail: React.FC<WaitlistEmailProps> = ({
  customerName,
  departureDate,
  cabinClass,
  paxCount
}) => {
  const formattedDate = new Date(departureDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={logoText}>PMM <span style={{color: '#D4AF37'}}>RESERVE</span></Text>
            <Text style={headerTitle}>WAITLIST CONFIRMATION</Text>
          </Section>

          <Section style={contentSection}>
            <Text style={greeting}>Dear {customerName},</Text>
            <Text style={paragraph}>
              You have been successfully added to our priority waitlist for the following fully-booked expedition:
            </Text>

            <Section style={ticketBox}>
              <Text style={label}>DEPARTURE DATE</Text>
              <Text style={value}>{formattedDate}</Text>
              <Hr style={divider} />
              <Text style={label}>CABIN & GUESTS</Text>
              <Text style={valueHighlight}>{cabinClass} - {paxCount} Pax</Text>
            </Section>

            <Text style={paragraph}>
              <strong>How it works:</strong><br/>
              If a cancellation occurs or additional cabins become available, our concierge team will notify you immediately. Waitlist priority is granted on a first-come, first-served basis.
            </Text>
          </Section>

          <Section style={footerSection}>
            <Text style={footerText}>
              PMM Voyage Liveaboard | Luxury Expeditions<br/>
              Lombok ➔ Komodo
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = { backgroundColor: '#F8F9FA', fontFamily: 'Arial, sans-serif', padding: '40px 0' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', borderRadius: '16px', overflow: 'hidden', maxWidth: '600px' };
const headerSection = { backgroundColor: '#0B192C', padding: '40px 30px', textAlign: 'center' as const };
const logoText = { color: '#ffffff', fontSize: '24px', fontWeight: 'bold', letterSpacing: '4px', margin: '0 0 10px 0' };
const headerTitle = { color: '#D4AF37', fontSize: '14px', letterSpacing: '2px', margin: '0' };
const contentSection = { padding: '40px 30px' };
const greeting = { fontSize: '18px', color: '#0B192C', fontWeight: 'bold', marginBottom: '10px' };
const paragraph = { fontSize: '14px', color: '#4b5563', lineHeight: '1.6', marginBottom: '24px' };
const ticketBox = { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' };
const label = { fontSize: '10px', color: '#6b7280', fontWeight: 'bold', letterSpacing: '1px', margin: '0 0 4px 0' };
const value = { fontSize: '14px', color: '#0B192C', fontWeight: 'bold', margin: '0 0 16px 0' };
const valueHighlight = { fontSize: '16px', color: '#D4AF37', fontWeight: 'bold', margin: '0' };
const divider = { borderColor: '#e5e7eb', margin: '16px 0' };
const footerSection = { backgroundColor: '#0B192C', padding: '24px', textAlign: 'center' as const };
const footerText = { color: '#9ca3af', fontSize: '12px', lineHeight: '1.5' };