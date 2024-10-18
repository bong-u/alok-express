import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function insertRecords() {
    const records = [
        { date: "2024-09-20", drinkType: "soju", amount: 2.5 },
        { date: "2024-09-23", drinkType: "soju", amount: 1.5 },
        { date: "2024-09-26", drinkType: "soju", amount: 2 },
        { date: "2024-09-27", drinkType: "soju", amount: 2.5 },
        { date: "2024-09-28", drinkType: "soju", amount: 1.5 },
        { date: "2024-10-02", drinkType: "soju", amount: 2.5 }, // 소주
        { date: "2024-10-02", drinkType: "beer", amount: 1 }, // 캔맥
        { date: "2024-10-04", drinkType: "soju", amount: 2 },
        { date: "2024-10-05", drinkType: "soju", amount: 1 },
        { date: "2024-10-06", drinkType: "beer", amount: 1 }, // 캔맥
        { date: "2024-10-08", drinkType: "soju", amount: 2 },
        { date: "2024-10-11", drinkType: "soju", amount: 2 },
        { date: "2024-10-12", drinkType: "soju", amount: 3 },
    ];

    for (const record of records) {
        await prisma.record.create({
            data: {
                date: record.date,
                drinkType: record.drinkType,
                amount: record.amount,
            },
        });
    }

    console.log("Records inserted successfully");
}

insertRecords()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });