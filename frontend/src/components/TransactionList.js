// components/TransactionList.js
import React from 'react';
import { IndianRupee, Trash2, FileText, FileDown } from 'lucide-react'; // Added FileText and FileDown icons

// Helper function to format currency (INR)
const formatCurrency = (amount) => {
  const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numAmount);
};

// Component for a styled data point in the table (e.g., Risk Score)
const DataBadge = ({ value, type }) => {
  let colorClass = 'bg-gray-100 text-gray-800';
  if (type === 'risk') {
    // Note: If value is a string like '0.0', convert it to a number for comparison
    const numericValue = parseFloat(value);
    if (numericValue >= 7) colorClass = 'bg-red-100 text-red-800 font-bold';
    else if (numericValue >= 4) colorClass = 'bg-yellow-100 text-yellow-800';
    else colorClass = 'bg-green-100 text-green-800';
  } else if (type === 'deductible') {
    colorClass = value ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-500';
  }

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
      {value}
    </span>
  );
};

// Function to convert transaction data array to CSV string
const convertToCsv = (data) => {
    if (!data || data.length === 0) return '';
    
    // Define the headers for the CSV file
    const headers = [
        "ID", "Date", "Merchant", "Category", 
        "Total Amount (INR)", "GST Amount (INR)", "Tax Deductible", 
        "Risk Score", "Flag Reason"
    ];

    // Map the transaction objects to CSV rows
    const rows = data.map(t => [
        `"${t.id}"`, 
        `"${t.date}"`, 
        // Escape internal quotes by doubling them, and wrap in quotes for fields that may contain commas
        `"${t.merchant ? t.merchant.replace(/"/g, '""') : ''}"`, 
        `"${t.category}"`,
        t.total_amount_numeric,
        t.gst_amount_numeric,
        t.tax_deductible ? 'Yes' : 'No',
        t.leakage_risk_score,
        `"${t.flag_reason ? t.flag_reason.replace(/"/g, '""') : ''}"`
    ].join(','));

    // Combine headers and rows
    return [
        headers.join(','),
        ...rows
    ].join('\n');
};


const TransactionList = ({ transactions, loading, onDeleteExpense }) => {
  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="animate-spin inline-block w-6 h-6 border-4 border-t-4 border-indigo-500 border-t-transparent rounded-full mr-2"></div>
        Loading transactions...
      </div>
    );
  }

  // Handler for exporting data to CSV
  const handleExportCsv = () => {
    const csvContent = convertToCsv(transactions);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element to trigger the download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'tax_tracker_transactions.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  };
  
  // Handler for generating PDF (using browser print function)
  const handleExportPdf = () => {
    // This triggers the browser's print dialog, which allows saving the page as a PDF.
    // For a cleaner printout, you would typically use CSS media queries to hide buttons.
    window.print();
  };


  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Expense Transactions</h1>

        {/* Export Buttons Section */}
        <div className="flex justify-end space-x-3 mb-6 print:hidden">
            <button
                onClick={handleExportCsv}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md"
            >
                <FileText className="w-4 h-4" />
                <span>Export to CSV/Excel</span>
            </button>
            <button
                onClick={handleExportPdf}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white font-medium text-sm rounded-lg hover:bg-gray-700 transition duration-150 shadow-md"
            >
                <FileDown className="w-4 h-4" />
                <span>Generate PDF</span>
            </button>
        </div>
        
        {/* Transaction Table */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Merchant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GST
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax Deductible
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length === 0 ? (
                    <tr>
                        <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                            No transactions found. Scan a receipt to add one.
                        </td>
                    </tr>
                ) : transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.merchant}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-right">
                      {formatCurrency(transaction.total_amount_numeric)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {formatCurrency(transaction.gst_amount_numeric)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-left">
                      <DataBadge 
                        value={transaction.tax_deductible ? 'Yes' : 'No'} 
                        type="deductible"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-left">
                      <DataBadge 
                        value={transaction.leakage_risk_score} 
                        type="risk"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium print:hidden">
                      {/* DELETE BUTTON: Calls the prop function */}{/* The print:hidden class ensures the delete button is not shown in the PDF */}
                      <button
                        onClick={() => onDeleteExpense(transaction.id)}
                        className="text-red-600 hover:text-red-900 transition-colors p-1"
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionList;
