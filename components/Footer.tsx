import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
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
                <a href="https://www.instagram.com/wissen_haus" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </a>
                <a href="https://www.linkedin.com/company/wissen-haus-empowerment-foundation" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.76-1.95C21.4 8.75 22 11 22 14.1V21h-4v-6.1c0-1.45-.03-3.3-2-3.3-2 0-2.3 1.57-2.3 3.2V21h-4z" />
                  </svg>
                </a>
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
              <a href="mailto:info@wissenhaus.org">info@wissenhaus.org</a>
              <a href="tel:+234800947736">+234 800 WISSEN</a>
            </div>
          </div>
        </div>

        <div className="footer-mega" aria-hidden="true">WISSEN-HAUS</div>

        <div className="wrap wrap-wide">
          <div className="footer-bottom">
            <span>© {year} Wissen-Haus Youth Empowerment Foundation. All rights reserved.</span>
            <span>Empowering youth · Educating for all · Opportunity for all</span>
          </div>
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
