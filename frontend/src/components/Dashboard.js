import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import { 
  Camera, BarChart3, Receipt, AlertTriangle, 
  TrendingUp, IndianRupee, Shield, Zap,
  LogOut, Upload, FileText, PieChart,
  ArrowUpRight, ArrowDownRight, CheckCircle,
  Loader2, Droplet, Layers, Lightbulb, TrendingDown,
  Trash2, Landmark, Users
} from 'lucide-react'
import Footer from '../components/Footer'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

// --- Helper Components ---

// Metric Card Component
const DashboardMetricCard = ({ icon, title, value, change, trend, gradient, changeColor }) => (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:-translate-y-1 shadow-xl">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 bg-gradient-to-br ${gradient} rounded-xl shadow-lg`}>
                {icon}
            </div>
            <div className={`flex items-center gap-1 text-sm ${changeColor || (trend === 'up' ? 'text-green-400' : 'text-red-400')}`}>
                {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
                <span>{change}</span>
            </div>
        </div>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        <p className="text-purple-200 text-sm">{title}</p>
    </div>
);

// Format currency utility
const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount)
}

// Calculate monthly growth utility
const calculateMonthlyGrowth = (expenses = []) => {
    if (!expenses.length) return 0
  
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const currentMonthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date)
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear
    }).reduce((sum, exp) => sum + (exp.total_amount_numeric || 0), 0)

    const lastMonthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date)
      return expDate.getMonth() === lastMonth && expDate.getFullYear() === lastMonthYear
    }).reduce((sum, exp) => sum + (exp.total_amount_numeric || 0), 0)

    if (lastMonthExpenses === 0) return 0
    return Math.round(((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100)
}

// Process flagged transactions from duplicate detection
const processFlaggedTransactions = (duplicates = []) => {
    return duplicates.map(dup => ({
      id: `dup-${Date.now()}-${Math.random()}`,
      merchant: dup.merchant,
      amount: dup.total_duplicate_amount,
      reason: `Possible duplicate payment - ${dup.suspected_duplicates} similar transactions`,
      date: new Date().toISOString().split('T')[0],
      risk: dup.risk_level?.toLowerCase() || 'medium'
    }))
}


export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [flaggedTransactions, setFlaggedTransactions] = useState([])
  const [recentExpenses, setRecentExpenses] = useState([])
  const [leakageData, setLeakageData] = useState({
      topCategories: [],
      aiRecommendation: "Analyzing data...", 
      leakageRiskAvg: 0
  });
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndFetchData()
  }, [])

  const checkAuthAndFetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      setSession(session)
      await fetchDashboardData(session)
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/login')
    }
  }

  // --- DELETE HANDLER ---
  const handleDeleteExpense = async (expenseId) => {
    if (!confirm(`Are you sure you want to delete expense ID ${expenseId}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = session.access_token;
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete expense: ${response.statusText}`);
      }
      
      alert(`Successfully deleted expense ${expenseId}.`);
      
      // OPTIMISTIC UI UPDATE: Remove the item from local state
      setRecentExpenses(prev => prev.filter(exp => exp.id !== expenseId));
      setFlaggedTransactions(prev => prev.filter(exp => exp.id !== expenseId));

      // Re-fetch all dashboard stats to update YTD totals, GST claimed, etc.
      await fetchDashboardData(session); 

    } catch (error) {
      console.error('Deletion failed:', error);
      alert(`Error deleting expense: ${error.message}`);
    }
  };
  // ----------------------

  // CA Connect Handler
  const handleCAConnect = () => {
    alert('CA Connect feature is coming soon! You will be able to share reports directly with your CA.');
  }


  const fetchDashboardData = async (session) => {
    try {
      setLoading(true)
      
      // Fetch data from dedicated BE endpoints
      const [metricsRes, flaggedRes, duplicateRes, expensesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/expenses/dashboard`, {
              headers: { 'Authorization': `Bearer ${session.access_token}` }
          }),
          fetch(`${API_BASE_URL}/expenses/flagged`, {
              headers: { 'Authorization': `Bearer ${session.access_token}` }
          }),
          fetch(`${API_BASE_URL}/duplicate-detection`, {
              headers: { 'Authorization': `Bearer ${session.access_token}` }
          }),
          fetch(`${API_BASE_URL}/expenses`, {
              headers: { 'Authorization': `Bearer ${session.access_token}` }
          })
      ]);

      let allExpenses = [];
      let metrics = {};
      
      // 1. Process Raw Expenses
      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        allExpenses = expensesData.expenses || []; 
        setRecentExpenses(allExpenses.slice(0, 5) || []);
      }

      // 2. Process Dashboard Metrics
      if (metricsRes.ok) {
          metrics = await metricsRes.json(); 
          const monthlyGrowth = calculateMonthlyGrowth(allExpenses); 
          
          setStats({
             totalExpensesYTD: metrics.totalExpensesYTD || 0,
             totalGSTClaimed: metrics.totalGSTClaimed || 0,
             totalOtherTaxes: metrics.totalOtherTaxes || 0,
             riskScoreAverage: metrics.riskScoreAverage || '0.0',
             monthlyGrowth: monthlyGrowth,
             taxSavings: (metrics.totalGSTClaimed || 0) * 1.2, // Placeholder estimation
            
          });
          
          const topCategories = metrics.topLeakageCategories || [];
          setLeakageData({
              topCategories: topCategories,
              aiRecommendation: topCategories.length > 0 
                  ? `Priority Leakage Alert: ${topCategories[0].category} accounts for the highest risky spending. Review spending policy in this area.`
                  : "Your financial health is stable. Keep tracking expenses to optimize further.",
              leakageRiskAvg: metrics.riskScoreAverage || 0
          });
      }
      
      // 3. Process Flagged and Duplicates for Alerts
      let combinedAlerts = [];
      
      // Process Leakage Alerts from /expenses/flagged
      if (flaggedRes.ok) {
          const flaggedExpenses = await flaggedRes.json();
          combinedAlerts.push(...flaggedExpenses.map(exp => ({
            id: exp.id,
            merchant: exp.merchant,
            amount: exp.total_amount_numeric,
            reason: `High Leakage Risk: ${exp.flag_reason || 'Review spending source'}`,
            date: exp.date,
            risk: 'high'
          })));
      }
      
      // Process Duplicates 
      if (duplicateRes.ok) {
          const duplicateData = await duplicateRes.json();
          combinedAlerts.push(...processFlaggedTransactions(duplicateData.duplicates || [])); 
      }
      setFlaggedTransactions(combinedAlerts);

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setStats({
          totalExpensesYTD: 0, totalGSTClaimed: 0, totalOtherTaxes: 0, riskScoreAverage: '0.0', 
          monthlyGrowth: 0, taxOptimization: 0, taxSavings: 0
      });
      setLeakageData({ topCategories: [], aiRecommendation: "Failed to connect to backend. Please check your server.", leakageRiskAvg: 0 });
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading your financial dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <div className="flex-1 p-6">
        {/* Navigation Header */}
        <header className="flex justify-between items-center pb-6 border-b border-white/10 mb-8">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-purple-400" />
            TaxTracker Dashboard
          </h1>
          <button 
            onClick={handleSignOut} 
            className="text-white/70 hover:text-white transition-colors flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </header>
        
        {/* Dashboard Content */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-white mb-4">Key Financial Summary</h2>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
            <DashboardMetricCard 
                icon={<IndianRupee className="w-5 h-5 text-white" />}
                title="Total Expenses YTD"
                value={stats ? formatCurrency(stats.totalExpensesYTD) : '₹0'}
                change={stats ? `+${stats.monthlyGrowth}%` : '+0%'}
                trend={stats && stats.monthlyGrowth > 0 ? 'up' : 'down'}
                gradient="from-blue-500 to-purple-600"
            />
            <DashboardMetricCard 
                icon={<Layers className="w-5 h-5 text-white" />}
                title="Total GST Claimed"
                value={stats ? formatCurrency(stats.totalGSTClaimed) : '₹0'}
                change="7% YOY"
                trend="up"
                gradient="from-green-500 to-teal-600"
            />
            <DashboardMetricCard 
                icon={<Shield className="w-5 h-5 text-white" />}
                title="Average Leakage Risk"
                value={stats ? stats.riskScoreAverage : '0.0'}
                change="Review"
                changeColor={stats && stats.riskScoreAverage >= 7 ? 'text-red-400' : 'text-yellow-400'}
                trend={stats && stats.riskScoreAverage >= 7 ? 'up' : 'down'}
                gradient="from-red-500 to-pink-600"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Leakage Analysis Section */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Droplet className="w-5 h-5 text-red-400" />
                    Leakage Analysis
                </h3>
                <div className="space-y-6">
                    <div className="p-4 bg-red-900/30 rounded-lg border border-red-700/50 flex items-start gap-3">
                        <Lightbulb className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-100 font-medium">
                            {leakageData.aiRecommendation}
                        </p>
                    </div>

                    <h4 className="text-lg font-semibold text-white mt-4 border-b border-white/10 pb-2">Top 5 Leakage Categories</h4>
                    <ul className="space-y-3">
                        {leakageData.topCategories.length > 0 ? (
                            leakageData.topCategories.map((item, index) => (
                                <li key={index} className="flex justify-between items-center text-sm text-purple-200">
                                    <span className="font-medium text-white">{item.category}</span>
                                    <span className="font-bold text-red-400">{formatCurrency(item.amount)}</span>
                                </li>
                            ))
                        ) : (
                            <li className="text-sm text-purple-300">No high-risk categories detected.</li>
                        )}
                    </ul>
                </div>
            </div>
                
            {/* Risk Alerts */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Risk Alerts ({flaggedTransactions.length})
                </h3>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {flaggedTransactions.length > 0 ? (
                        flaggedTransactions.slice(0, 5).map((alert, index) => (
                            <div key={alert.id || index} className={`p-3 rounded-lg flex justify-between items-center ${alert.risk === 'high' ? 'bg-red-900/20 border border-red-700/50' : 'bg-yellow-900/20 border border-yellow-700/50'}`}>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{alert.reason}</p>
                                    <p className="text-xs text-purple-200">{alert.merchant} · {formatCurrency(alert.amount)}</p>
                                </div>
                                <button
                                    onClick={() => handleDeleteExpense(alert.id)} 
                                    className="text-red-500 hover:text-red-400 transition-colors p-1 rounded ml-3"
                                    title="Delete Transaction"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                            <p className="text-purple-200">All Clear!</p>
                            <p className="text-purple-300 text-sm">No high-risk transactions detected.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions, CA Connect, MSME and Recent Expenses */}
            <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Quick Actions */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        Quick Actions
                    </h3>
                    <div className="space-y-4">
                        <button 
                            onClick={() => router.push('/scan')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                        >
                            <Camera className="w-5 h-5" />
                            Scan New Receipt
                        </button>
                        <button 
                            onClick={() => router.push('/transactions')}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                        >
                            <FileText className="w-5 h-5" />
                            View All Transactions
                        </button>
                    </div>
                </div>

                {/* CA Connect */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-cyan-400" />
                        CA Connect
                    </h3>
                    <button 
                        onClick={handleCAConnect}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                        Connect with CA
                    </button>
                    <p className="text-purple-300 text-xs mt-3">Share reports directly with your Chartered Accountant.</p>
                </div>

                {/* MSME Registration */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-green-400" />
                        MSME Registration
                    </h3>
                    <a 
                        href="https://udyamregistration.gov.in/Government-India/Ministry-MSME-registration.htm"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                        Register MSME
                    </a>
                   <p className="text-purple-300 text-2xl mt-3 font-bold">1. Priority Sector Lending at 9%  2. 50% Power Bill Subsidy   3.Delayed Payment Protection</p>
                </div>

                {/* Recent Expenses */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-blue-400" />
                        Recent Expenses
                    </h3>
                    <div className="space-y-4">
                        {recentExpenses.length > 0 ? (
                        recentExpenses.map((expense, idx) => (
                            <div 
                                key={expense.id || idx} 
                                className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white text-sm truncate">{expense.merchant}</p>
                                    <p className="text-purple-200 text-xs">{expense.category} · {expense.date}</p>
                                </div>
                                
                                <div className="flex items-center space-x-3 flex-shrink-0">
                                    <p className="text-white text-sm font-semibold">{formatCurrency(expense.total_amount_numeric)}</p>
                                    
                                    <button 
                                        onClick={() => handleDeleteExpense(expense.id)}
                                        className="text-red-500 hover:text-red-400 transition-colors p-1 rounded"
                                        title="Delete Transaction"
                                    >
                                        <Trash2 className="w-4 h-4" /> 
                                    </button>
                                </div>
                            </div>
                        ))
                        ) : (
                        <div className="text-center py-8">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-purple-200">No expenses yet</p>
                            <p className="text-purple-300 text-sm">Scan your first receipt to get started</p>
                        </div>
                        )}
                    </div>
                </div>
            </div>

          </div>
        </div>
      </div>
      <Footer/>
    </div>
  )
}
