import Joi from "joi";

const drinkTypeValues = ["soju", "beer"] as const;
export type DrinkType = (typeof drinkTypeValues)[number];

export interface DrinkRecord {
	drinkType: DrinkType;
	amount: number;
}

export interface Record extends DrinkRecord {
	date: string;
}

export interface MonthRecord extends DrinkRecord {
	month: string;
}

export interface RecordsByPeriod {
	[period: string]: DrinkRecord[];
}

export const getRecordsSchema = Joi.object({
	year: Joi.number().required(),
	month: Joi.number(),
});

export const deleteRecordRequestSchema = Joi.object({
	date: Joi.string().isoDate().required(),
	drinkType: Joi.string()
		.valid(...drinkTypeValues)
		.required(),
});

export const recordSchema = Joi.object({
	date: Joi.string().isoDate().required(),
	drinkType: Joi.string()
		.valid(...drinkTypeValues)
		.required(),
	amount: Joi.number()
		.valid(0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5)
		.required(),
});
