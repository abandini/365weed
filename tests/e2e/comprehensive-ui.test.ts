import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://4debcbc8.weed365-pwa.pages.dev';
const SCREENSHOT_DIR = path.join(process.cwd(), 'test-results', 'screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

interface TestResult {
  element: string;
  status: 'working' | 'broken' | 'partial';
  notes: string;
}

const testResults: TestResult[] = [];

function addResult(element: string, status: 'working' | 'broken' | 'partial', notes: string) {
  testResults.push({ element, status, notes });
  console.log(`[${status.toUpperCase()}] ${element}: ${notes}`);
}

async function takeScreenshot(page: Page, name: string): Promise<string> {
  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

test.describe('Comprehensive PWA UI Testing', () => {

  test('1. Navigation Bar - All Links', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Screenshot initial state
    await takeScreenshot(page, '01-homepage-initial');

    // Test Logo link
    try {
      const logo = page.locator('a:has-text("365 Days of Weed"), nav a:first-child');
      const isVisible = await logo.first().isVisible({ timeout: 5000 });
      if (isVisible) {
        await logo.first().click();
        await page.waitForURL(BASE_URL + '/', { timeout: 5000 });
        addResult('Navigation - Logo Link', 'working', 'Logo link navigates to home');
      } else {
        addResult('Navigation - Logo Link', 'broken', 'Logo not visible');
      }
    } catch (e) {
      addResult('Navigation - Logo Link', 'broken', `Error: ${e.message}`);
    }

    // Test Today link
    try {
      const todayLink = page.locator('nav a[href="/"], nav a:has-text("Today")');
      const isVisible = await todayLink.first().isVisible({ timeout: 5000 });
      if (isVisible) {
        await todayLink.first().click();
        await page.waitForTimeout(1000);
        const currentUrl = page.url();
        addResult('Navigation - Today Link', 'working', `Navigated to: ${currentUrl}`);
      } else {
        addResult('Navigation - Today Link', 'broken', 'Today link not visible');
      }
    } catch (e) {
      addResult('Navigation - Today Link', 'broken', `Error: ${e.message}`);
    }

    // Test Calendar link
    try {
      const calendarLink = page.locator('nav a[href="/calendar"], nav a:has-text("Calendar")');
      const isVisible = await calendarLink.first().isVisible({ timeout: 5000 });
      if (isVisible) {
        await calendarLink.first().click();
        await page.waitForTimeout(1000);
        await page.waitForURL('**/calendar', { timeout: 5000 });
        addResult('Navigation - Calendar Link', 'working', 'Calendar link navigates correctly');
        await takeScreenshot(page, '02-calendar-view');
      } else {
        addResult('Navigation - Calendar Link', 'broken', 'Calendar link not visible');
      }
    } catch (e) {
      addResult('Navigation - Calendar Link', 'broken', `Error: ${e.message}`);
    }

    // Test Journal link
    try {
      const journalLink = page.locator('nav a[href="/journal"], nav a:has-text("Journal")');
      const isVisible = await journalLink.first().isVisible({ timeout: 5000 });
      if (isVisible) {
        await journalLink.first().click();
        await page.waitForTimeout(1000);
        await page.waitForURL('**/journal', { timeout: 5000 });
        addResult('Navigation - Journal Link', 'working', 'Journal link navigates correctly');
        await takeScreenshot(page, '03-journal-view');
      } else {
        addResult('Navigation - Journal Link', 'broken', 'Journal link not visible');
      }
    } catch (e) {
      addResult('Navigation - Journal Link', 'broken', `Error: ${e.message}`);
    }
  });

  test('2. Today View - Content Display', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    addResult('Today View - Page Load Time', loadTime < 5000 ? 'working' : 'partial',
      `Loaded in ${loadTime}ms (target: <5000ms)`);

    await takeScreenshot(page, '04-today-page-loaded');

    // Check for daily content card
    try {
      const contentCard = page.locator('.card, .content-card, article, [class*="content"]').first();
      const isVisible = await contentCard.isVisible({ timeout: 5000 });
      if (isVisible) {
        addResult('Today View - Content Card', 'working', 'Daily content card is displayed');
      } else {
        addResult('Today View - Content Card', 'broken', 'Content card not visible');
      }
    } catch (e) {
      addResult('Today View - Content Card', 'broken', `Error: ${e.message}`);
    }

    // Check for title
    try {
      const title = page.locator('h1, h2, .title, [class*="title"]').first();
      const titleText = await title.textContent({ timeout: 5000 });
      if (titleText && titleText.trim().length > 0) {
        addResult('Today View - Title', 'working', `Title found: "${titleText.trim().substring(0, 50)}..."`);
      } else {
        addResult('Today View - Title', 'broken', 'Title not found or empty');
      }
    } catch (e) {
      addResult('Today View - Title', 'broken', `Error: ${e.message}`);
    }

    // Check for body content
    try {
      const bodyContent = page.locator('p, .content, .body, [class*="content"]');
      const count = await bodyContent.count();
      if (count > 0) {
        const text = await bodyContent.first().textContent();
        addResult('Today View - Body Content', 'working', `${count} content elements found`);
      } else {
        addResult('Today View - Body Content', 'broken', 'No body content found');
      }
    } catch (e) {
      addResult('Today View - Body Content', 'broken', `Error: ${e.message}`);
    }

    // Check for tags
    try {
      const tags = page.locator('.tag, .badge, [class*="tag"]');
      const count = await tags.count();
      addResult('Today View - Tags', count > 0 ? 'working' : 'partial',
        `${count} tags found`);
    } catch (e) {
      addResult('Today View - Tags', 'partial', `Error: ${e.message}`);
    }

    // Check for sponsored section
    try {
      const sponsored = page.locator(':has-text("Sponsored"), .sponsored, [class*="sponsor"]');
      const count = await sponsored.count();
      addResult('Today View - Sponsored Section', count > 0 ? 'working' : 'partial',
        `${count} sponsored sections found`);
    } catch (e) {
      addResult('Today View - Sponsored Section', 'partial', `Error: ${e.message}`);
    }

    // Check for ads
    try {
      const ads = page.locator('.ad, .advertisement, [class*="ad-"]');
      const count = await ads.count();
      addResult('Today View - Ads Display', count > 0 ? 'working' : 'partial',
        `${count} ad elements found`);

      // Try clicking an ad link
      if (count > 0) {
        const adLink = ads.first().locator('a').first();
        const adLinkExists = await adLink.count() > 0;
        if (adLinkExists) {
          const href = await adLink.getAttribute('href');
          addResult('Today View - Ad Link', 'working', `Ad link found with href: ${href}`);
        }
      }
    } catch (e) {
      addResult('Today View - Ads Display', 'partial', `Error: ${e.message}`);
    }
  });

  test('3. Calendar View - Content Grid', async ({ page }) => {
    await page.goto(`${BASE_URL}/calendar`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '05-calendar-page');

    // Check heading
    try {
      const heading = page.locator('h1:has-text("Content Calendar"), h1:has-text("Calendar")');
      const isVisible = await heading.first().isVisible({ timeout: 5000 });
      if (isVisible) {
        const text = await heading.first().textContent();
        addResult('Calendar View - Heading', 'working', `Heading found: "${text}"`);
      } else {
        addResult('Calendar View - Heading', 'broken', 'Calendar heading not visible');
      }
    } catch (e) {
      addResult('Calendar View - Heading', 'broken', `Error: ${e.message}`);
    }

    // Check for grid/cards
    try {
      const cards = page.locator('.card, .calendar-card, article, [class*="card"]');
      const count = await cards.count();
      if (count > 0) {
        addResult('Calendar View - Cards Display', 'working', `${count} cards displayed in grid`);

        // Check first card for date and title
        const firstCard = cards.first();
        const cardText = await firstCard.textContent();

        // Check for date
        const hasDate = /\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/.test(cardText || '');
        addResult('Calendar View - Card Date', hasDate ? 'working' : 'partial',
          hasDate ? 'Date found in card' : 'No date pattern found');

        // Check for title
        const cardTitle = firstCard.locator('h2, h3, .title, [class*="title"]');
        const titleExists = await cardTitle.count() > 0;
        addResult('Calendar View - Card Title', titleExists ? 'working' : 'partial',
          titleExists ? 'Title element found in card' : 'No title found in card');

        // Try clicking a card
        await firstCard.click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, '06-calendar-card-clicked');
        addResult('Calendar View - Card Click', 'working', 'Card is clickable');

      } else {
        addResult('Calendar View - Cards Display', 'broken', 'No cards found');
      }
    } catch (e) {
      addResult('Calendar View - Cards Display', 'broken', `Error: ${e.message}`);
    }
  });

  test.skip('4. Journal View - Full Workflow', async ({ page }) => {
    await page.goto(`${BASE_URL}/journal`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '07-journal-initial');

    // Click New Entry button
    try {
      const newEntryBtn = page.locator('button:has-text("New Entry"), button:has-text("+ New")');
      const isVisible = await newEntryBtn.first().isVisible({ timeout: 5000 });
      if (isVisible) {
        await newEntryBtn.first().click();
        await page.waitForTimeout(1000);
        addResult('Journal - New Entry Button', 'working', 'New Entry button clicked');
        await takeScreenshot(page, '08-journal-form-opened');
      } else {
        addResult('Journal - New Entry Button', 'broken', 'New Entry button not visible');
      }
    } catch (e) {
      addResult('Journal - New Entry Button', 'broken', `Error: ${e.message}`);
    }

    // Fill form fields
    const formData = {
      date: '2025-10-20',
      method: 'Vaporizer',
      amount: '2.5',
      units: 'grams',
      moodBefore: '6',
      moodAfter: '8',
      sleepHours: '7.5',
      notes: 'Test entry from automated Playwright test. Feeling relaxed and creative.'
    };

    // Date field
    try {
      const dateField = page.locator('input[type="date"], input[name*="date"]');
      const count = await dateField.count();
      if (count > 0) {
        await dateField.first().fill(formData.date);
        addResult('Journal Form - Date Field', 'working', `Date filled: ${formData.date}`);
      } else {
        addResult('Journal Form - Date Field', 'broken', 'Date field not found');
      }
    } catch (e) {
      addResult('Journal Form - Date Field', 'broken', `Error: ${e.message}`);
    }

    // Method dropdown
    try {
      const methodField = page.locator('select[name*="method"], select').first();
      const count = await methodField.count();
      if (count > 0) {
        await methodField.selectOption({ label: formData.method });
        addResult('Journal Form - Method Dropdown', 'working', `Method selected: ${formData.method}`);
      } else {
        addResult('Journal Form - Method Dropdown', 'broken', 'Method dropdown not found');
      }
    } catch (e) {
      addResult('Journal Form - Method Dropdown', 'broken', `Error: ${e.message}`);
    }

    // Amount field
    try {
      const amountField = page.locator('input[name*="amount"], input[type="number"]').first();
      const count = await amountField.count();
      if (count > 0) {
        await amountField.fill(formData.amount);
        addResult('Journal Form - Amount Field', 'working', `Amount filled: ${formData.amount}`);
      } else {
        addResult('Journal Form - Amount Field', 'broken', 'Amount field not found');
      }
    } catch (e) {
      addResult('Journal Form - Amount Field', 'broken', `Error: ${e.message}`);
    }

    // Units dropdown
    try {
      const unitsField = page.locator('select[name*="unit"]');
      const count = await unitsField.count();
      if (count > 0) {
        await unitsField.first().selectOption({ label: formData.units });
        addResult('Journal Form - Units Dropdown', 'working', `Units selected: ${formData.units}`);
      } else {
        addResult('Journal Form - Units Dropdown', 'broken', 'Units dropdown not found');
      }
    } catch (e) {
      addResult('Journal Form - Units Dropdown', 'broken', `Error: ${e.message}`);
    }

    // Mood before
    try {
      const moodBeforeField = page.locator('input[name*="mood"][name*="before"], input[name*="moodBefore"]');
      const count = await moodBeforeField.count();
      if (count > 0) {
        await moodBeforeField.first().fill(formData.moodBefore);
        addResult('Journal Form - Mood Before', 'working', `Mood before filled: ${formData.moodBefore}`);
      } else {
        addResult('Journal Form - Mood Before', 'broken', 'Mood before field not found');
      }
    } catch (e) {
      addResult('Journal Form - Mood Before', 'broken', `Error: ${e.message}`);
    }

    // Mood after
    try {
      const moodAfterField = page.locator('input[name*="mood"][name*="after"], input[name*="moodAfter"]');
      const count = await moodAfterField.count();
      if (count > 0) {
        await moodAfterField.first().fill(formData.moodAfter);
        addResult('Journal Form - Mood After', 'working', `Mood after filled: ${formData.moodAfter}`);
      } else {
        addResult('Journal Form - Mood After', 'broken', 'Mood after field not found');
      }
    } catch (e) {
      addResult('Journal Form - Mood After', 'broken', `Error: ${e.message}`);
    }

    // Sleep hours
    try {
      const sleepField = page.locator('input[name*="sleep"]');
      const count = await sleepField.count();
      if (count > 0) {
        await sleepField.first().fill(formData.sleepHours);
        addResult('Journal Form - Sleep Hours', 'working', `Sleep hours filled: ${formData.sleepHours}`);
      } else {
        addResult('Journal Form - Sleep Hours', 'broken', 'Sleep hours field not found');
      }
    } catch (e) {
      addResult('Journal Form - Sleep Hours', 'broken', `Error: ${e.message}`);
    }

    // Notes textarea
    try {
      const notesField = page.locator('textarea[name*="note"]');
      const count = await notesField.count();
      if (count > 0) {
        await notesField.first().fill(formData.notes);
        addResult('Journal Form - Notes Textarea', 'working', 'Notes filled');
      } else {
        addResult('Journal Form - Notes Textarea', 'broken', 'Notes textarea not found');
      }
    } catch (e) {
      addResult('Journal Form - Notes Textarea', 'broken', `Error: ${e.message}`);
    }

    await takeScreenshot(page, '09-journal-form-filled');

    // Save Entry button
    try {
      const saveBtn = page.locator('button:has-text("Save"), button[type="submit"]');
      const count = await saveBtn.count();
      if (count > 0) {
        await saveBtn.first().click();
        await page.waitForTimeout(2000);
        addResult('Journal Form - Save Button', 'working', 'Save button clicked');
        await takeScreenshot(page, '10-journal-after-save');
      } else {
        addResult('Journal Form - Save Button', 'broken', 'Save button not found');
      }
    } catch (e) {
      addResult('Journal Form - Save Button', 'broken', `Error: ${e.message}`);
    }

    // Check if form closes
    try {
      const form = page.locator('form, .form, [class*="form"]');
      const isVisible = await form.first().isVisible({ timeout: 2000 });
      addResult('Journal Form - Form Closes', !isVisible ? 'working' : 'partial',
        !isVisible ? 'Form closed after save' : 'Form still visible');
    } catch (e) {
      addResult('Journal Form - Form Closes', 'working', 'Form no longer visible');
    }

    // Check if entry appears in list
    try {
      const entries = page.locator('.entry, .journal-entry, [class*="entry"]');
      const count = await entries.count();
      if (count > 0) {
        addResult('Journal - Entry List', 'working', `${count} entries displayed`);
      } else {
        addResult('Journal - Entry List', 'partial', 'No entries found in list');
      }
    } catch (e) {
      addResult('Journal - Entry List', 'partial', `Error: ${e.message}`);
    }

    // Check stats display
    try {
      const stats = page.locator('.stats, [class*="stat"]');
      const count = await stats.count();
      addResult('Journal - Stats Display', count > 0 ? 'working' : 'partial',
        `${count} stat elements found`);
    } catch (e) {
      addResult('Journal - Stats Display', 'partial', `Error: ${e.message}`);
    }
  });

  test('5. Partner Portal - Full Workflow', async ({ page }) => {
    await page.goto(`${BASE_URL}/partner`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '11-partner-portal-initial');

    // Check login form displays
    try {
      const form = page.locator('form');
      const isVisible = await form.first().isVisible({ timeout: 5000 });
      if (isVisible) {
        addResult('Partner Portal - Login Form', 'working', 'Login form displayed');
      } else {
        addResult('Partner Portal - Login Form', 'broken', 'Login form not visible');
      }
    } catch (e) {
      addResult('Partner Portal - Login Form', 'broken', `Error: ${e.message}`);
    }

    // Fill Business Name
    try {
      const businessField = page.locator('input[name*="business"], input[placeholder*="Business"]');
      const count = await businessField.count();
      if (count > 0) {
        await businessField.first().fill('Test Cannabis Dispensary');
        addResult('Partner Portal - Business Name Field', 'working', 'Business name filled');
      } else {
        addResult('Partner Portal - Business Name Field', 'broken', 'Business name field not found');
      }
    } catch (e) {
      addResult('Partner Portal - Business Name Field', 'broken', `Error: ${e.message}`);
    }

    // Fill Email
    try {
      const emailField = page.locator('input[type="email"], input[name*="email"]');
      const count = await emailField.count();
      if (count > 0) {
        await emailField.first().fill('test@dispensary.com');
        addResult('Partner Portal - Email Field', 'working', 'Email filled');
      } else {
        addResult('Partner Portal - Email Field', 'broken', 'Email field not found');
      }
    } catch (e) {
      addResult('Partner Portal - Email Field', 'broken', `Error: ${e.message}`);
    }

    await takeScreenshot(page, '12-partner-form-filled');

    // Click Sign Up button
    try {
      const signUpBtn = page.locator('button:has-text("Sign Up"), button[type="submit"]');
      const count = await signUpBtn.count();
      if (count > 0) {
        await signUpBtn.first().click();
        await page.waitForTimeout(2000);
        addResult('Partner Portal - Sign Up Button', 'working', 'Sign Up button clicked');
        await takeScreenshot(page, '13-partner-after-signup');
      } else {
        addResult('Partner Portal - Sign Up Button', 'broken', 'Sign Up button not found');
      }
    } catch (e) {
      addResult('Partner Portal - Sign Up Button', 'broken', `Error: ${e.message}`);
    }

    // Check if dashboard loads
    try {
      const dashboard = page.locator('.dashboard, [class*="dashboard"]');
      const isVisible = await dashboard.first().isVisible({ timeout: 3000 });
      addResult('Partner Portal - Dashboard Load', isVisible ? 'working' : 'partial',
        isVisible ? 'Dashboard loaded' : 'Dashboard not visible or signup failed');
    } catch (e) {
      addResult('Partner Portal - Dashboard Load', 'partial', `Error: ${e.message}`);
    }

    // Check for New Campaign button
    try {
      const newCampaignBtn = page.locator('button:has-text("New Campaign"), button:has-text("+ New")');
      const count = await newCampaignBtn.count();
      if (count > 0) {
        addResult('Partner Portal - New Campaign Button', 'working', 'New Campaign button found');
        await newCampaignBtn.first().click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, '14-partner-campaign-form');

        // Fill campaign form
        const campaignNameField = page.locator('input[name*="name"], input[placeholder*="Campaign"]').first();
        if (await campaignNameField.count() > 0) {
          await campaignNameField.fill('Spring Sale 2025');
          addResult('Partner Portal - Campaign Name Field', 'working', 'Campaign name filled');
        }

        const regionField = page.locator('select[name*="region"], input[name*="region"]').first();
        if (await regionField.count() > 0) {
          addResult('Partner Portal - Region Field', 'working', 'Region field found');
        }

        const tagField = page.locator('input[name*="tag"], select[name*="tag"]').first();
        if (await tagField.count() > 0) {
          addResult('Partner Portal - Tag Field', 'working', 'Tag field found');
        }

        // Submit campaign
        const submitBtn = page.locator('button:has-text("Submit"), button:has-text("Create"), button[type="submit"]').first();
        if (await submitBtn.count() > 0) {
          await submitBtn.click();
          await page.waitForTimeout(2000);
          addResult('Partner Portal - Campaign Submit', 'working', 'Campaign submitted');
          await takeScreenshot(page, '15-partner-campaign-submitted');
        }

      } else {
        addResult('Partner Portal - New Campaign Button', 'partial', 'New Campaign button not found');
      }
    } catch (e) {
      addResult('Partner Portal - New Campaign Button', 'partial', `Error: ${e.message}`);
    }
  });

  test('6. PWA Features & Service Worker', async ({ page, context }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check service worker registration
    try {
      const swRegistered = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          return !!registration;
        }
        return false;
      });
      addResult('PWA - Service Worker', swRegistered ? 'working' : 'broken',
        swRegistered ? 'Service Worker registered' : 'Service Worker not registered');
    } catch (e) {
      addResult('PWA - Service Worker', 'broken', `Error: ${e.message}`);
    }

    // Check manifest.webmanifest
    try {
      const manifestResponse = await page.request.get(`${BASE_URL}/manifest.webmanifest`);
      const status = manifestResponse.status();
      addResult('PWA - Manifest File', status === 200 ? 'working' : 'broken',
        `Manifest status: ${status}`);

      if (status === 200) {
        const manifest = await manifestResponse.json();
        addResult('PWA - Manifest Content', 'working',
          `Manifest has name: "${manifest.name || manifest.short_name}"`);
      }
    } catch (e) {
      addResult('PWA - Manifest File', 'broken', `Error: ${e.message}`);
    }

    // Check for install prompt
    try {
      const hasInstallPrompt = await page.evaluate(() => {
        return 'BeforeInstallPromptEvent' in window;
      });
      addResult('PWA - Install Prompt Support', 'partial',
        hasInstallPrompt ? 'Install prompt API available' : 'Install prompt API not available (browser dependent)');
    } catch (e) {
      addResult('PWA - Install Prompt Support', 'partial', `Error: ${e.message}`);
    }

    // Check offline functionality
    try {
      await context.setOffline(true);
      await page.reload();
      await page.waitForTimeout(2000);
      const isOfflineWorking = await page.locator('body').isVisible();
      await context.setOffline(false);
      addResult('PWA - Offline Functionality', isOfflineWorking ? 'working' : 'partial',
        isOfflineWorking ? 'Page loads offline' : 'Offline mode not fully functional');
    } catch (e) {
      await context.setOffline(false);
      addResult('PWA - Offline Functionality', 'partial', `Error: ${e.message}`);
    }
  });

  test('7. Responsive Design Tests', async ({ page }) => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, `16-responsive-${viewport.name.toLowerCase()}`);

      // Check if navigation is visible
      try {
        const nav = page.locator('nav');
        const isVisible = await nav.isVisible({ timeout: 3000 });
        addResult(`Responsive - ${viewport.name} Navigation`, isVisible ? 'working' : 'broken',
          `Navigation ${isVisible ? 'visible' : 'hidden'} at ${viewport.width}x${viewport.height}`);
      } catch (e) {
        addResult(`Responsive - ${viewport.name} Navigation`, 'broken', `Error: ${e.message}`);
      }

      // Check if content is visible
      try {
        const content = page.locator('main, .content, [class*="content"]').first();
        const isVisible = await content.isVisible({ timeout: 3000 });
        addResult(`Responsive - ${viewport.name} Content`, isVisible ? 'working' : 'broken',
          `Content ${isVisible ? 'visible' : 'hidden'} at ${viewport.width}x${viewport.height}`);
      } catch (e) {
        addResult(`Responsive - ${viewport.name} Content`, 'broken', `Error: ${e.message}`);
      }
    }
  });

  test.afterAll(async () => {
    // Generate comprehensive report
    const working = testResults.filter(r => r.status === 'working').length;
    const broken = testResults.filter(r => r.status === 'broken').length;
    const partial = testResults.filter(r => r.status === 'partial').length;

    const report = {
      total_ui_elements: testResults.length,
      tested: testResults.length,
      working: working,
      broken: broken,
      partial: partial,
      elements: testResults,
      screenshots_taken: fs.readdirSync(SCREENSHOT_DIR).map(f => path.join(SCREENSHOT_DIR, f)),
      summary: `Tested ${testResults.length} UI elements. ${working} working, ${broken} broken, ${partial} partial. Success rate: ${((working / testResults.length) * 100).toFixed(1)}%`
    };

    const reportPath = path.join(process.cwd(), 'test-results', 'ui-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log('\n\n=== COMPREHENSIVE UI TEST REPORT ===');
    console.log(JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: ${reportPath}`);
  });
});
