const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).send('Welcome to the Fringe Online Booking System');
});

module.exports = router;