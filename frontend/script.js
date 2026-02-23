let currentBalance = 0;
let chart;

// 🔥 SET BUDGET
async function setBudget() {
    const budget = document.getElementById("budget").value;

    const response = await fetch("http://localhost:3000/setBudget", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ budget })
    });

    const data = await response.json();

    currentBalance = data.balance;
    document.getElementById("balance").innerText = "₹" + currentBalance;

    // Reset UI
    document.getElementById("list").innerHTML = "";
    document.getElementById("advice").innerText = "";
    updateChart([]);
}

// 🔥 ADD EXPENSE
async function addExpense() {
    const title = document.getElementById("title").value;
    const amount = document.getElementById("amount").value;
    const category = document.getElementById("category").value;

    if (!title || !amount || !category) {
        alert("Please fill all fields");
        return;
    }

    const response = await fetch("http://localhost:3000/add", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ title, amount, category })
    });

    const data = await response.json();

    currentBalance = data.balance;
    document.getElementById("balance").innerText = "₹" + currentBalance;

    displayExpenses(data.expenses);
    document.getElementById("advice").innerText = data.advice;

    updateChart(data.expenses);
}

// 🔥 DISPLAY EXPENSES
function displayExpenses(expenses) {
    const list = document.getElementById("list");
    list.innerHTML = "";

    expenses.forEach(e => {
        const li = document.createElement("li");
        li.innerText = `${e.title} - ₹${e.amount} (${e.category})`;
        list.appendChild(li);
    });
}

// 🔥 CHART FUNCTION
function updateChart(expenses) {
    let categories = {};

    expenses.forEach(e => {
        const cat = e.category.toLowerCase();

        if (!categories[cat]) {
            categories[cat] = 0;
        }

        categories[cat] += e.amount;
    });

    const labels = Object.keys(categories);
    const data = Object.values(categories);

    const ctx = document.getElementById("chart").getContext("2d");

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                data: data
            }]
        }
    });
}