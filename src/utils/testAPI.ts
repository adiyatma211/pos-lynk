// Simple API Test Utility for Browser Console
// Usage: Copy and paste this code into browser console on the POS app

import TransactionService from '../services/TransactionService';
import apiClient from '../services/api';

export const testTransactionAPI = async () => {
  console.log('🧪 Simple Transaction API Test');
  console.log('==============================');

  // Test 1: Health Check
  try {
    const health = await apiClient.healthCheck();
    console.log('✅ Health Check:', health);
  } catch (error) {
    console.error('❌ Health Check Failed:', error);
  }

  // Test 2: Get Transactions
  try {
    const transactions = await TransactionService.getTransactions({ limit: 3 });
    console.log('✅ Get Transactions:', transactions.length, 'found');
    transactions.forEach((trx, i) => {
      console.log(`  ${i + 1}. ${trx.id} - ${trx.total} (${trx.items.length} items)`);
    });
  } catch (error) {
    console.error('❌ Get Transactions Failed:', error);
  }

  // Test 3: Create Transaction
  try {
    const testData = {
      items: [
        {
          productId: '1',
          name: 'Test Product',
          price: 10000,
          qty: 1
        }
      ],
      subtotal: 10000,
      total: 10000,
      paid: 15000,
      change: 5000
    };

    const newTransaction = await TransactionService.createTransaction(testData);
    console.log('✅ Create Transaction:', newTransaction.id);
    console.log('  - Total:', newTransaction.total);
    console.log('  - Items:', newTransaction.items.length);
  } catch (error) {
    console.error('❌ Create Transaction Failed:', error);
  }

  console.log('\n🏁 Test Complete');
};

// Export for manual usage
if (typeof window !== 'undefined') {
  // Attach to window for easy browser console access
  (window as any).testTransactionAPI = testTransactionAPI;
  console.log('💡 Type testTransactionAPI() in console to run API tests');
}

export default testTransactionAPI;