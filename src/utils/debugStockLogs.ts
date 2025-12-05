// Debug script for Stock Logs API
import stockService from '../services/StockService';
import apiClient from '../services/api';

export const debugStockLogs = async () => {
  console.log('🔍 Debugging Stock Logs Integration');
  console.log('==================================');

  try {
    // 1. Test API connectivity
    console.log('\n📡 1. Testing API connectivity...');
    const healthCheck = await apiClient.healthCheck();
    console.log('✅ API Health:', healthCheck);

    // 2. Test StockService directly
    console.log('\n📊 2. Testing StockService.getStockLogs()...');
    const stockLogs = await stockService.getStockLogs();
    console.log(`✅ Found ${stockLogs.length} stock logs`);

    if (stockLogs.length > 0) {
      console.log('\n📋 Sample Stock Log:');
      const sample = stockLogs[0];
      console.log(`   ID: ${sample.id}`);
      console.log(`   Product ID: ${sample.productId}`);
      console.log(`   Type: ${sample.type}`);
      console.log(`   Amount: ${sample.amount}`);
      console.log(`   Note: ${sample.note}`);
      console.log(`   Created: ${sample.createdAt}`);
    }

    // 3. Verify API mode is enabled
    console.log('\n⚙️ 3. Checking API mode...');
    const useAPI = process.env.NEXT_PUBLIC_USE_API === 'true';
    console.log(`   NEXT_PUBLIC_USE_API: ${process.env.NEXT_PUBLIC_USE_API}`);
    console.log(`   shouldUseAPI: ${useAPI ? '✅ API mode' : '❌ Local mode'}`);

    // 4. Check backend data structure
    console.log('\n🔗 4. Checking raw backend response...');
    const rawResponse = await apiClient.get('/stock-logs');
    console.log('✅ Raw backend response:', rawResponse);

    return {
      success: true,
      stockLogsCount: stockLogs.length,
      apiMode: useAPI,
      sampleData: stockLogs[0] || null
    };

  } catch (error) {
    console.error('❌ Debug failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// Check current environment
export const checkEnvironment = () => {
  console.log('\n🌍 Environment Check:');
  console.log('   - Node environment:', process.env.NODE_ENV);
  console.log('   - API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
  console.log('   - Use API:', process.env.NEXT_PUBLIC_USE_API);
  console.log('   - Is browser:', typeof window !== 'undefined');
};

export default { debugStockLogs, checkEnvironment };

// Auto-attach to window for console testing
if (typeof window !== 'undefined') {
  (window as any).debugStockLogs = debugStockLogs;
  (window as any).checkEnvironment = checkEnvironment;

  console.log('💡 Debug commands available:');
  console.log('   - debugStockLogs() - Test stock logs API');
  console.log('   - checkEnvironment() - Check environment variables');
}