import { useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { Camera, Upload, Loader2, X, CheckCircle, AlertTriangle, Zap, MousePointerSquareDashed } from 'lucide-react'

// Use the public environment variable for the API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
const MAX_SIZE_MB = 8; // Max file size limit

// Custom Modal component to replace alert() and confirm()
const MessageModal = ({ type, text, onClose }) => {
  const isError = type === 'error';
  const icon = isError ? <AlertTriangle className="w-8 h-8 text-red-500" /> : <CheckCircle className="w-8 h-8 text-green-500" />;
  const title = isError ? "Processing Error" : "Success!";

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl transform transition-all duration-300 scale-100">
        <div className="mb-4 mx-auto w-12 h-12 flex items-center justify-center rounded-full">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{text}</p>
        <button
          onClick={onClose}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-colors duration-200 ${isError ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {isError ? 'Try Again' : 'Go to Dashboard'}
        </button>
      </div>
    </div>
  );
};


export default function ScanReceipt() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [message, setMessage] = useState(null) // State for custom modal messages
  const [isDragging, setIsDragging] = useState(false); // State for drag-and-drop visual feedback

  const processFile = useCallback(async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Invalid file type. Please upload an image (JPEG or PNG).' });
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setMessage({ type: 'error', text: `Image size must be less than ${MAX_SIZE_MB}MB.` });
      return;
    }

    setLoading(true)
    setMessage(null)
    setPreviewUrl(URL.createObjectURL(file))

    try {
      // Convert image to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1]
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/login');
          return;
        }

        // Send to backend for processing
        const response = await fetch(`${API_BASE_URL}/process-receipt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ imageBase64: base64 })
        })

        const result = await response.json()
        
        if (response.ok && result.success) {
          setMessage({ type: 'success', text: result.message || 'Expense successfully logged and analyzed.' })
        } else {
          const errorText = result.error || 'The server failed to process the receipt. Please try again.';
          setMessage({ type: 'error', text: errorText })
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error processing receipt:', error)
      setMessage({ type: 'error', text: 'An unexpected network error occurred. Check your connection.' })
    } finally {
      setLoading(false)
      // Clear the temporary object URL after the process is complete/failed
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [router, previewUrl])


  // Handler for file input change (Capture Receipt button)
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  // Drag-and-drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };


  // Handle modal close action
  const handleMessageClose = () => {
    if (message?.type === 'success') {
      router.push('/dashboard')
    }
    setMessage(null);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-10 text-center shadow-2xl max-w-md w-full">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-6" />
          <p className="text-xl font-bold text-gray-800 mb-2">Analyzing Receipt...</p>
          <p className="text-gray-500">
            Applying AI Vision for OCR, Tax Calculation, and Leakage Risk Assessment. This may take a moment.
          </p>
          {previewUrl && (
            <div className="mt-8">
              <img 
                src={previewUrl} 
                alt="Receipt preview" 
                className="max-w-full h-auto max-h-48 object-contain rounded-lg border-2 border-purple-300 mx-auto shadow-lg" 
              />
              <p className="text-xs text-gray-400 mt-2">Processing image preview...</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-start p-4 sm:p-12">
      
      {/* Header */}
      <div className="w-full max-w-3xl flex items-center justify-start mb-10">
          <Zap className="w-8 h-8 text-purple-400 mr-2" />
          <h1 className="text-3xl font-extrabold text-white tracking-wider">Smart Expense Analyzer</h1>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-3xl bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-10">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Upload className="w-6 h-6 text-purple-400 mr-3" />
            Upload or Capture Receipt
        </h2>
        
        {/* Upload Drop Zone (Enhanced for Drag & Drop) */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-4 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer
            ${isDragging 
              ? 'border-purple-300 bg-gray-700/80 scale-[1.02]' 
              : 'border-purple-500/50 hover:border-purple-500 bg-gray-800/50 hover:bg-gray-800/70'
            }
          `}
        >
          <input
            type="file"
            accept="image/jpeg, image/png, image/webp"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
            id="receipt-upload"
          />
          <label
            htmlFor="receipt-upload"
            className="block"
          >
            {isDragging ? (
                <MousePointerSquareDashed className="w-12 h-12 text-purple-300 mx-auto mb-4 animate-pulse" />
            ) : (
                <Camera className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            )}
            
            <span className="text-xl font-semibold text-white block mb-2">
                {isDragging ? 'Drop Image Here!' : 'Click to Capture or Drag & Drop'}
            </span>
            <span className="text-purple-200 block">
                Take a photo or upload an image file (JPEG, PNG, Max 8MB).
            </span>
          </label>
        </div>
        
        {/* Tips Section */}
        <div className="mt-8 space-y-3">
            <h3 className="text-lg font-semibold text-purple-300">Tips for Best Scan Results:</h3>
            <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                <li>Use good lighting and place the receipt on a contrasting background.</li>
                <li>Ensure all four corners of the receipt are visible in the photo.</li>
                <li>Avoid blurry or crumpled receipts for accurate OCR processing.</li>
            </ul>
        </div>
        
      </div>
      
      {/* Custom Message Modal */}
      {message && (
        <MessageModal 
          type={message.type} 
          text={message.text} 
          onClose={handleMessageClose} 
        />
      )}
    </div>
  )
}
