const { chromium } = require('playwright');
const Job = require('../models/Job');
const SearchProfile = require('../models/SearchProfile');
const diceSessionService = require('./diceSession.service');
const logger = require('../config/logger');

class DiceSearchService {
  buildDiceUrl({
    keywords = [],
    location = 'United States',
    workSettings = ['Remote'],
    employmentTypes = ['FULLTIME', 'CONTRACTS'],
    easyApplyOnly = true,
    postedWithin = 'ONE',
    radius = 30,
    pageSize = 50,
  }) {
    const q = keywords.length > 0 ? keywords.join(' OR ') : 'Software Engineer';
    let url = `https://www.dice.com/jobs?q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}&radius=${radius}&radiusUnit=mi&pageSize=${pageSize}&page=1`;

    if (workSettings && workSettings.length > 0) {
      url += `&filters.workplaceTypes=${workSettings.join(',')}`;
    }

    if (employmentTypes && employmentTypes.length > 0) {
      url += `&filters.employmentType=${employmentTypes.join(',')}`;
    }

    if (easyApplyOnly) {
      url += '&filters.easyApply=true';
    }

    if (postedWithin) {
      url += `&filters.postedDate=${postedWithin}`;
    }

    return url;
  }

  async runProfileSearch(profileId, userId = 'default') {
    const profile = await SearchProfile.findById(profileId);
    if (!profile) {
      throw new Error('Search profile not found');
    }

    const searchUrl = this.buildDiceUrl({
      keywords: profile.keywords,
      location: profile.location,
      workSettings: profile.workSettings,
      employmentTypes: profile.employmentTypes,
      easyApplyOnly: profile.easyApplyOnly,
      postedWithin: profile.postedWithin,
      radius: profile.radius,
    });

    logger.info(`[DiceSearchService] Launching search for profile '${profile.name}' URL: ${searchUrl}`);

    const browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled'],
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    });

    // Inject cookies if available
    const session = await diceSessionService.getSession(userId);
    if (session.cookies && session.cookies.length > 0) {
      try {
        await context.addCookies(session.cookies);
      } catch (err) {
        logger.warn(`[DiceSearchService] Pre-inject cookies warning: ${err.message}`);
      }
    }

    const page = await context.newPage();
    let scrapedJobs = [];

    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Allow dynamic cards to render
      await page.waitForTimeout(3000);

      // Extract job cards from page DOM
      scrapedJobs = await page.evaluate(() => {
        const jobs = [];
        const cardElements = document.querySelectorAll('dhi-search-card, [data-testid="job-card"], div.card');

        cardElements.forEach((card, index) => {
          try {
            const titleEl = card.querySelector('a[data-cy="card-title-link"], a.card-title-link, h5 a');
            const companyEl = card.querySelector('a[data-cy="search-result-company-name"], [data-testid="company-name"], .company-name');
            const locationEl = card.querySelector('[data-cy="search-result-location"], [data-testid="job-location"]');
            const summaryEl = card.querySelector('[data-cy="card-summary"], .card-description');
            const easyApplyEl = card.querySelector('[data-cy="easy-apply-label"], .badge-easy-apply');

            const title = titleEl ? titleEl.textContent.trim() : null;
            const applyUrl = titleEl ? titleEl.href : null;
            const company = companyEl ? companyEl.textContent.trim() : 'Dice Hiring Company';
            const location = locationEl ? locationEl.textContent.trim() : 'Remote, US';
            const description = summaryEl ? summaryEl.textContent.trim() : '';

            // Generate stable external ID from link or fallback index
            let externalId = `dice-${index}`;
            if (applyUrl) {
              const match = applyUrl.match(/\/job-detail\/([a-zA-Z0-9_-]+)/);
              if (match) externalId = match[1];
            }

            if (title && applyUrl) {
              jobs.push({
                externalId,
                title,
                company,
                location,
                description,
                applyUrl,
                easyApply: Boolean(easyApplyEl),
              });
            }
          } catch {
            // Ignore single card parse error
          }
        });

        return jobs;
      });
    } catch (err) {
      logger.warn(`[DiceSearchService] DOM extraction notice: ${err.message}`);
    } finally {
      await browser.close().catch(() => {});
    }

    // Ingest into MongoDB
    let newJobsCount = 0;
    let duplicateCount = 0;

    for (const j of scrapedJobs) {
      try {
        const existing = await Job.findOne({
          $or: [
            { externalId: j.externalId },
            { applyUrl: j.applyUrl },
          ]
        });

        if (existing) {
          duplicateCount++;
        } else {
          await Job.create({
            title: j.title,
            company: j.company,
            location: j.location,
            description: j.description || `Dice Easy Apply requisition: ${j.title}`,
            applyUrl: j.applyUrl,
            source: 'Dice',
            rawSource: 'dice',
            externalId: j.externalId,
            remote: j.location.toLowerCase().includes('remote') || profile.workSettings.includes('Remote'),
            jobType: profile.employmentTypes[0] || 'Full-time',
            postedAt: new Date(),
          });
          newJobsCount++;
        }
      } catch {
        duplicateCount++;
      }
    }

    logger.info(`[DiceSearchService] Search complete: ${scrapedJobs.length} found, ${newJobsCount} new added, ${duplicateCount} duplicates`);

    return {
      profile_name: profile.name,
      total_found: scrapedJobs.length,
      new_jobs_added: newJobsCount,
      duplicates_skipped: duplicateCount,
    };
  }
}

module.exports = new DiceSearchService();
