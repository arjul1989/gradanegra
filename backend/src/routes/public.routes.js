const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Public routes (no authentication required)

/**
 * @route   GET /api/public/events
 * @desc    Get public events (active/published only)
 * @access  Public
 */
router.get('/events', async (req, res) => {
  try {
    const { category, featured, limit = 50 } = req.query;
    
    let query = admin.firestore()
      .collection('events')
      .where('status', '==', 'active');

    // Filter by category if provided
    if (category) {
      query = query.where('category', '==', category);
    }

    // Filter by featured if provided
    if (featured === 'true') {
      query = query.where('featured', '==', true);
    }

    // Limit results
    query = query.limit(parseInt(limit));

    const snapshot = await query.get();
    
    const events = [];
    snapshot.forEach(doc => {
      events.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Error fetching public events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/public/events/:id
 * @desc    Get public event details by ID
 * @access  Public
 */
router.get('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const eventDoc = await admin.firestore()
      .collection('events')
      .doc(id)
      .get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const eventData = eventDoc.data();

    // Only return if event is active
    if (eventData.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Event not available'
      });
    }

    res.json({
      success: true,
      event: {
        id: eventDoc.id,
        ...eventData
      }
    });
  } catch (error) {
    console.error('Error fetching public event:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error.message
    });
  }
});

module.exports = router;
