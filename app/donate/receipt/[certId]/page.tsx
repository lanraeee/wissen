import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import sql from '@/lib/db'
import PrintReceiptButton from '@/components/PrintReceiptButton'

export interface DonationCert {
  cert_id: string
  donor_name: string
  donor_email?: string
  donor_address?: string
  amount: number
  currency: 'NGN' | 'USD' | 'GBP' | 'EUR'
  date: string
  purpose: string
  notes?: string
  issued_at: string
}

export interface FoundationDetails {
  legal_name: string
  rc_number: string
  tax_id?: string
  address: string
  email: string
  signatory_name: string
  signatory_role: string
}

const DEFAULT_FOUNDATION: FoundationDetails = {
  legal_name: 'Wissen-Haus Youth Empowerment Foundation',
  rc_number: '',
  address: 'Ibadan, Oyo State, Nigeria',
  email: 'director@wissenhaus.org',
  signatory_name: 'Benz Olagbaye',
  signatory_role: 'Founder & Executive Director',
}

const CURRENCY_SYMBOL: Record<string, string> = {
  NGN: '₦', USD: '$', GBP: '£', EUR: '€',
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency', currency, minimumFractionDigits: 2,
  }).format(amount)
}

interface Props { params: Promise<{ certId: string }> }

async function getData(certId: string) {
  const [certsRow, foundationRow] = await Promise.all([
    sql`SELECT value FROM site_content WHERE key = 'donation_certificates'`,
    sql`SELECT value FROM site_content WHERE key = 'foundation_details'`,
  ])
  const certs: DonationCert[] = (certsRow[0]?.value as DonationCert[]) ?? []
  const cert = certs.find(c => c.cert_id === certId) ?? null
  const foundation: FoundationDetails = foundationRow[0]?.value
    ? { ...DEFAULT_FOUNDATION, ...(foundationRow[0].value as Partial<FoundationDetails>) }
    : DEFAULT_FOUNDATION
  return { cert, foundation }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { certId } = await params
  const { cert } = await getData(certId)
  if (!cert) return { title: 'Receipt Not Found — Wissen-Haus' }
  return {
    title: `Donation Receipt ${cert.cert_id} — Wissen-Haus`,
    description: `Official donation receipt issued to ${cert.donor_name} by Wissen-Haus Youth Empowerment Foundation.`,
  }
}

