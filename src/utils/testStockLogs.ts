// Test script to verify Stock Logs API integration
import stockService from '../services/StockService';
import apiClient from '../services/api';

export const testStockLogsAPI = async () => {
  console.log('🧪 Testing Stock Logs API Integration');
  console.log('===================================');

  try {
    // Test 1: Health Check
    console.log('\n📡 Testing API connectivity...');
    const healthResponse = await apiClient.healthCheck();
    console.log('✅ Health Check:', healthResponse);

    // Test 2: Stock Logs API
    console.log('\n📊 Fetching stock logs...');
    const stockLogs = await stockService.getStockLogs();

    console.log('✅ Stock logs fetched successfully!');
    console.log('📋 Stock Logs Summary:');
    console.log('   Total Logs:', stockLogs.length);

    if (stockLogs.length > 0) {
      console.log('   Latest Log:');
      const latestLog = stockLogs[0];
      console.log('     - ID:', latestLog.id);
      console.log('     - Product ID:', latestLog.productId);
      console.log('     - Type:', latestLog.type);
      console.log('     - Amount:', latestLog.amount);
      console.log('     - Note:', latestLog.note);
      console.log('     - Created At:', latestLog.createdAt);
    }

    // Test 3: Data validation
    console.log('\n🔍 Validating stock logs data...');
    const hasStockOutLogs = stockLogs.some(log => log.type === 'out');
    const hasStockInLogs = stockLogs.some(log => log.type === 'in');

    console.log('   Has Stock Out Logs:', hasStockOutLogs ? '✅' : '❌');
    console.log('   Has Stock In Logs:', hasStockInLogs ? '✅' : '❌');

    // Test 4: Check for transaction-related logs
    const transactionLogs = stockLogs.filter(log =>
      log.note.toLowerCase().includes('penjualan')
    );
    console.log('   Transaction-related Logs:', transactionLogs.length);

    // Test 5: Product breakdown
    const productBreakdown = stockLogs.reduce((acc: any, log) => {
      const key = `Product ${log.productId}`;
      if (!acc[key]) {
        acc[key] = { in: 0, out: 0 };
      }
      acc[key][log.type]++;
      return acc;
    }, {});

    console.log('\n📈 Product Breakdown:');
    Object.entries(productBreakdown).forEach(([product, counts]: [string, any]) => {
      console.log(`   ${product}: In=${counts.in}, Out=${counts.out}`);
    });

    console.log('\n🎉 Stock Logs API test completed successfully!');
    return stockLogs;

  } catch (error: any) {
    console.error('❌ Stock Logs API test failed:', error.message);
    console.error('Error details:', error);
    throw error;
  }
};

// Test stock adjustment creation
export const testStockAdjustment = async () => {
  console.log('\n🔧 Testing Stock Adjustment Creation...');

  try {
    // Test stock in adjustment
    console.log('Creating stock IN adjustment...');
    await stockService.createStockAdjustment({
      productId: '1',
      type: 'in',
      amount: 10,
      note: 'Test penambahan stok'
    });
    console.log('✅ Stock IN adjustment created');

    // Test stock out adjustment
    console.log('Creating stock OUT adjustment...');
    await stockService.createStockAdjustment({
      productId: '1',
      type: 'out',
      amount: 5,
      note: 'Test pengurangan stok'
    });
    console.log('✅ Stock OUT adjustment created');

    return true;
  } catch (error: any) {
    console.error('❌ Stock adjustment test failed:', error.message);
    throw error;
  }
};

// Export for manual usage
if (typeof window !== 'undefined') {
  // Attach to window for easy browser console access
  (window as any).testStockLogsAPI = testStockLogsAPI;
  (window as any).testStockAdjustment = testStockAdjustment;

  console.log('💡 Stock Logs Test Commands:');
  console.log('   - testStockLogsAPI() - Test API integration');
  console.log('   - testStockAdjustment() - Test stock adjustment');
}

export default { testStockLogsAPI, testStockAdjustment };