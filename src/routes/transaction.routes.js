const { Router } = require('express');

const transactionController = require('../controllers/transaction.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/summary', transactionController.summarizeTransactions);
router.get('/', transactionController.listTransactions);
router.post('/', transactionController.createTransaction);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
