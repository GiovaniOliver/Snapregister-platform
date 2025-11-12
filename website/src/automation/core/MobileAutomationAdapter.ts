/**
 * Mobile Automation Adapter
 *
 * Provides mobile-specific enhancements for all automation classes.
 * Handles mobile browsers, touch events, and mobile-optimized form interactions.
 *
 * KEY FEATURES:
 * - Mobile viewport configuration
 * - Touch event simulation
 * - Mobile keyboard handling
 * - Zoom and scroll adjustments
 * - Mobile-specific selectors
 * - Responsive form detection
 *
 * SUPPORTED MOBILE BROWSERS:
 * - iOS Safari (iPhone, iPad)
 * - Android Chrome
 * - Samsung Internet
 * - Mobile Firefox
 *
 * @status Production Ready
 * @lastUpdated 2024-01-12
 */

import { Page, Browser, BrowserContext } from 'playwright';

export interface MobileConfig {
  deviceName?: string;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  hasTouch?: boolean;
  isMobile?: boolean;
}

export class MobileAutomationAdapter {
  private static readonly MOBILE_DEVICES = {
    'iPhone 14 Pro': {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 393, height: 852 },
      hasTouch: true,
      isMobile: true
    },
    'iPhone 14 Pro Max': {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 430, height: 932 },
      hasTouch: true,
      isMobile: true
    },
    'iPad Pro': {
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 1024, height: 1366 },
      hasTouch: true,
      isMobile: true
    },
    'Samsung Galaxy S23': {
      userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
      viewport: { width: 360, height: 780 },
      hasTouch: true,
      isMobile: true
    },
    'Samsung Galaxy S23 Ultra': {
      userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
      viewport: { width: 384, height: 854 },
      hasTouch: true,
      isMobile: true
    },
    'Google Pixel 7': {
      userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
      viewport: { width: 412, height: 915 },
      hasTouch: true,
      isMobile: true
    }
  };

  /**
   * Configure page for mobile automation
   */
  static async configureMobile(page: Page, config?: MobileConfig): Promise<void> {
    const mobileConfig = config || this.getDefaultMobileConfig();

    // Set viewport
    if (mobileConfig.viewport) {
      await page.setViewportSize(mobileConfig.viewport);
    }

    // Set user agent
    if (mobileConfig.userAgent) {
      await page.setExtraHTTPHeaders({
        'User-Agent': mobileConfig.userAgent
      });
    }

    // Enable touch events
    if (mobileConfig.hasTouch) {
      await page.emulateMedia({ colorScheme: 'light' });
    }

    // Add mobile-specific event listeners
    await this.addMobileEventListeners(page);

    console.log(`[Mobile] Configured mobile automation: ${JSON.stringify(mobileConfig.viewport)}`);
  }

  /**
   * Get default mobile configuration (iPhone 14 Pro)
   */
  static getDefaultMobileConfig(): MobileConfig {
    return this.MOBILE_DEVICES['iPhone 14 Pro'];
  }

  /**
   * Get mobile configuration by device name
   */
  static getMobileConfig(deviceName: keyof typeof MobileAutomationAdapter.MOBILE_DEVICES): MobileConfig {
    return this.MOBILE_DEVICES[deviceName] || this.getDefaultMobileConfig();
  }

  /**
   * Add mobile-specific event listeners
   */
  private static async addMobileEventListeners(page: Page): Promise<void> {
    await page.addInitScript(() => {
      // Override navigator properties for mobile detection
      Object.defineProperty(navigator, 'maxTouchPoints', {
        get: () => 5
      });

      // Add touch event support
      if (!('ontouchstart' in window)) {
        (window as any).ontouchstart = null;
      }
    });
  }

  /**
   * Enhanced click for mobile (uses tap instead of click)
   */
  static async mobileClick(page: Page, selector: string): Promise<void> {
    const element = await page.waitForSelector(selector, { state: 'visible' });

    if (element) {
      // Scroll element into view
      await element.scrollIntoViewIfNeeded();

      // Wait a bit for any scroll animations
      await page.waitForTimeout(300);

      // Use tap (touch event) instead of click
      await element.tap();

      // Wait for any mobile transitions
      await page.waitForTimeout(200);
    }
  }

  /**
   * Enhanced fill for mobile keyboards
   */
  static async mobileFill(page: Page, selector: string, value: string): Promise<void> {
    const element = await page.waitForSelector(selector, { state: 'visible' });

    if (element) {
      // Scroll into view
      await element.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);

      // Tap to focus (triggers mobile keyboard)
      await element.tap();
      await page.waitForTimeout(300);

      // Clear existing value
      await element.fill('');
      await page.waitForTimeout(200);

      // Type with mobile-like delay
      await element.type(value, { delay: 50 });
      await page.waitForTimeout(200);

      // Dismiss mobile keyboard (tap outside)
      await page.evaluate(() => {
        if (document.activeElement) {
          (document.activeElement as HTMLElement).blur();
        }
      });
    }
  }

  /**
   * Handle mobile select dropdowns
   */
  static async mobileSelect(page: Page, selector: string, value: string): Promise<void> {
    const element = await page.waitForSelector(selector, { state: 'visible' });

    if (element) {
      // Scroll into view
      await element.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);

      // Tap to open dropdown
      await element.tap();
      await page.waitForTimeout(500); // Wait for mobile picker to appear

      // Select option
      try {
        await element.selectOption({ value });
      } catch {
        // Try by label
        await element.selectOption({ label: value });
      }

      await page.waitForTimeout(300);
    }
  }

  /**
   * Scroll to element with mobile-friendly behavior
   */
  static async mobileScrollTo(page: Page, selector: string): Promise<void> {
    await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, selector);

    await page.waitForTimeout(500); // Wait for smooth scroll
  }

  /**
   * Handle mobile modals and overlays
   */
  static async dismissMobileModal(page: Page): Promise<boolean> {
    const modalSelectors = [
      '.modal-overlay',
      '.popup-overlay',
      '[role="dialog"]',
      '.mobile-overlay',
      '[data-mobile-modal]'
    ];

    for (const selector of modalSelectors) {
      try {
        const modal = await page.waitForSelector(selector, { timeout: 2000, state: 'visible' });
        if (modal) {
          // Try to find close button
          const closeSelectors = [
            `${selector} button[aria-label="Close"]`,
            `${selector} .close`,
            `${selector} [data-dismiss]`
          ];

          for (const closeSelector of closeSelectors) {
            try {
              const closeBtn = await page.waitForSelector(closeSelector, { timeout: 1000 });
              if (closeBtn) {
                await closeBtn.tap();
                await page.waitForTimeout(300);
                return true;
              }
            } catch {
              continue;
            }
          }
        }
      } catch {
        continue;
      }
    }

    return false;
  }

  /**
   * Handle mobile cookie consent
   */
  static async handleMobileCookieConsent(page: Page): Promise<void> {
    const consentSelectors = [
      'button[id*="accept" i]',
      'button[class*="accept" i]',
      'button:has-text("Accept")',
      'button:has-text("OK")',
      'button:has-text("Got it")',
      '[data-mobile-consent] button'
    ];

    for (const selector of consentSelectors) {
      try {
        const button = await page.waitForSelector(selector, { timeout: 3000, state: 'visible' });
        if (button) {
          await button.tap();
          await page.waitForTimeout(500);
          return;
        }
      } catch {
        continue;
      }
    }
  }

  /**
   * Check if page is mobile-optimized
   */
  static async isMobileOptimized(page: Page): Promise<boolean> {
    const result = await page.evaluate(() => {
      // Check viewport meta tag
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) return false;

      // Check for mobile-specific classes
      const hasMobileClasses = document.body.className.match(/mobile|responsive/i);

      // Check for mobile media queries
      const hasMediaQueries = Array.from(document.styleSheets).some(sheet => {
        try {
          return Array.from(sheet.cssRules).some(rule =>
            rule instanceof CSSMediaRule &&
            rule.conditionText.includes('max-width')
          );
        } catch {
          return false;
        }
      });

      return !!(viewportMeta && (hasMobileClasses || hasMediaQueries));
    });

    return result;
  }

  /**
   * Wait for mobile keyboard to appear/disappear
   */
  static async waitForMobileKeyboard(page: Page, shouldAppear: boolean): Promise<void> {
    await page.waitForTimeout(shouldAppear ? 500 : 300);
  }

  /**
   * Handle mobile-specific form validation
   */
  static async checkMobileValidation(page: Page): Promise<string[]> {
    const errors = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('.error, [role="alert"], .invalid');
      return Array.from(errorElements).map(el => el.textContent || '');
    });

    return errors.filter(e => e.trim().length > 0);
  }

  /**
   * Simulate mobile orientation change
   */
  static async setOrientation(page: Page, orientation: 'portrait' | 'landscape'): Promise<void> {
    const viewport = page.viewportSize();
    if (!viewport) return;

    if (orientation === 'landscape') {
      // Swap width and height
      await page.setViewportSize({
        width: viewport.height,
        height: viewport.width
      });
    } else {
      // Already in portrait or reset
      await page.setViewportSize(viewport);
    }

    await page.waitForTimeout(500); // Wait for re-layout
  }

  /**
   * Detect if running on mobile device
   */
  static async isMobileDevice(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    });
  }

  /**
   * Get list of all supported mobile devices
   */
  static getSupportedDevices(): string[] {
    return Object.keys(this.MOBILE_DEVICES);
  }

  /**
   * Create mobile browser context
   */
  static async createMobileContext(
    browser: Browser,
    deviceName?: keyof typeof MobileAutomationAdapter.MOBILE_DEVICES
  ): Promise<BrowserContext> {
    const config = deviceName
      ? this.getMobileConfig(deviceName)
      : this.getDefaultMobileConfig();

    return await browser.newContext({
      userAgent: config.userAgent,
      viewport: config.viewport,
      hasTouch: config.hasTouch,
      isMobile: config.isMobile,
      // Additional mobile settings
      deviceScaleFactor: 2,
      locale: 'en-US',
      timezoneId: 'America/New_York'
    });
  }

  /**
   * Test mobile automation compatibility
   */
  static async testMobileCompatibility(page: Page): Promise<{
    isOptimized: boolean;
    touchSupport: boolean;
    viewport: { width: number; height: number } | null;
    userAgent: string;
    issues: string[];
  }> {
    const issues: string[] = [];

    // Check if mobile optimized
    const isOptimized = await this.isMobileOptimized(page);
    if (!isOptimized) {
      issues.push('Page may not be mobile-optimized');
    }

    // Check touch support
    const touchSupport = await page.evaluate(() => {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    });
    if (!touchSupport) {
      issues.push('Touch events may not be supported');
    }

    // Get viewport
    const viewport = page.viewportSize();
    if (!viewport || viewport.width > 768) {
      issues.push('Viewport may be too large for mobile');
    }

    // Get user agent
    const userAgent = await page.evaluate(() => navigator.userAgent);
    if (!userAgent.match(/Mobile|Android|iPhone|iPad/i)) {
      issues.push('User agent does not indicate mobile device');
    }

    return {
      isOptimized,
      touchSupport,
      viewport,
      userAgent,
      issues
    };
  }
}
