const fs = require("fs").promises;


async function billing(page) {
    const element = await page.$("span[class^='BillDetails__bill-date']");
    const period = await element.evaluate(el => el.textContent);

    const list = await page.$$("div[class^='BillDetails__autopay']");

    const sharedEle = list.shift();

    const sharedAmount = await sharedEle.$(".BillService__wid-r1-c2__5LweC").evaluate(el => el.textContent);

    let individuals = {};

    for(let i=0; i<list.length; i++) {
        const phoneNum =  await sharedEle.$(".BillService__wid-r2-c1__7-DjN").evaluate(el => el.textContent);
        const amount =  await sharedEle.$(".BillService__wid-r1-c2__5LweC").evaluate(el => el.textContent);

        individuals[phoneNum] = amount;
    }


    await page.screenshot({ path: path.join(__dirname, `./screenshots/billing_${period}.png`) });

    // todo - download PDF.

    return {
        period,
        sharedAmount,
        individuals
    }
}


module.exports = billing;