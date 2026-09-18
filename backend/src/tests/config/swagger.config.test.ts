import { swaggerSpec } from '../../config/swagger.config';

describe('Swagger / OpenAPI Configuration', () => {
  it('should generate a valid OpenAPI 3.0 specification object', () => {
    const spec = swaggerSpec as any;
    expect(spec).toBeDefined();
    expect(spec.openapi).toBe('3.0.0');
    expect(spec.info.title).toBe('FlowMart API Documentation');
    expect(spec.paths).toBeDefined();
  });
});
