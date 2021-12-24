/* eslint-disable no-undef */
const readline = require('readline');

async function isHomePage(page) {
    await page.waitForFunction(() => {
        return window.location.href === "https://www.att.com/";
    })

    return "home";
}

async function isLoginPage(page) {
    await page.waitForFunction(() => {
        return window.location.href.startsWith("https://signin.att.com/dynamic/iamLRR/LrrController?IAM_OP=login");
    })

    return "login";
}

async function isMFAPage(page) {
    await page.waitForFunction(() => {
        return window.location.href.startsWith("https://signin.att.com/dynamic/iamLRR/LrrController?IAM_OP=OTP");
    })

    return "mfa";
}

async function isBillingPage(page) {
    await page.waitForFunction(() => {
        return window.location.href === "https://www.att.com/acctmgmt/billandpay";
    })

    return "billing";
}


async function getMFA(page, host) {
    const [hostTile] = await page.$x(`//div[@id='radio-form-container']/div[contains(., '${host}')]`);
    if (!hostTile) throw new Error("no host found in MFA!");

    await hostTile.click();

    await page.click("input#submitDest");

    await page.waitForFunction(() => {
        return !!document.querySelector("input#codeValue");
    })

    const mfaCode = await askQuestion("What's the MFA code from your phone?");

    await page.focus("input#codeValue");
    await page.keyboard.type(mfaCode);


    await page.click("input#submitCodeButton");


    
    function askQuestion(query) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        return new Promise(resolve => rl.question(query, ans => {
            rl.close();
            resolve(ans);
        }))
    }

}

module.exports = {
    isHomePage,
    isLoginPage,
    isMFAPage,
    isBillingPage,
    getMFA,
}