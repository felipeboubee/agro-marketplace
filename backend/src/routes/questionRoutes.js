const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const auth = require('../middleware/auth');

// Get all questions for a lote (public)
router.get('/lote/:loteId', questionController.getQuestionsByLote);

// Get question count for a lote (public)
router.get('/lote/:loteId/count', questionController.getQuestionCount);

// Create a question (buyer only)
router.post('/lote/:loteId', auth, questionController.createQuestion);

// Create an answer to a question (seller only)
router.post('/:questionId/answer', auth, questionController.createAnswer);

module.exports = router;
