import { expect, test } from '@playwright/test';
import { evidenceLinks, specialists, stages } from '../src/data/workflow';

test('has the exact eight stages in the agreed order', () => {
  expect(stages.map(stage => stage.id)).toEqual([
    'understand', 'inspect', 'plan', 'research',
    'delegate', 'implement', 'review', 'verify',
  ]);
  expect(stages.map(stage => stage.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  expect(stages.map(stage => stage.title)).toEqual([
    'Understand', 'Inspect', 'Plan', 'Research',
    'Delegate', 'Implement', 'Review', 'Verify',
  ]);
});

test('stage anchors are nonempty, unique, and safe fragment identifiers', () => {
  expect(stages).toHaveLength(8);
  const anchors = stages.map(stage => stage.id);
  expect(new Set(anchors).size).toBe(anchors.length);
  for (const anchor of anchors) expect(anchor).toMatch(/^[a-z][a-z-]*$/);
});

test('research and delegation are conditional rather than mandatory ceremony', () => {
  const research = stages.find(stage => stage.id === 'research');
  const delegate = stages.find(stage => stage.id === 'delegate');
  expect(research?.conditional ?? '').toMatch(/when needed/i);
  expect(delegate?.conditional ?? '').toMatch(/when useful/i);
  expect(research?.summary ?? '').toMatch(/when needed/i);
  expect(delegate?.summary ?? '').toMatch(/when useful/i);
  expect(stages.filter(stage => stage.conditional).map(stage => stage.id)).toEqual(['research', 'delegate']);
});

test('every stage includes a summary and complete what/why/illustrative output', () => {
  expect(stages).toHaveLength(8);
  for (const stage of stages) {
    for (const field of ['summary', 'what', 'why', 'output'] as const) {
      expect(stage[field].trim(), `${stage.id}.${field}`).not.toBe('');
    }
  }
  expect(stages.map(stage => stage.output).join(' ')).toMatch(/search|filter/i);
});

test('includes all seven specialist roles with nonempty responsibilities', () => {
  expect(specialists.map(role => role.id).toSorted()).toEqual([
    'designer', 'explorer', 'fixer', 'librarian', 'observer', 'oracle', 'orchestrator',
  ]);
  for (const role of specialists) {
    expect(role.title.trim()).not.toBe('');
    expect(role.responsibility.trim()).not.toBe('');
  }
});

test('evidence points to the actual public repository and profile', () => {
  const expectedPaths = [
    '/daryllmagsombol/ai-workflow/blob/main/README.md',
    '/daryllmagsombol/ai-workflow/blob/main/DEV-SETUP.md',
    '/daryllmagsombol/ai-workflow/blob/main/oh-my-opencode-slim.json',
    '/daryllmagsombol/ai-workflow/blob/main/.github/workflows/opencode-review.yml',
    '/daryllmagsombol',
  ];
  expect(evidenceLinks.map(link => new URL(link.href).pathname).toSorted()).toEqual(expectedPaths.toSorted());
  expect(new Set(evidenceLinks.map(link => link.id)).size).toBe(evidenceLinks.length);
  for (const link of evidenceLinks) {
    const url = new URL(link.href);
    expect(url.protocol).toBe('https:');
    expect(url.hostname).toBe('github.com');
    expect(url.search).toBe('');
    expect(url.username).toBe('');
    expect(url.password).toBe('');
    expect(link.title.trim()).not.toBe('');
    expect(link.description.trim()).not.toBe('');
  }
});

test('public content contains no companion credentials or local paths', () => {
  expect(evidenceLinks.length).toBeGreaterThanOrEqual(4);
  const content = JSON.stringify({ stages, specialists, evidenceLinks });
  expect(content).not.toMatch(/localhost|127\.0\.0\.1|\?key=|\.superpowers|\/Users\/|\/var\/folders\/|file:\/\/|[A-Z]:\\/i);
});
