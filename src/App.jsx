import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import { useSnackbar } from 'notistack';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FaTrash, FaEdit } from 'react-icons/fa';
import { IoMdPizza, IoMdGift  } from 'react-icons/io';
import { CiRollingSuitcase } from "react-icons/ci";

const STORAGE_KEYS = { // local storage
  WALLET: 'wallet_balance',
  EXPENSES: 'expenses_list'
};

const DEFAULT_WALLET = 5000;

const EXPENSE_CATEGORIES = {
  FOOD: 'Food',
  ENTERTAINMENT: 'Entertainment',
  TRAVEL: 'Travel'
};

const COLORS = ['#FF9304', '#A000FF', '#FDE006'];

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
  const [page, setPage] = useState(1);

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WALLET, walletBalance);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [walletBalance, expenses]);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const expensesByCategory = expenses.reduce((acc, exp) => {
    if (!acc[exp.category]) acc[exp.category] = { amount: 0, count: 0 };
    acc[exp.category].amount += exp.amount;
    acc[exp.category].count++;
    return acc;
  }, {});

  const pieChartData = Object.entries(expensesByCategory).map(([name, info]) => ({
    name,
    value: info.amount
  }));

  const barChartData = Object.entries(expensesByCategory).map(([name, info]) => ({
    name,
    count: info.count,
    amount: info.amount
  }));

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

  const handlePageButton = (bool) => {
    setPage(!!bool ? Math.min(Math.ceil(expenses.length/3), page + 1) : Math.max(1, page - 1));
  };

  return (
    <div className="App">

      <div className="main-container-wrapper">
        <h1>Expense Tracker</h1>
        <div className="main-container radius-15">
          <div className="status-card income">
            <span>
              Wallet Balance: <b className="value">₹{walletBalance}</b>
            </span>
            <button onClick={() => setShowAddIncome(true)}>+ Add Income</button>
          </div>

          <div className="status-card expense">
            <span>
              Expenses: <b className="value">₹{totalExpenses}</b>
            </span>
            <button onClick={() => setShowAddExpense(true)}>+ Add Expense</button>
          </div>

          <div className="pie-chart">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value) => `₹${value}`} />
                </PieChart>
              </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="secondary-container-parent">

        <div className="secondary-container-wrapper">
          <h2>Recent Transactions</h2>
          <div className="secondary-container">
            <div>
            {expenses.slice((page - 1)*3, page * 3).map(expense => (
              <div key={expense.id} className="transaction">
                <div className="type-icon">
                  <TypeIcon category={expense.category} />
                </div>
                <div className="name">
                  <div>{expense.title}</div>
                  <div className="subtitle">{new Date(expense.date).toLocaleDateString()}</div>
                </div>
                <div className="amount">
                  ₹{expense.amount}
                  <div className="action-buttons">
                    <button className="remove" onClick={() => handleDeleteExpense(expense.id)}>
                      <FaTrash />
                    </button>
                    <button className="edit" onClick={() => setEditingExpense(expense)}>
                      <FaEdit />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
            <nav>
              <button>←</button>
              <span className="page">{page}</span>
              <button>→</button>
            </nav>
          </div>
        </div>

        <div className="secondary-container-wrapper">
          <h2>Top Expenses</h2>
          <div className="secondary-container">
            <ResponsiveContainer width="100%" height="100%" >
                <BarChart data={barChartData} layout='vertical'>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false}  />
                  <XAxis type="number" tick={{ fill: 'black' }} />
                  <YAxis 
                    dataKey="name"
                    type="category"
                    tick={{ fill: 'black', fontSize: '9px', fontWeight: '500' }}
                    name="category"
                    width={70}
                  />
                  <Tooltip 
                    formatter={(value) => {
                      return `${value} transactions`;
                    }}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                    labelStyle={{ color: 'black' }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    fill="#F4BB4A" 
                    name="Number of Transactions" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
          </div>
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

function TypeIcon({ category }) {
  switch (category) {
    case EXPENSE_CATEGORIES.FOOD:
      return (
        <IoMdPizza />
      );
    case EXPENSE_CATEGORIES.ENTERTAINMENT:
      return (
        <IoMdGift />
      );
    case EXPENSE_CATEGORIES.TRAVEL:
      return (
        <CiRollingSuitcase />
      )
  }
};

function ExpenseForm({ expense, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(expense || {
    title: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });
  const dialogRef = useRef(null);
  const { enqueueSnackbar } = useSnackbar();


  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.category?.length && Object.values(EXPENSE_CATEGORIES).includes(formData.category)) {
      onSubmit({
        ...formData,
        amount: Number(formData.amount)
      });
    } else {
      enqueueSnackbar('Please enter a category.', { variant: 'warning' });
    }
  };

  const handleCancel = () => {
    dialogRef.current?.close();
    onCancel();
  }

  return (
    <dialog ref={dialogRef} className="modal radius-15 expense" onCancel={handleCancel}>
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
          {
            Object.values(EXPENSE_CATEGORIES).map((val, key) =>
              <option value={val} key={key}>{val}</option>
            )
          }
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
        <button type="button" className="field cancel radius-15" onClick={handleCancel}>
          Cancel
        </button>
      </form>
    </dialog>
  );
}

function IncomeForm({ onSubmit, onCancel }) {
  const [amount, setAmount] = useState('');
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(Number(amount));
  };

  const handleCancel = () => {
    dialogRef.current?.close();
    onCancel();
  };

  return (
    <dialog ref={dialogRef} className="modal radius-15 income" onCancel={handleCancel}>
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
        <button type="button" className="field cancel radius-15" onClick={handleCancel}>
          Cancel
        </button>
      </form>
    </dialog>
  );
}

export default App;
