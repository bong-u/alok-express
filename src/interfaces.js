"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordSchema = exports.deleteRecordRequestSchema = exports.getRecordsSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const drinkTypeValues = ["soju", "beer"];
exports.getRecordsSchema = joi_1.default.object({
    year: joi_1.default.number().required(),
    month: joi_1.default.number(),
});
exports.deleteRecordRequestSchema = joi_1.default.object({
    date: joi_1.default.string().isoDate().required(),
    drinkType: joi_1.default.string()
        .valid(...drinkTypeValues)
        .required(),
});
exports.recordSchema = joi_1.default.object({
    date: joi_1.default.string().isoDate().required(),
    drinkType: joi_1.default.string()
        .valid(...drinkTypeValues)
        .required(),
    amount: joi_1.default.number()
        .valid(0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5)
        .required(),
});
