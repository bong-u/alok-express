import { Record, MonthRecord, RecordsByPeriod } from "./interfaces";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default class RecordService {
	async getRecordsByMonth(
		year: number,
		month: number
	): Promise<RecordsByPeriod> {
		const formattedMonth = month < 10 ? `0${month}` : `${month}`; // 1자리 월을 2자리로 변환

		const records = await prisma.record.findMany({
			where: {
				date: {
					startsWith: `${year}-${formattedMonth}`,
				},
			},
		}) as Record[];

		return records.reduce(
			(acc: RecordsByPeriod, { date, drinkType, amount }: Record) => {
				if (!acc[date]) {
					acc[date] = [];
				}
				acc[date].push({ drinkType, amount });
				return acc;
			},
			{} as RecordsByPeriod
		);
	}

	async getRecordsByYear(year: number): Promise<RecordsByPeriod> {
		const records = await prisma.$queryRaw<MonthRecord[]
		>`SELECT strftime('%m', date) as month, drink_type as drinkType, SUM(amount) as amount
			FROM Record
			WHERE strftime('%Y', date) = ${year.toString()}
			GROUP BY strftime('%m', date), drink_type
		` as MonthRecord[];

		return records.reduce(
			(acc: RecordsByPeriod, { month, drinkType, amount }: MonthRecord) => {
				const monthKey = `${year}-${month}`;
				if (!acc[monthKey]) {
					acc[monthKey] = [];
				}
				acc[monthKey].push({ drinkType, amount });
				return acc;
			},
			{} as RecordsByPeriod
		);
	}

	async getRecordsByDate(date: string): Promise<Record[]> {
		return await prisma.record.findMany({
			where: {
				date,
			},
		}) as Record[];
	}

	async getRecordByDateAndDrinkType(
		date: string,
		drinkType: string
	): Promise<Record | null> {
		return await prisma.record.findUnique({
			where: {
				date_drinkType: {
					date,
					drinkType,
				},
			},
		}) as Record | null;
	}

	async createRecord(record: Record): Promise<void> {
		await prisma.record.create({
			data: record,
		});
	}

	async deleteRecordByDateAndDrinkType(
		date: string,
		drinkType: string
	): Promise<void> {
		await prisma.record.delete({
			where: {
				date_drinkType: {
					date,
					drinkType,
				},
			},
		});
	}
}
