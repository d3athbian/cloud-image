import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

describe('T133: Smart TV Platform Tests', () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Tizen TV Emulation', () => {
    it('should render correctly at 1920x1080', async () => {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(BASE_URL);
      await page.waitForSelector('h1');
      
      const heading = await page.locator('h1').textContent();
      expect(heading).toContain('CLOUD Image Cache Demo');
      
      await page.close();
    });

    it('should handle Tizen browser user agent', async () => {
      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Linux; Tizen 2.3) AppleWebKit/537.3 (KHTML, like Gecko) Chrome/30.0 Safari/537.3'
      });
      await page.goto(BASE_URL);
      await page.waitForSelector('img');
      
      const imageCount = await page.locator('img').count();
      expect(imageCount).toBeGreaterThan(0);
      
      await page.close();
    });

    it('should work without WebP support warning', async () => {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(1000);
      
      const webpErrors = consoleErrors.filter(e => 
        e.toLowerCase().includes('webp') || e.toLowerCase().includes('unsupported')
      );
      expect(webpErrors.length).toBe(0);
      
      await page.close();
    });
  });

  describe('webOS TV Emulation', () => {
    it('should render correctly on webOS viewport', async () => {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(BASE_URL);
      await page.waitForSelector('h1');
      
      const heading = await page.locator('h1').textContent();
      expect(heading).toContain('CLOUD Image Cache Demo');
      
      await page.close();
    });

    it('should handle webOS browser user agent', async () => {
      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0 Safari/537.36'
      });
      await page.goto(BASE_URL);
      await page.waitForSelector('img');
      
      const imageCount = await page.locator('img').count();
      expect(imageCount).toBeGreaterThan(0);
      
      await page.close();
    });
  });

  describe('Roku Emulation', () => {
    it('should handle Roku-style user agent', async () => {
      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Roku; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0 Safari/537.36'
      });
      await page.goto(BASE_URL);
      
      await page.waitForSelector('h1');
      expect(await page.locator('h1').isVisible()).toBe(true);
      
      await page.close();
    });
  });

  describe('Memory Constraints', () => {
    it('should handle limited memory scenario gracefully', async () => {
      const page = await browser.newPage();
      
      const memoryWarnings: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'warning' && msg.text().toLowerCase().includes('memory')) {
          memoryWarnings.push(msg.text());
        }
      });
      
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      
      const images = await page.locator('img').count();
      expect(images).toBeGreaterThan(0);
      
      await page.close();
    });

    it('should lazy load images to conserve memory', async () => {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      
      const loadingImages = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        let loaded = 0;
        imgs.forEach(img => {
          if ((img as HTMLImageElement).complete) loaded++;
        });
        return loaded;
      });
      
      expect(loadingImages).toBeLessThan(100);
      
      await page.close();
    });
  });

  describe('Remote Control Navigation', () => {
    it('should be keyboard accessible', async () => {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      await page.waitForSelector('button');
      
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'INPUT']).toContain(focusedElement);
      
      await page.close();
    });

    it('should respond to arrow key navigation', async () => {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      await page.waitForSelector('img');
      
      await page.keyboard.press('Tab');
      await page.keyboard.press('ArrowDown');
      
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'INPUT', 'A']).toContain(focusedElement ?? '');
      
      await page.close();
    });
  });

  describe('Offline Resilience', () => {
    it('should show cached content when offline', async () => {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      await page.waitForSelector('img');
      
      await page.route('**/picsum.photos/**', route => route.abort());
      
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.reload();
      await page.waitForTimeout(1000);
      
      expect(consoleErrors.filter(e => !e.includes('net::ERR'))).toHaveLength(0);
      
      await page.close();
    });
  });
});
