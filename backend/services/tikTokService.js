const { chromium } = require('playwright');

// Helpful default headers to look less bot-like
const DEFAULT_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function extractHeadMetadata(tiktokUrl, { waitMs = 5000 } = {}) {
  if (!tiktokUrl || typeof tiktokUrl !== 'string') {
    throw new Error('extractHeadMetadata: tiktokUrl is required');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: DEFAULT_UA,
    locale: 'en-US',
  });
  const page = await context.newPage();

  try {
    // Go to page and give it a moment for TikTok’s client JS to finish
    await page.goto(tiktokUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(waitMs);

    const meta = await page.evaluate(() => {
      const q = (sel) => document.querySelector(sel);
      const metaContent = (sel) => {
        const el = q(sel);
        return el ? (el.getAttribute('content') || '').trim() : '';
      };
      const linkHref = (sel) => {
        const el = q(sel);
        return el ? (el.getAttribute('href') || '').trim() : '';
      };

      return {
        title: document.title || '',
        description: metaContent('meta[name="description"]'),
        keywords: metaContent('meta[name="keywords"]'),
        ogTitle: metaContent('meta[property="og:title"]'),
        ogDescription: metaContent('meta[property="og:description"]'),
        canonical: linkHref('link[rel="canonical"]'),
        pageUrl: location.href,
        author: (() => {
            const match = location.href.match(/\/@([^/]+)/);
            return match ? match[1] : '';
        })() || metaContent('meta[name="author"]'),
      };
    });

    return meta;
  } finally {
    await browser.close();
  }
}

module.exports = {
  extractHeadMetadata,
};
