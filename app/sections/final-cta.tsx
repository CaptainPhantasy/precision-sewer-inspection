import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import { COMPANY_INFO } from '@/lib/constants'

export default function FinalCTA() {
  return (
    <section className="psi dark" data-screen-label="Final CTA" style={{ backgroundColor: 'var(--accent)', padding: '4rem 0' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        
        <h2 className="psi" style={{ color: '#fff', border: 'none', padding: 0, marginBottom: '1rem' }}>
          Don&apos;t Guess. Know What&apos;s In Your Pipes.
        </h2>
        
        <p className="lede" style={{ color: '#fff', opacity: 0.9, maxWidth: '600px', margin: '0 auto 2rem auto' }}>
          Book your professional sewer inspection today and get the evidence you need to make confident decisions.
        </p>

        <div className="cta-row" style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <Link
            href="/contact"
            className="btn"
            style={{ 
              backgroundColor: '#fff', 
              color: 'var(--accent)', 
              borderColor: '#fff',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            Book Your Inspection
            <ArrowRight size={18} strokeWidth={1.5} color="currentColor" style={{ marginLeft: '8px' }} />
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#fff', opacity: 0.9 }}>
          <Phone size={18} strokeWidth={1.5} color="currentColor" />
          <a href={`tel:${COMPANY_INFO?.phoneRaw ?? ''}`} style={{ fontWeight: 600, color: '#fff', textDecoration: 'none' }}>
            {COMPANY_INFO?.phone ?? ''}
          </a>
          <span style={{ margin: '0 8px', opacity: 0.5 }}>|</span>
          <span>Available 7 Days a Week</span>
        </div>
        
      </div>
    </section>
  )
}
