const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced prompt with structured output instructions
const SYSTEM_PROMPT = `
You are an expert financial analyst and OCR system. Analyze the receipt image and extract the following information in JSON format:

{
  "merchant": "Name of the vendor/merchant",
  "totalAmountStr": "Total amount with currency symbol (e.g., '₹1,500.00')",
  "date": "Transaction date in YYYY-MM-DD format",
  "category": "Expense category (Fuel, Meals, Supplies, Travel, Software, Office, Utilities, Marketing, Entertainment, Transportation, Other)",
  "gstAmountStr": "GST amount with currency or '₹0.00' if none",
  "otherTaxAmountStr": "Other taxes with currency or '₹0.00' if none",
  "taxDeductible": true/false,
  "confidenceScore": 0.0-1.0,
  "leakageRiskScore": 0-10,
  "flagReason": "Reason for risk score",
  "savingsInsight": "Actionable financial insight (max 15 words)"
}

LEAKAGE RISK SCORING GUIDE:
- 0-3: Essential business expense (office supplies, fuel, utilities)
- 4-6: Moderate risk (business meals, standard software)
- 7-10: High risk (luxury items, excessive entertainment, premium subscriptions)

Return ONLY valid JSON. No additional text.
`;

async function callGeminiWithRetry(imageBase64, maxRetries = 3) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      topK: 40,
    }
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent([
        {
          text: SYSTEM_PROMPT
        },
        {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/jpeg'
          }
        }
      ]);
      
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        return JSON.parse(jsonString);
      }
      
      throw new Error('No JSON found in response');
      
    } catch (error) {
      console.log(`Gemini API attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        // Return a fallback response if all retries fail
        return getFallbackResponse();
      }
      
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Fallback response for when Gemini fails
function getFallbackResponse() {
  return {
    merchant: "Unknown Merchant",
    totalAmountStr: "₹0.00",
    date: new Date().toISOString().split('T')[0],
    category: "Other",
    gstAmountStr: "₹0.00",
    otherTaxAmountStr: "₹0.00",
    taxDeductible: false,
    confidenceScore: 0.1,
    leakageRiskScore: 5,
    flagReason: "Unable to analyze receipt image",
    savingsInsight: "Please verify expense details manually"
  };
}

// Helper function to parse currency
function parseCurrency(amountStr) {
  if (!amountStr) return 0;
  
  // Handle various currency formats
  const numericString = amountStr
    .replace(/[^\d.,]/g, '') // Remove non-numeric characters except dots and commas
    .replace(/,/g, ''); // Remove commas
  
  const amount = parseFloat(numericString);
  return isNaN(amount) ? 0 : Math.round(amount * 100) / 100;
}

// Validate extracted data
function validateExtractedData(data) {
  const required = ['merchant', 'totalAmountStr', 'date', 'category', 'gstAmountStr', 'otherTaxAmountStr', 'taxDeductible', 'confidenceScore', 'leakageRiskScore', 'flagReason'];
  
  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Ensure scores are within valid ranges
  data.leakageRiskScore = Math.max(0, Math.min(10, parseInt(data.leakageRiskScore) || 5));
  data.confidenceScore = Math.max(0, Math.min(1, parseFloat(data.confidenceScore) || 0.5));
  
  return data;
}

router.post('/', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    // Verify user with Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    console.log('Processing receipt for user:', user.email);

    // Process image with Gemini AI
    const extractedData = await callGeminiWithRetry(imageBase64);
    console.log('Extracted data:', extractedData);

    // Validate and clean the data
    const validatedData = validateExtractedData(extractedData);

    // Convert currency strings to numbers
    const totalAmountNumeric = parseCurrency(validatedData.totalAmountStr);
    const gstAmountNumeric = parseCurrency(validatedData.gstAmountStr);
    const otherTaxAmountNumeric = parseCurrency(validatedData.otherTaxAmountStr);

    // Insert into database
    const { data: expense, error: dbError } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        merchant: validatedData.merchant,
        date: validatedData.date,
        category: validatedData.category,
        total_amount_str: validatedData.totalAmountStr,
        total_amount_numeric: totalAmountNumeric,
        gst_amount_str: validatedData.gstAmountStr,
        gst_amount_numeric: gstAmountNumeric,
        other_tax_amount_str: validatedData.otherTaxAmountStr,
        other_tax_amount_numeric: otherTaxAmountNumeric,
        tax_deductible: validatedData.taxDeductible,
        confidence_score: validatedData.confidenceScore,
        leakage_risk_score: validatedData.leakageRiskScore,
        flag_reason: validatedData.flagReason,
        savings_insight: validatedData.savingsInsight || 'No insight provided'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Failed to save expense' });
    }

    console.log('Receipt processed successfully:', expense.id);

    res.json({
      success: true,
      data: expense,
      message: 'Receipt processed successfully'
    });

  } catch (error) {
    console.error('Process receipt error:', error);
    res.status(500).json({ 
      error: 'Failed to process receipt',
      details: error.message,
      // Provide a fallback for development
      fallback: process.env.NODE_ENV === 'development' ? getFallbackResponse() : undefined
    });
  }
});

module.exports = router;
