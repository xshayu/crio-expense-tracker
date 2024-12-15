import './App.css';
import React, { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { FaTrash, FaEdit } from 'react-icons/fa';
import { IoMdAdd } from 'react-icons/io';

const STORAGE_KEYS = { // local storage
  WALLET: 'wallet_balance',
  EXPENSES: 'expenses_list'
};

const DEFAULT_WALLET = 5000;

function App() {
  const [walletBalance, setWalletBalance] = useState(() => {
    return Number(localStorage.getItem(STORAGE_KEYS.WALLET)) || DEFAULT_WALLET;
  });

  const [expenses, setExpenses] = useState(() => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES)) || [];
  });

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WALLET, walletBalance);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [walletBalance, expenses]);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const handleAddExpense = (expenseData) => {
    if (expenseData.amount > walletBalance) {
      enqueueSnackbar('Insufficient wallet balance!', { variant: 'error' });
      return;
    }

    setExpenses(prev => [...prev, { ...expenseData, id: Date.now() }]);
    setWalletBalance(prev => prev - expenseData.amount);
    setShowAddExpense(false);
    enqueueSnackbar('Expense added successfully!', { variant: 'success' });
  };

  const handleAddIncome = (amount) => {
    setWalletBalance(prev => prev + Number(amount));
    setShowAddIncome(false);
    enqueueSnackbar('Income added successfully!', { variant: 'success' });
  };

  const handleEditExpense = (id, updatedData) => {
    const oldExpense = expenses.find(exp => exp.id === id);
    const balanceDiff = oldExpense.amount - updatedData.amount;

    if (balanceDiff < 0 && Math.abs(balanceDiff) > walletBalance) {
      enqueueSnackbar('Insufficient wallet balance!', { variant: 'error' });
      return;
    }

    setExpenses(prev => prev.map(exp =>
      exp.id === id ? { ...exp, ...updatedData } : exp
    ));
    setWalletBalance(prev => prev + balanceDiff);
    setEditingExpense(null);
    enqueueSnackbar('Expense updated successfully!', { variant: 'success' });
  };

  const handleDeleteExpense = (id) => {
    const expense = expenses.find(exp => exp.id === id);
    setExpenses(prev => prev.filter(exp => exp.id !== id));
    setWalletBalance(prev => prev + expense.amount);
    enqueueSnackbar('Expense deleted successfully!', { variant: 'success' });
  };

  return (
    <div className="App">
      <h1>Expense Tracker</h1>

      <div className="main-container radius-15">
        <div className="status-card income">
          <span>Wallet Balance:</span>
          <span className="value">₹{walletBalance}</span>
          <button onClick={() => setShowAddIncome(true)}>+ Add Income</button>
        </div>

        <div className="status-card expense">
          <span>Expenses:</span>
          <span className="value">₹{totalExpenses}</span>
          <button onClick={() => setShowAddExpense(true)}>+ Add Expense</button>
        </div>

        <div className="pie-chart">
          {/* pie chart */}
        </div>
      </div>

      <div className="secondary-container-parent">
        <div className="secondary-container">
          <h2>Recent Transactions</h2>
          {expenses.map(expense => (
            <div key={expense.id} className="transaction">
              <div className="type-icon">
                {/* category icon */}
              </div>
              <div>
                <div>{expense.title}</div>
                <div className="subtitle">{new Date(expense.date).toLocaleDateString()}</div>
              </div>
              <div className="amount">
                ₹{expense.amount}
                <div className="action-buttons">
                  <button className="edit" onClick={() => setEditingExpense(expense)}>
                    <FaEdit />
                  </button>
                  <button className="remove" onClick={() => handleDeleteExpense(expense.id)}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="secondary-container">
          <h2>Top Expenses</h2>
          {/* bar chart */}
        </div>
      </div>

      {showAddExpense && (
        <ExpenseForm
          onSubmit={handleAddExpense}
          onCancel={() => setShowAddExpense(false)}
        />
      )}

      {editingExpense && (
        <ExpenseForm
          expense={editingExpense}
          onSubmit={(data) => handleEditExpense(editingExpense.id, data)}
          onCancel={() => setEditingExpense(null)}
        />
      )}

      {showAddIncome && (
        <IncomeForm
          onSubmit={handleAddIncome}
          onCancel={() => setShowAddIncome(false)}
        />
      )}
    </div>
  );
}

function ExpenseForm({ expense, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(expense || {
    title: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: Number(formData.amount)
    });
  };

  return (
    <dialog open className="modal radius-15">
      <h1>{expense ? 'Edit' : 'Add'} Expense</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          className="field radius-15"
          value={formData.title}
          onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />
        <input
          type="number"
          placeholder="Price"
          className="field radius-15"
          value={formData.amount}
          onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
          required
        />
        <select
          className="field radius-15"
          value={formData.category}
          onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
          required
        >
          <option value="">Select Category</option>
          <option value="Food">Food</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Travel">Travel</option>
        </select>
        <input
          type="date"
          className="field radius-15"
          value={formData.date}
          onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
          required
        />
        <button type="submit" className="field submit radius-15">
          {expense ? 'Update' : 'Add'} Expense
        </button>
        <button type="button" className="field cancel radius-15" onClick={onCancel}>
          Cancel
        </button>
      </form>
    </dialog>
  );
}

function IncomeForm({ onSubmit, onCancel }) {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(Number(amount));
  };

  return (
    <dialog open className="modal radius-15">
      <h1>Add Balance</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          placeholder="Income Amount"
          className="field radius-15"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
        />
        <button type="submit" className="field submit radius-15">
          Add Balance
        </button>
        <button type="button" className="field cancel radius-15" onClick={onCancel}>
          Cancel
        </button>
      </form>
    </dialog>
  );
}

export default App;
