const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const getGenAI = () => {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'test-gemini-key') {
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return null;
};

// AI Facility Insights - for Admin Dashboard
router.post('/facility-insights', authenticate, async (req, res) => {
  try {
    const { occupancy, pendingTickets, revenue, capacity } = req.body;

    const genAI = getGenAI();

    // If no valid API key, provide fallback response
    if (!genAI) {
      console.log('Using fallback insights - no genAI client');
      const fallbackInsights = `• Occupancy at ${occupancy}% - Monitor capacity planning\n• ${pendingTickets} pending maintenance tickets - Schedule reviews\n• Revenue collected: ₹${revenue} - Track payment status`;
      return res.json({ insights: fallbackInsights });
    }

    const prompt = `Given these hostel facility metrics:
- Current Occupancy: ${occupancy}%
- Pending Maintenance Tickets: ${pendingTickets}
- Revenue Collected This Month: ₹${revenue}
- Total Room Capacity: ${capacity}

Provide 3 concise bullet-point insights for a hostel admin dashboard summary. Be professional and actionable.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const insights = result.response.text();

    res.json({ insights });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ message: 'Failed to generate insights' });
  }
});

// Auto-Draft Notice - for Admin Notices
router.post('/draft-notice', authenticate, async (req, res) => {
  try {
    const { idea } = req.body;

    const genAI = getGenAI();

    // If no valid API key, provide fallback response
    if (!genAI) {
      const fallbackNotice = `Notice to All Residents:\n\n${idea}\n\nFor any inquiries, please contact the administration office.`;
      return res.json({ draftNotice: fallbackNotice });
    }

    const prompt = `As a hostel manager, convert this brief notice idea into a professional 4-sentence announcement for residents:
Idea: "${idea}"

Keep it formal, clear, and actionable.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const draftNotice = result.response.text();

    res.json({ draftNotice });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ message: 'Failed to generate notice' });
  }
});

// Enhance Complaint Description - for Student Complaints
router.post('/enhance-complaint', authenticate, async (req, res) => {
  try {
    const { shortDescription } = req.body;

    const genAI = getGenAI();

    // If no valid API key, provide fallback response
    if (!genAI) {
      const fallbackEnhanced = `Maintenance Issue: ${shortDescription}\n\nPlease provide additional details if available. Our maintenance team will review and address this issue promptly.`;
      return res.json({ enhancedDescription: fallbackEnhanced });
    }

    const prompt = `A resident has submitted a brief maintenance complaint. Enhance and rewrite it to be professional, detailed, and clear for maintenance staff:
Original: "${shortDescription}"

Rewrite it as a complete, professional problem description that provides context and details.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const enhancedDescription = result.response.text();

    res.json({ enhancedDescription });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ message: 'Failed to enhance description' });
  }
});

module.exports = router;
