const path = require('path');
const YAML = require('yamljs');

describe('Swagger Documentation', () => {
  let swaggerDocument;

  beforeAll(() => {
    const swaggerPath = path.join(__dirname, '../../src/docs/swagger.yaml');
    swaggerDocument = YAML.load(swaggerPath);
  });

  it('should load swagger.yaml successfully and contain expected structure', () => {
    expect(swaggerDocument).toBeDefined();
    expect(swaggerDocument.openapi).toBe('3.0.3');
    expect(swaggerDocument.info.title).toBe('Where Did Our Money Go API');
    
    // Check paths
    const paths = swaggerDocument.paths;
    expect(paths['/health']).toBeDefined();
    expect(paths['/auth/register']).toBeDefined();
    expect(paths['/auth/login']).toBeDefined();
    expect(paths['/transactions']).toBeDefined();
    expect(paths['/transactions/summary']).toBeDefined();
    expect(paths['/transactions/{id}']).toBeDefined();
    
    // Check schemas
    const schemas = swaggerDocument.components.schemas;
    expect(schemas.AuthUser).toBeDefined();
    expect(schemas.Transaction).toBeDefined();
    expect(schemas.RegisterRequest).toBeDefined();
    expect(schemas.LoginRequest).toBeDefined();
    expect(schemas.TransactionSummary).toBeDefined();
  });

  it('should have correct security definitions', () => {
    expect(swaggerDocument.components.securitySchemes.bearerAuth).toBeDefined();
    expect(swaggerDocument.components.securitySchemes.bearerAuth.type).toBe('http');
    expect(swaggerDocument.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
  });
});
