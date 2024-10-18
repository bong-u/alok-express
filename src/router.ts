import { Router, Request, Response } from "express";
import {
	recordSchema,
	getRecordsSchema,
	deleteRecordRequestSchema,
} from "./interfaces";
import RecordService from "./service";

const recordRouter = () => {
	const router = Router();
	const recordService = new RecordService();

	router.get("/:year/:month", async (req: Request, res: Response) => {
		const { year, month } = req.params;

		const { error } = getRecordsSchema.validate({ year, month });
		if (error) {
			res.status(400).send(error.details[0].message);
			return;
		}

		const records = await recordService.getRecordsByMonth(
			Number(year),
			Number(month)
		);

		res.json(records);
	});

	router.get("/:year", async (req: Request, res: Response) => {
		const { year } = req.params;

		const { error } = getRecordsSchema.validate({ year });
		if (error) {
			res.status(400).send(error.details[0].message);
			return;
		}

		const records = await recordService.getRecordsByYear(Number(year));
		res.json(records);
	});

	router.post("/", async (req: Request, res: Response) => {
		const { error } = recordSchema.validate(req.body);

		if (error) {
			res.status(400).send(error.details[0].message);
			return;
		}

		// Date와 DrinkType이 같은 기록이 이미 존재하는지 확인
		const existing_record = await recordService.getRecordsByDate(
			req.body.date
		);

		const duplicate = existing_record.find(
			(record) =>
				record.drinkType === req.body.drinkType &&
				record.date === req.body.date
		);

		if (duplicate) {
			res.status(409).send("Record already exists");
			return;
		}

		const { date, drinkType, amount } = req.body;
		try {
			await recordService.createRecord({ date, drinkType, amount });
			res.status(201).send("Record created successfully");
		} catch (err: any) {
			res.status(500).send(err.message);
		}
	});

	router.delete("/:date/:drinkType", async (req: Request, res: Response) => {
		const { date, drinkType } = req.params;

		const { error } = deleteRecordRequestSchema.validate({
			date,
			drinkType,
		});

		if (error) {
			res.status(400).send(error.details[0].message);
			return;
		}

		// date와 drinkType 해당하는 기록이 존재하는지 확인
		const record = await recordService.getRecordByDateAndDrinkType(
			date,
			drinkType
		);

		if (!record) {
			res.status(404).send("Record not found");
			return;
		}

		try {
			recordService.deleteRecordByDateAndDrinkType(date, drinkType);
			res.status(200).send("Record deleted successfully");
		} catch (err: any) {
			res.status(500).send(err.message);
		}
	});
	return router;
};

export default recordRouter;
