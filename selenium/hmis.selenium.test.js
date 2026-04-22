import { Builder, By, until, Key } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { expect } from 'chai';

const BASE_URL  = 'http://localhost:5173';
const WAIT      = 8000; // ms

describe('HMIS Selenium UI Tests', function () {
  this.timeout(60000);
  let driver;

  before(async () => {
    const options = new chrome.Options().addArguments('--headless', '--no-sandbox', '--disable-dev-shm-usage');
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  });

  after(async () => { await driver.quit(); });

  // Helpers
  const visit    = path => driver.get(`${BASE_URL}${path}`);
  const find     = sel  => driver.wait(until.elementLocated(By.css(sel)), WAIT);
  const findText = sel  => find(sel).then(el => el.getText());
  const type     = async (sel, text) => { const el = await find(sel); await el.clear(); await el.sendKeys(text); };
  const click    = async sel => { const el = await find(sel); await el.click(); };
  const sleep    = ms => new Promise(r => setTimeout(r, ms));

  // ── SE-01: Login page renders ─────────────────────────────────────────
  describe('SE-01: Login page', () => {
    it('should render the login form', async () => {
      await visit('/login');
      const heading = await findText('h1');
      expect(heading).to.include('HMIS');
      const emailInput = await find('input[type="email"]');
      expect(await emailInput.isDisplayed()).to.be.true;
    });

    it('should show error on wrong credentials', async () => {
      await visit('/login');
      await type('input[type="email"]',    'wrong@test.com');
      await type('input[type="password"]', 'WrongPass@1');
      await click('button[type="submit"]');
      await sleep(1500);
      const errorEl = await find('.text-red-700');
      expect(await errorEl.getText()).to.include('Invalid credentials');
    });

    it('should redirect admin to /dashboard after login', async () => {
      await visit('/login');
      await type('input[type="email"]',    'admin@hmis.com');
      await type('input[type="password"]', 'Admin@1234');
      await click('button[type="submit"]');
      await driver.wait(until.urlContains('/dashboard'), WAIT);
      const url = await driver.getCurrentUrl();
      expect(url).to.include('/dashboard');
    });
  });

  // ── SE-02: Dashboard renders KPIs ────────────────────────────────────
  describe('SE-02: Admin dashboard', () => {
    before(async () => {
      await visit('/login');
      await type('input[type="email"]',    'admin@hmis.com');
      await type('input[type="password"]', 'Admin@1234');
      await click('button[type="submit"]');
      await driver.wait(until.urlContains('/dashboard'), WAIT);
    });

    it('should display Total patients stat card', async () => {
      const cards = await driver.findElements(By.css('.rounded-xl.text-white'));
      expect(cards.length).to.be.at.least(4);
    });

    // it('should show monthly revenue chart bars', async () => {
    //   const bars = await driver.findElements(By.css('.bg-violet-400'));
    //   expect(bars.length).to.be.at.least(1);
    // });

    it('should have the sidebar with navigation links', async () => {
      const nav = await driver.findElements(By.css('nav a'));
      expect(nav.length).to.be.at.least(3);
    });
  });

  // ── SE-03: Patients page ─────────────────────────────────────────────
  describe('SE-03: Patients page', () => {
    it('should navigate to patients and show register button', async () => {
      await visit('/patients');
      await driver.wait(until.urlContains('/patients'), WAIT);
      const btn = await find('button.bg-violet-600');
      expect(await btn.getText()).to.include('Register patient');
    });

    it('should open register modal on button click', async () => {
      await click('button.bg-violet-600');
      const modal = await find('.fixed.inset-0');
      expect(await modal.isDisplayed()).to.be.true;
    });

    it('should close modal on Escape key', async () => {
      await driver.findElement(By.css('body')).sendKeys(Key.ESCAPE);
      await sleep(500);
      const modals = await driver.findElements(By.css('.fixed.inset-0'));
      expect(modals.length).to.equal(0);
    });
  });

  // ── SE-04: Appointments page ─────────────────────────────────────────
  describe('SE-04: Appointments page', () => {
    it('should show date filter and book button', async () => {
      await visit('/appointments');
      const dateInput = await find('input[type="date"]');
      expect(await dateInput.isDisplayed()).to.be.true;
      const bookBtn = await find('button.bg-violet-600');
      expect(await bookBtn.getText()).to.include('Book appointment');
    });

    it('should open booking modal', async () => {
      await click('button.bg-violet-600');
      const modal = await find('.fixed.inset-0');
      expect(await modal.isDisplayed()).to.be.true;
      await driver.findElement(By.css('body')).sendKeys(Key.ESCAPE);
    });
  });

  // ── SE-05: Sign-out ───────────────────────────────────────────────────
  describe('SE-05: Sign out', () => {
    it('should sign out and redirect to /login', async () => {
      const logoutBtn = await find('button[class*="text-gray-400"]');
      await logoutBtn.click();
      await driver.wait(until.urlContains('/login'), WAIT);
      const url = await driver.getCurrentUrl();
      expect(url).to.include('/login');
    });
  });
});