/* ===================================
   Expense & Budget Visualizer
   Vanilla JS — Single File
   =================================== */

// ---- Constants ----
const STORAGE_KEY = 'expenseTransactions';
const THEME_KEY = 'expenseTheme';
const LIMIT_KEY = 'expenseLimit';

const CATEGORY_COLORS = {
    Food: '#4f6ef7',
    Transport: '#f59e0b',
    Fun: '#ec4899'
};

// ---- DOM References ----
const dom = {
    form: document.getElementById('transactionForm'),
    itemName: document.getElementById('itemName'),
    amount: document.getElementById('amount'),
    category: document.getElementById('category'),
    itemNameError: document.getElementById('itemNameError'),
    amountError: document.getElementById('amountError'),
    categoryError: document.getElementById('categoryError'),
    totalAmount: document.getElementById('totalAmount'),
    transactionList: document.getElementById('transactionList'),
    sortSelect: document.getElementById('sortSelect'),
    toast: document.getElementById('toast'),
    chartCanvas: document.getElementById('expenseChart'),
    chartEmpty: document.getElementById('chartEmpty'),
    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.getElementById('themeIcon'),
    // Limit
    limitEditBtn: document.getElementById('limitEditBtn'),
    limitDisplay: document.getElementById('limitDisplay'),
    limitAmountDisplay: document.getElementById('limitAmountDisplay'),
    limitForm: document.getElementById('limitForm'),
    limitInput: document.getElementById('limitInput'),
    limitSaveBtn: document.getElementById('limitSaveBtn'),
    limitCancelBtn: document.getElementById('limitCancelBtn'),
    limitRemoveBtn: document.getElementById('limitRemoveBtn'),
    limitProgressWrap: document.getElementById('limitProgressWrap'),
    limitProgressFill: document.getElementById('limitProgressFill'),
    limitStatus: document.getElementById('limitStatus'),
    limitInputError: document.getElementById('limitInputError')
};

// ---- State ----
let transactions = [];
let spendingLimit = null;
let chart = null;
let toastTimeout = null;

// ---- Utility Functions ----

/** Generate a unique ID */
function generateId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

/** Format number as Rupiah */
function formatRupiah(num) {
    try {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    } catch {
        return 'Rp' + num.toLocaleString('id-ID');
    }
}

/** Check if localStorage is available */
function isLocalStorageAvailable() {
    try {
        const testKey = '__ls_test__';
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
        return true;
    } catch {
        return false;
    }
}

// ---- Data Functions ----

function loadTransactions() {
    if (!isLocalStorageAvailable()) return [];
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed)) return [];
        // Validate each transaction
        return parsed.filter(t =>
            t && typeof t.id === 'string' &&
            typeof t.itemName === 'string' &&
            typeof t.amount === 'number' && t.amount > 0 &&
            typeof t.category === 'string' &&
            typeof t.date === 'string'
        );
    } catch {
        return [];
    }
}

function saveTransactions() {
    if (!isLocalStorageAvailable()) return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch {
        showToast('Failed to save data');
    }
}

function addTransaction(itemName, amount, category) {
    const transaction = {
        id: generateId(),
        itemName: itemName.trim(),
        amount: amount,
        category: category,
        date: new Date().toISOString()
    };
    transactions.push(transaction);
    saveTransactions();
    return transaction;
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
}

function calculateTotal() {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
}

function calculateCategoryTotals() {
    const totals = {};
    transactions.forEach(t => {
        if (!totals[t.category]) {
            totals[t.category] = 0;
        }
        totals[t.category] += t.amount;
    });
    return totals;
}

// ---- Spending Limit ----

function loadLimit() {
    if (!isLocalStorageAvailable()) return null;
    try {
        const val = localStorage.getItem(LIMIT_KEY);
        if (!val) return null;
        const num = Number(val);
        return isFinite(num) && num > 0 ? num : null;
    } catch {
        return null;
    }
}

function saveLimit(val) {
    if (!isLocalStorageAvailable()) return;
    try {
        if (val === null) {
            localStorage.removeItem(LIMIT_KEY);
        } else {
            localStorage.setItem(LIMIT_KEY, String(val));
        }
    } catch {
        showToast('Failed to save limit');
    }
}

