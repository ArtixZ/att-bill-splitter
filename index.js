import puppeteer from 'puppeteer-core';
import readline from 'readline';

import BillModel from './models/Bill.model.js';
import UserModel from './models/User.model.js';

import attConfig from './config/att.config.js';
import PATH_TO_CHROME from './config/path_to_chromium.config.js';

const { USER, PASSWORD, MY_LAST_4_DIGITS } = attConfig;
const TYPING_DELAY = 0;

(async () => {
	const browser = await puppeteer.launch({
		headless: false,
		slowMo: 250,
		executablePath: PATH_TO_CHROME,
		args: [ '--no-sandbox' ],
		userDataDir: './.userdata'
	});

	const page = await browser.newPage();
	page.setDefaultNavigationTimeout(60000);
	await crawl(page);
	console.log('Job Done! Closing browser');
	await browser.close();
})();

const crawl = async (page) => {
	await login(page);

	const recordedBillCount = await BillModel.getCount();

	const existingUsers = await UserModel.getAll();

	const updateUsersBound = updateUsers.bind(null, existingUsers);

	await crawlBills(page, recordedBillCount[0].count, { updateBills, updateUsers: updateUsersBound });
};

const updateUsers = async (existingUsers, users) => {
	const existingSet = new Set(existingUsers.map((obj) => obj.PhoneNumber));
	await Promise.all(
		users.map(async (user) => {
			if (!existingSet.has(user.phoneNumber)) {
				await UserModel.create({ ...user });
			}
		})
	);
};

const updateBills = async (users, billCycle) => {
	await Promise.all(users.map(async (user) => BillModel.create({ ...user, ...billCycle })));
};

const clickAndWait = (page, selector, waitUntil = 'networkidle2') => {
	return Promise.all([ page.waitForNavigation(waitUntil), page.click(selector) ]);
};

const waitForSpinerDismiss = async (page) => {
	await page.waitForSelector('#commonLoader');

	return page.waitForSelector('#commonLoader', { hidden: true }).then(() => {
		console.log('spinner is gone');
	});
};

const get2FACode = () => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	return new Promise((resolve, reject) => {
		rl.question('What is the code? ', (answer) => {
			rl.close();
			resolve(answer);
		});
	});
};

const login = async (page) => {
	console.log('================start logging in================');
	await page.goto('https://www.att.com/my/#/login', { waitUntil: 'networkidle0' });
	try {
		await page.waitForSelector('input[name="password"]');
	} catch (err) {
		if ((await page.title()) === 'Account overview') {
			console.log('logged in using session');
			return;
		} else {
			console.log();
			throw new Error('unidentified page');
		}
	}

	try {
		await page.type('input#userID', USER, { delay: TYPING_DELAY });
	} catch (err) {
		console.log('session timedout. trying to re-enter');
	}
	await page.type('input[name="password"]', PASSWORD, { delay: TYPING_DELAY });
	await clickAndWait(page, 'button[type="submit"]');
	await waitForSpinerDismiss(page);

	try {
		await page.waitForSelector('#your-code');
		console.log('going to check 2FA code');
	} catch (err) {
		return;
	}

	//2 factor authentication
	const myNumber = await page.$x(`//div[contains(text(), ${MY_LAST_4_DIGITS})]`);
	await myNumber[0].click();
	await clickAndWait(page, '#submitDest');

	const code = await get2FACode();
	await page.type('input#codeValue', code, { delay: TYPING_DELAY });
	await clickAndWait(page, 'input#submitCodeButton', 'networkidle0');
	await waitForSpinerDismiss(page);
};

const crawlBills = async (page, recordedCount, { updateUsers, updateBills }) => {
	console.log('================start crawling================');

	//start crawling from index `recordedCount`
	await page.goto('https://www.att.com/my/#/viewBill', { waitUntil: 'networkidle0' });

	let list = await page.$$(
		".marTopBillHead.span4  form[name='dropdownForm'] .ng-scope.selectWrap > .selectWrapper > .awd-select-list.ddh-collapse > ul[role='menu'] > li"
	);
	list = list.reverse();

	for (let i = recordedCount; i < list.length; i++) {
		console.log(`working on the ${i}th bill`);
		await page.click(".marTopBillHead.span4  form[name='dropdownForm'] .selectbill_drop");
		await list[i].click();
		await waitForSpinerDismiss(page);

		await page.click('[ddh-wireless-bill-details-britebill]');

		const sharedElem = await page.$x(`//span[contains(text(), "Shared plan charges")]`);
		const usersElem = await page.$$(".accordion-content .tiny-accordion [id^='tab'] .row.hidden-phone");

		let sharedAmount = 0;

		if (sharedElem && sharedElem.length) {
			sharedAmount = parseFloat(
				await page.evaluate((elem) => elem.nextElementSibling.textContent.replace('$', ''), sharedElem[0])
			);
			usersElem.shift();
		}

		const usersData = await Promise.all(
			usersElem.map(
				async (elem) =>
					await page.evaluate(
						(el, sharedAmount, numberOfUsers) => {
							return {
								phoneNumber: el.firstChild.firstChild.textContent,
								name: el.firstChild.lastChild.textContent,
								amount:
									Number(parseFloat(sharedAmount / numberOfUsers).toFixed(2)) +
									Number(parseFloat(el.children[1].textContent.replace('$', '')))
							};
						},
						elem,
						sharedAmount,
						usersElem.length
					)
			)
		);

		console.log('going to update User table');
		await updateUsers(usersData);
		console.log('User table updated');

		const billTotalRowElem = await page.$('[class*="accordion-total"]');
		const billCycle = await page.evaluate((el) => {
			const text = el.firstChild.querySelector('.ng-binding.ng-scope').lastChild.textContent;
			const yearPart = text.split(',')[1].trim();
			const monthPart = text.split(',')[0].replace('for', '').trim();
			const startMonthDate = monthPart.split('-')[0].trim();
			const endMonthDate = monthPart.split('-')[1].trim();
			const months = {
				Jan: '01',
				Feb: '02',
				Mar: '03',
				Apr: '04',
				May: '05',
				Jun: '06',
				Jul: '07',
				Aug: '08',
				Sep: '09',
				Oct: '10',
				Nov: '11',
				Dec: '12'
			};

			return {
				startDate: `${yearPart}-${months[startMonthDate.split(' ')[0]]}-${startMonthDate.split(' ')[1]}`,
				endDate: `${yearPart}-${months[endMonthDate.split(' ')[0]]}-${endMonthDate.split(' ')[1]}`
			};
		}, billTotalRowElem);

		console.log('going to update Bill table');

		await updateBills(usersData, billCycle);

		console.log('Bill table updated');
	}
};
