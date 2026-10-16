import { readFile, writeFile } from 'node:fs/promises';
import { createElement, StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

// One known public route. Vite transforms TSX only at build time; no runtime server.
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { default: App } = await vite.ssrLoadModule('/src/App.tsx');
  const markup = renderToString(createElement(StrictMode, null, createElement(App)));
  const file = new URL('../dist/index.html', import.meta.url);
  const template = await readFile(file, 'utf8');
  const outlet = '<div id="root"></div>';
  if (!template.includes(outlet)) throw new Error('The prerender outlet is missing.');
  await writeFile(file, template.replace(outlet, `<div id="root">${markup}</div>`));
  console.log('Prerendered /ai-workflow/ with full readable content.');
} finally {
  await vite.close();
}
