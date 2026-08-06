import Link from 'next/link'
import Image from 'next/image'
import sql from '@/lib/db'

interface SiteSettings {
  contact_email: string
  whatsapp_url: string
  instagram_url: string
  linkedin_url: string
  twitter_url: string
  tagline: string
  footer_note: string
}

const DEFAULTS: SiteSettings = {
  contact_email: 'info@wissenhaus.org',
  whatsapp_url: '',
  instagram_url: 'https://www.instagram.com/wissen_haus',
  linkedin_url: 'https://www.linkedin.com/company/wissen-haus-empowerment-foundation',
  twitter_url: '',
  tagline: 'Empowering youth · Educating for all · Opportunity for all',
  footer_note: '',
}

export default async function Footer() {
  let settings: SiteSettings = DEFAULTS
  try {
    const rows = await sql`SELECT value FROM site_content WHERE key = 'site_settings'`
    if (rows[0]?.value) {
      settings = { ...DEFAULTS, ...(rows[0].value as Partial<SiteSettings>) }
    }
  } catch {
    // fall back to defaults if DB unavailable
  }

  const year = new Date().getFullYear()

  return (
    <>
      <footer className="site-footer">
        <div className="wrap wrap-wide">
          <div className="footer-top">
            <div className="footer-brand">
              <Link className="brand" href="/">
                <Image src="/img/logo.png" alt="Wissen-Haus logo" width={40} height={40} />
                <span>Wissen-Haus<small>Youth Empowerment</small></span>
              </Link>
              <p>Bridging the skills gap in Nigeria, equipping young people with practical guidance, mentorship and global exposure for economic independence.</p>
              <div className="footer-social">
                {settings.instagram_url && (
                  <a href={settings.instagram_url} aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                    </svg>
                  </a>
                )}
                {settings.linkedin_url && (
                  <a href={settings.linkedin_url} aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.76-1.95C21.4 8.75 22 11 22 14.1V21h-4v-6.1c0-1.45-.03-3.3-2-3.3-2 0-2.3 1.57-2.3 3.2V21h-4z" />
                    </svg>
                  </a>
                )}
                {settings.twitter_url && (
                  <a href={settings.twitter_url} aria-label="X / Twitter" target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.736-8.857L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
                {settings.whatsapp_url && (
                  <a href={settings.whatsapp_url} aria-label="WhatsApp Community" target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>

            <div className="footer-col">
              <h5>Explore</h5>
              <Link href="/programmes">Programmes</Link>
              <Link href="/community">Community Hub</Link>
              <Link href="/jobs">Remote Jobs</Link>
              <Link href="/internships">Internships</Link>
              <Link href="/scholarships">Scholarships</Link>
              <Link href="/competitions">Competitions</Link>
              <Link href="/impact-content">Impact Stories</Link>
              <Link href="/policy-research">Policy &amp; Research</Link>
              <Link href="/wiki">Foundation Overview</Link>
            </div>

            <div className="footer-col">
              <h5>Get Involved</h5>
              <Link href="/volunteer">Volunteer</Link>
              <Link href="/careers">Careers</Link>
              <Link href="/partner">Partner With Us</Link>
              <Link href="/donate">Donate</Link>
              <Link href="/contact">Contact</Link>
            </div>

            <div className="footer-col">
              <h5>Contact</h5>
              <a href="#">Ibadan, Nigeria</a>
              <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
              <a href="tel:+234800947736">+234 800 WISSEN</a>
            </div>
          </div>
        </div>

        <div className="footer-mega" aria-hidden="true">WISSEN-HAUS</div>

        <div className="wrap wrap-wide">
          <div className="footer-bottom">
            <span>© {year} Wissen-Haus Youth Empowerment Foundation. All rights reserved.</span>
            <span>{settings.tagline || 'Empowering youth · Educating for all · Opportunity for all'}</span>
          </div>
          {settings.footer_note && (
            <p style={{ textAlign: 'center', fontSize: '.78rem', color: 'rgba(255,255,255,0.4)', marginTop: 8, marginBottom: 0 }}>
              {settings.footer_note}
            </p>
          )}
        </div>
      </footer>

      <BackToTop />
    </>
  )
}

function BackToTop() {
  return (
    <button className="to-top" aria-label="Back to top" id="backToTop">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="M12 19V5M6 11l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
