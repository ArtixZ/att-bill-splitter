const puppeteer = require("puppeteer-core");
const fs = require("fs").promises;
const path = require("path");

const login = require("./login.js");
const billing = require("./billing.js");
const calculate = require("./calculate.js");

const config = require("./.config.json");

const { isLoginPage, isHomePage, isMFAPage, isBillingPage, getMFA } = require("./utility");

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
  });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);

  let curPage;
  try {

    // eslint-disable-next-line no-constant-condition
    while(true) {
        try {
            await page.goto(LOGIN_URL);
            await page.waitForSelector('body', { visible: true, timeout: 0 });
            // await page.screenshot({ path: path.join(__dirname, "./screenshots/login-loaded.png") });
            console.log("-------------now at login page------------");

            curPage = await Promise.any([
              isLoginPage(page),
              isHomePage(page)
            ]);
            if (curPage === "login") await login(page, username, password, host);
            
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
  const curPage = await Promise.any([
    isMFAPage(page),
    isHomePage(page),
    isBillingPage(page)
  ]);

  if(curPage === "mfa") {
      await getMFA(page, host);
  }
}

run(config);

