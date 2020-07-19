import connection from './db.js';

class Bill {
	static create({ startDate = null, endDate, phoneNumber, amount }) {
		if (!endDate || !phoneNumber || !amount) throw new Error('endDate, phoneNumber, amount need to be defined');
		return connection.then((sql) =>
			sql.query(`INSERT INTO Bill (StartDate, EndDate, PhoneNumber, Amount) VALUES (?, ?, ?,?)`, [
				startDate,
				endDate,
				phoneNumber,
				amount
			])
		);
	}

	static getCount() {
		return connection.then((sql) => sql.query(`SELECT COUNT(DISTINCT EndDate) AS count FROM Bill`));
	}
}

export default Bill;
