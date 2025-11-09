// React Email Template for Warranty Expiring Notifications

import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Hr,
  Row,
  Column,
} from '@react-email/components';

interface WarrantyExpiringEmailProps {
  productName: string;
  manufacturer: string;
  expiryDate: string;
  daysRemaining: number;
  warrantyType: string;
  userName: string;
  warrantyId: string;
}

export default function WarrantyExpiringEmail({
  productName = 'Samsung Refrigerator',
  manufacturer = 'Samsung',
  expiryDate = 'December 31, 2024',
  daysRemaining = 30,
  warrantyType = 'Limited Manufacturer Warranty',
  userName = 'John',
  warrantyId = 'warranty-123',
}: WarrantyExpiringEmailProps) {
  const urgencyLevel =
    daysRemaining <= 7 ? 'urgent' : daysRemaining <= 30 ? 'warning' : 'info';

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://snapregister.com';

  return (
    <Html>
      <Head />
      <Preview>
        Your warranty for {productName} expires in {daysRemaining} days
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={headerText}>Warranty Expiration Notice</Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Hello {userName},</Text>

            {urgencyLevel === 'urgent' ? (
              <Section style={alertBoxUrgent}>
                <Text style={alertText}>
                  URGENT: Your warranty expires in {daysRemaining} day
                  {daysRemaining !== 1 ? 's' : ''}!
                </Text>
              </Section>
            ) : urgencyLevel === 'warning' ? (
              <Section style={alertBoxWarning}>
                <Text style={alertText}>
                  REMINDER: Your warranty expires in {daysRemaining} days
                </Text>
              </Section>
            ) : (
              <Text style={paragraph}>
                This is a reminder that your warranty will expire in{' '}
                {daysRemaining} days.
              </Text>
            )}

            {/* Product Details Box */}
            <Section style={productBox}>
              <Heading as="h2" style={productBoxTitle}>
                Product Details
              </Heading>
              <Hr style={divider} />
              <Row style={detailRow}>
                <Column style={detailLabel}>Product:</Column>
                <Column style={detailValue}>{productName}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Manufacturer:</Column>
                <Column style={detailValue}>{manufacturer}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Warranty Type:</Column>
                <Column style={detailValue}>{warrantyType}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Expiration Date:</Column>
                <Column style={detailValue}>{expiryDate}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Days Remaining:</Column>
                <Column style={detailValueBold}>{daysRemaining} days</Column>
              </Row>
            </Section>

            {/* Action Items */}
            <Section style={actionSection}>
              <Heading as="h3" style={actionTitle}>
                Recommended Actions
              </Heading>
              <ul style={actionList}>
                <li style={actionItem}>
                  Review your product's condition and performance
                </li>
                <li style={actionItem}>
                  File any pending warranty claims before expiration
                </li>
                <li style={actionItem}>
                  Contact the manufacturer about extended warranty options
                </li>
                <li style={actionItem}>
                  Keep all warranty documents and receipts for reference
                </li>
              </ul>
            </Section>

            {/* CTA Button */}
            <Section style={buttonSection}>
              <Button
                style={button}
                href={`${baseUrl}/dashboard/warranties/${warrantyId}`}
              >
                View Warranty Details
              </Button>
            </Section>

            <Text style={paragraph}>
              You can manage your notification preferences in your account
              settings.
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              This email was sent by SnapRegister - Your Product Registration
              Assistant
            </Text>
            <Text style={footerText}>
              <a
                href={`${baseUrl}/settings/notifications`}
                style={footerLink}
              >
                Manage Notification Preferences
              </a>
              {' | '}
              <a href={`${baseUrl}/dashboard`} style={footerLink}>
                Dashboard
              </a>
              {' | '}
              <a href={`${baseUrl}/support`} style={footerLink}>
                Support
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '30px',
  textAlign: 'center' as const,
};

const headerText = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
};

const content = {
  padding: '30px',
};

const greeting = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333333',
  marginBottom: '16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#525f7f',
};

const alertBoxUrgent = {
  backgroundColor: '#fee2e2',
  border: '2px solid #dc2626',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
};

const alertBoxWarning = {
  backgroundColor: '#fef3c7',
  border: '2px solid #f59e0b',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
};

const alertText = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0',
  textAlign: 'center' as const,
};

const productBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  marginTop: '24px',
  marginBottom: '24px',
};

const productBoxTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#667eea',
  margin: '0 0 12px 0',
};

const detailRow = {
  marginBottom: '12px',
};

const detailLabel = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#6b7280',
  width: '140px',
};

const detailValue = {
  fontSize: '14px',
  color: '#1f2937',
};

const detailValueBold = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#1f2937',
};

const actionSection = {
  marginTop: '24px',
  marginBottom: '24px',
};

const actionTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1f2937',
  marginBottom: '12px',
};

const actionList = {
  paddingLeft: '20px',
  marginTop: '8px',
};

const actionItem = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#525f7f',
  marginBottom: '8px',
};

const buttonSection = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
};

const button = {
  backgroundColor: '#667eea',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const footer = {
  padding: '20px 30px',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  color: '#8898aa',
  lineHeight: '20px',
  marginTop: '8px',
};

const footerLink = {
  color: '#667eea',
  textDecoration: 'none',
};
