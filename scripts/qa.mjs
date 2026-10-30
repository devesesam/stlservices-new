// QA sweep: screenshots, layout checks and axe across every page and width.
// Usage: npm run build && npm run preview (in another shell), then `npm run qa`.
// Env: QA_BASE (default http://localhost:4321), CHROME (path to Chrome).
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = process.env.QA_BASE ?? 'http://localhost:4321';
const OUT = 'qa-output';
const PAGES = [
  '/', '/fleet/', '/contact/',
  '/services/earthworks/', '/services/forestry/', '/services/trucking/',
  '/services/firewood/', '/services/custom-projects/', '/services/motocross-tracks/',
  '/thanks/', '/404/',
];
const VIEWPORTS = [
  [320, 640, 3], [360, 800, 3], [390, 844, 3], [430, 932, 3],
  [768, 1024, 2], [820, 1180, 2], [880, 1200, 1], [1024, 1366, 2],
  [1280, 800, 1], [1366, 768, 1], [1440, 900, 1], [1920, 1080, 1], [2560, 1440, 1],
];
// Full-page screenshots only at these widths, to keep the run quick.
const SHOT_WIDTHS = new Set([390, 820, 1440, 1920]);

const slug = (p) => (p === '/' ? 'home' : p.replace(/^\/|\/$/g, '').replace(/\//g, '_'));

const browser = await chromium.launch({
  executablePath: process.env.CHROME,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'],
});
await mkdir(OUT, { recursive: true });
const problems = [];

for (const [w, h, dpr] of VIEWPORTS) {
  const phone = w < 768;
  const ctx = await browser.newContext({
    viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: phone, hasTouch: w < 1280,
  });
  const page = await ctx.newPage();
  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });

    // A primary action must be visible without scrolling: the fixed call bar
    // on phones, the hero buttons everywhere else.
    if (w <= 768) {
      const bar = await page.evaluate(() => {
        const el = document.querySelector('.call-bar');
        const r = el?.getBoundingClientRect();
        return !!r && r.height > 0 && r.bottom <= window.innerHeight + 1;
      });
      if (!bar) problems.push(`${w}px ${path}: call bar not visible`);
    } else if (path === '/') {
      const ctaBottom = await page.evaluate(() => {
        const el = document.querySelector('.hero-actions');
        return el ? el.getBoundingClientRect().bottom : null;
      });
      if (ctaBottom === null || ctaBottom > h) problems.push(`${w}px ${path}: hero CTA below the fold (bottom ${Math.round(ctaBottom)} > ${h})`);
    }

    // Scroll through so reveal animations fire, then measure.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(700);

    const layout = await page.evaluate(() => {
      const out = [];
      const vw = document.documentElement.clientWidth;
      if (document.documentElement.scrollWidth > vw) out.push(`horizontal overflow (${document.documentElement.scrollWidth} > ${vw})`);
      // Header items must sit inside the bar and not overlap each other.
      const bar = document.querySelector('.navbar');
      if (bar) {
        const b = bar.getBoundingClientRect();
        const items = [...bar.querySelectorAll('.nav-logo, .nav-actions, .nav-links, .mobile-toggle')]
          .filter(el => el.offsetParent !== null && getComputedStyle(el).position !== 'fixed');
        const rects = items.map(el => [el.className, el.getBoundingClientRect()]);
        for (const [name, r] of rects) {
          if (r.top < b.top - 1 || r.bottom > b.bottom + 1) out.push(`header: ${name} spills out of bar`);
          if (r.right > vw + 1 || r.left < -1) out.push(`header: ${name} off-screen`);
        }
        // Logo text or header buttons wrapping onto a second line.
        for (const el of bar.querySelectorAll('.nav-logo, .nav-actions .btn')) {
          if (el.offsetParent !== null && el.getBoundingClientRect().height > 48) { out.push(`header: ${el.textContent.trim()} wraps`); }
        }
        for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
          const [na, a] = rects[i], [nb, c] = rects[j];
          if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) out.push(`header: ${na} overlaps ${nb}`);
        }
      }
      // Text inside the hero should not touch the viewport edge on small screens.
      for (const el of document.querySelectorAll('.hero p, .hero h1')) {
        const r = el.getBoundingClientRect();
        if (r.width && (vw - r.right < 12 || r.left < 12)) { out.push('hero text touches viewport edge'); break; }
      }
      return out;
    });
    layout.forEach(p => problems.push(`${w}px ${path}: ${p}`));

    if (SHOT_WIDTHS.has(w)) {
      await page.screenshot({ path: `${OUT}/${slug(path)}_${w}_fold.png` });
      if (path === '/') await page.screenshot({ path: `${OUT}/${slug(path)}_${w}_full.png`, fullPage: true });
    }

    if (w === 390 || w === 1440) {
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      axe.violations.forEach(v => problems.push(`${w}px ${path}: axe ${v.id} (${v.nodes.length})`));
    }
  }
  await ctx.close();
}
await browser.close();

await writeFile(`${OUT}/report.txt`, problems.join('\n') + '\n');
console.log(problems.length ? problems.join('\n') : 'QA clean');
console.log(`\n${problems.length} problem(s). Screenshots in ${OUT}/`);
process.exitCode = problems.length ? 1 : 0;
