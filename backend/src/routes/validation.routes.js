const express = require('express');
const router = express.Router();

router.post('/scan', (req, res) => {
  res.status(501).json({ message: 'Scan and validate ticket - To be implemented' });
});

router.get('/event/:id', (req, res) => {
  res.status(501).json({ message: 'Get validation stats - To be implemented' });
});

module.exports = router;
