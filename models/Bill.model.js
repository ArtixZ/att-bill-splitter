import sql from './db';

class Bill {
	constructor(cb) {
		this.errorcb = cb.errorcb;
		this.createCallback = cb.create;
		this.getLatestCallback = cb.getLatest;
	}
	create(startDate = '', endDate, phoneNumber, amount) {
		if (!endDate || !phoneNumber || !Amount) throw new Error('endDate, phoneNumber, Amount need to be defined');
		sql.query(
			`INSERT INTO Bill (StartDate, EndDate, PhoneNumber, Amount) VALUES (${startDate}, ${endDate}, ${phoneNumber}, ${amount})`,
			(err, res) => {
				if (err) {
					console.log(err);
					this.errorcb('BILL', 'CREATE', err);
					return;
				}
				this.createCallback(res);
			}
		);
	}

	getLatest() {
		sql.query(`SELECT * FROM table ORDER BY id DESC LIMIT 1`, (err, res) => {
			if (err) {
				console.log(err);
				this.errorcb('BILL', 'GETLATEST', err);
				return;
			}
			this.getLatestCallback(res);
		});
	}
}

module.exports = Bill;
