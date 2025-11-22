// pages/transactions.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import TransactionList from '../components/TransactionList'

const API_BASE_URL = 'http://localhost:3001/api'

export default function TransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {
    checkAuthAndFetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Dependency array includes router implicitly via hook

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    } else {
      setSession(session)
      await fetchTransactions(session)
    }
  }

  const fetchTransactions = async (currentSession) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/expenses`, {
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`
        }
      })
      
      const data = await response.json()
      
      // FIX: Extract the 'expenses' array from the response object
      if (data && Array.isArray(data.expenses)) {
          setTransactions(data.expenses)
      } else {
          console.error('API response did not contain an expenses array:', data);
          setTransactions([]); 
      }

    } catch (error) {
      console.error('Error fetching transactions:', error)
      setTransactions([]);
    } finally {
      setLoading(false)
    }
  }

  // --- DELETE HANDLER ---
  const handleDeleteExpense = async (expenseId) => {
    if (!session || !confirm(`Are you sure you want to delete expense ID ${expenseId}? This action cannot be undone.`)) {
        return
    }

    try {
        const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to delete expense: ${response.statusText}`);
        }
        
        alert(`Expense ${expenseId} deleted successfully.`);
        
        // Optimistically update the UI by removing the deleted item
        setTransactions(prev => prev.filter(exp => exp.id !== expenseId));

    } catch (error) {
        console.error('Deletion failed:', error);
        alert(`Error deleting expense: ${error.message}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">All Transactions</h1>
      <TransactionList 
        // Pass state and handler as props
        transactions={transactions} 
        loading={loading}
        onDeleteExpense={handleDeleteExpense}
      />
    </div>
  )
}
