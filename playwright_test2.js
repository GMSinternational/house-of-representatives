const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('pageerror', err => console.log('ERROR:', err.message));

  await page.goto('http://localhost:8765/index_test.html');
  await page.waitForFunction(() => document.getElementById('cover').style.display === 'none', { timeout: 20000 });
  console.log('✅ ページ読み込み完了');

  // キーワード確認
  const keywords = await page.$$eval('#keywords a', els => els.map(e => e.textContent));
  console.log('キーワード（' + keywords.length + '個）:', keywords.join('｜'));
  const hasFixed = ['減税','社会保険料','規制'].every(k => keywords.includes(k));
  console.log('固定3キーワード含む:', hasFixed ? '✅' : '❌');
  console.log('合計8個:', keywords.length === 8 ? '✅' : '❌ 実際:' + keywords.length);

  // 検索タブへ
  await page.click('.switch-item[code="search"]');
  await page.waitForTimeout(200);

  // 会派プルダウンのoptgroup確認
  const partyGroups = await page.$$eval('#select-party-for optgroup', els => els.map(e => e.label));
  console.log('会派 optgroups:', JSON.stringify(partyGroups));

  // 現存会派に自民党が含まれるか
  const currentParties = await page.$$eval('#select-party-for optgroup[label="現在の会派"] option', els => els.map(e => e.value));
  console.log('現在の会派 count:', currentParties.length, '（自民党含む:', currentParties.includes('自由民主党') ? '✅' : '❌', '）');

  const historicalParties = await page.$$eval('#select-party-for optgroup[label="過去の会派"] option', els => els.map(e => e.value));
  console.log('過去の会派 count:', historicalParties.length, '（みんなの党含む:', historicalParties.includes('みんなの党') ? '✅' : '❌', '）');

  // 審議に関わった年のプルダウン確認
  const kaijiYearCount = await page.$$eval('#select-kaiji-any-year option', els => els.length);
  console.log('審議に関わった年 options:', kaijiYearCount, '（指定なし含む）');

  // 公布年プルダウン確認
  const horeiYearCount = await page.$$eval('#select-horei-year option', els => els.length);
  console.log('公布年 options:', horeiYearCount);

  // 法律番号datalist確認
  const horeiNumCount = await page.$$eval('#datalist-horei-number option', els => els.length);
  console.log('法律番号 datalist options:', horeiNumCount);

  // datalist（回次・番号）確認
  const sessionDatalist = await page.$$eval('#datalist-gian-session option', els => els.length);
  const numberDatalist = await page.$$eval('#datalist-gian-number option', els => els.length);
  console.log('回次 datalist:', sessionDatalist, '件, 議案番号 datalist:', numberDatalist, '件');

  // 審査結果 optgroups確認
  const shuShinsaGroups = await page.$$eval('#select-shugiin-shinsa optgroup', els => els.map(e => e.label));
  console.log('衆院審査結果 optgroups:', JSON.stringify(shuShinsaGroups));

  const sanShinsaGroups = await page.$$eval('#select-sangiin-shinsa optgroup', els => els.map(e => e.label));
  console.log('参院審査結果 optgroups:', JSON.stringify(sanShinsaGroups));

  // 合同会派注記確認
  await page.click('.switch-item[code="summary"]');
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  const noteH4s = await page.$$eval('#parties-note-block h4', els => els.map(e => e.textContent));
  console.log('会派注記 h4見出し:', JSON.stringify(noteH4s));

  // 検索テスト：審議に関わった年2020でフィルタ
  await page.click('.switch-item[code="search"]');
  await page.waitForTimeout(200);
  await page.selectOption('#select-kaiji-any-year', '2020');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  const result2020 = await page.$eval('#result-number', el => el.textContent);
  console.log('審議年2020フィルタ:', result2020);

  // 公布年+法律番号の組み合わせテスト
  await page.selectOption('#select-kaiji-any-year', '');
  await page.selectOption('#select-horei-year', '2024');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  const resultHorei2024 = await page.$eval('#result-number', el => el.textContent);
  console.log('公布年2024フィルタ:', resultHorei2024);

  // 衆院審査結果「可決」テスト
  await page.selectOption('#select-horei-year', '');
  await page.selectOption('#select-shugiin-shinsa', '可決');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  const resultKaketsu = await page.$eval('#result-number', el => el.textContent);
  console.log('衆院審査結果「可決」フィルタ:', resultKaketsu);

  // 「修正」では「併合修正」にヒットしないことを確認（exact match）
  await page.selectOption('#select-shugiin-shinsa', '修正');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  const resultShusei = await page.$eval('#result-number', el => el.textContent);
  console.log('衆院審査結果「修正」フィルタ（exact）:', resultShusei);

  await page.selectOption('#select-shugiin-shinsa', '併合修正');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  const resultHeigo = await page.$eval('#result-number', el => el.textContent);
  console.log('衆院審査結果「併合修正」フィルタ（exact）:', resultHeigo);

  // 「修正」と「併合修正」の合計が「可決」より少ないことを確認
  const numKaketsu = parseInt(resultKaketsu.replace(/,/g, ''));
  const numShusei = parseInt(resultShusei.replace(/,/g, ''));
  const numHeigo = parseInt(resultHeigo.replace(/,/g, ''));
  console.log('可決:', numKaketsu, '修正:', numShusei, '併合修正:', numHeigo);
  console.log('「修正」!=「併合修正」（exact matchが効いている）:', numShusei !== numHeigo ? '✅' : '⚠️要確認');

  await browser.close();
  console.log('\n✅ 検証完了');
})().catch(e => { console.error('FAIL:', e); process.exit(1); });
