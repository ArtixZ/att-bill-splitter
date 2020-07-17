import sql from './db';

class User {
	constructor(cb) {
		this.errorcb = cb.errorcb;
		this.createCallback = cb.create;
		this.getAllCallback = cb.getAll;
		this.getCallback = cb.get;
	}

	create({ name = '', phoneNumber, email = '' }) {
		if (!phoneNumber) {
			throw new Error('empty phone number!');
		}
		sql.query(
			`INSERT INTO User (Name, PhoneNumer, Email) VALUES (${name}, ${phoneNumber}, ${email})`,
			(err, res) => {
				if (err) {
					console.log(err);
					this.errorcb('USER', 'CREATE', err);
					return;
				}
				this.createCallback(res);
			}
		);
	}

	getAll() {
		sql.query(`SELECT * FROM User`, (err, res) => {
			if (err) {
				console.log(err);
				this.errorcb('USER', 'GET', err);
				return;
			}
			this.getAllCallback(res);
		});
	}

	get(phoneNumber) {
		sql.query(`SELECT * FROM User where PhoneNumber=${phoneNumber}`, (err, res) => {
			if (err) {
				console.log(err);
				this.errorcb('USER', 'GET', err);
				return;
			}
			this.getCallback(res);
		});
	}
}

module.exports = User;
