const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { chromium } = require('playwright');
const DiceSession = require('../models/DiceSession');
const logger = require('../config/logger');

class DiceSessionService {
  constructor() {
    this.cookiesFilePath = path.resolve(process.cwd(), 'data', 'dice_cookies.json');
    this.ensureDataDir();
  }

  ensureDataDir() {
    const dir = path.dirname(this.cookiesFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async getSession(userId = 'default') {
    if (mongoose.connection.readyState !== 1) {
      let cookies = [];
      if (fs.existsSync(this.cookiesFilePath)) {
        try {
          cookies = JSON.parse(fs.readFileSync(this.cookiesFilePath, 'utf-8'));
        } catch {
          cookies = [];
        }
      }
      return {
        userId,
        isConnected: cookies.length > 0,
        cookies,
        cookiesCount: cookies.length,
        username: cookies.length > 0 ? 'Dice User' : '',
        lastVerified: cookies.length > 0 ? new Date() : null,
        settings: {
          openai_model: 'gpt-4o-mini',
          max_jobs_per_search: 15,
          max_applications_per_run: 10,
          headless_browser: true,
          default_mode: 'APPLY',
        },
        save: async () => {},
      };
    }

    let session = await DiceSession.findOne({ userId });
    if (!session) {
      // Check local json file fallback
      let cookies = [];
      if (fs.existsSync(this.cookiesFilePath)) {
        try {
          cookies = JSON.parse(fs.readFileSync(this.cookiesFilePath, 'utf-8'));
        } catch {
          cookies = [];
        }
      }

      session = await DiceSession.create({
        userId,
        isConnected: cookies.length > 0,
        cookies,
        cookiesCount: cookies.length,
        username: cookies.length > 0 ? 'Dice User' : '',
        lastVerified: cookies.length > 0 ? new Date() : null,
      });
    }
    return session;
  }

  async getDiceStatus(userId = 'default') {
    const session = await this.getSession(userId);
    return {
      is_connected: session.isConnected && (session.cookiesCount > 0),
      username: session.username || (session.isConnected ? 'Dice User' : undefined),
      cookies_count: session.cookiesCount || (session.cookies ? session.cookies.length : 0),
      last_verified: session.lastVerified,
    };
  }

  async saveCookies(cookies, username = 'Dice User', userId = 'default') {
    try {
      fs.writeFileSync(this.cookiesFilePath, JSON.stringify(cookies, null, 2));
    } catch (err) {
      logger.warn(`[DiceSession] Could not save cookies to file: ${err.message}`);
    }

    await DiceSession.findOneAndUpdate(
      { userId },
      {
        userId,
        isConnected: cookies.length > 0,
        cookies,
        cookiesCount: cookies.length,
        username,
        lastVerified: new Date(),
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Opens a headful Playwright browser window pointing to Dice login.
   * Runs in the background and saves session cookies once user logs in.
   */
  async openLoginBrowser(userId = 'default') {
    logger.info('[DiceSession] Launching headful Playwright browser for Dice login...');
    
    // Launch non-headless browser so user can interact and log in
    const browser = await chromium.launch({
      headless: false,
      args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
    });

    const context = await browser.newContext({
      viewport: null,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    });

    // Inject existing cookies if available
    const existing = await this.getSession(userId);
    if (existing.cookies && existing.cookies.length > 0) {
      try {
        await context.addCookies(existing.cookies);
      } catch (err) {
        logger.warn(`[DiceSession] Pre-loading existing cookies warning: ${err.message}`);
      }
    }

    const page = await context.newPage();
    await page.goto('https://www.dice.com/dashboard/login', { waitUntil: 'domcontentloaded' }).catch(() => {});

    // Listen in background for login completion
    const checkInterval = setInterval(async () => {
      try {
        if (!browser.isConnected()) {
          clearInterval(checkInterval);
          return;
        }

        const url = page.url();
        // Once redirected to dashboard or home, user is logged in
        if (url.includes('/dashboard') || url.includes('/home') || url.includes('/profile')) {
          const cookies = await context.cookies();
          if (cookies.length > 5) {
            await this.saveCookies(cookies, 'Dice Member', userId);
            logger.info(`[DiceSession] Successfully captured and saved ${cookies.length} Dice cookies.`);
            clearInterval(checkInterval);
          }
        }
      } catch {
        clearInterval(checkInterval);
      }
    }, 3000);

    // Auto cleanup after 5 minutes if still open
    setTimeout(async () => {
      clearInterval(checkInterval);
      if (browser.isConnected()) {
        const cookies = await context.cookies().catch(() => []);
        if (cookies.length > 0) {
          await this.saveCookies(cookies, 'Dice Member', userId);
        }
        await browser.close().catch(() => {});
      }
    }, 300000);

    return {
      success: true,
      message: 'Playwright browser opened. Please complete your Dice login in the opened browser window.',
    };
  }
}

module.exports = new DiceSessionService();
