import express from "express";
import cors from "cors";
import recordRouter from "./router";
import { initDB } from "./database";

const app = express();

initDB('db.sqlite3');

app.use(
	cors({
		origin: "http://193.122.103.176:8081",
	})
);
app.use(express.json());
app.use("/api/records", recordRouter());

app.listen(3001, () => {
	console.log("서버가 http://localhost:3001에서 실행 중입니다.");
});
