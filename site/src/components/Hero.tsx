import { repositoryUrl } from '../data/workflow';
import { useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import MotionControls, { useMotionPreference } from './MotionControls';
import { useSceneProgress } from '../hooks/useSceneProgress';

export default function Hero() {
  const hero = useRef<HTMLElement>(null);
  const { clock, running, enhanced, reduced } = useMotionPreference();
  const pointer = useMotionValue(0);
  const progress = useSceneProgress(hero, true);
  const lightY = useTransform(progress, value => value * 240);
  const titleY = useTransform(progress, value => value * -110);
  const artY = useTransform(progress, value => value * 140);
  const orbitScale = useTransform(progress, value => 1 + value * .18);
  const requestX = useTransform(progress, value => value * 34);
  const evidenceX = useTransform(progress, value => value * -34);
  const orbitRotation = useTransform(clock, time => time / 160);
  const counterRotation = useTransform(clock, time => -time / 240);
  const depthX = useTransform(pointer, value => value * -.5);
  const tokenProgress = useTransform(clock, time => `${time % 10000 / 100}%`);
  const tokenOpacity = useTransform(clock, time => {
    const phase = time % 10000 / 10000;
    return phase < .08 || phase > .94 ? 0 : .85;
  });
  return (
    <section className="hero page-shell" aria-labelledby="intro-title" ref={hero} onPointerMove={event => {
      if (!running || event.pointerType !== 'mouse' || window.innerWidth <= 650) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      pointer.set(((event.clientX - bounds.left) / bounds.width - .5) * 36);
    }} onPointerLeave={() => { if (running) pointer.set(0); }}>
      <motion.div className="hero-light" data-depth="background" style={{ x: pointer, y: lightY }} aria-hidden="true" />
      <motion.div className="hero-depth-grid" data-depth="rails" style={{ x: depthX, y: lightY }} aria-hidden="true"><span /><span /><span /></motion.div>
      <p className="eyebrow hero-eyebrow"><span className="signal-dot" aria-hidden="true" />AI-assisted. Human-led.</p>
      <motion.h1 id="intro-title" data-depth="typography" style={{ y: titleY }} initial={false} animate={running ? { opacity: [.65, 1] } : undefined} transition={{ duration: 1 }}>How I build{' '}<br /><span>software with AI.</span></motion.h1>
      <p className="hero-description">Specialized AI assistants help me investigate, implement, review, and verify.
        <span>I stay responsible for the decisions—and what gets shipped.</span>
      </p>
      <div className="hero-actions">
        <a className="primary-link" href="#workflow">Explore my workflow <span aria-hidden="true">↓</span></a>
        <a className="secondary-link" href={repositoryUrl}>View the repository <span aria-hidden="true">↗</span></a>
      </div>

      <motion.div className="hero-story" data-depth="foreground" style={{ y: artY }} role="group" aria-label="From an illustrative request to a human-led engineering cycle">
        <div className="hero-story-line" aria-hidden="true" />
        {enhanced && !reduced ? <motion.span className="hero-request-token" style={{ offsetDistance: tokenProgress, opacity: tokenOpacity }} aria-hidden="true" /> : null}
        <motion.div className="story-note request-note" style={{ x: requestX }}>
          <p className="micro">The request / illustrative</p>
          <p className="story-title">“Add search<br />and filters.”</p>
          <p className="story-caption">An existing application.<br />A problem to understand first.</p>
        </motion.div>
        <div className="judgment-scene">
          <motion.div className="orbit-ring orbit-outer" style={{ rotate: orbitRotation, scale: orbitScale }} aria-hidden="true"><span className="orbit-tracer" /></motion.div>
          <motion.div className="orbit-ring orbit-inner" style={{ rotate: counterRotation }} aria-hidden="true" />
          <div className="judgment-core">
            <p className="micro">Throughout the cycle</p>
            <p>Human judgment</p>
            <span>Decisions. Trade-offs. Approval.</span>
          </div>
        </div>
        <motion.div className="story-note evidence-note" style={{ x: evidenceX }}>
          <p className="micro">The goal / not a reported result</p>
          <p className="story-title">A change we can<br />explain and check.</p>
          <p className="story-caption">Review. Verify. Correct.<br />Then a human decides.</p>
        </motion.div>
      </motion.div>
      <div className="scene-caption"><span>One request. A coordinated cycle.</span><span>Illustrative task · not live project status</span></div>
      <MotionControls />
    </section>
  );
}
