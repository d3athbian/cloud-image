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
    });
  });

  describe('Basic UI', () => {
    it('should have correct title', async () => {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      const title = await page.title();
      expect(title).toBe('CLOUD Image Cache Demo');
      await page.close();
    });
  });
});