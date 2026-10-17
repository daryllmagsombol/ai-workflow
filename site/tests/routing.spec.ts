import { expect, test, type Page } from '@playwright/test';

interface Point { x: number; y: number }
interface Rect { x: number; y: number; width: number; height: number }
interface Geometry { cards: Rect[]; bounds: Rect; forward: Point[]; correction: Point[] }
interface Snapshot {
  geometry: Geometry;
  surface: Rect;
  measuredCards: Rect[];
  returnTop: number | null;
  footerTop: number | null;
  scrollWidth: number;
  innerWidth: number;
}

const CLEARANCE = 12;
const WIDTHS = [320, 390, 650, 651, 768, 1024, 1050, 1280, 1440];

// A segment avoids a card when it stays outside the card inflated by the
// required clearance. Routing is orthogonal, so only axis-aligned segments are
// valid input here.
function intersects(a: Point, b: Point, card: Rect, clearance = CLEARANCE) {
  const l = card.x - clearance, r = card.x + card.width + clearance;
  const t = card.y - clearance, bottom = card.y + card.height + clearance;
  if (Math.abs(a.y - b.y) < 0.01) return a.y > t && a.y < bottom && Math.max(a.x, b.x) > l && Math.min(a.x, b.x) < r;
  if (Math.abs(a.x - b.x) < 0.01) return a.x > l && a.x < r && Math.max(a.y, b.y) > t && Math.min(a.y, b.y) < bottom;
  throw new Error(`Expected orthogonal gutter routing, got (${a.x},${a.y})->(${b.x},${b.y})`);
}

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const svg = document.querySelector('.cycle-connections');
    const surface = document.querySelector('.cycle-surface') as HTMLElement;
    const box = surface.getBoundingClientRect();
    const measuredCards = Array.from(surface.querySelectorAll('.cycle-card')).map(card => {
      const rect = card.getBoundingClientRect();
      return { x: rect.left - box.left, y: rect.top - box.top, width: rect.width, height: rect.height };
    });
    const relativeTop = (selector: string) => {
      const element = document.querySelector(selector);
      return element ? element.getBoundingClientRect().top - box.top : null;
    };
    return {
      geometry: JSON.parse(svg!.getAttribute('data-geometry')!),
      surface: { x: 0, y: 0, width: box.width, height: box.height },
      measuredCards,
      returnTop: relativeTop('.cycle-return'),
      footerTop: relativeTop('.closing-section'),
      scrollWidth: document.body.scrollWidth,
      innerWidth: window.innerWidth,
    };
  });
}

// The rendered SVG geometry must match the live DOM: wait until the measured
// cards and reserved bounds agree with the values the component published.
async function expectStable(page: Page) {
  await expect.poll(async () => page.evaluate(() => {
    const svg = document.querySelector('.cycle-connections');
    if (!svg?.getAttribute('data-geometry')) return 1e9;
    const geometry = JSON.parse(svg.getAttribute('data-geometry')!);
    const surface = document.querySelector('.cycle-surface') as HTMLElement;
    const box = surface.getBoundingClientRect();
    const cards = Array.from(surface.querySelectorAll('.cycle-card')).map(card => {
      const rect = card.getBoundingClientRect();
      return { x: rect.left - box.left, y: rect.top - box.top, width: rect.width, height: rect.height };
    });
    if (!geometry.cards || cards.length !== geometry.cards.length) return 1e9;
    let delta = Math.abs(geometry.bounds.width - box.width) + Math.abs(geometry.bounds.height - box.height);
    cards.forEach((card, index) => {
      delta += Math.abs(card.x - geometry.cards[index].x) + Math.abs(card.y - geometry.cards[index].y)
        + Math.abs(card.width - geometry.cards[index].width) + Math.abs(card.height - geometry.cards[index].height);
    });
    return delta;
  }), { timeout: 5000, intervals: [50, 100, 200, 400] }).toBeLessThan(2);
}

