import { useEffect, useRef, useState } from 'react';
import { evidenceLinks, stages, type StageId } from '../data/workflow';
import DelegationScene from './DelegationScene';
import { motion } from 'motion/react';
import { useMotionPreference } from './MotionControls';

export default function StageDetails() {
  const { running } = useMotionPreference();
  const [openStages, setOpenStages] = useState<readonly StageId[]>(['understand']);
  const [enhanced, setEnhanced] = useState(false);
  const stageList = useRef<HTMLDivElement>(null);
  const allOpen = openStages.length === stages.length;

  useEffect(() => {
    setEnhanced(true);
    let focusFrame = 0;
    function reveal(hash: string) {
      const stage = stages.find(item => `#${item.id}` === hash);
      if (!stage) return;
      const disclosure = document.getElementById(stage.id);
      if (disclosure instanceof HTMLDetailsElement) disclosure.open = true;
      cancelAnimationFrame(focusFrame);
      focusFrame = requestAnimationFrame(() => {
        const summary = document.querySelector<HTMLElement>(`#${stage.id} > summary`);
        summary?.focus({ preventScroll: true });
        summary?.scrollIntoView({ block: 'start' });
      });
    }
    const onHash = () => reveal(window.location.hash);
    function onLink(event: MouseEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const anchor = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
      if (anchor) reveal(anchor.getAttribute('href') ?? '');
    }
    onHash();
    window.addEventListener('hashchange', onHash);
    document.addEventListener('click', onLink);
    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener('hashchange', onHash);
      document.removeEventListener('click', onLink);
    };
  }, []);

  function recordToggle() {
    // Native toggle events may be queued/coalesced. Read current DOM state rather
    // than replaying a stale event into controlled `open` props.
    const current = Array.from(stageList.current?.querySelectorAll<HTMLDetailsElement>(':scope > details[open]') ?? []);
    setOpenStages(current.map(disclosure => disclosure.id as StageId));
  }

  function toggleAll() {
    stageList.current?.querySelectorAll<HTMLDetailsElement>(':scope > details').forEach(disclosure => {
      disclosure.open = !allOpen;
    });
    recordToggle();
  }

  return (
    <section className="walkthrough-section page-shell" aria-labelledby="walkthrough-title">
      <motion.div className="task-brief" initial={false} whileInView={running ? { opacity: [.7, 1], y: [18, 0] } : undefined} viewport={{ once: true }} transition={{ duration: .8 }}>
        <div><p className="micro">Follow along / illustrative walkthrough</p><h2>“Add search and filters<br />to an existing application.”</h2></div>
        <p>A made-up task to make the method concrete—not a client case study or completed feature.
          The steps describe possible decisions and outputs, not actual test results.</p>
      </motion.div>
      <div className="walkthrough-layout">
        <aside className="exploration-guide">
          <p className="chapter-label">02 / Open the work</p>
          <h2 id="walkthrough-title">Behind<br />each moment.</h2>
          <p>Follow the task in order, or open any stage. The what, why, and output stay visible on your terms.</p>
          <button type="button" className="outline-button" hidden={!enhanced} aria-controls="stage-list"
            onClick={toggleAll}>
            {allOpen ? 'Close all stages' : 'Open all stages'}<span aria-hidden="true">{allOpen ? '−' : '+'}</span>
          </button>
          <p className="guide-note">Jump freely. Nothing is locked.<br />Several stages can stay open.</p>
        </aside>
        <div className="stage-list" id="stage-list" ref={stageList}>
          {stages.map((stage, index) => (
            <details className="stage-details" id={stage.id} key={stage.id} open={stage.id === 'understand'}
              onToggle={event => {
                if (event.target === event.currentTarget) recordToggle();
              }}>
              <summary>
                <h3 className="stage-summary-heading">
                  <span className="stage-number" aria-hidden="true">{String(stage.number).padStart(2, '0')}</span>
                  <span className="summary-copy"><span className="stage-heading"><span className="stage-title">{stage.title}</span>{stage.conditional ? <span className="conditional-label">{stage.conditional}</span> : null}</span><span className="stage-summary">{stage.summary}</span></span>
                  <span className="disclosure-mark" aria-hidden="true" />
                </h3>
              </summary>
              <div className="stage-body">
                <dl className="stage-explanation"><div><dt>What happens</dt><dd>{stage.what}</dd></div><div><dt>Why it matters</dt><dd>{stage.why}</dd></div></dl>
                {stage.id === 'delegate' ? <DelegationScene /> : null}
                <div className="illustrative-output"><p className="micro">Illustrative output</p><p>{stage.output}</p></div>
                {stage.id === 'review' || stage.id === 'verify' ? (
                  <div className="correction-note"><p className="micro">A correction, not a dead end</p><p>Investigate the cause, fix the responsible stage, then review and verify again.</p><a href="#implement">Return to implementation <span aria-hidden="true">↶</span></a></div>
                ) : null}
                <nav className="stage-actions" aria-label={`${stage.title} next steps`}>
                  {index < stages.length - 1 ? <a href={`#${stages[index + 1].id}`}>Next: {stages[index + 1].title.toLowerCase()} <span aria-hidden="true">→</span></a> : <a href="#human-approval">Then: human review and approval <span aria-hidden="true">→</span></a>}
                  <a href={evidenceLinks[0].href}>Read the method <span aria-hidden="true">↗</span></a>
                </nav>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
