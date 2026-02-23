const express = require("express");
const cors = require("cors");

// 🔥 LowDB setup
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");

const adapter = new JSONFile("db.json");
const db = new Low(adapter,{
    expenses:[],
    budget:0,
    balance:0

});

async function initDB() {
    await db.read();
    db.data = db.data || {
        expenses: [],
        budget: 0,
        balance: 0
    };
    await db.write();
}
initDB();

const app = express();

app.use(cors());
app.use(express.json());


// 🔥 AI FUNCTION
function generateAdvice(expenses, remaining, budget) {
    let totalSpent = budget - remaining;

    let food = 0;
    let travel = 0;
    let shopping = 0;

    expenses.forEach(e => {
        const cat = e.category.toLowerCase();

        if (cat.includes("food") || cat.includes("restaurant") || cat.includes("hotel")) {
            food += e.amount;
        } 
        else if (cat.includes("travel") || cat.includes("bus") || cat.includes("uber")) {
            travel += e.amount;
        } 
        else if (cat.includes("clothes") || cat.includes("shopping") || cat.includes("dress")) {
            shopping += e.amount;
        }
    });

    let advice = `💰 Budget: ₹${budget}\n`;
    advice += `💸 Spent: ₹${totalSpent}\n`;
    advice += `💵 Remaining: ₹${remaining}\n\n`;

    // 🔥 Category warnings
    if (food > 1000) {
        advice += "🍔 High food spending! Try reducing outside food.\n";
    }

    if (travel > 800) {
        advice += "🚗 Travel cost is high! Try saving money.\n";
    }

    if (shopping > 1500) {
        advice += "🛍️ Too much spent on shopping! Avoid unnecessary buying.\n";
    }

    // 🔥 Prediction logic
    const daysUsed = expenses.length || 1;
    const avgPerDay = totalSpent / daysUsed;

    if (remaining > 0 && avgPerDay > 0) {
        const predictedDays = Math.floor(remaining / avgPerDay);
        advice += `📉 At this rate, your money will last ${predictedDays} days.\n`;
    }

    // 🔥 Critical warnings
    if (remaining <= budget * 0.2 && remaining > 0) {
        advice += "⚠️ Warning: You are close to running out of money!\n";
    }

    if (remaining <= 0) {
        advice += "💀 Budget exceeded! Control your spending immediately.\n";
    }

    return advice;
}


// 🔥 SET BUDGET
app.post("/setBudget", async (req, res) => {
    await db.read();

    db.data.budget = Number(req.body.budget);
    db.data.balance = db.data.budget;
    db.data.expenses = [];

    await db.write();

    res.json({ balance: db.data.balance });
});


// 🔥 ADD EXPENSE
app.post("/add", async (req, res) => {
    await db.read();

    const { title, amount, category } = req.body;
    const expenseAmount = Number(amount);

    // ❌ Prevent overspending
    if (expenseAmount > db.data.balance) {
        return res.json({
            expenses: db.data.expenses,
            advice: "❌ Not enough balance!",
            balance: db.data.balance
        });
    }

    // ✅ Deduct balance
    db.data.balance -= expenseAmount;

    const expense = { title, amount: expenseAmount, category };
    db.data.expenses.push(expense);

    const advice = generateAdvice(
        db.data.expenses,
        db.data.balance,
        db.data.budget
    );

    await db.write();

    res.json({
        expenses: db.data.expenses,
        advice,
        balance: db.data.balance
    });
});


// 🚀 START SERVER
app.listen(3000, () => {
    console.log("Server running on port 3000 🚀");
})