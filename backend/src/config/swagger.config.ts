import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FlowMart API Documentation',
      version: '1.0.0',
      description: 'Interactive API documentation for FlowMart Multi-Vendor E-Commerce & Escrow Platform.',
      contact: {
        name: 'FlowMart Engineering',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'V1 Base API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT authorization bearer token',
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'User & Staff Authentication' },
      { name: 'Products', description: 'Marketplace Product Catalog' },
      { name: 'Orders', description: 'Cart Checkout & Fulfillment' },
      { name: 'Disputes', description: 'Escrow Dispute Resolution' },
      { name: 'Welfare', description: 'Campaign & Inventory Distribution' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