function updateLimitUI() {
    const total = calculateTotal();

    if (spendingLimit === null) {
        dom.limitAmountDisplay.textContent = 'No limit set';
        dom.limitProgressWrap.classList.add('hidden');
        return;
    }

    dom.limitAmountDisplay.textContent = formatRupiah(spendingLimit);
    dom.limitProgressWrap.classList.remove('hidden');

    const percent = Math.min((total / spendingLimit) * 100, 100);
    dom.limitProgressFill.style.width = percent + '%';

    // Remove old status classes
    dom.limitProgressFill.classList.remove('warning', 'danger');
    dom.limitStatus.classList.remove('warning', 'danger');

    if (total >= spendingLimit) {
        dom.limitProgressFill.classList.add('danger');
        dom.limitStatus.classList.add('danger');
        dom.limitStatus.textContent = `⚠ Over limit! ${formatRupiah(total)} / ${formatRupiah(spendingLimit)}`;
    } else if (percent >= 80) {
        dom.limitProgressFill.classList.add('warning');
        dom.limitStatus.classList.add('warning');
        dom.limitStatus.textContent = `⚠ Approaching limit: ${formatRupiah(total)} / ${formatRupiah(spendingLimit)}`;
    } else {
        dom.limitStatus.textContent = `${formatRupiah(total)} / ${formatRupiah(spendingLimit)} (${Math.round(percent)}% used)`;
    }
}

// ---- Theme ----

function loadTheme() {
    if (!isLocalStorageAvailable()) return 'light';
    try {
        const saved = localStorage.getItem(THEME_KEY);
        return saved === 'dark' ? 'dark' : 'light';
    } catch {
        return 'light';
    }
}

function saveTheme(theme) {
    if (!isLocalStorageAvailable()) return;
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch {
        // Silently fail
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    dom.themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    // Re-render chart with correct colors if it exists
    if (chart) {
        updateChart();
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);
}

// ---- Toast ----

function showToast(message) {
    if (toastTimeout) clearTimeout(toastTimeout);
    dom.toast.textContent = message;
    dom.toast.classList.remove('hidden');
    toastTimeout = setTimeout(() => {
        dom.toast.classList.add('hidden');
    }, 2500);
}

// ---- Sort ----

function getSortedTransactions() {
    const sorted = [...transactions];
    const sortBy = dom.sortSelect.value;

    switch (sortBy) {
        case 'newest':
            sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'oldest':
            sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'highest':
            sorted.sort((a, b) => b.amount - a.amount);
            break;
        case 'lowest':
            sorted.sort((a, b) => a.amount - b.amount);
            break;
    }

    return sorted;
}

// ---- UI Rendering ----

function updateTotal() {
    dom.totalAmount.textContent = formatRupiah(calculateTotal());
}

function renderTransactions() {
    const sorted = getSortedTransactions();

    if (sorted.length === 0) {
        dom.transactionList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon" aria-hidden="true">📋</div>
                <p class="empty-state-title">No transactions yet</p>
                <p class="empty-state-text">Start tracking your spending by adding your first expense.</p>
            </div>
        `;
        return;
    }

    dom.transactionList.innerHTML = sorted.map(t => {
        const catClass = t.category.toLowerCase();
        return `
            <div class="transaction-item" role="listitem" data-id="${t.id}">
                <div class="transaction-info">
                    <span class="transaction-cat-dot ${catClass}" aria-hidden="true"></span>
                    <div class="transaction-details">
                        <p class="transaction-name">${escapeHtml(t.itemName)}</p>
                        <p class="transaction-category">${escapeHtml(t.category)}</p>
                    </div>
                </div>
                <div class="transaction-right">
                    <span class="transaction-amount">${formatRupiah(t.amount)}</span>
                    <button class="delete-btn" data-id="${t.id}" type="button"
                        aria-label="Delete ${escapeHtml(t.itemName)}">
                        ✕
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/** Prevent XSS in rendered content */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ---- Chart ----

function updateChart() {
    const categoryTotals = calculateCategoryTotals();
    const categories = Object.keys(categoryTotals);

    if (categories.length === 0) {
        dom.chartCanvas.style.display = 'none';
        dom.chartEmpty.classList.remove('hidden');
        if (chart) {
            chart.destroy();
            chart = null;
        }
        return;
    }

    dom.chartCanvas.style.display = 'block';
    dom.chartEmpty.classList.add('hidden');

    const labels = categories;
    const data = categories.map(c => categoryTotals[c]);
    const colors = categories.map(c => CATEGORY_COLORS[c] || '#9ca3af');

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const borderColor = isDark ? '#1a1d28' : '#ffffff';

    if (chart) {
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.data.datasets[0].backgroundColor = colors;
        chart.data.datasets[0].borderColor = borderColor;
        chart.update();
        return;
    }

    chart = new Chart(dom.chartCanvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: borderColor,
                borderWidth: 3,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 16,
                        usePointStyle: true,
                        pointStyleWidth: 10,
                        font: {
                            family: "'Inter', sans-serif",
                            size: 12,
                            weight: 500
                        },
                        color: isDark ? '#9ca3af' : '#6b7280'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return ' ' + context.label + ': ' + formatRupiah(context.raw);
                        }
                    },
                    bodyFont: {
                        family: "'Inter', sans-serif"
                    },
                    padding: 10,
                    cornerRadius: 8
                }
            }
        }
    });
}

