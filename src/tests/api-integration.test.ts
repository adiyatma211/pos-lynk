import TransactionService, {
  CreateTransactionRequest,
  TransactionData
} from '../services/TransactionService';
import apiClient from '../services/api';

// Test configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

console.log('🧪 Transaction API Integration Test');
console.log('====================================');
console.log(`Base URL: ${API_BASE_URL}`);

// Test utility functions
const logTest = (testName: string, success: boolean, message?: string) => {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}${message ? `: ${message}` : ''}`);
};

const logSection = (sectionName: string) => {
  console.log(`\n📋 ${sectionName}`);
};

// Test data
const testTransactionData: TransactionData = {
  items: [
    {
      productId: '1', // Assuming product with ID 1 exists
      name: 'Test Product 1',
      price: 10000,
      qty: 2
    },
    {
      productId: '2', // Assuming product with ID 2 exists
      name: 'Test Product 2',
      price: 5000,
      qty: 1
    }
  ],
  subtotal: 25000,
  total: 25000,
  paid: 30000,
  change: 5000
};

// Test functions
async function testHealthCheck() {
  logSection('Health Check Test');
  try {
    const response = await apiClient.healthCheck();
    logTest('API Health Check', response.status === 'ok', `Status: ${response.status}`);
  } catch (error: any) {
    logTest('API Health Check', false, error.message || 'Connection failed');
  }
}

async function testGetTransactions() {
  logSection('Get Transactions Test');
  try {
    const transactions = await TransactionService.getTransactions({ limit: 5 });
    logTest('Get Transactions', Array.isArray(transactions), `Found ${transactions.length} transactions`);

    // Log first transaction for debugging
    if (transactions.length > 0) {
      console.log('Sample transaction:', {
        id: transactions[0].id,
        total: transactions[0].total,
        itemsCount: transactions[0].items.length,
        createdAt: transactions[0].createdAt
      });
    }
  } catch (error: any) {
    logTest('Get Transactions', false, error.message);
  }
}

async function testGetTodayTransactions() {
  logSection('Get Today Transactions Test');
  try {
    const todayTransactions = await TransactionService.getTodayTransactions();
    logTest('Get Today Transactions', Array.isArray(todayTransactions), `Found ${todayTransactions.length} today transactions`);
  } catch (error: any) {
    logTest('Get Today Transactions', false, error.message);
  }
}

async function testCreateTransaction() {
  logSection('Create Transaction Test');
  try {
    const createdTransaction = await TransactionService.createTransaction(testTransactionData);
    logTest('Create Transaction', !!createdTransaction.id, `Created transaction with ID: ${createdTransaction.id}`);

    // Verify transaction data
    const isValid =
      createdTransaction.items.length === 2 &&
      createdTransaction.total === 25000 &&
      createdTransaction.paid === 30000 &&
      createdTransaction.change === 5000;

    logTest('Transaction Data Validation', isValid, 'All fields match expected values');

    return createdTransaction.id; // Return ID for further tests
  } catch (error: any) {
    logTest('Create Transaction', false, error.message);
    return null;
  }
}

async function testGetTransactionById(transactionId: string) {
  logSection('Get Transaction by ID Test');
  if (!transactionId) {
    logTest('Get Transaction by ID', false, 'No transaction ID provided');
    return;
  }

  try {
    const transaction = await TransactionService.getTransactionById(transactionId);
    logTest('Get Transaction by ID', !!transaction, `Found transaction: ${transaction?.id || 'Not found'}`);
  } catch (error: any) {
    logTest('Get Transaction by ID', false, error.message);
  }
}

async function testSyncTransactions() {
  logSection('Sync Transactions Test');
  try {
    await TransactionService.syncTransactionsFromAPI(10);
    logTest('Sync Transactions', true, 'Sync completed successfully');
  } catch (error: any) {
    logTest('Sync Transactions', false, error.message);
  }
}

async function testAPIConnectivity() {
  logSection('API Connectivity Test');
  try {
    const isConnected = await TransactionService.checkAPIConnectivity();
    logTest('API Connectivity', isConnected, isConnected ? 'Connected' : 'Not connected');
  } catch (error: any) {
    logTest('API Connectivity', false, error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Transaction API Integration Tests...\n');

  // Basic connectivity tests
  await testHealthCheck();
  await testAPIConnectivity();

  // Read operations
  await testGetTransactions();
  await testGetTodayTransactions();

  // Write operations (will create test data)
  const createdTransactionId = await testCreateTransaction();

  // Individual transaction lookup
  if (createdTransactionId) {
    await testGetTransactionById(createdTransactionId);
  }

  // Sync functionality
  await testSyncTransactions();

  console.log('\n🏁 Test Suite Complete');
  console.log('======================');
  console.log('📝 Note: Some tests may fail if:');
  console.log('   - Backend server is not running');
  console.log('   - Test products (ID 1, 2) do not exist');
  console.log('   - API endpoints are not properly configured');
  console.log('   - NEXT_PUBLIC_USE_API is not set to "true"');
}

// Export for manual testing
export {
  runAllTests,
  testHealthCheck,
  testGetTransactions,
  testCreateTransaction,
  testGetTransactionById,
  testSyncTransactions,
  testAPIConnectivity,
  testTransactionData
};

// Auto-run if called directly
if (typeof window === 'undefined' && require.main === module) {
  runAllTests().catch(console.error);
}