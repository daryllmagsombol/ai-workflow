import { profileUrl } from './data/workflow';
import Hero from './components/Hero';
import WorkflowCycle from './components/WorkflowCycle';
import StageDetails from './components/StageDetails';
import CheckpointScene from './components/CheckpointScene';
import EvidenceFooter from './components/EvidenceFooter';
import { MotionProvider } from './components/MotionControls';

export default function App() {
  return (
    <MotionProvider>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="page-shell site-header">
        <a className="byline" href={profileUrl}><svg className="brand-mark" width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M11 1v20M1 11h20M4 4l14 14M4 18 18 4" stroke="currentColor" strokeWidth="1.2" /></svg>daryllmagsombol</a>
        <p className="professional-title">Software Engineer</p>
        <nav aria-label="Main navigation" className="header-links">
          <a href="#workflow">The workflow</a>
          <a href="#evidence">The evidence <span aria-hidden="true">↗</span></a>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        <Hero />
        <WorkflowCycle />
        <StageDetails />
        <CheckpointScene />
        <EvidenceFooter />
      </main>
    </MotionProvider>
  );
}
