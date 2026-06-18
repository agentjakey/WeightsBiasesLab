import { AUTHOR, GITHUB_URL, LAST_UPDATED, SIBLING_PROJECTS, UCSD_URL } from '@/lib/config'

export function Footer() {
  // Underline decoration colors copied from FailModeAtlas Footer.
  const linkStyle = {
    color: 'inherit',
    textDecoration: 'underline',
    textDecorationColor: 'rgba(92, 90, 84, 0.45)',
    textUnderlineOffset: '2px',
  } as React.CSSProperties

  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-[720px] px-6 py-16">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <p className="mb-3.5 font-mono text-[11px] uppercase tracking-widest text-accent">
              About
            </p>
            <p className="font-serif text-[16px] leading-[1.8] text-secondary">
              Built as a companion demo for{' '}
              <span className="text-primary">Week 2A: Why Neural Networks?</span> by{' '}
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                {AUTHOR}
              </a>
              . The neuron, the dataset, and the boundary are toy-sized on purpose. The point is to
              feel how three numbers steer a real prediction.
            </p>
          </div>

          <div>
            <p className="mb-3.5 font-mono text-[11px] uppercase tracking-widest text-accent">
              Sibling Projects
            </p>
            <div className="flex flex-col gap-3">
              {SIBLING_PROJECTS.map((p) => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-[14px] text-secondary transition-colors hover:text-primary"
                  style={{
                    textDecoration: 'underline',
                    textDecorationColor: 'rgba(92, 90, 84, 0.35)',
                    textUnderlineOffset: '2px',
                  }}
                >
                  {p.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <p
            className="mb-4 font-serif text-[14px] italic leading-[1.7] text-faint"
            style={{ maxWidth: '560px' }}
          >
            A single neuron is the smallest piece of a network. Once these three sliders feel
            obvious, a layer is just many of them, and a deep net is just many layers.
          </p>
          <p className="font-sans text-[13px] leading-[1.7] text-secondary">
            Made by{' '}
            <a
              href="https://www.linkedin.com/in/jacob-ortiz-ab6421348/"
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
            >
              Jacob Ortiz
            </a>
            , a physics student at{' '}
            <a href={UCSD_URL} target="_blank" rel="noopener noreferrer" style={linkStyle}>
              UCSD
            </a>{' '}
            working on AI safety and interpretability.
          </p>
          <p className="mt-4 font-mono text-[11px] text-faint">
            Last updated: {LAST_UPDATED} &middot; MIT License
          </p>
        </div>
      </div>
    </footer>
  )
}
