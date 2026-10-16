import { useEffect, useState, type RefObject } from 'react';
import { useMotionValue, useMotionValueEvent, useScroll } from 'motion/react';
import { useMotionPreference } from '../components/MotionControls';

// Freeze the last rendered depth while paused, rather than resetting transforms.
export function useSceneProgress(target: RefObject<HTMLElement | null>, hero = false) {
  const { running, reduced } = useMotionPreference();
  const [mobile, setMobile] = useState(false);
  const progress = useMotionValue(0);
  const { scrollYProgress } = useScroll({ target, offset: hero ? ['start start', 'end start'] : ['start end', 'end start'] });
  useEffect(() => {
    const query = matchMedia('(max-width: 650px)');
    const sync = () => setMobile(query.matches);
    sync(); query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  useMotionValueEvent(scrollYProgress, 'change', value => {
    if (running) progress.set(Math.max(0, Math.min(1, value)) * (mobile ? .35 : 1));
  });
  useEffect(() => {
    if (reduced) progress.set(0);
    else if (running) progress.set(Math.max(0, Math.min(1, scrollYProgress.get())) * (mobile ? .35 : 1));
  }, [running, reduced, mobile, progress, scrollYProgress]);
  return progress;
}
