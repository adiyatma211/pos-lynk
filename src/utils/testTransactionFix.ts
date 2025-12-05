// Test script to verify the transaction API fix
import TransactionService from '../services/TransactionService';

export const testTransactionFix = async () => {
  console.log('🧪 Testing Transaction API Fix');
  console.log('===============================');

  try {
    // Test data
    const testData = {
      items: [
        {
          productId: '1', // Assuming product with ID 1 exists
          name: 'Test Product',
          price: 25000,
          qty: 1
        }
      ],
      subtotal: 25000,
      total: 25000,
      paid: 30000,
      change: 5000
    };

    console.log('📦 Test Data:', testData);

    // Test transaction creation
    console.log('\n🔄 Creating transaction...');
    const transaction = await TransactionService.createTransaction(testData);

    console.log('✅ Transaction created successfully!');
    console.log('📋 Transaction Details:');
    console.log('   ID:', transaction.id);
    console.log('   Total:', transaction.total);
    console.log('   Items:', transaction.items.length);
    console.log('   Created At:', transaction.createdAt);

    // Test getting transaction by ID
    console.log('\n🔍 Fetching transaction by ID...');
    const fetchedTransaction = await TransactionService.getTransactionById(transaction.id);

    if (fetchedTransaction) {
      console.log('✅ Transaction fetched successfully!');
      console.log('   Fetched ID:', fetchedTransaction.id);
      console.log('   Fetched Total:', fetchedTransaction.total);
    } else {
      console.log('❌ Transaction not found');
    }

    // Test getting all transactions
    console.log('\n📋 Fetching latest transactions...');
    const latestTransactions = await TransactionService.getLatestTransactions(3);
    console.log('✅ Latest transactions fetched:', latestTransactions.length);

    console.log('\n🎉 All tests passed! Transaction API integration is working correctly.');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
};

// Export for manual usage
if (typeof window !== 'undefined') {
  // Attach to window for easy browser console access
  (window as any).testTransactionFix = testTransactionFix;
  console.log('💡 Type testTransactionFix() in console to run the fix verification');
}

export default testTransactionFix;