import { PrismaClient } from "@prisma/client";
import request from "supertest";
import express from "express";
import recordRouter from "./router";
import {
	beforeAll,
	describe,
	expect,
	beforeEach,
	afterEach,
	it,
} from "@jest/globals";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

const prisma = new PrismaClient();

const insertRecord = async (
	date: string,
	drinkType: string,
	amount: number
) => {
	await prisma.record.create({
		data: {
			date,
			drinkType,
			amount,
		},
	});
};

describe("Record Router", () => {
	let app: express.Application;

	beforeAll(async () => {
		await prisma.$connect();
		app = express();
		app.use(express.json());
		app.use("/api/records", recordRouter());

		// 데이터베이스 마이그레이션
		await prisma.$executeRaw`PRAGMA foreign_keys = OFF;`; // 테스트에서는 FK 필요 없으므로 비활성화
	});

	afterEach(async () => {
		// 각 테스트 후 테이블 데이터를 삭제
		await prisma.record.deleteMany();
	});

	afterAll(async () => {
		await prisma.$disconnect(); // 테스트 종료 시 연결 해제
	});

	describe("GET /api/records", () => {
		it("빈 목록 조회", async () => {
			const res = await request(app).get("/api/records/2024/1");
			expect(res.status).toBe(200);
			expect(res.body).toEqual({});
		});

		it("record 달별 조회", async () => {
			await insertRecord("2024-01-01", "soju", 3);

			const res = await request(app).get("/api/records/2024/1");
			expect(res.status).toBe(200);
			expect(res.body).toMatchObject({
				"2024-01-01": [{ drinkType: "soju", amount: 3 }],
			});
		});

		it("record 연별 조회", async () => {
			await insertRecord("2024-01-01", "soju", 3);
			await insertRecord("2024-01-02", "soju", 2);

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
		];

		testcases.forEach(({ newRecord, expectedStatus }) => {
			it(`CREATE - ${JSON.stringify(newRecord)} - ${expectedStatus}`, async () => {
				const res = await request(app)
					.post("/api/records")
					.send(newRecord);
				expect(res.status).toBe(expectedStatus);

				if (expectedStatus === 201) {
					const record = await prisma.record.findUnique({
						where: {
							date_drinkType: {
								date: newRecord.date,
								drinkType: newRecord.drinkType,
							},
						},
					});
					expect(record).toMatchObject(newRecord);
				}
			});
		});

		it("이미 존재하는 record를 추가할 때 409를 반환", async () => {
			await insertRecord("2024-01-01", "soju", 3);

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
			await insertRecord("2024-01-01", "soju", 3);

			const res = await request(app).delete(
				"/api/records/2024-01-01/soju"
			);
			expect(res.status).toBe(200);

			const record = await prisma.record.findUnique({
				where: {
					date_drinkType: {
						date: "2024-01-01",
						drinkType: "soju",
					},
				},
			});
			expect(record).toBeNull();
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
