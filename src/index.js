"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const router_1 = __importDefault(require("./router"));
const database_1 = require("./database");
const app = (0, express_1.default)();
(0, database_1.initDB)('db.sqlite3');
app.use((0, cors_1.default)({
    origin: "http://193.122.103.176:8081",
}));
app.use(express_1.default.json());
app.use("/api/records", (0, router_1.default)());
app.listen(3001, () => {
    console.log("서버가 http://localhost:3001에서 실행 중입니다.");
});
