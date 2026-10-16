import { useRef } from 'react';
import { motion, useMotionValueEvent, useTransform } from 'motion/react';
import { pathData, pointOnRoute } from '../lib/connectorGeometry';
import type { MeasuredCycle } from '../hooks/useConnectorGeometry';
import { useMotionPreference } from './MotionControls';

export default function CycleConnections({ geometry }: { geometry: MeasuredCycle | null }) {
  const { clock, enhanced, reduced } = useMotionPreference();
  const token = useRef<SVGCircleElement>(null);
  const path = useTransform(clock, time => {
    if (!geometry) return { x: 0, y: 0 };
    const phase = time % 18000 / 18000;
    // Forward → correction to Implement → review/verify again.
    if (phase < .6) return pointOnRoute(geometry.forward, phase / .6);
    if (phase < .82) return pointOnRoute(geometry.correction, (phase - .6) / .22);
    const target = geometry.correction.at(-1)!;
    const start = geometry.forward.findIndex(point => point.x === target.x && point.y === target.y);
    return pointOnRoute(geometry.forward.slice(start), (phase - .82) / .18);
  });
  const cx = useTransform(path, point => point.x);
  const cy = useTransform(path, point => point.y);
  const fill = useTransform(clock, time => time % 18000 >= 10800 && time % 18000 < 14760 ? '#e9c491' : '#e4efff');
  useMotionValueEvent(clock, 'change', time => token.current?.setAttribute('data-progress', String(time)));
  if (!geometry) return null;
  return (
    <svg className="cycle-connections" viewBox={`0 0 ${geometry.bounds.width} ${geometry.bounds.height}`} aria-hidden="true" data-geometry={JSON.stringify(geometry)}>
      <path className="forward-path" d={pathData(geometry.forward)} />
      <path className="correction-path" d={pathData(geometry.correction)} />
      {geometry.cards.map((card, index) => {
        const vertical = geometry.cards.every(item => Math.abs(item.x - geometry.cards[0].x) < 1);
        return <circle className="route-port" key={index} cx={vertical ? 32 : card.x + card.width / 2} cy={vertical ? card.y + card.height / 2 : card.y - 24} r="2" />;
      })}
      {enhanced && !reduced ? <motion.circle ref={token} className="task-token" data-progress="0" r="3" style={{ cx, cy, fill }} /> : null}
    </svg>
  );
}
