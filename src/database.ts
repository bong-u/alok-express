import sqlite3 from "sqlite3";

let db: sqlite3.Database;

export const initDB = async (databasePath: string): Promise<void> => {
	db = new sqlite3.Database(databasePath, (err) => {
		if (err) {
			console.error("Error opening database", err);
		} else {
			console.log("Database opened");
		}
	});

	await db.run(
		`CREATE TABLE IF NOT EXISTS records (
			date TEXT,
			drinkType TEXT,
			amount REAL CHECK(amount >= 0),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (date, drinkType)
		)`
	);
	// await db.run(`
	// 	INSERT INTO records (date, drinkType, amount) VALUES
	// 	('2024-09-20', 'soju', 2.5),
	// 	('2024-09-20', 'beer', 1),
	// 	('2024-09-23', 'soju', 1.5),
	// 	('2024-09-26', 'soju', 2),
	// 	('2024-09-27', 'soju', 2.5),
	// 	('2024-09-28', 'soju', 1.5),
	// 	('2024-10-02', 'soju', 2.5),
	// 	('2024-10-02', 'beer', 1),
	// 	('2024-10-04', 'soju', 2),
	// 	('2024-10-05', 'soju', 1),
	// 	('2024-10-06', 'beer', 1),
	// 	('2024-10-08', 'soju', 2),
	// 	('2024-10-11', 'soju', 2),
	// 	('2024-10-12', 'soju', 3);
	// `);
};

export const getDB = (): sqlite3.Database => {
	if (!db) {
		throw new Error("Database not initialized. Call initDB first.");
	}
	return db;
};
