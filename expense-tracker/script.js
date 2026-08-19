// Expense Tracker - Enhanced Logic with Dark Mode, Search, Filter, Charts & Export

// DOM Elements
const form = document.getElementById('expenseForm');
const descInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const transactionList = document.getElementById('transactionList');
const totalAmountEl = document.getElementById('totalAmount');
const transactionCountEl = document.getElementById('transactionCount');
const filteredCountEl = document.getElementById('filteredCount');
const searchInput = document.getElementById('searchInput');
const filterCategory = document.getElementById('filterCategory');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const themeText = document.getElementById('themeText');
const exportBtn = document.getElementById('exportBtn');
const toast = document.getElementById('toast');

// State
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let expenseChart = null;
let trendChart = null;

// Category Colors for Charts
const categoryColors = {
    'Food': '#ff7675',
    'Transport': '#74b9ff',
    'Shopping': '#fd79a8',
    'Bills': '#ffeaa7',
    'Entertainment': '#a29bfe',
    'Health': '#55efc4',
    'Other': '#b2bec3'
};

// Initialize App
function init() {
    loadTheme();
    renderTransactions();
    updateSummary();
    initCharts();
    updateCharts();
    setupEventListeners();
}

// Setup Event Listeners
function setupEventListeners() {
    form.addEventListener('submit', handleAddExpense);
    searchInput.addEventListener('input', renderTransactions);
    filterCategory.addEventListener('change', renderTransactions);
    themeToggle.addEventListener('click', toggleTheme);
    exportBtn.addEventListener('click', exportToCSV);
}

// Handle Add Expense
function handleAddExpense(e) {
    e.preventDefault();

    const description = descInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;

    if (description === '' || isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid description and amount', 'error');
        return;
    }

    const transaction = {
        id: generateID(),
        description,
        amount,
        category,
        timestamp: Date.now(),
        date: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    };

    transactions.unshift(transaction);
    saveToLocalStorage();
    
    renderTransactions();
    updateSummary();
    updateCharts();

    form.reset();
    showToast(`Added $${amount.toFixed(2)} for ${description}`, 'success');
}

// Remove Transaction
function removeTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    transactions = transactions.filter(t => t.id !== id);
    saveToLocalStorage();
    renderTransactions();
    updateSummary();
    updateCharts();
    showToast(`Deleted ${transaction.description}`, 'success');
}

// Get Filtered Transactions
function getFilteredTransactions() {
    const search = searchInput.value.toLowerCase();
    const category = filterCategory.value;
    
    return transactions.filter(t => {
        const matchSearch = t.description.toLowerCase().includes(search);
        const matchCategory = category === '' || t.category === category;
        return matchSearch && matchCategory;
    });
}

