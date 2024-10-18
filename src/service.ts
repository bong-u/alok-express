import sqlite3 from "sqlite3";
import { Record, RecordsResponse } from "./interfaces";
import { promisify } from "util";

export default class RecordService {
	db: sqlite3.Database;

	constructor(db: sqlite3.Database) {
		this.db = db;
		this.dbAll = promisify<string, any[]>(this.db.all).bind(this.db);
		this.dbGet = promisify<string, any>(this.db.get).bind(this.db);
		this.dbRun = promisify<string, void>(this.db.run).bind(this.db);
	}

	private dbAll: (sql: string, params?: any[]) => Promise<any[]>;
	private dbGet: (sql: string, params?: any[]) => Promise<any>;
	private dbRun: (sql: string, params?: any[]) => Promise<void>;

	async getRecordsByMonth(
		year: number,
		month: number
	): Promise<RecordsResponse> {
		const formattedMonth = month < 10 ? `0${month}` : `${month}`; // 1자리 월을 2자리로 변환
		const sql = `SELECT * FROM records WHERE strftime('%Y-%m', date) = ?`;
		const rows = await this.dbAll(sql, [`${year}-${formattedMonth}`]);

		return rows.reduce(
			(acc: RecordsResponse, { date, drinkType, amount }: Record) => {
				if (!acc[date]) {
					acc[date] = [];
				}
				acc[date].push({ drinkType, amount });
				return acc;
			},
			{} as RecordsResponse
		);
	}

	async getRecordsByYear(year: number): Promise<RecordsResponse> {
		const sql = `
		SELECT strftime('%m', date) as month, drinkType, SUM(amount) as amount
		FROM records
		WHERE strftime('%Y', date) = ?
		GROUP BY strftime('%m', date), drinkType
		`;
		const rows = await this.dbAll(sql, [`${year}`]);

		return rows.reduce(
			(acc: RecordsResponse, { month, drinkType, amount }) => {
				const monthKey = `${year}-${month}`;
				if (!acc[monthKey]) {
					acc[monthKey] = [];
				}
				acc[monthKey].push({ drinkType, amount });
				return acc;
			},
			{} as RecordsResponse
		);
	}

	async getRecordsByDate(date: string): Promise<Record[]> {
		const sql = "SELECT * FROM records WHERE date = ?";
		const rows = await this.dbAll(sql, [date]);
		return rows as Record[];
	}

	async getRecordByDateAndDrinkType(
		date: string,
		drinkType: string
	): Promise<Record> {
		const sql = "SELECT * FROM records WHERE date = ? AND drinkType = ?";
		const row = await this.dbGet(sql, [date, drinkType]);
		return row as Record;
	}

	async createRecord(record: Record): Promise<void> {
		const sql =
			"INSERT INTO records (date, drinkType, amount) VALUES (?, ?, ?)";
		await this.dbRun(sql, [record.date, record.drinkType, record.amount]);
	}

	async deleteRecordByDateAndDrinkType(
		date: string,
		drinkType: string
	): Promise<void> {
		const sql = "DELETE FROM records WHERE date = ? AND drinkType = ?";
		await this.dbRun(sql, [date, drinkType]);
	}
}
