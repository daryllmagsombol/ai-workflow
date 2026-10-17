import { specialists } from '../data/workflow';
import { motion, useTransform } from 'motion/react';
import { useMotionPreference } from './MotionControls';

function ParallelLane({ title, label, index }: { title: string; label: string; index: number }) {
  const { clock, reduced, enhanced } = useMotionPreference();
  const opacity = useTransform(clock, time => reduced || !enhanced ? 1 : .72 + Math.max(0, Math.sin((time % 10000 / 10000 - index * .045) * Math.PI * 2)) * .28);
  const emphasis = useTransform(clock, time => reduced || !enhanced ? 0 : Math.max(0, Math.sin((time % 10000 / 10000 - .14 - index * .065) * Math.PI * 2)));
  const lift = useTransform(emphasis, value => value * -12);
  const entry = useTransform(clock, time => Math.max(0, Math.min(1, (time % 10000 / 10000 - .12 - index * .045) / .3)));
  const exit = useTransform(clock, time => Math.max(0, Math.min(1, (time % 10000 / 10000 - .5 - index * .025) / .25)));
  return <motion.div className="parallel-lane" style={{ opacity, y: lift }}>
    <motion.span className="lane-spotlight" style={{ opacity: emphasis }} aria-hidden="true" />
    <span className="micro">{title}</span><p>{label}</p>
    {enhanced && !reduced ? <><motion.span className="lane-arrival" style={{ scaleY: entry }} aria-hidden="true" /><motion.span className="lane-departure" style={{ scaleY: exit }} aria-hidden="true" /></> : null}
  </motion.div>;
}

export default function DelegationScene() {
  const { clock, reduced, enhanced, running } = useMotionPreference();
  const mergeOpacity = useTransform(clock, time => reduced || !enhanced ? 1 : time % 10000 / 10000 > .75 ? 1 : .65);
  const fork = useTransform(clock, time => Math.max(0, Math.min(1, (time % 10000 / 10000 - .04) / .16)));
  const convergence = useTransform(clock, time => Math.max(0, Math.min(1, (time % 10000 / 10000 - .6) / .2)));
  const featured = specialists.filter(role => ['explorer', 'designer', 'librarian'].includes(role.id));
  return (
    <section className="delegation-scene" aria-labelledby="delegation-title">
      <p className="micro">Inside delegation / illustrative lanes</p>
      <motion.h4 id="delegation-title" initial={false} whileInView={running ? { y: [16, 0], opacity: [.65, 1] } : undefined} viewport={{ once: true }} transition={{ duration: .8 }}>Different lines of inquiry.<br /><span>One agreed direction.</span></motion.h4>
      <p className="scene-description">Interface exploration and documentation research can proceed independently.
        Shared decisions are reconciled before dependent implementation begins.</p>
      <div className="delegation-diagram">
        <div className="coordination-node"><span className="micro">Orchestrator</span><strong>A scoped brief + clear boundaries</strong></div>
        <div className="parallel-lanes">
          {enhanced && !reduced ? <><motion.span className="fork-bus" style={{ scaleX: fork }} aria-hidden="true" /><motion.span className="merge-bus" style={{ scaleX: convergence }} aria-hidden="true" /></> : null}
          {featured.map((role, index) => (
            <ParallelLane key={role.id} index={index} title={`${role.title}${role.id === 'librarian' ? ' / if needed' : ''}`} label={role.id === 'explorer' ? 'Read the app' : role.id === 'designer' ? 'Explore the interface' : 'Check the docs'} />
          ))}
        </div>
        <motion.div className="coordination-node convergence-node" style={{ opacity: mergeOpacity }}><span className="micro">Reconcile the results</span><strong>Agreed approach → implementation</strong></motion.div>
      </div>
      <p className="scene-note">Only independent work runs in parallel. Exploration often informs the brief first.
        The task determines the mix—not every specialist participates every time.</p>
      <details className="specialist-details">
        <summary>Explore the seven specialist roles <span aria-hidden="true" className="disclosure-mark" /></summary>
        <div className="specialist-roles">
          {specialists.map(role => (
            <section className="specialist-role" key={role.id} aria-labelledby={`role-${role.id}`}>
              <h5 id={`role-${role.id}`}>{role.title}</h5>
              <p>{role.responsibility}</p>
            </section>
          ))}
        </div>
      </details>
    </section>
  );
}
