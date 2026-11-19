#!/usr/bin/env node
/**
 * Capture GenieACS UI screenshots (all main pages) using Playwright.
 *
 * Prereqs:
 *   npm install playwright@1.65.1   (or compatible)
 *   npx playwright install chromium
 *
 * Usage examples:
 *   # login with username/password
 *   BASE_URL=http://127.0.0.1:3000 UI_USER=admin UI_PASS=admin node scripts/capture-screenshots.mjs
 *
 *   # or on the ACS server (reads GENIEACS_UI_JWT_SECRET from env file)
 *   ENV_FILE=/opt/genieacs/genieacs.env UI_USER=admin node scripts/capture-screenshots.mjs
 *
 * Output: docs/screenshots/*.png
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const OUT = process.env.OUT_DIR || path.join(process.cwd(), 'docs', 'screenshots');
const ENV_FILE = process.env.ENV_FILE || '/opt/genieacs/genieacs.env';
const UI_USER = process.env.UI_USER || 'admin';
const UI_PASS = process.env.UI_PASS || '';
const DEVICE_ID = process.env.DEVICE_ID || 'D8A8C8-F663NV9-ZTEGCCC3BF6F';

function b64url(s) { return Buffer.from(s).toString('base64url'); }
function makeJwt(secret, username) {
  const h = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const p = b64url(JSON.stringify({ username, authMethod: 'local' }));
  const msg = `${h}.${p}`;
  const sig = crypto.createHmac('sha256', secret).update(msg).digest('base64url');
  return `${msg}.${sig}`;
}
function readSecret() {
  try {
    const s = fs.readFileSync(ENV_FILE, 'utf8');
    for (const line of s.split('\n')) {
      if (line.startsWith('GENIEACS_UI_JWT_SECRET=')) return line.slice('GENIEACS_UI_JWT_SECRET='.length).trim();
    }
  } catch {}
  return process.env.GENIEACS_UI_JWT_SECRET || null;
}

async function login(page) {
  if (UI_PASS) {
    await page.goto(`${BASE}/#!/login`, { waitUntil: 'networkidle', timeout: 45000 }).catch(()=>{});
    await page.waitForTimeout(1500);
    await page.fill('input[name="username"], input[type="text"]', UI_USER).catch(()=>{});
    await page.fill('input[name="password"], input[type="password"]', UI_PASS).catch(()=>{});
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Log in")').catch(()=>{});
    await page.waitForTimeout(2500);
    return true;
  }
  const secret = readSecret();
  if (!secret) throw new Error('Provide UI_PASS or GENIEACS_UI_JWT_SECRET/ENV_FILE');
  const token = makeJwt(secret, UI_USER);
  const url = new URL(BASE);
  await page.context().addCookies([{
    name: 'genieacs-ui-jwt', value: token,
    domain: url.hostname, path: '/',
  }]);
  return true;
}

async function shot(page, hash, file, wait = 4500) {
  const url = `${BASE}/#!${hash}`;
  console.log('capture', url, '->', file);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(()=>{});
  await page.waitForTimeout(wait);
  await page.screenshot({ path: path.join(OUT, file), fullPage: false });
}

(async () => {
  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch { console.error('Install playwright: npm i playwright && npx playwright install chromium'); process.exit(1); }

  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // Login page
  const pLogin = await context.newPage();
  await shot(pLogin, '/login', '01-login.png', 3000);
  await pLogin.close();

  // Authenticated
  const page = await context.newPage();
  await login(page);

  const pages = [
    ['/overview', '02-overview.png'],
    ['/devices', '03-devices.png'],
    [`/devices/${DEVICE_ID}`, '04-device-detail.png'],
    ['/faults', '05-faults.png'],
    ['/admin', '06-admin.png'],
    ['/admin/presets', '07-admin-presets.png'],
    ['/admin/provisions', '08-admin-provisions.png'],
    ['/admin/virtualParameters', '09-admin-virtual-parameters.png'],
    ['/admin/config', '10-admin-config.png'],
    ['/admin/files', '11-admin-files.png'],
    ['/admin/users', '12-admin-users.png'],
    ['/admin/permissions', '13-admin-permissions.png'],
  ];
  for (const [hash, file] of pages) {
    try { await shot(page, hash, file); } catch (e) { console.error('ERR', hash, e.message); }
  }
  await browser.close();
  console.log('done ->', OUT);
})().catch(e => { console.error(e); process.exit(1); });
