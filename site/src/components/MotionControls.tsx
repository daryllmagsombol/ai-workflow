import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { MotionConfig, useAnimationFrame, useMotionValue, useReducedMotion, type MotionValue } from 'motion/react';

interface MotionPreference {
  paused: boolean;
  reduced: boolean;
  running: boolean;
  enhanced: boolean;
  generation: number;
  clock: MotionValue<number>;
  toggle: () => void;
  replay: () => void;
}
const Preference = createContext<MotionPreference | null>(null);

export function MotionProvider({ children }: { children: ReactNode }) {
  const rawReduced = useReducedMotion() === true;
  const [paused, setPaused] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const [visible, setVisible] = useState(true);
  const [generation, setGeneration] = useState(0);
  const clock = useMotionValue(0);
  // The server render cannot read prefers-reduced-motion, so the preference is
  // only honored after `enhanced` flips true in an effect. This keeps the
  // prerendered markup and the first client render identical (no hydration
  // mismatch), while the reduced-motion stylesheet still applies immediately.
  const reduced = enhanced && rawReduced;
  useEffect(() => {
    setEnhanced(true);
    const sync = () => setVisible(!document.hidden);
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);
  const running = enhanced && !paused && !reduced && visible;
  useAnimationFrame((_time, delta) => { if (running) clock.set(clock.get() + Math.min(delta, 64)); });
  const value = { paused, reduced, running, enhanced, generation, clock,
    toggle: () => setPaused(current => !current),
    replay: () => { clock.set(0); setGeneration(current => current + 1); },
  };
  return <MotionConfig reducedMotion="user"><Preference.Provider value={value}>{children}</Preference.Provider></MotionConfig>;
}

export function useMotionPreference() {
  const value = useContext(Preference);
  if (!value) throw new Error('Motion components require MotionProvider.');
  return value;
}

export default function MotionControls() {
  const { paused, reduced, enhanced, generation, toggle, replay } = useMotionPreference();
  return (
    <div className="motion-controls" hidden={!enhanced} data-replay-generation={generation}>
      <p className="motion-explainer">Illustrative motion. Not live project progress.</p>
      <div><button type="button" disabled={reduced} aria-pressed={paused} onClick={toggle}>{reduced ? 'Reduced motion enabled' : paused ? 'Resume motion' : 'Pause motion'}</button>
        <button type="button" disabled={reduced} onClick={replay}>Replay flow <span aria-hidden="true">↻</span></button></div>
    </div>
  );
}