function assertRouteQuality(snap: Snapshot, label: string) {
  const { geometry, surface, measuredCards, returnTop, footerTop } = snap;

  expect(geometry.cards.length, `${label}: eight measured cards`).toBe(8);
  expect(Math.abs(geometry.bounds.width - surface.width), `${label}: bounds width matches surface`).toBeLessThan(1.5);
  expect(Math.abs(geometry.bounds.height - surface.height), `${label}: bounds height matches surface`).toBeLessThan(1.5);

  geometry.cards.forEach((card, index) => {
    expect(Math.abs(card.x - measuredCards[index].x), `${label}: data-geometry card ${index} x matches DOM`).toBeLessThan(1.5);
    expect(Math.abs(card.y - measuredCards[index].y), `${label}: data-geometry card ${index} y matches DOM`).toBeLessThan(1.5);
    expect(Math.abs(card.width - measuredCards[index].width), `${label}: data-geometry card ${index} width matches DOM`).toBeLessThan(1.5);
    expect(Math.abs(card.height - measuredCards[index].height), `${label}: data-geometry card ${index} height matches DOM`).toBeLessThan(1.5);
  });

  for (const [name, path] of [['forward', geometry.forward], ['correction', geometry.correction]] as const) {
    expect(path.length, `${label}: ${name} route present`).toBeGreaterThan(1);
    for (let segment = 1; segment < path.length; segment++) {
      for (let card = 0; card < geometry.cards.length; card++) {
        expect(
          intersects(path[segment - 1], path[segment], geometry.cards[card]),
          `${label}: ${name} segment ${segment} clears card ${card} (12px)`,
        ).toBe(false);
      }
    }
  }

  const vertical = geometry.cards.every(card => Math.abs(card.x - geometry.cards[0].x) < 1);
  const ports = geometry.cards.map(card => vertical
    ? { x: 32, y: card.y + card.height / 2 }
    : { x: card.x + card.width / 2, y: card.y - 24 });

  let cursor = -1;
  ports.forEach((port, stageIndex) => {
    const found = geometry.forward.findIndex((point, index) =>
      index > cursor && Math.abs(point.x - port.x) < 0.5 && Math.abs(point.y - port.y) < 0.5);
    expect(found, `${label}: forward reaches stage ${stageIndex + 1} in order (04 -> 05 preserved)`).toBeGreaterThan(cursor);
    cursor = found;
  });

  // The correction route returns to the "implement" checkpoint (stage 6).
  const expectedReturn = ports[ports.length - 3];
  const landing = geometry.correction.at(-1)!;
  expect(Math.abs(landing.x - expectedReturn.x), `${label}: correction returns to implement (x)`).toBeLessThan(0.5);
  expect(Math.abs(landing.y - expectedReturn.y), `${label}: correction returns to implement (y)`).toBeLessThan(0.5);

  // Correction rails stay inside the reserved surface and clear of the return row
  // and footer, which sit below the measured cycle bounds.
  for (const point of geometry.correction) {
    expect(point.x, `${label}: correction inside horizontal bounds`).toBeGreaterThanOrEqual(0);
    expect(point.x, `${label}: correction inside horizontal bounds`).toBeLessThanOrEqual(geometry.bounds.width + 0.5);
    expect(point.y, `${label}: correction inside vertical bounds`).toBeGreaterThanOrEqual(0);
    expect(point.y, `${label}: correction inside vertical bounds`).toBeLessThanOrEqual(geometry.bounds.height + 0.5);
  }
  if (returnTop !== null) expect(returnTop, `${label}: return row sits below the cycle surface`).toBeGreaterThanOrEqual(geometry.bounds.height - 1);
  if (footerTop !== null) expect(footerTop, `${label}: footer sits below the cycle surface`).toBeGreaterThanOrEqual(geometry.bounds.height - 1);

  expect(snap.scrollWidth, `${label}: no horizontal overflow`).toBeLessThanOrEqual(snap.innerWidth + 1);
}

interface RenderedRoutes {
  forward: Point[];
  correction: Point[];
  debugForward: Point[];
  debugCorrection: Point[];
  cards: Rect[];
  footer: Rect;
  returnRow: Rect;
  tokenCenter: Point | null;
  scrollWidth: number;
  innerWidth: number;
}

