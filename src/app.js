const path = require('path');
const cors = require('cors');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const authRoutes = require('./routes/auth.routes');
const healthRoutes = require('./routes/health.routes');
const transactionRoutes = require('./routes/transaction.routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'swagger.yaml'));

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/transactions', transactionRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
