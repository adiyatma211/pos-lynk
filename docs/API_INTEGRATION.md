# Transaction API Integration Guide

## Overview

This document describes the integration between the frontend POS application and the backend Laravel API for transaction management.

## 🎯 Priority 1 Implementation Status: ✅ COMPLETE

### ✅ Features Implemented

1. **Transaction CRUD Operations**
   - `GET /api/v1/transactions` - List transactions with filters
   - `POST /api/v1/transactions` - Create new transaction
   - `GET /api/v1/transactions/{code}` - Get transaction by code

2. **Data Transformation**
   - Backend `TransactionResource` → Frontend `Transaction` format
   - Automatic ID mapping (backend `code` becomes frontend `id`)
   - Item data transformation with proper field mapping

3. **Hybrid Architecture**
   - API-first approach with localStorage fallback
   - Graceful degradation when API is unavailable
   - Automatic error handling and recovery

4. **Performance Optimizations**
   - API parameter support (`range`, `limit`, `per_page`)
   - Client-side filtering as backup
   - Batch operations for better performance

5. **Additional Features**
   - Transaction sync for offline support
   - API connectivity checking
   - Comprehensive error logging

## 🏗️ Architecture

### Service Layer Structure

```
TransactionService.ts
├── API Types
│   ├── TransactionItemRequest
│   ├── CreateTransactionRequest
│   ├── TransactionItemResponse
│   └── TransactionResponse
├── Data Transformation
│   ├── transformTransaction()
│   └── transformTransactionArray()
├── API Integration
│   ├── getTransactions() - with filters
│   ├── getTransactionById() - by code
│   └── createTransaction() - full flow
├── Hybrid Methods
│   ├── getTodayTransactions() - API with fallback
│   └── getLatestTransactions() - API with limit
└── Utility Methods
    ├── syncTransactionsFromAPI()
    └── checkAPIConnectivity()
```

### Data Flow

```
Frontend Component
    ↓
Custom Hook (useTransactions)
    ↓
TransactionService
    ↓ (if API enabled)
Backend API
    ↓
Data Transformation
    ↓
Frontend Format
    ↓
Component State
```

## 📡 API Endpoints Integration

### 1. List Transactions
```typescript
// API Call
await TransactionService.getTransactions({
  range: 'today',
  limit: 10
});

// Maps to: GET /api/v1/transactions?range=today&limit=10
```

### 2. Create Transaction
```typescript
// Frontend Data
const transactionData: TransactionData = {
  items: [
    {
      productId: '1',
      name: 'Product Name',
      price: 10000,
      qty: 2
    }
  ],
  subtotal: 20000,
  total: 20000,
  paid: 25000,
  change: 5000
};

// API Call
const transaction = await TransactionService.createTransaction(transactionData);

// Maps to: POST /api/v1/transactions
// Payload: {
//   items: [{ product_id: 1, qty: 2 }],
//   paid: 25000
// }
```

### 3. Get Transaction by Code
```typescript
// API Call
const transaction = await TransactionService.getTransactionById('TRX-2023120112000ABC');

// Maps to: GET /api/v1/transactions/TRX-2023120112000ABC
```

## 🔄 Data Transformation

### Backend → Frontend Mapping

| Backend Field | Frontend Field | Type | Notes |
|---------------|----------------|------|-------|
| `referenceId` | N/A | number | Internal DB ID (from TransactionResource) |
| `id` | `id` | string | Transaction code (from TransactionResource) |
| `code` | `id` | string | Transaction code (duplicate, uses id) |
| `createdAt` | `createdAt` | string | ISO date format |
| `itemCount` | N/A | number | Items count (used for validation) |
| `items[].productId` | `items[].productId` | string | Number → String (TransactionItemResource uses camelCase) |
| `items[].name` | `items[].name` | string | Direct mapping (TransactionItemResource uses name) |
| `items[].price` | `items[].price` | number | Direct mapping |
| `items[].qty` | `items[].qty` | number | Direct mapping |
| `subtotal` | `subtotal` | number | Direct mapping |
| `total` | `total` | number | Direct mapping |
| `paid` | `paid` | number | Direct mapping |
| `change` | `change` | number | Direct mapping |

### Laravel TransactionResource Structure
```php
// Backend returns:
{
  "data": {
    "id": "TRX-2512031416158UB",     // Transaction code
    "code": "TRX-2512031416158UB",   // Transaction code
    "referenceId": 4,                // Database ID
    "subtotal": 25000,
    "total": 25000,
    "paid": 30000,
    "change": 5000,
    "itemCount": 1,
    "createdAt": "2025-12-03T14:16:15.000000Z",
    "items": [...]
  },
  "message": "Transaksi tersimpan."
}
```