// Read what is actually painted: parse the rendered path `d` strings, map the
// viewBox vertices through the live screen CTM, and pair them with the real
// getBoundingClientRect card rects. This catches a wrong/mis-scaled/mispositioned
// `d` that the debug data-geometry would not reveal.
async function renderedRoutes(page: Page): Promise<RenderedRoutes> {
  return page.evaluate(() => {
    const svg = document.querySelector('.cycle-connections') as SVGSVGElement;
    const surface = document.querySelector('.cycle-surface') as HTMLElement;
    const ctm = svg.getScreenCTM()!;
    const toScreen = (point: { x: number; y: number }) => {
      const local = svg.createSVGPoint();
      local.x = point.x;
      local.y = point.y;
      const screen = local.matrixTransform(ctm);
      return { x: screen.x, y: screen.y };
    };
    const parse = (d: string) => (d.match(/[ML](-?\d*\.?\d+),(-?\d*\.?\d+)/g) ?? []).map(token => {
      const [x, y] = token.slice(1).split(',').map(Number);
      return { x, y };
    });
    const rect = (element: Element) => {
      const box = element.getBoundingClientRect();
      return { x: box.left, y: box.top, width: box.width, height: box.height };
    };
    const geometry = JSON.parse(svg.getAttribute('data-geometry')!);
    const tokenBox = document.querySelector('.task-token')?.getBoundingClientRect();
    return {
      forward: parse(document.querySelector('.forward-path')!.getAttribute('d')!).map(toScreen),
      correction: parse(document.querySelector('.correction-path')!.getAttribute('d')!).map(toScreen),
      debugForward: geometry.forward.map(toScreen),
      debugCorrection: geometry.correction.map(toScreen),
      cards: Array.from(surface.querySelectorAll('.cycle-card')).map(rect),
      footer: rect(document.querySelector('.closing-section')!),
      returnRow: rect(document.querySelector('.cycle-return')!),
      tokenCenter: tokenBox ? { x: tokenBox.left + tokenBox.width / 2, y: tokenBox.top + tokenBox.height / 2 } : null,
      scrollWidth: document.body.scrollWidth,
      innerWidth: window.innerWidth,
    };
  });
}

function hasIntersection(polyline: Point[], cards: Rect[]) {
  for (let segment = 1; segment < polyline.length; segment++) {
    for (const card of cards) if (intersects(polyline[segment - 1], polyline[segment], card)) return true;
  }
  return false;
}

function distanceToPolyline(point: Point, polyline: Point[]) {
  let best = Number.POSITIVE_INFINITY;
  for (let segment = 1; segment < polyline.length; segment++) {
    const a = polyline[segment - 1], b = polyline[segment];
    const dx = b.x - a.x, dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared)) : 0;
    best = Math.min(best, Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy)));
  }
  return best;
}

function assertRenderedRoutes(routes: RenderedRoutes, label: string) {
  expect(routes.forward.length, `${label}: rendered forward path present`).toBeGreaterThan(1);
  expect(routes.correction.length, `${label}: rendered correction path present`).toBeGreaterThan(1);

  // The rendered `d` must encode the same vertices the component published.
  expect(routes.forward.length, `${label}: rendered forward vertex count matches data-geometry`).toBe(routes.debugForward.length);
  expect(routes.correction.length, `${label}: rendered correction vertex count matches data-geometry`).toBe(routes.debugCorrection.length);
  routes.forward.forEach((point, index) => {
    expect(Math.hypot(point.x - routes.debugForward[index].x, point.y - routes.debugForward[index].y), `${label}: rendered forward vertex ${index} matches published geometry`).toBeLessThan(0.75);
  });
  routes.correction.forEach((point, index) => {
    expect(Math.hypot(point.x - routes.debugCorrection[index].x, point.y - routes.debugCorrection[index].y), `${label}: rendered correction vertex ${index} matches published geometry`).toBeLessThan(0.75);
  });

  // The painted polylines must clear the real card rects inflated by 12px.
  expect(hasIntersection(routes.forward, routes.cards), `${label}: rendered forward clears actual cards (12px)`).toBe(false);
  expect(hasIntersection(routes.correction, routes.cards), `${label}: rendered correction clears actual cards (12px)`).toBe(false);

  // ...and stay clear of the return row and the footer below the cycle.
  const lowest = (polyline: Point[]) => Math.max(...polyline.map(point => point.y));
  expect(lowest(routes.forward), `${label}: rendered forward above return row`).toBeLessThan(routes.returnRow.y + 0.5);
  expect(lowest(routes.correction), `${label}: rendered correction above return row`).toBeLessThan(routes.returnRow.y + 0.5);
  expect(lowest(routes.forward), `${label}: rendered forward above footer`).toBeLessThan(routes.footer.y + 0.5);
  expect(lowest(routes.correction), `${label}: rendered correction above footer`).toBeLessThan(routes.footer.y + 0.5);

  // The moving token must travel the same rendered route.
  if (routes.tokenCenter) {
    const distance = Math.min(
      distanceToPolyline(routes.tokenCenter, routes.forward),
      distanceToPolyline(routes.tokenCenter, routes.correction),
    );
    expect(distance, `${label}: task token travels the rendered route`).toBeLessThan(3);
  }

  expect(routes.scrollWidth, `${label}: no horizontal overflow while rendered`).toBeLessThanOrEqual(routes.innerWidth + 1);
}

