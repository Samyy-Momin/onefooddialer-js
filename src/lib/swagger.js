// OneFoodDialer - Swagger/OpenAPI Documentation Generator
export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'OneFoodDialer API',
    version: '1.0.0',
    description: 'Comprehensive subscription-based business management system API',
    contact: {
      name: 'OneFoodDialer Support',
      email: 'support@onefooddialer.com',
    },
  },
  servers: [
    {
      url:
        process.env.NODE_ENV === 'production'
          ? 'https://onefooddialer.vercel.app/api'
          : 'http://localhost:3000/api',
      description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: {
            type: 'string',
            enum: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'KITCHEN_MANAGER', 'STAFF', 'CUSTOMER'],
          },
          profile: { $ref: '#/components/schemas/UserProfile' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      UserProfile: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'object' },
        },
      },
      Customer: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          customerCode: { type: 'string' },
          userId: { type: 'string' },
          businessId: { type: 'string' },
          walletBalance: { type: 'number', format: 'float' },
          loyaltyPoints: { type: 'integer' },
          isActive: { type: 'boolean' },
          user: { $ref: '#/components/schemas/User' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Subscription: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          customerId: { type: 'string' },
          planId: { type: 'string' },
          kitchenId: { type: 'string' },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED'],
          },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          autoRenew: { type: 'boolean' },
          customer: { $ref: '#/components/schemas/Customer' },
          plan: { $ref: '#/components/schemas/SubscriptionPlan' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      SubscriptionPlan: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          type: { type: 'string', enum: ['DAILY', 'WEEKLY', 'MONTHLY'] },
          price: { type: 'number', format: 'float' },
          duration: { type: 'integer' },
          isActive: { type: 'boolean' },
          businessId: { type: 'string' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          orderNumber: { type: 'string' },
          customerId: { type: 'string' },
          subscriptionId: { type: 'string' },
          kitchenId: { type: 'string' },
          status: {
            type: 'string',
            enum: [
              'PENDING',
              'CONFIRMED',
              'PREPARING',
              'READY',
              'OUT_FOR_DELIVERY',
              'DELIVERED',
              'CANCELLED',
            ],
          },
          type: { type: 'string', enum: ['SUBSCRIPTION', 'BULK', 'ONE_TIME'] },
          scheduledFor: { type: 'string', format: 'date-time' },
          finalAmount: { type: 'number', format: 'float' },
          customer: { $ref: '#/components/schemas/Customer' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Invoice: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          invoiceNumber: { type: 'string' },
          customerId: { type: 'string' },
          businessId: { type: 'string' },
          totalAmount: { type: 'number', format: 'float' },
          taxAmount: { type: 'number', format: 'float' },
          status: {
            type: 'string',
            enum: ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED'],
          },
          dueDate: { type: 'string', format: 'date' },
          paidAt: { type: 'string', format: 'date-time' },
          paymentMethod: { type: 'string' },
          customer: { $ref: '#/components/schemas/Customer' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      WalletTransaction: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['CREDIT', 'DEBIT'] },
          amount: { type: 'number', format: 'float' },
          description: { type: 'string' },
          reference: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED'] },
          balanceAfter: { type: 'number', format: 'float' },
          customerId: { type: 'string' },
          userId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
          message: { type: 'string' },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              totalPages: { type: 'integer' },
              totalItems: { type: 'integer' },
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    '/customers': {
      get: {
        tags: ['CRM'],
        summary: 'Get all customers',
        description: 'Retrieve a paginated list of customers with filtering options',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Page number',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 10 },
            description: 'Items per page',
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Search by name or email',
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['active', 'inactive'] },
            description: 'Filter by status',
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Customer' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['CRM'],
        summary: 'Create a new customer',
        description: 'Create a new customer account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'firstName', 'lastName', 'businessId'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  phone: { type: 'string' },
                  businessId: { type: 'string' },
                  initialWalletBalance: { type: 'number', default: 0 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Customer created successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/Customer' },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/customers/{id}': {
      get: {
        tags: ['CRM'],
        summary: 'Get customer by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Customer ID',
          },
        ],
        responses: {
          200: {
            description: 'Customer details',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/Customer' },
                      },
                    },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['CRM'],
        summary: 'Update customer',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  phone: { type: 'string' },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { $ref: '#/components/responses/Success' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['CRM'],
        summary: 'Delete customer',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { $ref: '#/components/responses/Success' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },
  responses: {
    Success: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ApiResponse' },
        },
      },
    },
    BadRequest: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
        },
      },
    },
    Unauthorized: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
        },
      },
    },
    Forbidden: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
        },
      },
    },
    NotFound: {
      description: 'Resource not found',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
        },
      },
    },
  },
};

export default swaggerSpec;
