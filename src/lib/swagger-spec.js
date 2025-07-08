// OneFoodDialer - Complete OpenAPI Swagger Specification
export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "OneFoodDialer API",
    version: "1.0.0",
    description:
      "Comprehensive subscription-based business management system for food delivery services",
    contact: {
      name: "OneFoodDialer Support",
      email: "support@onefooddialer.com",
      url: "https://onefooddialer.com",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url:
        process.env.NODE_ENV === "production"
          ? "https://onefooddialer.vercel.app/api"
          : "http://localhost:3000/api",
      description:
        process.env.NODE_ENV === "production"
          ? "Production Server"
          : "Development Server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token obtained from Supabase authentication",
      },
    },
    schemas: {
      // User & Authentication Schemas
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          role: {
            type: "string",
            enum: [
              "SUPER_ADMIN",
              "BUSINESS_OWNER",
              "KITCHEN_MANAGER",
              "STAFF",
              "CUSTOMER",
            ],
          },
          profile: { $ref: "#/components/schemas/UserProfile" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      UserProfile: {
        type: "object",
        properties: {
          firstName: { type: "string", maxLength: 50 },
          lastName: { type: "string", maxLength: 50 },
          phone: { type: "string", pattern: "^\\+?[1-9]\\d{1,14}$" },
          address: {
            type: "object",
            properties: {
              street: { type: "string" },
              city: { type: "string" },
              state: { type: "string" },
              zipCode: { type: "string" },
              country: { type: "string", default: "India" },
            },
          },
        },
      },

      // Customer Management Schemas
      Customer: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          customerCode: { type: "string", pattern: "^CUST[0-9]{6}$" },
          userId: { type: "string", format: "uuid" },
          businessId: { type: "string", format: "uuid" },
          walletBalance: { type: "number", format: "float", minimum: 0 },
          loyaltyPoints: { type: "integer", minimum: 0 },
          isActive: { type: "boolean", default: true },
          user: { $ref: "#/components/schemas/User" },
          subscriptions: {
            type: "array",
            items: { $ref: "#/components/schemas/Subscription" },
          },
          orders: {
            type: "array",
            items: { $ref: "#/components/schemas/Order" },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },

      // Subscription Management Schemas
      Subscription: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          customerId: { type: "string", format: "uuid" },
          planId: { type: "string", format: "uuid" },
          kitchenId: { type: "string", format: "uuid" },
          status: {
            type: "string",
            enum: ["ACTIVE", "PAUSED", "CANCELLED", "EXPIRED"],
            default: "ACTIVE",
          },
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
          autoRenew: { type: "boolean", default: true },
          customer: { $ref: "#/components/schemas/Customer" },
          plan: { $ref: "#/components/schemas/SubscriptionPlan" },
          kitchen: { $ref: "#/components/schemas/Kitchen" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      SubscriptionPlan: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", maxLength: 100 },
          description: { type: "string", maxLength: 500 },
          type: {
            type: "string",
            enum: ["DAILY", "WEEKLY", "MONTHLY"],
            default: "MONTHLY",
          },
          price: { type: "number", format: "float", minimum: 0 },
          duration: {
            type: "integer",
            minimum: 1,
            description: "Duration in days",
          },
          isActive: { type: "boolean", default: true },
          businessId: { type: "string", format: "uuid" },
          features: {
            type: "array",
            items: { type: "string" },
            description: "List of plan features",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },

      // Order Management Schemas
      Order: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          orderNumber: { type: "string", pattern: "^ORD[0-9]{8}$" },
          customerId: { type: "string", format: "uuid" },
          subscriptionId: { type: "string", format: "uuid", nullable: true },
          kitchenId: { type: "string", format: "uuid" },
          status: {
            type: "string",
            enum: [
              "PENDING",
              "CONFIRMED",
              "PREPARING",
              "READY",
              "OUT_FOR_DELIVERY",
              "DELIVERED",
              "CANCELLED",
            ],
            default: "PENDING",
          },
          type: {
            type: "string",
            enum: ["SUBSCRIPTION", "BULK", "ONE_TIME"],
            default: "ONE_TIME",
          },
          scheduledFor: { type: "string", format: "date-time" },
          deliveredAt: { type: "string", format: "date-time", nullable: true },
          finalAmount: { type: "number", format: "float", minimum: 0 },
          taxAmount: { type: "number", format: "float", minimum: 0 },
          discountAmount: { type: "number", format: "float", minimum: 0 },
          customer: { $ref: "#/components/schemas/Customer" },
          kitchen: { $ref: "#/components/schemas/Kitchen" },
          orderItems: {
            type: "array",
            items: { $ref: "#/components/schemas/OrderItem" },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      OrderItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          orderId: { type: "string", format: "uuid" },
          menuItemId: { type: "string", format: "uuid" },
          quantity: { type: "integer", minimum: 1 },
          unitPrice: { type: "number", format: "float", minimum: 0 },
          totalPrice: { type: "number", format: "float", minimum: 0 },
          specialInstructions: { type: "string", maxLength: 200 },
          menuItem: { $ref: "#/components/schemas/MenuItem" },
        },
      },

      // Kitchen Management Schemas
      Kitchen: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", maxLength: 100 },
          description: { type: "string", maxLength: 500 },
          address: { $ref: "#/components/schemas/Address" },
          phone: { type: "string", pattern: "^\\+?[1-9]\\d{1,14}$" },
          email: { type: "string", format: "email" },
          capacity: { type: "integer", minimum: 1 },
          isActive: { type: "boolean", default: true },
          businessId: { type: "string", format: "uuid" },
          operatingHours: {
            type: "object",
            properties: {
              monday: { $ref: "#/components/schemas/DaySchedule" },
              tuesday: { $ref: "#/components/schemas/DaySchedule" },
              wednesday: { $ref: "#/components/schemas/DaySchedule" },
              thursday: { $ref: "#/components/schemas/DaySchedule" },
              friday: { $ref: "#/components/schemas/DaySchedule" },
              saturday: { $ref: "#/components/schemas/DaySchedule" },
              sunday: { $ref: "#/components/schemas/DaySchedule" },
            },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      DaySchedule: {
        type: "object",
        properties: {
          isOpen: { type: "boolean", default: true },
          openTime: {
            type: "string",
            pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$",
          },
          closeTime: {
            type: "string",
            pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$",
          },
        },
      },

      // Billing & Invoice Schemas
      Invoice: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          invoiceNumber: { type: "string", pattern: "^INV[0-9]{8}$" },
          customerId: { type: "string", format: "uuid" },
          businessId: { type: "string", format: "uuid" },
          subtotalAmount: { type: "number", format: "float", minimum: 0 },
          taxAmount: { type: "number", format: "float", minimum: 0 },
          discountAmount: { type: "number", format: "float", minimum: 0 },
          totalAmount: { type: "number", format: "float", minimum: 0 },
          status: {
            type: "string",
            enum: ["PENDING", "PAID", "OVERDUE", "CANCELLED", "REFUNDED"],
            default: "PENDING",
          },
          dueDate: { type: "string", format: "date" },
          paidAt: { type: "string", format: "date-time", nullable: true },
          paymentMethod: {
            type: "string",
            enum: ["CASH", "CARD", "UPI", "WALLET", "BANK_TRANSFER"],
            nullable: true,
          },
          customer: { $ref: "#/components/schemas/Customer" },
          invoiceItems: {
            type: "array",
            items: { $ref: "#/components/schemas/InvoiceItem" },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      InvoiceItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          invoiceId: { type: "string", format: "uuid" },
          description: { type: "string", maxLength: 200 },
          quantity: { type: "integer", minimum: 1 },
          unitPrice: { type: "number", format: "float", minimum: 0 },
          totalPrice: { type: "number", format: "float", minimum: 0 },
        },
      },

      // Wallet Management Schemas
      WalletTransaction: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          customerId: { type: "string", format: "uuid" },
          type: {
            type: "string",
            enum: ["CREDIT", "DEBIT"],
            description: "CREDIT for adding money, DEBIT for spending",
          },
          amount: { type: "number", format: "float", minimum: 0 },
          description: { type: "string", maxLength: 200 },
          reference: {
            type: "string",
            maxLength: 100,
            description: "Reference ID for transaction",
          },
          status: {
            type: "string",
            enum: ["PENDING", "COMPLETED", "FAILED"],
            default: "PENDING",
          },
          balanceAfter: { type: "number", format: "float", minimum: 0 },
          orderId: { type: "string", format: "uuid", nullable: true },
          invoiceId: { type: "string", format: "uuid", nullable: true },
          customer: { $ref: "#/components/schemas/Customer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },

      // Common Schemas
      Address: {
        type: "object",
        properties: {
          street: { type: "string", maxLength: 200 },
          city: { type: "string", maxLength: 50 },
          state: { type: "string", maxLength: 50 },
          zipCode: { type: "string", maxLength: 10 },
          country: { type: "string", maxLength: 50, default: "India" },
          latitude: { type: "number", format: "float", nullable: true },
          longitude: { type: "number", format: "float", nullable: true },
        },
      },
      MenuItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", maxLength: 100 },
          description: { type: "string", maxLength: 500 },
          price: { type: "number", format: "float", minimum: 0 },
          category: { type: "string", maxLength: 50 },
          isVegetarian: { type: "boolean", default: false },
          isAvailable: { type: "boolean", default: true },
          kitchenId: { type: "string", format: "uuid" },
          imageUrl: { type: "string", format: "uri", nullable: true },
          preparationTime: {
            type: "integer",
            minimum: 1,
            description: "Time in minutes",
          },
          ingredients: {
            type: "array",
            items: { type: "string" },
            description: "List of ingredients",
          },
          allergens: {
            type: "array",
            items: { type: "string" },
            description: "List of allergens",
          },
          nutritionalInfo: {
            type: "object",
            properties: {
              calories: { type: "integer", minimum: 0 },
              protein: { type: "number", format: "float", minimum: 0 },
              carbs: { type: "number", format: "float", minimum: 0 },
              fat: { type: "number", format: "float", minimum: 0 },
            },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },

      // API Response Schemas
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { type: "object", description: "Response data" },
          message: { type: "string", description: "Success message" },
          pagination: {
            type: "object",
            properties: {
              page: { type: "integer", minimum: 1 },
              limit: { type: "integer", minimum: 1, maximum: 100 },
              totalPages: { type: "integer", minimum: 0 },
              totalItems: { type: "integer", minimum: 0 },
              hasNextPage: { type: "boolean" },
              hasPrevPage: { type: "boolean" },
            },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string", description: "Error type" },
          message: { type: "string", description: "Error message" },
          details: {
            type: "object",
            description: "Additional error details",
            nullable: true,
          },
        },
      },

      // Dashboard Analytics Schemas
      DashboardStats: {
        type: "object",
        properties: {
          totalCustomers: {
            type: "object",
            properties: {
              value: { type: "string" },
              trend: { type: "string", enum: ["up", "down", "neutral"] },
              trendValue: { type: "string" },
              change: { type: "number" },
            },
          },
          totalRevenue: {
            type: "object",
            properties: {
              value: { type: "string" },
              trend: { type: "string", enum: ["up", "down", "neutral"] },
              trendValue: { type: "string" },
              change: { type: "number" },
            },
          },
          activeOrders: {
            type: "object",
            properties: {
              value: { type: "string" },
              trend: { type: "string", enum: ["up", "down", "neutral"] },
              trendValue: { type: "string" },
              change: { type: "number" },
            },
          },
          activeSubscriptions: {
            type: "object",
            properties: {
              value: { type: "string" },
              trend: { type: "string", enum: ["up", "down", "neutral"] },
              trendValue: { type: "string" },
              change: { type: "number" },
            },
          },
          ordersToday: {
            type: "object",
            properties: {
              value: { type: "string" },
              trend: { type: "string", enum: ["up", "down", "neutral"] },
              trendValue: { type: "string" },
              change: { type: "number" },
            },
          },
          walletBalance: {
            type: "object",
            properties: {
              value: { type: "string" },
              trend: { type: "string", enum: ["up", "down", "neutral"] },
              trendValue: { type: "string" },
              change: { type: "number" },
            },
          },
          lastUpdated: { type: "string", format: "date-time" },
          range: { type: "string", enum: ["7d", "30d", "90d", "1y"] },
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
    // Authentication Endpoints
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "User login",
        description: "Authenticate user with email and password",
        security: [], // No auth required for login
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    {
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            user: { $ref: "#/components/schemas/User" },
                            token: { type: "string" },
                            refreshToken: { type: "string" },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/auth/signup": {
      post: {
        tags: ["Authentication"],
        summary: "User registration",
        description: "Register a new user account",
        security: [], // No auth required for signup
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "email",
                  "password",
                  "firstName",
                  "lastName",
                  "role",
                ],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 },
                  firstName: { type: "string", maxLength: 50 },
                  lastName: { type: "string", maxLength: 50 },
                  phone: { type: "string" },
                  role: {
                    type: "string",
                    enum: [
                      "BUSINESS_OWNER",
                      "KITCHEN_MANAGER",
                      "STAFF",
                      "CUSTOMER",
                    ],
                    default: "CUSTOMER",
                  },
                  businessId: {
                    type: "string",
                    format: "uuid",
                    description: "Required for non-customer roles",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "User created successfully",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    {
                      properties: {
                        data: { $ref: "#/components/schemas/User" },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          409: {
            description: "User already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "User logout",
        description: "Logout current user and invalidate token",
        responses: {
          200: {
            description: "Logout successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponse" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    // Customer Management Endpoints
    "/customers": {
      get: {
        tags: ["CRM - Customer Management"],
        summary: "Get all customers",
        description:
          "Retrieve a paginated list of customers with filtering options",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1, minimum: 1 },
            description: "Page number for pagination",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10, minimum: 1, maximum: 100 },
            description: "Number of items per page",
          },
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Search by customer name, email, or phone",
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["active", "inactive"] },
            description: "Filter by customer status",
          },
          {
            name: "loyaltyTier",
            in: "query",
            schema: {
              type: "string",
              enum: ["bronze", "silver", "gold", "platinum"],
            },
            description: "Filter by loyalty tier",
          },
          {
            name: "sortBy",
            in: "query",
            schema: {
              type: "string",
              enum: ["createdAt", "walletBalance", "loyaltyPoints"],
            },
            description: "Sort field",
          },
          {
            name: "sortOrder",
            in: "query",
            schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
            description: "Sort order",
          },
        ],
        responses: {
          200: {
            description: "Customers retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    {
                      properties: {
                        data: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Customer" },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      post: {
        tags: ["CRM - Customer Management"],
        summary: "Create a new customer",
        description: "Create a new customer account with user profile",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "firstName", "lastName"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: {
                    type: "string",
                    minLength: 6,
                    description:
                      "Optional - will be auto-generated if not provided",
                  },
                  firstName: { type: "string", maxLength: 50 },
                  lastName: { type: "string", maxLength: 50 },
                  phone: { type: "string" },
                  address: { $ref: "#/components/schemas/Address" },
                  initialWalletBalance: {
                    type: "number",
                    format: "float",
                    minimum: 0,
                    default: 0,
                  },
                  loyaltyPoints: { type: "integer", minimum: 0, default: 0 },
                  sendWelcomeEmail: { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Customer created successfully",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    {
                      properties: {
                        data: { $ref: "#/components/schemas/Customer" },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          409: {
            description: "Customer with email already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
  responses: {
    Success: {
      description: "Successful operation",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ApiResponse" },
        },
      },
    },
    BadRequest: {
      description: "Bad request - Invalid input data",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ErrorResponse" },
        },
      },
    },
    Unauthorized: {
      description: "Unauthorized - Authentication required",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ErrorResponse" },
        },
      },
    },
    Forbidden: {
      description: "Forbidden - Insufficient permissions",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ErrorResponse" },
        },
      },
    },
    NotFound: {
      description: "Resource not found",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ErrorResponse" },
        },
      },
    },
    InternalServerError: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ErrorResponse" },
        },
      },
    },
  },
};

export default swaggerSpec;
