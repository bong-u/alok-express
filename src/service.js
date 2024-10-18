"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
class RecordService {
    constructor(db) {
        this.db = db;
        this.dbAll = (0, util_1.promisify)(this.db.all).bind(this.db);
        this.dbGet = (0, util_1.promisify)(this.db.get).bind(this.db);
        this.dbRun = (0, util_1.promisify)(this.db.run).bind(this.db);
    }
    async getRecordsByMonth(year, month) {
        const formattedMonth = month < 10 ? `0${month}` : `${month}`; // 1자리 월을 2자리로 변환
        const sql = `SELECT * FROM records WHERE strftime('%Y-%m', date) = ?`;
        const rows = await this.dbAll(sql, [`${year}-${formattedMonth}`]);
        return rows.reduce((acc, { date, drinkType, amount }) => {
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push({ drinkType, amount });
            return acc;
        }, {});
    }
    async getRecordsByYear(year) {
        const sql = `
		SELECT strftime('%m', date) as month, drinkType, SUM(amount) as amount
		FROM records
		WHERE strftime('%Y', date) = ?
		GROUP BY strftime('%m', date), drinkType
		`;
        const rows = await this.dbAll(sql, [`${year}`]);
        return rows.reduce((acc, { month, drinkType, amount }) => {
            const monthKey = `${year}-${month}`;
            if (!acc[monthKey]) {
                acc[monthKey] = [];
            }
            acc[monthKey].push({ drinkType, amount });
            return acc;
        }, {});
    }
    async getRecordsByDate(date) {
        const sql = "SELECT * FROM records WHERE date = ?";
        const rows = await this.dbAll(sql, [date]);
        return rows;
    }
    async getRecordByDateAndDrinkType(date, drinkType) {
        const sql = "SELECT * FROM records WHERE date = ? AND drinkType = ?";
        const row = await this.dbGet(sql, [date, drinkType]);
        return row;
    }
    async createRecord(record) {
        const sql = "INSERT INTO records (date, drinkType, amount) VALUES (?, ?, ?)";
        await this.dbRun(sql, [record.date, record.drinkType, record.amount]);
    }
    async deleteRecordByDateAndDrinkType(date, drinkType) {
        const sql = "DELETE FROM records WHERE date = ? AND drinkType = ?";
        await this.dbRun(sql, [date, drinkType]);
    }
}
exports.default = RecordService;
