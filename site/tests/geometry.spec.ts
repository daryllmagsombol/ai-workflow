import { expect, test } from '@playwright/test';
import { routeCycle, type Point, type Rect } from '../src/lib/connectorGeometry';

export function intersects(a: Point, b: Point, card: Rect, clearance = 12) {
  const l = card.x - clearance, r = card.x + card.width + clearance;
  const t = card.y - clearance, bottom = card.y + card.height + clearance;
  if (Math.abs(a.y - b.y) < 0.01) return a.y > t && a.y < bottom && Math.max(a.x, b.x) > l && Math.min(a.x, b.x) < r;
  if (Math.abs(a.x - b.x) < 0.01) return a.x > l && a.x < r && Math.max(a.y, b.y) > t && Math.min(a.y, b.y) < bottom;
  throw new Error('Expected orthogonal gutter routing');
}

for (const columns of [1, 2, 4]) {
  for (const variableHeight of [false, true]) {
    test(`${columns} columns, ${variableHeight ? 'variable' : 'normal'} heights route in gutters in stage order`, () => {
      const width = columns === 1 ? 284 : columns === 2 ? 700 : 1200;
      const cardWidth = (width - (columns === 1 ? 76 : 128) - (columns - 1) * 64) / columns;
      const cards: Rect[] = [];
      let y = columns === 1 ? 24 : 48;
      for (let row = 0; row < 8 / columns; row++) {
        const height = variableHeight ? 105 + row * 23 : 88;
        for (let col = 0; col < columns; col++) cards.push({ x: 64 + col * (cardWidth + 64), y, width: cardWidth, height });
        y += height + (columns === 1 ? 24 : 96);
      }
      const bounds = { x: 0, y: 0, width, height: y - (columns === 1 ? 24 : 96) + (columns === 1 ? 48 : 64) };
      const route = routeCycle(cards, bounds);
      expect(route.forward.length).toBeGreaterThanOrEqual(8);
      expect(route.correction.length).toBeGreaterThanOrEqual(4);
      const ports = cards.map(card => columns === 1 ? { x: 32, y: card.y + card.height / 2 } : { x: card.x + card.width / 2, y: card.y - 24 });
      let cursor = -1;
      for (const port of ports) {
        const found = route.forward.findIndex((point, index) => index > cursor && point.x === port.x && point.y === port.y);
        expect(found, `stage ${ports.indexOf(port) + 1}, including 04→05`).toBeGreaterThan(cursor);
        cursor = found;
      }
      expect(route.correction[0]).toEqual(ports[7]);
      expect(route.correction.at(-1)).toEqual(ports[5]);
      for (const path of [route.forward, route.correction]) {
        for (const point of path) {
          expect(point.x).toBeGreaterThanOrEqual(12);
          expect(point.x).toBeLessThanOrEqual(width - 12);
          expect(point.y).toBeGreaterThanOrEqual(12);
          expect(point.y).toBeLessThanOrEqual(bounds.height - 12);
        }
        for (let i = 1; i < path.length; i++) for (const card of cards) expect(intersects(path[i - 1], path[i], card)).toBe(false);
      }
    });
  }
}

test('empty input has no geometry', () => {
  expect(routeCycle([], { x: 0, y: 0, width: 0, height: 0 })).toEqual({ forward: [], correction: [] });
});
