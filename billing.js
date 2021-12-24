// const fs = require("fs").promises;
// const path = require("path");

async function billing(page) {
    await page.waitForSelector("span[class^='BillDetails__bill-date']", { visible: true, timeout: 0 });

    const element = await page.$("span[class^='BillDetails__bill-date']");
    const period = await element.evaluate(el => el.textContent);

    const list = await page.$$("div[class^='BillDetails__autopay']");

    const sharedEle = list.shift();

    const sharedAmount = await sharedEle.$(".BillService__wid-r1-c2__5LweC").then(e => e.evaluate(el => el.textContent));

    let individuals = {};

    for(let i=0; i<list.length; i++) {
        const phoneNum =  await list[i].$(".BillService__wid-r2-c1__7-DjN").then(e => e.evaluate(el => el.textContent));
        const amount =  await list[i].$(".BillService__wid-r1-c2__5LweC").then(e => e.evaluate(el => el.textContent));

        individuals[phoneNum] = amount;
    }

    // await page.pdf({ path: path.join(__dirname, `./screenshots/`)});

    // await page.screenshot({ path: path.join(__dirname, `./screenshots/billing_${period}.png`) });

    return {
        period,
        sharedAmount,
        individuals
    }
}


module.exports = billing;
