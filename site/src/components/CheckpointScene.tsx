import { stages } from '../data/workflow';
import { motion, useTransform } from 'motion/react';
import { useRef } from 'react';
import { useSceneProgress } from '../hooks/useSceneProgress';
import { useMotionPreference } from './MotionControls';

function Checkpoint({ id, title, number, index }: { id: string; title: string; number: number; index: number }) {
  const { clock, enhanced, reduced } = useMotionPreference();
  const emphasis = useTransform(clock, time => {
    if (!enhanced || reduced) return 1;
    const phase = time % 18000 / 18000;
    const active = phase < .35 ? 0 : phase < .55 ? 1 : phase < .78 ? 0 : phase < .9 ? 1 : 2;
    return active === index ? 1 : .7;
  });
  const spotlight = useTransform(emphasis, value => value === 1 ? .8 : 0);
  return <motion.li style={{ opacity: emphasis }}>
    <motion.span className="checkpoint-spotlight" style={{ opacity: spotlight }} aria-hidden="true" />
    <p className="micro">{String(number).padStart(2, '0')} / {title}</p>
    <h3>{checkpointCopy[id].title}</h3><p>{checkpointCopy[id].description}</p>
    <a href={`#${id}`}>Explore {title.toLowerCase()} <span aria-hidden="true">↗</span></a>
  </motion.li>;
}

const checkpointCopy: Record<string, { title: string; description: string }> = {
  implement: { title: 'Make the change.', description: 'Fix the combined search and filter behavior, not just a visible symptom.' },
  review: { title: 'Challenge it.', description: 'Review the diff. Investigate a finding. Reconcile the result.' },
  verify: { title: 'Check it again.', description: 'Run relevant checks. Report the actual evidence and limitations.' },
};

export default function CheckpointScene() {
  const section = useRef<HTMLElement>(null);
  const progress = useSceneProgress(section);
  const titleY = useTransform(progress, value => 38 - Math.min(value * 2, 1) * 76);
  const { clock, running, enhanced, reduced } = useMotionPreference();
  const returnProgress = useTransform(clock, time => Math.max(0, Math.min(1, (time % 18000 / 18000 - .55) / .23)));
  const returnOpacity = useTransform(clock, time => {
    const phase = time % 18000 / 18000;
    return phase >= .55 && phase <= .8 ? 1 : 0;
  });
  return (
    <section className="checkpoint-section page-shell" aria-labelledby="checkpoint-title" ref={section}>
      <motion.div className="checkpoint-scene scene-frame" initial={false} whileInView={running ? { y: [25, 0], opacity: [.7, 1] } : undefined} viewport={{ once: true, amount: .2 }} transition={{ duration: .9 }}>
        <p className="chapter-label">03 / Evidence changes the direction</p>
        <motion.h2 id="checkpoint-title" className="checkpoint-depth-title" style={{ y: enhanced && !reduced ? titleY : 0 }}>A finding is not the end.<br /><span>It’s a reason to loop back.</span></motion.h2>
        <p className="scene-description">Imagine the status filter drops the search term. Review catches the issue.
          The change returns to implementation, then through review and verification again.</p>
        <ol className="checkpoint-sequence">
          {stages.filter(stage => stage.id in checkpointCopy).map((stage, index) => (
            <Checkpoint key={stage.id} id={stage.id} title={stage.title} number={stage.number} index={index} />
          ))}
        </ol>
        <div className="correction-rail"><span aria-hidden="true">↶</span><p>A finding returns the work to the stage that needs attention.</p>
          {enhanced && !reduced ? <motion.span className="correction-trace" style={{ scaleX: returnProgress, opacity: returnOpacity }} aria-hidden="true" /> : null}
        </div>
        <p className="scene-footnote">Illustrative correction loop. Not an actual review verdict or test result.</p>
      </motion.div>
      <section id="human-approval" className="human-approval" aria-labelledby="approval-title">
        <div><p className="eyebrow">The decision stays human</p><h2 id="approval-title">Evidence informs approval.<br /><span>It doesn’t replace it.</span></h2></div>
        <div><p>I remain responsible for requirements, architecture, security-sensitive decisions, acceptance criteria,
          final review, and merge. Verified work is ready for that decision—not automatically approved.</p><a href="#understand">New requirement? Start the cycle again <span aria-hidden="true">↶</span></a></div>
      </section>
    </section>
  );
}
