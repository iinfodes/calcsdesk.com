const path = require('path');
const fs = require('fs');
const {createRequire} = require('module');
const req = createRequire('C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1026-487-0_26.1026.487.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright/package.json');
const {chromium} = req('playwright');
const sharp = req('sharp');
const {pathToFileURL} = require('url');
const names=['The clear answer','Find your number','A little more certainty','Your country, your calculation','One desk. Different rules.','Money has a local language','Make the next decision clearer','Put your numbers to work','Before the big decision'];
const styles=['Search / Utility','Search / Bold','Search / Editorial','Country / Utility','Country / Bold','Country / Editorial','Task / Utility','Task / Bold','Task / Editorial'];
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage();const qa=[];
 for(let n=1;n<=9;n++){
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1440,height:900});
  await page.goto(pathToFileURL(path.join(__dirname,`option-${n}.html`)).href);
  await page.screenshot({path:path.join(__dirname,`option-${n}-desktop.png`)});
  await page.screenshot({path:path.join(__dirname,`option-${n}-full.png`),fullPage:true});
  await page.locator('.theme').click();
  await page.screenshot({path:path.join(__dirname,`option-${n}-dark.png`)});
  await page.locator('.theme').click();
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:path.join(__dirname,`option-${n}-mobile.png`)});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  await page.locator('.theme').click();
  await page.screenshot({path:path.join(__dirname,`option-${n}-mobile-dark.png`)});
  await page.locator('.theme').click();
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  // Fixed pixel fonts in a screenshot study are enlarged directly for text-only zoom QA.
  await page.evaluate(()=>{const sizes=[...document.querySelectorAll('body *')].map(el=>[el,parseFloat(getComputedStyle(el).fontSize)]);sizes.forEach(([el,size])=>el.style.fontSize=size*2+'px')});
  const zoomOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  await page.reload();
  let searchWorks=null;
  if(await page.locator('#find').count()){await page.locator('#find').fill('zzzz-no-match');searchWorks=await page.locator('#empty').isVisible();await page.locator('#find').fill('UK salary');searchWorks=searchWorks&&(await page.locator('.tool:visible').count()===1);await page.locator('#find').fill('UAE gratuity');searchWorks=searchWorks&&(await page.locator('.tool:visible').count()===1)}
  if(await page.locator('#find').count())await page.locator('#find').fill('');
  const countryButton=page.locator('[data-filter="CA"]').first();let countryWorks=null;
  if(await countryButton.count()){await countryButton.click();countryWorks=await page.locator('.tool:visible').count()===1}
  let finderWorks=null;
  if(await page.locator('#finder-country').count()){
   await page.locator('#finder-country').selectOption('UK');
   finderWorks=(await page.locator('#suggested-tool').textContent())==='Salary calculator';
   await page.locator('#open-suggestion').click();
   finderWorks=finderWorks&&(await page.locator('#tool-preview').isVisible())&&(await page.locator('#dialog-route').textContent())==='/uk/pay/salary-calculator/';
   await page.keyboard.press('Escape');await page.locator('#finder-task').selectOption('Benefits');finderWorks=finderWorks&&(await page.locator('#open-suggestion').isDisabled());
  }
  await page.locator('.tool:visible').first().click();const cardPreviewWorks=await page.locator('#tool-preview').isVisible();await page.keyboard.press('Escape');
  await page.keyboard.press('Tab');const focus=await page.evaluate(()=>{const el=document.activeElement;return el&&getComputedStyle(el).outlineStyle!=='none'});
  qa.push({option:n,mobileOverflow:overflow,textZoomOverflow:zoomOverflow,searchWorks,countryWorks,finderWorks,cardPreviewWorks,keyboardFocusVisible:focus,scriptErrors:errors});
 }
 await browser.close();
 const composite=[];const width=1896,height=1848,tileW=600,tileH=375,gap=24;
 for(let n=1;n<=9;n++){
  const col=(n-1)%3,row=Math.floor((n-1)/3),left=24+col*(tileW+gap),top=110+row*460;
  composite.push({input:await sharp(path.join(__dirname,`option-${n}-desktop.png`)).resize(tileW,tileH).toBuffer(),left,top});
  const label=`<svg width="600" height="65"><style>text{font-family:Segoe UI,Arial,sans-serif}</style><text x="0" y="24" fill="#172034" font-size="21" font-weight="650">${n}. ${names[n-1]}</text><text x="0" y="48" fill="#566174" font-size="16">${styles[n-1]}</text></svg>`;
  composite.push({input:Buffer.from(label),left,top:top+tileH+6});
 }
 const header=Buffer.from('<svg width="1896" height="100"><style>text{font-family:Segoe UI,Arial,sans-serif}</style><text x="24" y="46" fill="#172034" font-size="32" font-weight="700">CalcsDesk — enhanced concepts / round 2</text><text x="24" y="77" fill="#566174" font-size="18">Competitor-informed revisions. Recommended: 1 for launch, 4 for country discovery, 7 for a workspace.</text></svg>');
 composite.push({input:header,left:0,top:0});
 for(let n=1;n<=9;n++){
  const left=24+(n-1)*208;
  composite.push({input:await sharp(path.join(__dirname,`option-${n}-mobile.png`)).resize(180,390).toBuffer(),left,top:1518});
  composite.push({input:Buffer.from(`<svg width="180" height="30"><text x="0" y="23" font-family="Segoe UI,Arial" font-size="16" fill="#172034">${n} / MOBILE</text></svg>`),left,top:1480});
 }
 await sharp({create:{width,height:1940,channels:3,background:'#edf0f5'}}).composite(composite).png().toFile(path.join(__dirname,'contact-sheet.png'));
 const darkTiles=[];
 for(let n=1;n<=9;n++)darkTiles.push({input:await sharp(path.join(__dirname,`option-${n}-dark.png`)).resize(600,375).toBuffer(),left:24+((n-1)%3)*624,top:24+Math.floor((n-1)/3)*400});
 await sharp({create:{width:1896,height:1224,channels:3,background:'#080d17'}}).composite(darkTiles).png().toFile(path.join(__dirname,'dark-contact-sheet.png'));
 fs.writeFileSync(path.join(__dirname,'qa-results.json'),JSON.stringify(qa,null,2));
 console.log(JSON.stringify(qa,null,2));
})().catch(e=>{console.error(e.message);process.exit(1)});
