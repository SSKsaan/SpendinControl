class ExpenseTracker {
  constructor() {
    this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    this.budgets = JSON.parse(localStorage.getItem('budgets')) || [];
    this.editingExpenseId = null;
    this.editingBudgetId = null;
    this.collapsedMonths = new Set();
    this.collapsedComparisons = new Set();
    this.init();
  }

  init() {
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('expenseForm').onsubmit = e => this.handleExpenseSubmit(e);
    document.getElementById('cancelEdit').onclick = () => this.cancelEdit();
    document.getElementById('addBudgetBtn').onclick = () => this.addOrUpdateBudget();
    document.getElementById('exportBtn').onclick = () => this.exportCSV();
    document.getElementById('importFile').onchange = e => this.importCSV(e);
    window.addEventListener('online', () => this.setOnlineStatus());
    window.addEventListener('offline', () => this.setOnlineStatus());
    this.setOnlineStatus();
    this.render();
  }

  setOnlineStatus() {
    const isOnline = navigator.onLine;
    document.getElementById('statusDot').classList.toggle('offline', !isOnline);
    document.getElementById('statusText').textContent = isOnline ? 'Online' : 'Offline';
  }

  handleExpenseSubmit(e) {
    e.preventDefault();
    const name = expenseName.value.trim();
    const amount = parseFloat(expenseAmount.value);
    const category = expenseCategory.value.trim();
    const date = expenseDate.value;
    if (!name || !amount || !date) return alert('Fill all fields');
    const data = { id: this.editingExpenseId || Date.now(), name, amount, category, date, month: date.slice(0, 7) };
    this.expenses = this.editingExpenseId ? this.expenses.map(e => e.id == data.id ? data : e) : [...this.expenses, data];
    this.editingExpenseId = null;
    this.resetForm();
    this.save();
    this.render();
  }

  resetForm() {
    expenseForm.reset();
    expenseDate.value = new Date().toISOString().split('T')[0];
    cancelEdit.classList.add('hidden');
    document.querySelector('.btn-primary').textContent = '💰 Add Expense';
  }

  cancelEdit() {
    this.editingExpenseId = null;
    this.resetForm();
  }

  editExpense(id) {
    const e = this.expenses.find(x => x.id == id);
    if (!e) return;
    expenseName.value = e.name;
    expenseAmount.value = e.amount;
    expenseCategory.value = e.category;
    expenseDate.value = e.date;
    this.editingExpenseId = id;
    cancelEdit.classList.remove('hidden');
    document.querySelector('.btn-primary').textContent = '✏️ Update Expense';
    document.querySelector('.add-expense').scrollIntoView({ behavior: 'smooth' });
  }

  deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;
    this.expenses = this.expenses.filter(x => x.id != id);
    this.save();
    this.render();
  }

  addOrUpdateBudget() {
    const category = budgetCategory.value.trim();
    const amount = parseFloat(budgetAmount.value);
    if (!category || !amount) return alert('Enter valid category and amount');
    const data = { id: this.editingBudgetId || Date.now(), category, amount };
    this.budgets = this.editingBudgetId ? this.budgets.map(b => b.id == data.id ? data : b) : [...this.budgets, data];
    this.editingBudgetId = null;
    budgetCategory.value = '';
    budgetAmount.value = '';
    addBudgetBtn.textContent = 'Add Budget';
    this.save();
    this.render();
  }

  editBudget(id) {
    const b = this.budgets.find(x => x.id == id);
    if (!b) return;
    budgetCategory.value = b.category;
    budgetAmount.value = b.amount;
    this.editingBudgetId = id;
    addBudgetBtn.textContent = 'Update Budget';
    document.querySelector('.budget-section').scrollIntoView({ behavior: 'smooth' });
  }

  deleteBudget(id) {
    if (!confirm('Delete this budget?')) return;
    this.budgets = this.budgets.filter(x => x.id != id);
    this.save();
    this.render();
  }

  toggleBudgetSection() {
    document.querySelector('.budget-section').classList.toggle('collapsed');
  }

  toggleMonth(month) {
    this.collapsedMonths.has(month) ? this.collapsedMonths.delete(month) : this.collapsedMonths.add(month);
    this.render();
  }

  toggleComparison(month) {
    this.collapsedComparisons.has(month) ? this.collapsedComparisons.delete(month) : this.collapsedComparisons.add(month);
    this.render();
  }

  format(amount) {
    return `${parseFloat(amount).toFixed(2)} ৳`;
  }

  save() {
    localStorage.setItem('expenses', JSON.stringify(this.expenses));
    localStorage.setItem('budgets', JSON.stringify(this.budgets));
  }

  exportCSV() {
    const expensesCsv = ['Date,Name,Amount,Category', ...this.expenses.map(e => `${e.date},"${e.name}",${e.amount},"${e.category}"`)].join('\n');
    const budgetsCsv = ['Category,Amount', ...this.budgets.map(b => `"${b.category}",${b.amount}`)].join('\n');
    const csv = `${expensesCsv}\n\n${budgetsCsv}`;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'spendinControl.csv';
    a.click();
  }

  importCSV(e) {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith('.csv')) return alert('Choose a CSV file');
    const reader = new FileReader();
    reader.onload = ev => {
      const sections = ev.target.result.trim().split('\n\n');
      
      const expenseLines = sections[0].split('\n').slice(1);
      const expenses = expenseLines.map(l => l.split(',')).map(([date, name, amount, category]) => ({
        id: Date.now() + Math.random(),
        name: name?.replace(/"/g, '') || '',
        amount: parseFloat(amount) || 0,
        category: category?.replace(/"/g, '') || '',
        date: date || '',
        month: date?.slice(0, 7) || ''
      })).filter(e => e.name && e.date && !isNaN(e.amount));

      let budgets = [];
      if (sections[1]) {
        const budgetLines = sections[1].split('\n').slice(1);
        budgets = budgetLines.map(l => l.split(',')).map(([category, amount]) => ({
          id: Date.now() + Math.random(),
          category: category?.replace(/"/g, '') || '',
          amount: parseFloat(amount) || 0
        })).filter(b => b.category && !isNaN(b.amount));
      }

      if (!expenses.length && !budgets.length) return alert('Invalid data');
      
      if (confirm(`Import ${expenses.length} expenses and ${budgets.length} budgets? This will replace existing data.`)) {
        this.expenses = expenses;
        this.budgets = budgets;
        this.save();
        this.render();
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  render() {
    const container = monthlyExpenses;
    if (!this.expenses.length) return container.innerHTML = '<div class="empty-state">No expenses yet</div>';
    const grouped = {};
    this.expenses.forEach(e => {
      (grouped[e.month] ||= []).push(e);
    });
    const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
    container.innerHTML = months.map(month => {
      const items = grouped[month];
      const total = items.reduce((s, e) => s + parseFloat(e.amount), 0);
      const mName = new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      const show = this.collapsedMonths.has(month);
      const showTable = this.collapsedComparisons.has(month);
      return `
        <div class="month-section ${!show ? 'collapsed' : ''}">
          <div class="month-header" onclick="tracker.toggleMonth('${month}')">
            <div class="month-info">
              <div class="month-title">${mName}</div>
              <div class="month-count">${items.length} ${items.length > 1 ? 'entries' : 'entry'}</div>
            </div>
            <div class="month-total">${this.format(total)}</div>
          </div>
          <div class="month-expenses">
            <div class="budget-comparison">
              <div class="comparison-header" onclick="tracker.toggleComparison('${month}')" style="cursor:pointer"> 
                <h3>📈 Budget Comparison </h3>
                <span class="toggle-icon" style="transform: ${showTable ? 'rotate(0)' : 'rotate(-90deg)'}">▼</span>
              </div>
              <div style="display:${showTable ? 'block' : 'none'}">
                ${this.renderComparison(month)}
              </div>
            </div>
            ${items.map(e => `
              <div class="expense-item">
                <div class="expense-details">
                  <div class="expense-meta">${e.name} <span class="expense-date">| ${new Date(e.date).toLocaleDateString()}</span></div>
                  ${e.category ? `<span class="expense-category">${e.category}</span>` : ''}
                </div>
                <div class="expense-actions">
                  <div class="expense-amount">${this.format(e.amount)}</div>
                  <button class="btn btn-success btn-small" onclick="tracker.editExpense(${e.id})">✏️ Edit </button>
                  <button class="btn btn-danger btn-small" onclick="tracker.deleteExpense(${e.id})">🗑️ Delete </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

    budgetList.innerHTML = this.budgets.length ? this.budgets.map(b => `
      <div class="budget-item-display">
        <div><strong>${b.category}</strong><br>${this.format(b.amount)}</div>
        <div class="expense-actions">
          <button class="btn btn-success btn-small" onclick="tracker.editBudget(${b.id})">✏️ Edit </button>
          <button class="btn btn-danger btn-small" onclick="tracker.deleteBudget(${b.id})">🗑️ Delete </button>
        </div>
      </div>
    `).join('') : '<div class="empty-state">No budgets set</div>';
  }

  renderComparison(month) {
    if (!this.budgets.length) return '<i>No budgets set.</i>';
    const totals = {};
    const budgetCats = this.budgets.map(b => b.category);
    let uncategorizedTotal = 0;
    
    this.expenses.filter(e => e.month === month).forEach(e => {
      const cat = e.category || '';
      if (!cat || !budgetCats.includes(cat)) {
        uncategorizedTotal += parseFloat(e.amount);
      } else {
        totals[cat] = (totals[cat] || 0) + parseFloat(e.amount);
      }
    });

    const rows = this.budgets.map(b => {
      const spent = totals[b.category] || 0;
      const remain = b.amount - spent;
      const cls = spent > b.amount ? 'over-budget' : 'under-budget';
      return `<tr>
        <td class="category">${b.category}</td>
        <td>${this.format(b.amount)}</td>
        <td>${this.format(spent)}</td>
        <td class="${cls}">${this.format(remain)}</td>
      </tr>`;
    }).join('');

    const defaultRow = uncategorizedTotal > 0 ? `<tr>
      <td class="category">Others</td>
      <td>-</td>
      <td>${this.format(uncategorizedTotal)}</td>
      <td class="over-budget">${this.format(-uncategorizedTotal)}</td>
    </tr>` : '';

    return `<table class="budget-table">
      <thead><tr><th class="category">Category</th><th>Budget </th><th>Spent </th><th>Current</th></tr></thead>
      <tbody>${rows}${defaultRow}</tbody>
    </table>`;
  }
}

const tracker = new ExpenseTracker();