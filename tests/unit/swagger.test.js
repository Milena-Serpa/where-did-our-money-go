const path = require('path');
const YAML = require('yamljs');
const { test, describe } = require('node:test');
const assert = require('node:assert');

describe('Swagger Documentation', () => {
  test('should load swagger.yaml successfully and contain expected structure', () => {
    const swaggerPath = path.join(__dirname, '../../src/docs/swagger.yaml');
    const swaggerDocument = YAML.load(swaggerPath);
    
    assert.ok(swaggerDocument, 'Swagger document should be loaded');
    assert.strictEqual(swaggerDocument.openapi, '3.0.3');
    assert.strictEqual(swaggerDocument.info.title, 'Where Did Our Money Go API');
    
    // Check paths
    const paths = swaggerDocument.paths;
    assert.ok(paths['/health'], 'Health path missing');
    assert.ok(paths['/auth/register'], 'Register path missing');
    assert.ok(paths['/auth/login'], 'Login path missing');
    assert.ok(paths['/transactions'], 'Transactions path missing');
    assert.ok(paths['/transactions/summary'], 'Summary path missing');
    assert.ok(paths['/transactions/{id}'], 'Transaction detail path missing');
    
    // Check schemas
    const schemas = swaggerDocument.components.schemas;
    assert.ok(schemas.User, 'User schema missing');
    assert.ok(schemas.Transaction, 'Transaction schema missing');
    assert.ok(schemas.RegisterRequest, 'RegisterRequest schema missing');
    assert.ok(schemas.LoginRequest, 'LoginRequest schema missing');
    assert.ok(schemas.TransactionSummary, 'TransactionSummary schema missing');
    assert.ok(schemas.ErrorResponse, 'ErrorResponse schema missing');
  });

  test('should have correct security definitions', () => {
    const swaggerPath = path.join(__dirname, '../../src/docs/swagger.yaml');
    const swaggerDocument = YAML.load(swaggerPath);
    
    assert.ok(swaggerDocument.components.securitySchemes.bearerAuth, 'BearerAuth security scheme missing');
    assert.strictEqual(swaggerDocument.components.securitySchemes.bearerAuth.type, 'http');
    assert.strictEqual(swaggerDocument.components.securitySchemes.bearerAuth.scheme, 'bearer');
  });
});
