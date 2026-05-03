const transactionService = require('../services/transaction.service');

async function listTransactions(req, res, next) {
  try {
    const transactions = await transactionService.listTransactions(req.user.familyId);
    res.status(200).json(transactions);
  } catch (error) {
    next(error);
  }
}

async function createTransaction(req, res, next) {
  try {
    const transaction = await transactionService.createTransaction(req.body, req.user);
    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
}

async function deleteTransaction(req, res, next) {
  try {
    await transactionService.deleteTransaction(req.params.id, req.user.familyId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function summarizeTransactions(req, res, next) {
  try {
    const summary = await transactionService.summarizeTransactions(req.user.familyId);
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listTransactions,
  createTransaction,
  deleteTransaction,
  summarizeTransactions
};