export default async function DonationReceiptPage({ params }: Props) {
  const { certId } = await params
  const { cert, foundation } = await getData(certId)

  if (!cert) {
    return (
      <section style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
          <h1 style={{ fontSize: '1.6rem', color: '#8B1A1A', marginBottom: 12 }}>Receipt Not Found</h1>
          <p style={{ color: '#5a5a4a', marginBottom: 24 }}>
            No donation receipt matches ID{' '}
            <code style={{ background: '#f0ede5', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{certId}</code>.
          </p>
          <Link href="/donate" className="btn">Back to Donate</Link>
        </div>
      </section>
    )
  }

  const donationDate = new Date(cert.date)
  const issuedDate = new Date(cert.issued_at)
  const formatted = {
    donation: donationDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    issued: issuedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
  }

  return (
    <div style={{ background: '#f4f0e8', minHeight: '100vh', padding: 'clamp(32px,5vw,64px) 16px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Document */}
        <div style={{
          background: '#FEFCF5',
          border: '2px solid #B8952A',
          borderRadius: 6,
          boxShadow: '0 0 0 6px #FEFCF5, 0 0 0 8px #B8952A, 0 24px 64px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}>

          {/* Gold header */}
          <div style={{
            background: 'linear-gradient(135deg, #A07820 0%, #C9A030 40%, #B8952A 70%, #8B6914 100%)',
            padding: '20px 36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '3px solid #7A5510',
            gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Image src="/img/logo.png" alt="Wissen-Haus" width={80} height={80}
                style={{ borderRadius: 12, filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.22))' }} />
              <div>
                <div style={{ color: '#2a1a00', fontWeight: 800, fontSize: '1rem', lineHeight: 1.2 }}>
                  {foundation.legal_name}
                </div>
                {foundation.rc_number && (
                  <div style={{ color: 'rgba(42,26,0,0.65)', fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>
                    RC No. {foundation.rc_number}
                  </div>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#2a1a00', fontWeight: 800, fontSize: '.72rem', letterSpacing: '.18em', textTransform: 'uppercase' }}>
                Donation Receipt
              </div>
              <div style={{ color: 'rgba(42,26,0,0.65)', fontFamily: 'monospace', fontSize: '.68rem', marginTop: 3 }}>
                {cert.cert_id}
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: 'clamp(28px,4vw,48px) clamp(28px,5vw,56px)' }}>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{ flex: 1, maxWidth: 80, height: 1, background: 'linear-gradient(to right, transparent, #B8952A)' }} />
                <span style={{ color: '#B8952A', fontSize: '.65rem', fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase' }}>
                  Official Tax Receipt
                </span>
                <span style={{ flex: 1, maxWidth: 80, height: 1, background: 'linear-gradient(to left, transparent, #B8952A)' }} />
              </div>
              <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 'clamp(1.4rem,3vw,1.9rem)', color: '#0F2D1D', margin: 0, letterSpacing: '-.01em' }}>
                Certificate of Donation
              </h1>
            </div>

            {/* Acknowledgement */}
            <p style={{ color: '#3a3a2a', fontSize: '.92rem', lineHeight: 1.7, marginBottom: 28, textAlign: 'center' }}>
              This certifies that <strong>{foundation.legal_name}</strong> gratefully acknowledges
              the following donation received in support of our youth empowerment mission.
            </p>

            {/* Donor & donation details box */}
            <div style={{
              border: '1px solid rgba(184,149,42,0.35)',
              borderRadius: 8,
              overflow: 'hidden',
              marginBottom: 28,
            }}>
              <div style={{ background: 'rgba(184,149,42,0.06)', padding: '10px 20px', borderBottom: '1px solid rgba(184,149,42,0.2)' }}>
                <span style={{ fontSize: '.62rem', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9a7a20' }}>
                  Donor Details
                </span>
              </div>
              <div style={{ padding: '20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#9a9a8a', marginBottom: 3 }}>Donor Name</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.3rem', color: '#0F2D1D', lineHeight: 1.2 }}>{cert.donor_name}</div>
                </div>
                {cert.donor_email && (
                  <div>
                    <div style={{ fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#9a9a8a', marginBottom: 3 }}>Email</div>
                    <div style={{ fontSize: '.88rem', color: '#3a3a2a' }}>{cert.donor_email}</div>
                  </div>
                )}
                {cert.donor_address && (
                  <div style={cert.donor_email ? undefined : { gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#9a9a8a', marginBottom: 3 }}>Address</div>
                    <div style={{ fontSize: '.88rem', color: '#3a3a2a', whiteSpace: 'pre-line' }}>{cert.donor_address}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Donation details box */}
            <div style={{
              border: '1px solid rgba(184,149,42,0.35)',
              borderRadius: 8,
              overflow: 'hidden',
              marginBottom: 28,
            }}>
              <div style={{ background: 'rgba(184,149,42,0.06)', padding: '10px 20px', borderBottom: '1px solid rgba(184,149,42,0.2)' }}>
                <span style={{ fontSize: '.62rem', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9a7a20' }}>
                  Donation Details
                </span>
              </div>
              <div style={{ padding: '20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                <div>
                  <div style={{ fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#9a9a8a', marginBottom: 3 }}>Amount</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F2D1D', letterSpacing: '-.01em' }}>
                    {formatAmount(cert.amount, cert.currency)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#9a9a8a', marginBottom: 3 }}>Date of Donation</div>
                  <div style={{ fontSize: '.92rem', color: '#3a3a2a', fontWeight: 600 }}>{formatted.donation}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#9a9a8a', marginBottom: 3 }}>Purpose</div>
                  <div style={{ fontSize: '.88rem', color: '#3a3a2a' }}>{cert.purpose}</div>
                </div>
                {cert.notes && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#9a9a8a', marginBottom: 3 }}>Additional Notes</div>
                    <div style={{ fontSize: '.88rem', color: '#3a3a2a' }}>{cert.notes}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Tax statement */}
            <div style={{
              background: 'rgba(15,45,29,0.04)',
              border: '1px solid rgba(15,45,29,0.12)',
              borderRadius: 8,
              padding: '16px 20px',
              marginBottom: 28,
            }}>
              <p style={{ margin: 0, fontSize: '.8rem', color: '#5a5a4a', lineHeight: 1.7 }}>
                <strong style={{ color: '#0F2D1D' }}>Tax Declaration:</strong> No goods or services were provided
                in exchange for this donation. {foundation.legal_name} is a registered non-profit foundation.
                This receipt may be used for tax deduction purposes in accordance with applicable tax laws.
                {foundation.tax_id && ` Tax Identification Number: ${foundation.tax_id}.`}
              </p>
            </div>

            {/* Signature & issue info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: 24 }}>
              <div>
                <div style={{ fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#9a9a8a', marginBottom: 4 }}>Issued on</div>
                <div style={{ fontSize: '.88rem', color: '#3a3a2a', fontWeight: 600, marginBottom: 8 }}>{formatted.issued}</div>
                <div style={{ fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#9a9a8a', marginBottom: 2 }}>Foundation Address</div>
                <div style={{ fontSize: '.8rem', color: '#5a5a4a' }}>{foundation.address}</div>
                <div style={{ fontSize: '.8rem', color: '#5a5a4a' }}>{foundation.email}</div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 160 }}>
                <div style={{
                  fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  fontSize: '1.3rem', color: '#0F2D1D', lineHeight: 1, marginBottom: 6,
                }}>
                  {foundation.signatory_name}
                </div>
                <div style={{ height: 1, background: 'rgba(184,149,42,0.5)', marginBottom: 6 }} />
                <div style={{ fontSize: '.62rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#9a9a8a' }}>
                  {foundation.signatory_role}
                </div>
              </div>
            </div>

            {/* Cert ID footer */}
            <div style={{ borderTop: '1px solid rgba(184,149,42,0.2)', marginTop: 24, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '.65rem', color: '#B8952A' }}>{cert.cert_id}</span>
              <span style={{ fontSize: '.7rem', color: '#9a9a8a' }}>wissenhaus.org</span>
            </div>
          </div>
        </div>

        {/* Print / back actions */}
        <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <PrintReceiptButton />
          <Link href="/donate" style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 22px', background: '#fff', color: '#3a3a2a', border: '1.5px solid #d0ccbf', borderRadius: 8, fontSize: '.85rem', fontWeight: 600, textDecoration: 'none' }}>
            ← Back to Donate
          </Link>
        </div>

      </div>
    </div>
  )
}
