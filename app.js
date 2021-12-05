
// const puppeteer = require("puppeteer-core");
const puppeteer = require("puppeteer"); // TODO: change to puppeteer-core
const fs = require("fs").promises;
const path = require("path");

const login = require("./login.js");
const billing = require("./billing.js");

const config = require("./config.json");

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
  console.log(`-------------working on user ${username}------------`);

  //   const browser = await puppeteer.launch();
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: "/opt/homebrew/bin/chromium",
    userDataDir: path.join(__dirname, './.userDataDir'),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
    ],
  });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);

  // read cookies and set cookies to page.
//   try {
//     const cookiesString = await fs.readFile(path.join(__dirname, `./.cookies/cookie`));
//     const cookies = JSON.parse(cookiesString);
//     await page.setCookie(...cookies);
//   } catch (err) {
//     console.log("can't set cookie.", err);
//   }

  try {

    while(true) {
        try {
            await page.goto(LOGIN_URL);
            // await page.screenshot({ path: path.join(__dirname, "./screenshots/login-loaded.png") });
            console.log("-------------now at login page------------");

            if (new URL(page.url().hostname) === new URL(LOGIN_URL).hostname) await login(page, username, password, host);
            
            break;
        } catch (err) {
            console.log(err,err.stack);
            continue;
        }
    }

    console.log("-------------logged in------------");

    await page.goto(BILLING_URL);

    console.log("-------------now at billing page------------");

    const billRes = await billing(page);

    console.log("-------------calculate------------");

    await browser.close();
    
  } catch(err) {
    console.log(err, err.stack);
  }
  
}

run(config);

