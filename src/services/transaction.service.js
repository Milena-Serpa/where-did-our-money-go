const mongoose = require('mongoose');

const { CATEGORIES } = require('../constants/categories');
const Transaction = require('../models/transaction.model');

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function serializeTransaction(transaction) {
  return {
    id: transaction.id,
    title: transaction.title,
    amount: transaction.amount,
    category: transaction.category,
    date: transaction.date,
    userId: transaction.userId.toString(),
    familyId: transaction.familyId
  };
}

function validateTransactionPayload(payload) {
  const { title, amount, category, date } = payload;

  if (!title || !String(title).trim()) {
    throw createHttpError('title is required', 400);
  }

  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
    throw createHttpError('amount is required and must be a number', 400);
  }

  if (Number(amount) <= 0) {
    throw createHttpError('amount must be greater than zero', 400);
  }

  if (!category) {
    throw createHttpError('category is required', 400);
  }

  if (!CATEGORIES.includes(category)) {
    throw createHttpError(`category must be one of: ${CATEGORIES.join(', ')}`, 400);
  }

  if (date && Number.isNaN(Date.parse(date))) {
    throw createHttpError('date must be a valid date', 400);
  }
}

async function listTransactions(familyId) {
  const transactions = await Transaction.find({ familyId })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  return transactions.map((transaction) => ({
    id: transaction._id.toString(),
    title: transaction.title,
    amount: transaction.amount,
    category: transaction.category,
    date: transaction.date,
    userId: transaction.userId.toString(),
    familyId: transaction.familyId
  }));
}

async function createTransaction(payload, user) {
  validateTransactionPayload(payload);

  const transaction = await Transaction.create({
    title: payload.title,
    amount: Number(payload.amount),
    category: payload.category,
    date: payload.date || undefined,
    userId: user.id,
    familyId: user.familyId
  });

  return serializeTransaction(transaction);
}

async function deleteTransaction(id, familyId) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError('transaction not found', 404);
  }

  const transaction = await Transaction.findOneAndDelete({
    _id: id,
    familyId
  });

  if (!transaction) {
    throw createHttpError('transaction not found', 404);
  }
}

async function summarizeTransactions(familyId) {
  const totals = await Transaction.aggregate([
    {
      $match: {
        familyId
      }
    },
    {
      $group: {
        _id: '$category',
        total: {
          $sum: '$amount'
        }
      }
    },
    {
      $sort: {
        _id: 1
      }
    }
  ]);

  return totals.reduce((summary, item) => {
    summary[item._id] = item.total;
    return summary;
  }, {});
}

module.exports = {
  listTransactions,
  createTransaction,
  deleteTransaction,
  summarizeTransactions
};