// ---- Validation ----

function clearErrors() {
    dom.itemNameError.classList.add('hidden');
    dom.amountError.classList.add('hidden');
    dom.categoryError.classList.add('hidden');
    dom.itemName.classList.remove('input-error');
    dom.amount.classList.remove('input-error');
    dom.category.classList.remove('input-error');
}

function showFieldError(inputEl, errorEl, message) {
    inputEl.classList.add('input-error');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
}

function validateForm() {
    clearErrors();
    let valid = true;

    const name = dom.itemName.value.trim();
    const amountVal = dom.amount.value.trim();
    const cat = dom.category.value;

    if (!name) {
        showFieldError(dom.itemName, dom.itemNameError, 'Item name is required.');
        valid = false;
    }

    if (!amountVal) {
        showFieldError(dom.amount, dom.amountError, 'Amount is required.');
        valid = false;
    } else {
        const num = Number(amountVal);
        if (isNaN(num) || !isFinite(num)) {
            showFieldError(dom.amount, dom.amountError, 'Please enter a valid number.');
            valid = false;
        } else if (num <= 0) {
            showFieldError(dom.amount, dom.amountError, 'Amount must be greater than zero.');
            valid = false;
        }
    }

    if (!cat) {
        showFieldError(dom.category, dom.categoryError, 'Please select a category.');
        valid = false;
    } else if (!['Food', 'Transport', 'Fun'].includes(cat)) {
        showFieldError(dom.category, dom.categoryError, 'Invalid category.');
        valid = false;
    }

    return valid;
}

// ---- Full UI Refresh ----

function refreshUI() {
    updateTotal();
    renderTransactions();
    updateChart();
    updateLimitUI();
}

// ---- Event Handlers ----

function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    const name = dom.itemName.value.trim();
    const amount = Number(dom.amount.value.trim());
    const category = dom.category.value;

    addTransaction(name, amount, category);

    // Reset form
    dom.form.reset();
    clearErrors();

    showToast('Transaction added!');
    refreshUI();
}

function handleDeleteClick(e) {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;

    const id = btn.dataset.id;
    if (!id) return;

    deleteTransaction(id);
    showToast('Transaction deleted');
    refreshUI();
}

function handleSortChange() {
    renderTransactions();
}

// Spending Limit events
function handleLimitEdit() {
    dom.limitDisplay.classList.add('hidden');
    dom.limitForm.classList.remove('hidden');
    dom.limitEditBtn.classList.add('hidden');
    if (spendingLimit !== null) {
        dom.limitInput.value = spendingLimit;
    } else {
        dom.limitInput.value = '';
    }
    dom.limitInput.focus();
}

function handleLimitCancel() {
    dom.limitForm.classList.add('hidden');
    dom.limitDisplay.classList.remove('hidden');
    dom.limitEditBtn.classList.remove('hidden');
    // Clear validation state when closing the form
    dom.limitInput.classList.remove('input-error');
    dom.limitInputError.classList.add('hidden');
}

function handleLimitSave(e) {
    e.preventDefault();
    const val = Number(dom.limitInput.value);
    if (!dom.limitInput.value.trim() || !isFinite(val) || val <= 0) {
        dom.limitInput.classList.add('input-error');
        dom.limitInputError.textContent = val < 0
            ? 'Limit must be a positive amount.'
            : 'Please enter a valid amount greater than zero.';
        dom.limitInputError.classList.remove('hidden');
        dom.limitInput.focus();
        return;
    }
    // Clear any previous error
    dom.limitInput.classList.remove('input-error');
    dom.limitInputError.classList.add('hidden');

    spendingLimit = val;
    saveLimit(spendingLimit);
    handleLimitCancel();
    updateLimitUI();
    showToast('Spending limit saved');
}

function handleLimitRemove() {
    spendingLimit = null;
    saveLimit(null);
    handleLimitCancel();
    updateLimitUI();
    showToast('Spending limit removed');
}

// ---- Initialize ----

function init() {
    // Load theme first to prevent flash
    const savedTheme = loadTheme();
    applyTheme(savedTheme);

    // Load data
    transactions = loadTransactions();
    spendingLimit = loadLimit();

    // Render everything
    refreshUI();

    // Attach event listeners
    dom.form.addEventListener('submit', handleFormSubmit);
    dom.transactionList.addEventListener('click', handleDeleteClick);
    dom.sortSelect.addEventListener('change', handleSortChange);
    dom.themeToggle.addEventListener('click', toggleTheme);

    // Limit events
    dom.limitEditBtn.addEventListener('click', handleLimitEdit);
    dom.limitCancelBtn.addEventListener('click', handleLimitCancel);
    dom.limitForm.addEventListener('submit', handleLimitSave);
    dom.limitRemoveBtn.addEventListener('click', handleLimitRemove);
}

// Start the app
init();
