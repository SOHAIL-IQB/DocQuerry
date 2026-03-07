const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: "new"});
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  try {
    await page.goto('http://localhost:5173/chat', {waitUntil: 'networkidle0'});
    await new Promise(r => setTimeout(r, 2000));
    const btn = await page.$('.new-chat-btn');
    if (btn) await btn.click();
    await new Promise(r => setTimeout(r, 3000));
  } catch (e) {
    console.log('SCRIPT ERROR:', e.message);
  }
  await browser.close();
})();
