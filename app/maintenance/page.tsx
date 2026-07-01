import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Planned Maintenance | Precision Sewer Inspection',
  description:
    'Precision Sewer Inspection is briefly offline for planned routine maintenance.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function MaintenancePage() {
  return (
    <>
      <header className="site" data-screen-label="Maintenance Header">
        <div className="container header-inner">
          <Link className="brand-lockup" href="/">
            <div className="mark">
              <img src="/assets/psi_logo.png" alt="Precision Sewer Inspection" />
            </div>
            <div className="name">
              <span className="display">
                Precision <em>Sewer</em> Inspection
              </span>
              <span className="tag">Central Indiana&apos;s Trusted Experts</span>
            </div>
          </Link>
          <div className="header-cta">
            <a className="phone" href="tel:3176203858">
              <span className="icon">·</span>(317) 620-3858
            </a>
            <a href="mailto:booking@precisionsewerinspections.com" className="btn btn-onlight">
              Email Us
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="cover" data-screen-label="Maintenance Holding Page">
          <div className="container">
            <div className="cover-grid">
              <div>
                <span className="pill outline-dark">Planned Routine Maintenance</span>
                <h1>
                  We&apos;re Tightening Up The <em>Website</em>
                </h1>
                <p className="price-line">
                  Online booking is paused for a few hours while we finish scheduled updates.
                </p>
                <p className="lede-dark">
                  Precision Sewer Inspection is still available by phone and email. If you need
                  to schedule, change, or ask about an inspection, contact us directly and we will
                  take care of it.
                </p>
                <div className="ctas">
                  <a className="btn btn-accent" href="tel:3176203858">
                    Call (317) 620-3858 <span className="arrow">→</span>
                  </a>
                  <a className="btn btn-outline-dark" href="mailto:booking@precisionsewerinspections.com">
                    booking@precisionsewerinspections.com
                  </a>
                </div>
                <div className="trust-grid">
                  <div className="cell">
                    <div className="k">Status</div>
                    <div className="v">Planned</div>
                  </div>
                  <div className="cell">
                    <div className="k">Booking</div>
                    <div className="v">Paused</div>
                  </div>
                  <div className="cell">
                    <div className="k">Phone</div>
                    <div className="v">Open</div>
                  </div>
                  <div className="cell">
                    <div className="k">Reports</div>
                    <div className="v">Safe</div>
                  </div>
                </div>
              </div>

              <div className="tech-card" aria-hidden="true">
                <div className="placeholder">
                  <span className="stamp">Scheduled Website Maintenance</span>
                </div>
                <div className="cert-bump">
                  <div className="ic">✓</div>
                  <div className="text">
                    <div className="a">Routine Work</div>
                    <div className="b">Back online shortly</div>
                  </div>
                </div>
                <div className="ribbon">
                  <div className="lead">Precision Sewer Inspection</div>
                  <div className="meta">Clean · Accurate · Reliable</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="cover-contact">
          <div className="container row">
            <span>(317) 620-3858</span>
            <span className="dot">·</span>
            <span>booking@precisionsewerinspections.com</span>
            <span className="dot">·</span>
            <span>Indianapolis Metro &amp; Surrounding Areas</span>
          </div>
        </div>

        <section className="final-cta" data-screen-label="Maintenance Contact">
          <h2>Need Us Before The Site Is Back?</h2>
          <p>
            Call or email and we can handle scheduling, questions, and report support directly.
          </p>
          <div className="btn-row">
            <a className="btn btn-white" href="tel:3176203858">
              Call Now <span className="arrow">→</span>
            </a>
          </div>
          <div className="phone-row">
            <span>·</span>
            <a href="tel:3176203858">(317) 620-3858</a>
            <span className="sep">|</span>
            <span>Central Indiana Sewer Inspection</span>
          </div>
        </section>
      </main>

      <footer className="site" data-screen-label="Maintenance Footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link className="lockup" href="/">
                <div className="mark">
                  <img src="/assets/psi_logo.png" alt="Precision Sewer Inspection" />
                </div>
                <div className="nm">
                  <div className="a">
                    Precision <em>Sewer</em> Inspection
                  </div>
                  <div className="b">Sanitary Lateral Camera Survey</div>
                </div>
              </Link>
              <p>
                Central Indiana&apos;s trusted sewer inspection company. Evidence you can see,
                answers you can trust.
              </p>
              <div className="creds">
                <span className="cred">Licensed &amp; Insured</span>
                <span className="cred">
                  <span className="dot">·</span>InterNACHI
                </span>
              </div>
            </div>
            <div>
              <h4>Maintenance</h4>
              <ul>
                <li>Online booking temporarily paused</li>
                <li>Phone scheduling available</li>
                <li>Email support available</li>
              </ul>
            </div>
            <div>
              <h4>Contact</h4>
              <ul>
                <li className="contact-line">
                  <span className="label-mini">Phone</span>
                  <a href="tel:3176203858">(317) 620-3858</a>
                </li>
                <li className="contact-line">
                  <span className="label-mini">Email</span>
                  <a href="mailto:booking@precisionsewerinspections.com">
                    booking@precisionsewerinspections.com
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4>Area</h4>
              <ul>
                <li className="contact-line">
                  <span className="label-mini">Serving</span>
                  <span>Indianapolis Metro &amp; Surrounding Areas</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-areas">
            <h4>Serving Central Indiana</h4>
            <div className="row">
              <span className="chip">Indianapolis</span>
              <span className="chip">Carmel</span>
              <span className="chip">Fishers</span>
              <span className="chip">Noblesville</span>
              <span className="chip">Westfield</span>
              <span className="chip">Zionsville</span>
              <span className="chip">Greenwood</span>
              <span className="more">+ more</span>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="name">
              Precision <em>Sewer</em> Inspection
            </div>
            <div className="tagline">
              Clear<span className="dot">·</span>Accurate<span className="dot">·</span>Reliable
            </div>
            <div className="copy">© 2026 Precision Sewer Inspection. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </>
  )
}
