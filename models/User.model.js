import connection from './db.js';

class User {
	static create({ name = null, phoneNumber, email = null }) {
		if (!phoneNumber) {
			throw new Error('empty phone number!');
		}
		return connection.then((sql) =>
			sql.query(`INSERT INTO User (Name, PhoneNumber, Email) VALUES (?, ?, ?)`, [ name, phoneNumber, email ])
		);
	}

	static getAll() {
		return connection.then((sql) => sql.query(`SELECT * FROM User`));
	}

	static get(phoneNumber) {
		if (!phoneNumber) {
			throw new Error('empty phone number!');
		}
		return connection.then((sql) => sql.query(`SELECT * FROM User where PhoneNumber=${phoneNumber}`));
	}
}

export default User;
