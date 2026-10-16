import { evidenceLinks, profileUrl, repositoryUrl } from '../data/workflow';

export default function EvidenceFooter() {
  return (
    <>
      <section id="evidence" className="evidence-section page-shell" aria-labelledby="evidence-title">
        <p className="chapter-label">04 / Inspect the actual setup</p>
        <div className="section-heading"><h2 id="evidence-title">The method has<br /><span>a paper trail.</span></h2><p>These links open the real repository—not example evidence for the search task.
          Its CI validates configuration and scripts, not an application search feature.</p></div>
        <div className="evidence-links">
          {evidenceLinks.filter(link => link.id !== 'profile').map((link, index) => (
            <a href={link.href} key={link.id} className="evidence-link"><span className="micro">0{index + 1} / Repository evidence</span><h3>{link.title}</h3><p>{link.description}</p><span className="evidence-action">Inspect the source <span aria-hidden="true">↗</span></span></a>
          ))}
        </div>
        <p className="evidence-note-text">Checks vary by project. SonarQube is opt-in. No live CI status is implied here.</p>
      </section>
      <footer className="closing-section page-shell">
        <div><p className="eyebrow">AI-assisted software engineering</p><p className="closing-statement">AI does the assisting.<br /><span>I own the outcome.</span></p></div>
        <div className="closing-actions"><a className="primary-link" href={profileUrl}>GitHub profile <span aria-hidden="true">↗</span></a><a href={repositoryUrl} className="secondary-link">View the repository <span aria-hidden="true">↗</span></a></div>
        <div className="footer-byline"><span>daryllmagsombol / Software Engineer</span><span>A working method, not a promise of autopilot.</span></div>
      </footer>
    </>
  );
}