// Render Transactions List
function renderTransactions() {
    const filtered = getFilteredTransactions();
    transactionList.innerHTML = '';

    // Update filtered count
    filteredCountEl.textContent = `${filtered.length} of ${transactions.length} shown`;

    if (filtered.length === 0) {
        if (transactions.length === 0) {
            transactionList.innerHTML = '<li class="empty-state">No expenses yet. Add one above!</li>';
        } else {
            transactionList.innerHTML = '<li class="empty-state">No transactions match your filter</li>';
        }
        return;
    }

    filtered.forEach(t => {
        const item = document.createElement('li');
        item.className = 'transaction-item';
        item.style.borderLeftColor = categoryColors[t.category] || '#6c5ce7';

        item.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-desc">${t.description}</div>
                <div class="transaction-meta">${t.category} • ${t.date}</div>
            </div>
            <div class="transaction-amount">-$${t.amount.toFixed(2)}</div>
            <button class="btn-delete" onclick="removeTransaction(${t.id})">✕</button>
        `;

        transactionList.appendChild(item);
    });
}

// Update Summary Cards
function updateSummary() {
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    totalAmountEl.textContent = `$${total.toFixed(2)}`;
    transactionCountEl.textContent = transactions.length;
}

// Initialize Charts
function initCharts() {
    const isDark = document.body.classList.contains('dark-mode');
    const chartColors = getChartColors(isDark);

    // Doughnut Chart
    const doughnutCtx = document.getElementById('expenseChart').getContext('2d');
    expenseChart = new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        color: chartColors.text,
                        font: { size: 12, weight: '600' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });

    // Line Chart (Monthly Trend)
    const lineCtx = document.getElementById('trendChart').getContext('2d');
    trendChart = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Monthly Spending',
                data: [],
                borderColor: '#6c5ce7',
                backgroundColor: 'rgba(108, 92, 231, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#6c5ce7',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `$${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: chartColors.grid,
                        drawBorder: false
                    },
                    ticks: {
                        color: chartColors.text,
                        font: { size: 12, weight: '600' }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: chartColors.grid,
                        drawBorder: false
                    },
                    ticks: {
                        color: chartColors.text,
                        font: { size: 12, weight: '600' },
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

// Update Charts
function updateCharts() {
    if (!expenseChart || !trendChart) return;

    // Update Doughnut Chart
    const categoryTotals = {};
    transactions.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const doughnutLabels = Object.keys(categoryTotals);
    const doughnutData = Object.values(categoryTotals);
    const doughnutColors = doughnutLabels.map(label => categoryColors[label] || '#6c5ce7');

    expenseChart.data.labels = doughnutLabels;
    expenseChart.data.datasets[0].data = doughnutData;
    expenseChart.data.datasets[0].backgroundColor = doughnutColors;
    expenseChart.update();

    // Update Line Chart (Monthly Trend)
    const monthlyData = getMonthlyData();
    trendChart.data.labels = monthlyData.map(m => m.name);
    trendChart.data.datasets[0].data = monthlyData.map(m => m.total);
    trendChart.update();
}

// Get Monthly Data (Last 6 Months)
function getMonthlyData() {
    const now = new Date();
    const months = [];
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleString('default', { month: 'short' });
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        months.push({ name: monthName, key: monthKey, total: 0 });
    }
    
    // Aggregate transactions by month
    transactions.forEach(t => {
        const date = new Date(t.timestamp);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const month = months.find(m => m.key === key);
        if (month) {
            month.total += t.amount;
        }
    });
    
    return months;
}

// Get Chart Colors Based on Theme
function getChartColors(isDark) {
    return {
        grid: isDark ? '#2d3748' : '#e0e0e0',
        text: isDark ? '#a0a0b0' : '#636e72'
    };
}

// Update Charts Theme
function updateChartsTheme() {
    if (!expenseChart || !trendChart) return;

    const isDark = document.body.classList.contains('dark-mode');
    const chartColors = getChartColors(isDark);

    // Update Doughnut Chart
    expenseChart.options.plugins.legend.labels.color = chartColors.text;
    expenseChart.update();

    // Update Line Chart
    trendChart.options.scales.x.grid.color = chartColors.grid;
    trendChart.options.scales.x.ticks.color = chartColors.text;
    trendChart.options.scales.y.grid.color = chartColors.grid;
    trendChart.options.scales.y.ticks.color = chartColors.text;
    trendChart.update();
}

// Toggle Theme
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    
    localStorage.setItem('darkMode', isDark);
    
    if (isDark) {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light Mode';
    } else {
        themeIcon.textContent = '';
        themeText.textContent = 'Dark Mode';
    }

    updateChartsTheme();
    showToast(`${isDark ? 'Dark' : 'Light'} mode enabled`, 'success');
}

// Load Theme from LocalStorage
function loadTheme() {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') {
        document.body.classList.add('dark-mode');
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light Mode';
    }
}

// Export to CSV
function exportToCSV() {
    if (transactions.length === 0) {
        showToast('No transactions to export', 'error');
        return;
    }

    const headers = ['Date', 'Description', 'Category', 'Amount'];
    const rows = transactions.map(t => {
        const date = new Date(t.timestamp).toLocaleDateString('en-US');
        const desc = `"${t.description.replace(/"/g, '""')}"`;
        const category = t.category;
        const amount = t.amount.toFixed(2);
        return [date, desc, category, amount];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Exported ${transactions.length} transactions to CSV`, 'success');
}

// Show Toast Notification
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Generate Random ID
function generateID() {
    return Math.floor(Math.random() * 100000000);
}

// Save to LocalStorage
function saveToLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Start the app
init();
