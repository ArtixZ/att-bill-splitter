const fs = require("fs").promises;
const path = require("path");
const readline = require('readline');


async function login(page, username, password, host) {
    // todo - username might stored.
    await page.focus("#username");
    await page.keyboard.type(username);

    await page.focus("#password");
    await page.keyboard.type(password);

    await page.click("button#signin");

    const mfa = await Promise.any([
        requireNotMFA(page),
        requireMFA(page)
    ]);

    if(mfa === "required") {
        await getMFA(page, host);
    }

    return;
    
}

async function requireNotMFA(page) {
    await page.waitForFunction(() => {
        return window.location.href === "https://www.att.com/";
    })

    return "not_required";
}

async function requireMFA(page) {
    await page.waitForFunction(() => {
        return window.location.href.startsWith("https://signin.att.com/dynamic/iamLRR/LrrController?IAM_OP=OTP");
    })

    return "required";
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

module.exports = login;