import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

describe('T132: E2E Cloud Image Cache Flows', () => {
  let browser: any;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Page Load', () => {
    it('should load demo page without errors', async () => {
      const response = await fetch(BASE_URL);
      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('text/html');
    });

    it('should display correct title', async () => {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      const title = await page.title();
      expect(title).toBe('CLOUD Image Cache Demo');
      await page.close();
    });
  });

  describe('Cache Statistics', () => {
    it('should display initial cache stats as zero', async () => {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      await page.waitForSelector('text=Items cached: 0');
      await page.waitForSelector('text=Total size: 0.00 MB');
      await page.close();
    });
  });

  describe('Network Status', () => {
    it('should detect network status', async () => {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      const isOnline = await page.locator('text=Status: Online').isVisible();
      const isOffline = await page.locator('text=Status: Offline').isVisible();
      expect(isOnline || isOffline).toBe(true);
      await page.close();
    });
  });

  describe('Image Grid', () => {
    it('should render 100 images in grid', async () => {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      const images = await page.locator('img').count();
      expect(images).toBe(100);
      await page.close();
    });

    it('should have proper alt text for images', async () => {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      const firstImage = page.locator('img').first();
      const altText = await firstImage.getAttribute('alt');
      expect(altText).toContain('Demo image');
      await page.close();
    });
  });

  describe('Controls', () => {
    it('should have prefetch button', async () => {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      const isVisible = await page.locator('button:has-text("Prefetch 10")').isVisible();
      expect(isVisible).toBe(true);
      await page.close();
    });

    it('should have clear cache button', async () => {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      const isVisible = await page.locator('button:has-text("Clear Cache")').isVisible();
      expect(isVisible).toBe(true);
      await page.close();
    });
  });

  describe('Responsive Layout', () => {
    it('should adapt to mobile viewport', async () => {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      await page.waitForSelector('h1');
      await page.close();
    });

    it('should adapt to tablet viewport', async () => {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(BASE_URL);
      await page.waitForSelector('h1');
      await page.close();
    });
  });
});
