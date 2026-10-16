import { stages } from '../data/workflow';
import { useRef } from 'react';
import { motion } from 'motion/react';
import { useConnectorGeometry } from '../hooks/useConnectorGeometry';
import CycleConnections from './CycleConnections';
import { useMotionPreference } from './MotionControls';

export default function WorkflowCycle() {
  const surface = useRef<HTMLDivElement>(null);
  const geometry = useConnectorGeometry(surface);
  const { running } = useMotionPreference();
  return (
    <section id="workflow" className="workflow-section page-shell" aria-labelledby="workflow-title">
      <p className="chapter-label">01 / The process at a glance</p>
      <motion.div className="section-heading" initial={false} whileInView={running ? { opacity: [0.65, 1], y: [18, 0] } : { opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .8 }}>
        <div><p className="eyebrow">A cycle, not autopilot</p><h2 id="workflow-title">Move forward.<br /><span>Learn. Loop back.</span></h2></div>
        <p>A typical path, not a rigid checklist. Simple tasks take a lighter route.
          Research and delegation happen when useful; findings can send work back to an earlier stage.</p>
      </motion.div>
      <nav aria-label="Workflow stages">
        <div className="cycle-surface" ref={surface}>
        <ol className="cycle-map">
          {stages.map(stage => (
            <li key={stage.id}>
              <a className="cycle-card" href={`#${stage.id}`}>
                <span className="cycle-number">{String(stage.number).padStart(2, '0')}</span>
                <span className="cycle-name">{stage.title}{stage.conditional ? <small>{stage.conditional}</small> : null}</span>
                <span className="cycle-link-mark" aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ol>
        <CycleConnections geometry={geometry} />
        </div>
      </nav>
      <div className="cycle-return"><p><span aria-hidden="true">↶</span> Findings return to the stage that needs attention.</p><p>Verified work → human review → approval to ship</p></div>
    </section>
  );
}
