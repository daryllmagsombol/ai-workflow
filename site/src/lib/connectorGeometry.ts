export interface Rect { x: number; y: number; width: number; height: number }
export interface Point { x: number; y: number }
export interface CycleRoute { forward: Point[]; correction: Point[] }

export function routeCycle(cards: readonly Rect[], bounds: Rect): CycleRoute {
  if (!cards.length) return { forward: [], correction: [] };
  const vertical = cards.length === 1 || cards.every(card => Math.abs(card.x - cards[0].x) < 1);
  const left = bounds.x + 32;
  const right = bounds.x + bounds.width - 32;
  const ports = cards.map(card => vertical
    ? { x: left, y: card.y + card.height / 2 }
    : { x: card.x + card.width / 2, y: card.y - 24 });
  const forward: Point[] = [ports[0]];
  for (let i = 1; i < cards.length; i++) {
    if (!vertical && cards[i].y > cards[i - 1].y + 1) {
      // Wrap outside the completed row, then cross its reserved lower gutter.
      const rowBottom = Math.max(...cards.slice(0, i).filter(card => Math.abs(card.y - cards[i - 1].y) < 1).map(card => card.y + card.height));
      const transit = rowBottom + 24;
      forward.push({ x: right, y: ports[i - 1].y }, { x: right, y: transit }, { x: left, y: transit }, { x: left, y: ports[i].y });
    }
    forward.push(ports[i]);
  }
  const last = ports.at(-1)!;
  const targetIndex = Math.max(0, cards.length - 3);
  const target = ports[targetIndex];
  const bottom = bounds.y + bounds.height - 20;
  let correction: Point[];
  if (vertical) {
    const rail = bounds.x + 12;
    correction = [last, { x: last.x, y: bottom }, { x: rail, y: bottom }, { x: rail, y: target.y }, target];
  } else {
    const rail = bounds.x + bounds.width - 16;
    const previous = cards[targetIndex - 1];
    const targetCard = cards[targetIndex];
    const gutter = previous && Math.abs(previous.y - targetCard.y) < 1
      ? (previous.x + previous.width + targetCard.x) / 2 : targetCard.x - 32;
    correction = [last, { x: rail, y: last.y }, { x: rail, y: bottom }, { x: gutter, y: bottom }, { x: gutter, y: target.y }, target];
  }
  return { forward, correction };
}

export function pathData(points: readonly Point[]): string {
  return points.map((point, index) => `${index ? 'L' : 'M'}${point.x},${point.y}`).join(' ');
}

export function pointOnRoute(points: readonly Point[], progress: number): Point {
  if (!points.length) return { x: 0, y: 0 };
  const lengths = points.slice(1).map((point, index) => Math.hypot(point.x - points[index].x, point.y - points[index].y));
  let distance = Math.max(0, Math.min(1, progress)) * lengths.reduce((sum, length) => sum + length, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i]) {
      const ratio = lengths[i] ? distance / lengths[i] : 0;
      return { x: points[i].x + (points[i + 1].x - points[i].x) * ratio, y: points[i].y + (points[i + 1].y - points[i].y) * ratio };
    }
    distance -= lengths[i];
  }
  return points.at(-1)!;
}
