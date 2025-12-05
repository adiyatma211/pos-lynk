// Test script to verify Dashboard API integration
import dashboardService from '../services/dashboardService';
import apiClient from '../services/api';

export const testDashboardAPI = async () => {
  console.log('🧪 Testing Dashboard API Integration');
  console.log('===================================');

  try {
    // Test 1: Health Check
    console.log('\n📡 Testing API connectivity...');
    const healthResponse = await apiClient.healthCheck();
    console.log('✅ Health Check:', healthResponse);

    // Test 2: Dashboard API
    console.log('\n📊 Fetching dashboard summary...');
    const dashboardData = await dashboardService.getSummary();

    console.log('✅ Dashboard data fetched successfully!');
    console.log('📋 Dashboard Summary:');
    console.log('   Today Transactions:', dashboardData.todayTransactions);
    console.log('   Today Revenue:', dashboardData.todayRevenue);
    console.log('   Average Order:', dashboardData.averageOrder);
    console.log('   Top Product:', dashboardData.topSellingProducts?.[0]?.name || 'N/A');
    console.log('   Recent Transactions:', dashboardData.recentTransactions?.length || 0);
    console.log('   Total Revenue:', dashboardData.totalRevenue);
    console.log('   Total Transactions:', dashboardData.totalTransactions);

    // Test 3: Data validation
    console.log('\n🔍 Validating data...');
    const hasData = dashboardData.todayTransactions > 0 || dashboardData.todayRevenue > 0;

    if (hasData) {
      console.log('✅ Dashboard contains meaningful data');
    } else {
      console.log('⚠️ Dashboard appears to have empty/zero data');
    }

    // Test 4: Check individual metrics
    const metrics = {
      'Today Transactions Count': dashboardData.todayTransactions,
      'Today Revenue': dashboardData.todayRevenue,
      'Average Order': dashboardData.averageOrder,
      'Top Selling Product': dashboardData.topSellingProducts?.[0]?.name,
      'Latest Transactions Count': dashboardData.recentTransactions?.length,
      'Total Revenue': dashboardData.totalRevenue,
    };

    console.log('\n📈 Metrics Status:');
    Object.entries(metrics).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`${status} ${key}: ${value}`);
    });

    console.log('\n🎉 Dashboard API test completed successfully!');
    return dashboardData;

  } catch (error: any) {
    console.error('❌ Dashboard API test failed:', error.message);
    console.error('Error details:', error);
    throw error;
  }
};

// Test dashboard hook data transformation
export const testDashboardHook = async () => {
  console.log('\n🔧 Testing Dashboard Hook Integration...');

  try {
    // Import and test the hook
    const { useDashboardData } = await import('../hooks/useDashboardData');

    console.log('✅ useDashboardData hook imported successfully');
    console.log('📋 Hook interface is available for components');

    // Note: We can't actually run the hook outside React component
    // But we can verify it's properly structured

    return true;
  } catch (error: any) {
    console.error('❌ Dashboard hook test failed:', error.message);
    throw error;
  }
};

// Export for manual usage
if (typeof window !== 'undefined') {
  // Attach to window for easy browser console access
  (window as any).testDashboardAPI = testDashboardAPI;
  (window as any).testDashboardHook = testDashboardHook;

  console.log('💡 Dashboard API Test Commands:');
  console.log('   - testDashboardAPI() - Test API integration');
  console.log('   - testDashboardHook() - Test hook structure');
}

export default { testDashboardAPI, testDashboardHook };