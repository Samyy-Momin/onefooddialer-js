# OneFoodDialer - End-to-End Test Plan

## Test Flow: Subscription Creation → Orders → Kitchen Assignment → Invoices → Wallet Updates

### Prerequisites
- Database seeded with test data
- Test business, kitchens, and customers created
- Test subscription plans available

### Test Scenario 1: Complete Subscription Lifecycle

#### Step 1: Create Subscription
**API Endpoint**: `POST /api/subscriptions`

**Test Data**:
```json
{
  "customerId": "test-customer-1",
  "businessId": "test-business-1",
  "planId": "test-plan-daily",
  "startDate": "2025-07-08",
  "autoRenew": true,
  "deliveryAddress": {
    "street": "123 Test Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
}
```

**Expected Results**:
- ✅ Subscription created with status "ACTIVE"
- ✅ Kitchen auto-assigned if not specified
- ✅ Next billing date calculated correctly
- ✅ Returns complete subscription object with relations

**Verification Queries**:
```sql
-- Check subscription created
SELECT * FROM subscriptions WHERE customer_id = 'test-customer-1';

-- Check kitchen assignment
SELECT s.id, s.kitchen_id, k.name 
FROM subscriptions s 
JOIN kitchens k ON s.kitchen_id = k.id 
WHERE s.customer_id = 'test-customer-1';
```

#### Step 2: Verify Orders Generated
**Expected Results**:
- ✅ Initial orders created based on plan type
- ✅ Orders have correct scheduled dates
- ✅ Order items match subscription plan items
- ✅ Orders assigned to same kitchen as subscription

**Verification Queries**:
```sql
-- Check orders created
SELECT o.id, o.order_number, o.scheduled_for, o.status, o.kitchen_id
FROM orders o
WHERE o.subscription_id = (
  SELECT id FROM subscriptions WHERE customer_id = 'test-customer-1'
);

-- Check order items
SELECT oi.*, mi.name as menu_item_name
FROM order_items oi
JOIN menu_items mi ON oi.menu_item_id = mi.id
WHERE oi.order_id IN (
  SELECT o.id FROM orders o
  WHERE o.subscription_id = (
    SELECT id FROM subscriptions WHERE customer_id = 'test-customer-1'
  )
);
```

#### Step 3: Verify Invoice Creation
**Expected Results**:
- ✅ Invoice created for subscription
- ✅ Correct GST calculations applied
- ✅ Invoice linked to subscription
- ✅ Due date set appropriately

**Verification Queries**:
```sql
-- Check invoice created
SELECT i.*, s.id as subscription_id
FROM invoices i
JOIN subscriptions s ON i.subscription_id = s.id
WHERE s.customer_id = 'test-customer-1';

-- Verify GST calculations
SELECT 
  subtotal,
  tax_amount,
  total_amount,
  (subtotal * 0.18) as expected_tax,
  (subtotal + (subtotal * 0.18)) as expected_total
FROM invoices 
WHERE subscription_id = (
  SELECT id FROM subscriptions WHERE customer_id = 'test-customer-1'
);
```

#### Step 4: Verify Wallet Transaction
**Expected Results**:
- ✅ Customer wallet balance updated
- ✅ Debit transaction created
- ✅ Transaction references invoice
- ✅ Balance after calculation correct

**Verification Queries**:
```sql
-- Check wallet balance updated
SELECT wallet_balance FROM customers WHERE id = 'test-customer-1';

-- Check wallet transaction
SELECT * FROM wallet_transactions 
WHERE customer_id = 'test-customer-1' 
ORDER BY created_at DESC LIMIT 1;

-- Verify balance calculation
SELECT 
  wt.balance_after,
  c.wallet_balance,
  wt.amount,
  wt.type
FROM wallet_transactions wt
JOIN customers c ON wt.customer_id = c.id
WHERE wt.customer_id = 'test-customer-1'
ORDER BY wt.created_at DESC LIMIT 1;
```

### Test Scenario 2: Order Status Updates

#### Step 1: Update Order to "PREPARING"
**API Endpoint**: `PUT /api/orders/{orderId}`

**Test Data**:
```json
{
  "status": "PREPARING"
}
```

**Expected Results**:
- ✅ Order status updated
- ✅ Inventory reduced for order items
- ✅ Stock movements recorded

#### Step 2: Update Order to "DELIVERED"
**Test Data**:
```json
{
  "status": "DELIVERED"
}
```

**Expected Results**:
- ✅ Order marked as delivered
- ✅ Delivery timestamp recorded
- ✅ Invoice marked as paid
- ✅ Loyalty points added to customer

### Test Scenario 3: Payment Processing

#### Step 1: Process Invoice Payment
**API Endpoint**: `POST /api/invoices/{invoiceId}/pay`

**Test Data**:
```json
{
  "paymentMethod": "WALLET"
}
```

