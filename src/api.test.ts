import request from "supertest";
import express from "express";
import recordRouter from "./router";
import { initDB, getDB } from "./database";
import {
	beforeAll,
	describe,
	expect,
	beforeEach,
	afterEach,
	it,
} from "@jest/globals";
import { promisify } from "util";

const insertRecord = async (
	db: any,
	date: string,
	drinkType: string,
	amount: number
) => {
	await db.run(
		`INSERT INTO records(date, drinkType, amount) VALUES(?, ?, ?)`,
		[date, drinkType, amount]
	);
};

describe("Record Router", () => {
	let app: express.Application;
	let db: any;

	beforeAll(async () => {
		await initDB(":memory:");
		db = await getDB();
		db.getAsync = promisify(db.get).bind(db);
	});

	beforeEach((done) => {
		app = express();
		app.use(express.json());
		app.use("/api/records", recordRouter());
		done();
	});

	afterEach(async () => {
		await db.run("DELETE FROM records");
	});

	describe("GET /api/records", () => {
		it("빈 목록 조회", async () => {
			const res = await request(app).get("/api/records/2024/1");
			expect(res.status).toBe(200);
			expect(res.body).toEqual({});
		});

		it("record 달별 조회", async () => {
			await insertRecord(db, "2024-01-01", "soju", 3);

			const res = await request(app).get("/api/records/2024/1");
			expect(res.status).toBe(200);
			expect(res.body).toMatchObject({
				"2024-01-01": [{ drinkType: "soju", amount: 3 }],
			});
		});

		it("record 연별 조회", async () => {
			await insertRecord(db, "2024-01-01", "soju", 3);
			await insertRecord(db, "2024-01-02", "soju", 2);

			const res = await request(app).get("/api/records/2024");
			expect(res.status).toBe(200);
			expect(res.body).toMatchObject({
				"2024-01": [{ drinkType: "soju", amount: 5 }],
			});
		});

		it("년이 숫자가 아닐때 400을 반환", async () => {
			const res = await request(app).get("/api/records/invalid-year");
			expect(res.status).toBe(400);
		});

		it("월이 숫자가 아닐때 400을 반환", async () => {
			const res = await request(app).get(
				"/api/records/2024/invalid-month"
			);
			expect(res.status).toBe(400);
		});
	});

	describe("POST /api/records", () => {
		const testcases = [
			{
				newRecord: {
					date: "2024-01-01",
					drinkType: "soju",
					amount: 3.5,
				},
				expectedStatus: 201,
			},
			{
				newRecord: {
					date: "2024-01-32", // invalid date
					drinkType: "soju",
					amount: 3,
				},
				expectedStatus: 400,
			},
			{
				newRecord: {
					date: "2024-01-01",
					drinkType: "juice", // invalid drinkType
					amount: 2,
				},
				expectedStatus: 400,
			},
			{
				newRecord: {
					date: "invalid-date",
					drinkType: "soju",
					amount: -5, // invalid amount
				},
				expectedStatus: 400,
			},
			{
				newRecord: {
					date: "2024-01-01",
					drinkType: "soju",
					amount: 0, // invalid amount
				},
				expectedStatus: 400,
			},
			{
				newRecord: {
					date: "2024-01-01",
					drinkType: "soju",
					amount: 3.3, // invalid amount
				},
				expectedStatus: 400,
			},
			{
				newRecord: {
					date: "2024-01-01",
					drinkType: "soju",
					amount: 5.5, // invalid amount
				},
				expectedStatus: 400,
			},
		];

		testcases.forEach(({ newRecord, expectedStatus }) => {
			it(`CREATE - ${JSON.stringify(newRecord)} - ${expectedStatus}`, async () => {
				const res = await request(app)
					.post("/api/records")
					.send(newRecord);
				expect(res.status).toBe(expectedStatus);

				if (expectedStatus === 201) {
					const row = await db.getAsync(
						"SELECT * FROM records WHERE date = ?",
						[newRecord.date]
					);
					expect(row).toMatchObject(newRecord);
				}
			});
		});

		it("이미 존재하는 record를 추가할 때 409를 반환", async () => {
			await insertRecord(db, "2024-01-01", "soju", 3);

			const newRecord = {
				date: "2024-01-01",
				drinkType: "soju",
				amount: 4,
			};
			const res = await request(app).post("/api/records").send(newRecord);
			expect(res.status).toBe(409);
		});
	});
	describe("DELETE /api/records/:date", () => {
		it("record 삭제", async () => {
			await insertRecord(db, "2024-01-01", "soju", 3);

			const res = await request(app).delete(
				"/api/records/2024-01-01/soju"
			);
			expect(res.status).toBe(200);

			const row = await db.getAsync(
				"SELECT * FROM records WHERE date = ? AND drinkType = ?",
				["2024-01-01", "soju"]
			);
			expect(row).toBeUndefined();
		});

		it("잘못된 형식의 date일때 400을 반환", async () => {
			const res = await request(app).delete(
				"/api/records/2024.01.01/soju"
			);
			expect(res.status).toBe(400);
		});

		it("잘못된 형식의 drinkType일때 400을 반환", async () => {
			const res = await request(app).delete(
				"/api/records/2024-01-01/juice"
			);
			expect(res.status).toBe(400);
		});

		it("존재하지 않는 record일때 404를 반환", async () => {
			const res = await request(app).delete(
				"/api/records/2024-01-01/soju"
			);
			expect(res.status).toBe(404);
		});
	});
});