## 🛡️ Error Handling Strategy

### 1. API Layer Errors
- Network connectivity issues
- Server errors (5xx)
- Client errors (4xx)

### 2. Fallback Mechanism
```typescript
try {
  // Try API first
  return await apiCall();
} catch (error) {
  console.error('API failed, using localStorage:', error);
  // Fallback to localStorage
  return await localStorageCall();
}
```

### 3. Response Format Handling
The service handles multiple API response formats:
- Direct array response
- `{ data: [...] }`
- `{ data: { data: [...] } }`

## 🧪 Testing

### 1. Automated Test Script
```typescript
import { runAllTests } from '@/tests/api-integration.test';

// Run all tests
await runAllTests();
```

### 2. Browser Console Testing
```typescript
// Import in browser console
import { testTransactionAPI } from '@/utils/testAPI';

// Quick test
testTransactionAPI();
```

### 3. Manual Testing Steps
1. Ensure backend is running (`php artisan serve`)
2. Set `NEXT_PUBLIC_USE_API=true` in environment
3. Test transaction creation in POS app
4. Verify data persistence in backend database

## ⚙️ Configuration

### Environment Variables
```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_USE_API=true
```

### Feature Flags
- `useAPI()` - Controls API vs localStorage usage
- Automatic fallback to localStorage when API fails

## 📊 Performance Considerations

### 1. API Optimization
- Use `limit` parameter for large datasets
- Use `range` filter for date-based queries
- Implement pagination for transaction history

### 2. Client-side Optimization
- Memoize transaction data in hooks
- Debounce API calls during search/filter
- Cache recent transactions locally

### 3. Network Efficiency
- Batch multiple operations where possible
- Use compressed API responses
- Implement request deduplication

## 🚀 Next Steps

### Priority 2: Stock Management API
1. Create StockService.ts
2. Integrate Stock Logs API
3. Implement real-time stock updates

### Priority 3: Advanced Features
1. Real-time transaction updates (WebSockets)
2. Offline transaction queue
3. Advanced reporting and analytics

## 🔍 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check if backend server is running
   - Verify `NEXT_PUBLIC_API_BASE_URL` configuration
   - Check CORS settings on backend

2. **Transaction Creation Failed**
   - Verify product IDs exist in backend
   - Check stock availability
   - Validate request payload format

3. **Data Not Syncing**
   - Check `NEXT_PUBLIC_USE_API` setting
   - Verify API connectivity
   - Check browser console for errors

4. **Database Schema Issues**
   - **Error**: "Column not found: 1054 Unknown column 'price' in 'field list'"
   - **Cause**: Migration syntax error created wrong column name
   - **Fix**: Run the fix migration:
     ```bash
     php artisan migrate
     ```
   - **Verification**: Check table structure:
     ```bash
     php artisan tinker --execute="echo json_encode(Schema::getColumnListing('transaction_items'), JSON_PRETTY_PRINT);"
     ```

5. **Frontend Response Parsing Issues**
   - **Error**: "Invalid transaction response from server"
   - **Cause**: Mismatch between Laravel TransactionResource format and frontend expectations
   - **Fix**: Updated TransactionService to handle Laravel Resource response format
   - **Testing**: Use the test utility:
     ```typescript
     import { testTransactionFix } from '@/utils/testTransactionFix';
     testTransactionFix();
     ```

6. **Field Mapping Issues**
   - **Error**: "TypeError: can't access property 'toString', item.product_id is undefined"
   - **Cause**: Backend TransactionItemResource uses camelCase (`productId`, `name`) but frontend expects snake_case (`product_id`, `product_name`)
   - **Backend TransactionItemResource returns:**
     ```php
     'productId' => $this->product_id,  // camelCase
     'name' => $this->product_name,     // 'name' not 'product_name'
     ```
   - **Fix**: Updated TransactionService to use correct field names:
     ```typescript
     productId: item.productId.toString(),  // ✅ camelCase
     name: item.name,                     // ✅ 'name' not 'product_name'
     ```

### Debug Mode
Enable detailed logging by setting:
```typescript
// In browser console
localStorage.setItem('debug', 'true');
```

This will enable detailed API request/response logging in the console.

### Database Issues Fixed
- **Migration Fix**: Fixed typo in `transaction_items` table creation
- **Column Rename**: Created migration to fix `price` column name
- **Schema Verification**: All required columns now exist properly