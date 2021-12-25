// const fs = require("fs").promises;
// const path = require("path");
const path = require("path");

async function login(page, username, password) {
    await page.waitForSelector("input[autocomplete='current-password']", { visible: true, timeout: 0 });

    await Promise.any([
        Promise.resolve((async () =>  {
            await page.waitForSelector("div.expandedIdArea", { visible: true, timeout: 0 });
        })()),
        Promise.resolve((async () => {
            await page.focus("input[autocomplete='username']");
            await page.keyboard.type(username);
        })())
    ])
    // todo - username might stored.
    

    await page.focus("input[autocomplete='current-password']");
    await page.keyboard.type(password);

    await page.screenshot({ path: path.join(__dirname, "./screenshots/login-filled.png") });

    await page.click("button[type='submit']");

    return;
    
}


module.exports = login;