**Expected Results**:
- ✅ Invoice status changed to "PAID"
- ✅ Payment timestamp recorded
- ✅ Wallet balance reduced
- ✅ Wallet transaction created
- ✅ Loyalty points awarded
- ✅ Next billing date updated for subscription

### Test Scenario 4: Wallet Operations

#### Step 1: Add Money to Wallet
**API Endpoint**: `POST /api/wallet`

**Test Data**:
```json
{
  "amount": 1000,
  "paymentMethod": "ONLINE",
  "paymentReference": "TEST_PAYMENT_123"
}
```

**Expected Results**:
- ✅ Wallet balance increased
- ✅ Credit transaction recorded
- ✅ Bonus applied for large recharge (if applicable)

#### Step 2: Transfer Money Between Wallets
**API Endpoint**: `POST /api/wallet/transfer`

**Test Data**:
```json
{
  "toCustomerId": "test-customer-2",
  "amount": 100,
  "description": "Test transfer"
}
```

**Expected Results**:
- ✅ Sender balance reduced
- ✅ Recipient balance increased
- ✅ Both transactions recorded
- ✅ Correct balance calculations

### Test Scenario 5: CRM Operations

#### Step 1: Create New Customer
**API Endpoint**: `POST /api/customers`

**Test Data**:
```json
{
  "email": "newcustomer@test.com",
  "password": "testpassword123",
  "firstName": "New",
  "lastName": "Customer",
  "phone": "9876543210",
  "businessId": "test-business-1",
  "initialWalletBalance": 500
}
```

**Expected Results**:
- ✅ User account created
- ✅ Customer profile created
- ✅ Customer code generated
- ✅ Initial wallet balance set
- ✅ Initial wallet transaction recorded

### Performance Tests

#### Load Testing
- **Concurrent Subscriptions**: Test 100 simultaneous subscription creations
- **Order Processing**: Test 500 concurrent order status updates
- **Payment Processing**: Test 200 simultaneous payment transactions

#### Database Performance
- **Query Optimization**: Verify all queries use proper indexes
- **Transaction Rollback**: Test transaction failures and rollbacks
- **Connection Pooling**: Test under high concurrent load

### Integration Tests

#### External Services
- **Payment Gateway**: Test Razorpay/Stripe integration
- **SMS Service**: Test Twilio notifications
- **Email Service**: Test SendGrid email delivery

#### Real-time Updates
- **WebSocket Connections**: Test real-time order updates
- **Push Notifications**: Test mobile app notifications

### Security Tests

#### Authentication & Authorization
- **JWT Token Validation**: Test expired and invalid tokens
- **Role-based Access**: Test access control for different user roles
- **API Rate Limiting**: Test API rate limits

#### Data Validation
- **Input Sanitization**: Test SQL injection prevention
- **XSS Protection**: Test cross-site scripting prevention
- **CSRF Protection**: Test cross-site request forgery prevention

### Automated Test Scripts

#### Jest/Supertest API Tests
```javascript
// Example test structure
describe('Subscription API', () => {
  test('should create subscription and generate orders', async () => {
    const response = await request(app)
      .post('/api/subscriptions')
      .send(testSubscriptionData)
      .expect(201);
    
    // Verify subscription created
    expect(response.body.status).toBe('ACTIVE');
    
    // Verify orders generated
    const orders = await prisma.order.findMany({
      where: { subscriptionId: response.body.id }
    });
    expect(orders.length).toBeGreaterThan(0);
  });
});
```

#### Cypress E2E Tests
```javascript
// Example E2E test
describe('Subscription Flow', () => {
  it('should create subscription through UI', () => {
    cy.login('customer@test.com', 'password');
    cy.visit('/customer');
    cy.get('[data-cy=create-subscription]').click();
    cy.get('[data-cy=plan-select]').select('Daily Plan');
    cy.get('[data-cy=submit-subscription]').click();
    cy.get('[data-cy=success-message]').should('be.visible');
  });
});
```

### Test Data Management

#### Database Seeding
```sql
-- Seed test business
INSERT INTO businesses (id, name, owner_id) VALUES 
('test-business-1', 'Test Restaurant', 'test-owner-1');

-- Seed test kitchens
INSERT INTO kitchens (id, name, business_id, capacity) VALUES 
('test-kitchen-1', 'Main Kitchen', 'test-business-1', 100);

-- Seed test customers
INSERT INTO customers (id, customer_code, user_id, business_id, wallet_balance) VALUES 
('test-customer-1', 'CUS001', 'test-user-1', 'test-business-1', 1000.00);
```

#### Test Cleanup
- Reset database after each test suite
- Clear Redis cache
- Reset file uploads
- Clean up test files

This comprehensive test plan ensures that all critical paths through the OneFoodDialer system are thoroughly tested, from subscription creation through order fulfillment and payment processing.
