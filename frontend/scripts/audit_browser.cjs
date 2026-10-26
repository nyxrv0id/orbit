const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SCREENSHOT_DIR = path.resolve(__dirname, '../../docs/screenshots');

async function runAudit() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('Launching Headless Chrome from:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('console', (msg) => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    console.log(`[PAGE ERROR] ${err.toString()}`);
    consoleErrors.push(err.toString());
  });
  page.on('requestfailed', (req) => {
    console.log(`[REQUEST FAILED] ${req.method()} ${req.url()}: ${req.failure().errorText}`);
  });
  page.on('response', (res) => {
    if (res.url().includes('/api/')) {
      console.log(`[API RESPONSE] ${res.status()} ${res.url()}`);
    }
  });

  try {
    console.log('1. Navigating to Dashboard: http://localhost:5173/');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 15000 });

    // Verify Brand Title
    await page.waitForSelector('span.font-bold');
    const brandText = await page.$eval('span.font-bold', (el) => el.textContent);
    console.log(`- Dashboard Header verified: "${brandText}"`);

    // Capture Dashboard Screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'dashboard.png'), fullPage: false });
    console.log('- Saved dashboard screenshot to docs/screenshots/dashboard.png');

    // 2. Click a featured repository sample: tiangolo/fastapi or search
    console.log('2. Searching / selecting repository: tiangolo/fastapi');
    const sampleBtn = await page.$('button[class*="group flex flex-col"]');
    if (sampleBtn) {
      await sampleBtn.click();
    } else {
      // Type in search bar
      await page.type('input[aria-label="Repository search"]', 'fastapi/fastapi');
      await page.keyboard.press('Enter');
    }

    // 3. Wait for Repo Details to render
    console.log('3. Waiting for repository metadata and metrics...');
    await page.waitForSelector('h1.font-bold', { timeout: 15000 });
    const repoTitle = await page.$eval('h1.font-bold', (el) => el.textContent);
    console.log(`- Repository Detail Title loaded: "${repoTitle}"`);

    // Wait for health score to be visible
    await page.waitForSelector('span.font-bold.font-mono');
    const starsText = await page.evaluate(() => {
      const el = document.querySelector('div.text-xl');
      return el ? el.textContent : 'N/A';
    });
    console.log(`- Key metric (Stars) rendered: ${starsText}`);

    // Wait a brief moment for activity stream to complete
    await new Promise((r) => setTimeout(r, 1500));

    // Capture Repo Detail Screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'repo-detail.png'), fullPage: false });
    console.log('- Saved repo detail screenshot to docs/screenshots/repo-detail.png');

    // 4. Click "Add to Compare"
    console.log('4. Testing Comparison Mode...');
    const compareBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Compare'));
    });
    if (compareBtn) {
      await compareBtn.click();
      console.log('- Added repository to compare list');
    }

    // Open Compare View
    await page.goto('http://localhost:5173/#compare', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('h2.font-bold', { timeout: 10000 });
    const matrixHeader = await page.$eval('h2.font-bold', (el) => el.textContent);
    console.log(`- Comparison Matrix Header: "${matrixHeader}"`);

    // Capture Comparison Screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'compare.png'), fullPage: false });
    console.log('- Saved comparison screenshot to docs/screenshots/compare.png');

    // Check for errors
    if (consoleErrors.length > 0) {
      console.warn('Browser Console Errors detected:', consoleErrors);
    } else {
      console.log('Zero browser console errors detected. All flows verified successfully!');
    }

    return { success: true, consoleErrors };
  } catch (err) {
    console.error('Audit failed with error:', err);
    console.log('Current URL:', page.url());
    const body = await page.evaluate(() => document.body.innerText);
    console.log('Page Text:', body);
    return { success: false, error: err.message, consoleErrors };
  } finally {
    await browser.close();
  }
}

runAudit().then((res) => {
  if (!res.success) {
    process.exit(1);
  }
});
