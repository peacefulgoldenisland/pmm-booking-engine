import * as React from 'react';
import { 
  Html, Head, Body, Container, Section, Text, Hr, Row, Column, Link, Preview
} from '@react-email/components';

interface TicketEmailProps {
  orderId: string;
  customerName: string;
  departureDate: string;
  cabinClass: string;
  paxCount: number;
  pickupLocation: string;
}

export const TicketEmail: React.FC<TicketEmailProps> = ({
  orderId = "PGI-12345",
  customerName = "Guest",
  departureDate = new Date().toISOString(),
  cabinClass = "Private Sea View",
  paxCount = 2,
  pickupLocation = "Hotel Marina, Senggigi"
}) => {
  // Format Tanggal Editorial
  const formattedDate = new Date(departureDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <Html>
      <Head />
      <Preview>Your PGI Booking E-Ticket & Itinerary</Preview>
      <Body style={main}>
        <Container style={container}>
          
          {/* HEADER: LUXURY BRANDING */}
          <Section style={headerSection}>
            <Text style={logoText}>
              PGI <span style={logoAccent}>BOOKING</span>
            </Text>
            <Text style={headerSubtitle}>YOUR E-TICKET</Text>
          </Section>

          {/* GREETING & INTRO */}
          <Section style={contentSection}>
            <Text style={greeting}>Dear {customerName},</Text>
            <Text style={paragraph}>
              Your payment has been verified. Your trip is now confirmed. Please present this e-ticket during your scheduled pickup or when checking in.
            </Text>

            {/* EDITORIAL TICKET BOX */}
            <Section style={ticketWrapper}>
              <Section style={ticketHeader}>
                <Text style={ticketHeaderText}>BOOKING DETAILS</Text>
              </Section>
              
              <Section style={ticketBody}>
                <Row>
                  <Column style={columnLeft}>
                    <Text style={label}>BOOKING ID</Text>
                    <Text style={valueMono}>{orderId}</Text>
                  </Column>
                  <Column style={columnRight}>
                    <Text style={label}>ROUTE</Text>
                    <Text style={valueSerif}>Lombok &#x279D; Komodo</Text>
                  </Column>
                </Row>
                
                <Hr style={divider} />
                
                <Row>
                  <Column style={columnLeft}>
                    <Text style={label}>DEPARTURE DATE</Text>
                    <Text style={valueSerif}>{formattedDate}</Text>
                  </Column>
                  <Column style={columnRight}>
                    <Text style={label}>CABIN CLASS</Text>
                    <Text style={valueSerif}>{cabinClass} <span style={paxBadge}>({paxCount} PAX)</span></Text>
                  </Column>
                </Row>

                <Hr style={divider} />

                <Row>
                  <Column>
                    <Text style={label}>PICKUP POINT</Text>
                    <Text style={valueSerif}>{pickupLocation}</Text>
                  </Column>
                </Row>
              </Section>
            </Section>

            {/* MARITIME PROTOCOLS */}
            <Section style={protocolBox}>
              <Text style={protocolTitle}>IMPORTANT INFORMATION</Text>
              <Text style={protocolText}>
                <span style={bullet}>&#x2022;</span> Please arrive at the harbor <strong>2 hours</strong> before departure.<br/>
                <span style={bullet}>&#x2022;</span> Please show this e-ticket and your original ID/Passport when checking in.<br/>
                <span style={bullet}>&#x2022;</span> Baggage allowance is 20kg per guest. Soft luggage is recommended.
              </Text>
            </Section>

            <Text style={closing}>
              We look forward to welcoming you on board. Have a wonderful trip!<br/><br/>
              Warm regards,<br/>
              <strong>The PGI Booking Team</strong>
            </Text>
          </Section>

          {/* FOOTER */}
          <Section style={footerSection}>
            <Text style={footerText}>
              PGI Voyage | Komodo Trips<br/>
              Need assistance? Contact our 24/7 support at <Link href="tel:+6281234567890" style={footerLink}>+62 812-3456-7890</Link> or reply to this email.
            </Text>
            <Text style={footerCopyright}>
              &copy; {new Date().getFullYear()} PGI Booking. All rights reserved.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
};

export default TicketEmail;

// =========================================================
// STYLING BERBASIS OBJEK (React Email Safe For All Clients)
// =========================================================

const main = {
  backgroundColor: '#fdfbf7', // Off-white/cream paper feel
  fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
  padding: '40px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  border: '1px solid #e2e8f0',
  borderRadius: '4px', // Sharp corners for editorial feel
  maxWidth: '600px',
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
  overflow: 'hidden',
};

const headerSection = {
  backgroundColor: '#0B192C',
  padding: '40px 30px',
  textAlign: 'center' as const,
  borderTop: '6px solid #D4AF37', // Gold top accent
};

const logoText = {
  color: '#ffffff',
  fontFamily: 'Georgia, "Times New Roman", serif', // Luxury serif
  fontSize: '28px',
  fontWeight: 'normal',
  letterSpacing: '4px',
  margin: '0 0 8px 0',
};

const logoAccent = {
  color: '#D4AF37',
  fontStyle: 'italic',
  textTransform: 'lowercase' as const,
};

const headerSubtitle = {
  color: '#8b96a5',
  fontSize: '10px',
  letterSpacing: '3px',
  margin: '0',
  fontWeight: 'bold',
};

const contentSection = {
  padding: '40px 30px',
};

const greeting = {
  fontSize: '22px',
  color: '#0B192C',
  fontFamily: 'Georgia, "Times New Roman", serif',
  marginBottom: '16px',
  marginTop: '0',
};

const paragraph = {
  fontSize: '14px',
  color: '#4b5563',
  lineHeight: '1.6',
  marginBottom: '32px',
  fontWeight: '300',
};

const ticketWrapper = {
  border: '1px solid #e5e7eb',
  marginBottom: '32px',
};

const ticketHeader = {
  backgroundColor: '#0B192C',
  padding: '12px 20px',
};

const ticketHeaderText = {
  color: '#D4AF37',
  fontSize: '10px',
  letterSpacing: '2px',
  fontWeight: 'bold',
  margin: '0',
};

const ticketBody = {
  padding: '24px 20px 10px 20px',
};

const columnLeft = {
  width: '50%',
  paddingRight: '10px',
};

const columnRight = {
  width: '50%',
  paddingLeft: '10px',
};

const label = {
  fontSize: '9px',
  color: '#9ca3af',
  fontWeight: 'bold',
  letterSpacing: '1.5px',
  margin: '0 0 6px 0',
};

const valueSerif = {
  fontSize: '16px',
  color: '#0B192C',
  fontFamily: 'Georgia, "Times New Roman", serif',
  margin: '0 0 20px 0',
};

const valueMono = {
  fontSize: '16px',
  color: '#0B192C',
  fontFamily: 'monospace',
  fontWeight: 'bold',
  letterSpacing: '2px',
  margin: '0 0 20px 0',
};

const paxBadge = {
  fontSize: '10px',
  color: '#6b7280',
  fontFamily: 'Arial, sans-serif',
  letterSpacing: '1px',
};

const divider = {
  borderColor: '#f3f4f6',
  margin: '0 0 20px 0',
};

const protocolBox = {
  backgroundColor: '#f8f9fa',
  borderLeft: '3px solid #D4AF37',
  padding: '20px',
  marginBottom: '32px',
};

const protocolTitle = {
  fontSize: '10px',
  color: '#0B192C',
  fontWeight: 'bold',
  letterSpacing: '1.5px',
  margin: '0 0 12px 0',
};

const protocolText = {
  fontSize: '12px',
  color: '#4b5563',
  lineHeight: '1.8',
  margin: '0',
};

const bullet = {
  color: '#D4AF37',
  marginRight: '8px',
};

const closing = {
  fontSize: '14px',
  color: '#4b5563',
  lineHeight: '1.6',
  margin: '0',
};

const footerSection = {
  backgroundColor: '#0B192C',
  padding: '30px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#8b96a5',
  fontSize: '11px',
  lineHeight: '1.6',
  margin: '0 0 10px 0',
};

const footerLink = {
  color: '#D4AF37',
  textDecoration: 'none',
  fontWeight: 'bold',
};

const footerCopyright = {
  color: '#4b5563',
  fontSize: '10px',
  margin: '0',
};