test('clearance check rejects a segment that crosses an inflated card', () => {
  const card: Rect = { x: 100, y: 100, width: 200, height: 80 };
  expect(intersects({ x: 50, y: 120 }, { x: 400, y: 120 }, card), 'horizontal crossing detected').toBe(true);
  expect(intersects({ x: 160, y: 20 }, { x: 160, y: 300 }, card), 'vertical crossing detected').toBe(true);
  expect(intersects({ x: 50, y: 20 }, { x: 400, y: 20 }, card), 'clear gutter accepted').toBe(false);
});

for (const width of WIDTHS) {
  test(`cycle routing clears cards and footer at ${width}px after expansion and resize`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    await page.goto('./');
    await expectStable(page);
    await expect(page.locator('.task-token')).toBeAttached();
    assertRouteQuality(await snapshot(page), `${width}px initial`);
    assertRenderedRoutes(await renderedRoutes(page), `${width}px initial`);

    await page.getByRole('button', { name: 'Open all stages' }).click();
    await expect(page.locator('.stage-details[open]')).toHaveCount(8);
    await expectStable(page);
    assertRouteQuality(await snapshot(page), `${width}px expanded`);
    assertRenderedRoutes(await renderedRoutes(page), `${width}px expanded`);

    const resized = width >= 1440 ? width - 40 : width + 40;
    await page.setViewportSize({ width: resized, height: 960 });
    await expectStable(page);
    assertRouteQuality(await snapshot(page), `${resized}px after resize`);
    assertRenderedRoutes(await renderedRoutes(page), `${resized}px after resize`);
  });
}

test('cycle routing recomputes across column breakpoints', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 960 });
  await page.goto('./');
  await expectStable(page);
  let snap = await snapshot(page);
  expect(new Set(snap.geometry.cards.map(card => Math.round(card.x))).size, 'one column at 320px').toBe(1);
  assertRouteQuality(snap, '320px');
  assertRenderedRoutes(await renderedRoutes(page), '320px');

  await page.setViewportSize({ width: 768, height: 960 });
  await expectStable(page);
  snap = await snapshot(page);
  expect(new Set(snap.geometry.cards.map(card => Math.round(card.x))).size, 'two columns at 768px').toBe(2);
  assertRouteQuality(snap, '768px');
  assertRenderedRoutes(await renderedRoutes(page), '768px');

  await page.setViewportSize({ width: 1440, height: 960 });
  await expectStable(page);
  snap = await snapshot(page);
  expect(new Set(snap.geometry.cards.map(card => Math.round(card.x))).size, 'four columns at 1440px').toBe(4);
  assertRouteQuality(snap, '1440px');
  assertRenderedRoutes(await renderedRoutes(page), '1440px');
});

test('rendered-path clearance check flags a mispositioned d', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.goto('./');
  await expectStable(page);

  const baseline = await renderedRoutes(page);
  expect(hasIntersection(baseline.forward, baseline.cards), 'baseline rendered path is clear').toBe(false);

  // Overwrite the visible path with a line driven straight through a real card.
  await page.evaluate(() => {
    const svg = document.querySelector('.cycle-connections') as SVGSVGElement;
    const card = document.querySelector('.cycle-surface .cycle-card') as Element;
    const box = card.getBoundingClientRect();
    const ctm = svg.getScreenCTM()!;
    const toLocal = (x: number, y: number) => {
      const point = svg.createSVGPoint();
      point.x = x;
      point.y = y;
      return point.matrixTransform(ctm.inverse());
    };
    const a = toLocal(box.left - 20, box.top + box.height / 2);
    const b = toLocal(box.right + 20, box.top + box.height / 2);
    document.querySelector('.forward-path')!.setAttribute('d', `M${a.x},${a.y}L${b.x},${b.y}`);
  });

  const tampered = await renderedRoutes(page);
  expect(hasIntersection(tampered.forward, tampered.cards), 'mispositioned rendered path is detected').toBe(true);
});
