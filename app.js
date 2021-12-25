const puppeteer = require("puppeteer-core");
const fs = require("fs").promises;
const path = require("path");

const login = require("./login.js");
const billing = require("./billing.js");
const calculate = require("./calculate.js");

const config = require("./.config.json");

const { isHomePage, isMFAPage, isBillingPage, getMFA } = require("./utility");

const LOGIN_URL = "https://signin.att.com";
const BILLING_URL = "https://www.att.com/acctmgmt/billandpay";

// clear out screenshots before run.

async function run(config) {
  try {
    await fs.readdir(path.join(__dirname, "./screenshots")).then(async (files) => {
      for (const file of files) {
        await fs.unlink(path.join(__dirname, "./screenshots", file));
      }
    });
  } catch (err) {
    console.log("can't remove previous screenshots.");
    console.log(err);
  }

  const username = config.username;
  const password = config.password;
  const host = config.host;
  const users = config.users;
  console.log(`-------------working on user ${username}------------`);

  //   const browser = await puppeteer.launch();
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/chromium-browser",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
    ],
    userDataDir: path.join(__dirname, './.userDataDir')
  });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3738.0 Safari/537.36');

  try {

    // eslint-disable-next-line no-constant-condition
    while(true) {
        try {
    // page.on('console', consoleObj => console.log(consoleObj.text()));

            await page.emulateMediaType('screen');
            console.log("-------------now going to login page------------");

            await page.goto(LOGIN_URL, { waitUntil: "networkidle0" });
            
            await page.waitForSelector('body [aria-controls]', { visible: true, timeout: 0 });
            await page.screenshot({ path: path.join(__dirname, "./screenshots/login-loaded.png") });


            // try{
            //   curPage = await Promise.any([
            //     isLoginPage(page),
            //     isHomePage(page)
            //   ]);
            // } catch (err) {
            //   await page.screenshot({ path: path.join(__dirname, "./screenshots/login-error.png") });

            // }
            // await page.screenshot({ path: path.join(__dirname, "./screenshots/login-loaded.png") });
            const pageURL = page.url()
            if (pageURL.startsWith("https://signin.att.com/dynamic/iamLRR/LrrController?IAM_OP=login")) {
              await login(page, username, password, host);
            }
            
            break;

        } catch (err) {
            console.log(err.stack);
            continue;
        }
    }

    await solveMFA(page, host);

    console.log("-------------logged in------------");

    await page.goto(BILLING_URL);

    await solveMFA(page, host);

    console.log("-------------now at billing page------------");

    const billRes = await billing(page);

    console.log("-------------calculate------------");

    await calculate(page, billRes, users);

    await browser.close();
    
  } catch(err) {
    console.log(err.stack);
  }
  
}

async function solveMFA(page, host) {

  let curPage;
  try {
    curPage = await Promise.any([
      isMFAPage(page),
      isHomePage(page),
      isBillingPage(page)
    ]);
  } catch (err) {
    await page.screenshot({ path: path.join(__dirname, "./screenshots/mfa-failed.png") });
    throw err;
  }
  

  if(curPage === "mfa") {
      await getMFA(page, host);
  }
}

run(config);

