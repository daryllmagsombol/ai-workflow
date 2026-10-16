import { useEffect, useState, type RefObject } from 'react';
import { routeCycle, type CycleRoute, type Rect } from '../lib/connectorGeometry';

export interface MeasuredCycle extends CycleRoute { cards: Rect[]; bounds: Rect }

export function useConnectorGeometry(ref: RefObject<HTMLElement | null>) {
  const [geometry, setGeometry] = useState<MeasuredCycle | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let frame = 0, disposed = false;
    function measure() {
      if (disposed || !element) return;
      const box = element.getBoundingClientRect();
      const bounds = { x: 0, y: 0, width: box.width, height: box.height };
      const cards = Array.from(element.querySelectorAll('.cycle-card'), card => {
        const rect = card.getBoundingClientRect();
        return { x: rect.left - box.left, y: rect.top - box.top, width: rect.width, height: rect.height };
      });
      const next = { cards, bounds, ...routeCycle(cards, bounds) };
      setGeometry(current => JSON.stringify(current) === JSON.stringify(next) ? current : next);
    }
    function schedule() { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); }
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    element.querySelectorAll('.cycle-card').forEach(card => observer.observe(card));
    window.addEventListener('resize', schedule, { passive: true });
    document.fonts.ready.then(schedule);
    document.fonts.addEventListener('loadingdone', schedule);
    measure();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      document.fonts.removeEventListener('loadingdone', schedule);
    };
  }, [ref]);
  return geometry;
}
