const pool = require('../config/database');

class Question {
  // Create a new question
  async create(loteId, buyerId, questionText) {
    const query = `
      INSERT INTO questions (lote_id, buyer_id, question_text, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    const { rows } = await pool.query(query, [loteId, buyerId, questionText]);
    return rows[0];
  }

  // Get all questions for a lote with their answers
  async findByLoteId(loteId) {
    const query = `
      SELECT 
        q.id,
        q.lote_id,
        q.buyer_id,
        q.question_text,
        q.created_at,
        q.is_blocked,
        u.name as buyer_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', a.id,
              'answer_text', a.answer_text,
              'created_at', a.created_at,
              'is_blocked', a.is_blocked,
              'seller_name', us.name
            ) ORDER BY a.created_at ASC
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) as answers
      FROM questions q
      LEFT JOIN users u ON q.buyer_id = u.id
      LEFT JOIN answers a ON a.question_id = q.id
      LEFT JOIN users us ON a.seller_id = us.id
      WHERE q.lote_id = $1 AND q.is_blocked = false
      GROUP BY q.id, q.lote_id, q.buyer_id, q.question_text, q.created_at, q.is_blocked, u.name
      ORDER BY q.created_at DESC
    `;
    const { rows } = await pool.query(query, [loteId]);
    return rows;
  }

  // Get a single question by ID
  async findById(questionId) {
    const query = 'SELECT * FROM questions WHERE id = $1';
    const { rows } = await pool.query(query, [questionId]);
    return rows[0];
  }

  // Mark question as blocked
  async blockQuestion(questionId) {
    const query = `
      UPDATE questions
      SET is_blocked = true
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(query, [questionId]);
    return rows[0];
  }

  // Create an answer to a question
  async createAnswer(questionId, sellerId, answerText) {
    const query = `
      INSERT INTO answers (question_id, seller_id, answer_text, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    const { rows } = await pool.query(query, [questionId, sellerId, answerText]);
    return rows[0];
  }

  // Mark answer as blocked
  async blockAnswer(answerId) {
    const query = `
      UPDATE answers
      SET is_blocked = true
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(query, [answerId]);
    return rows[0];
  }

  // Get question count for a lote
  async getQuestionCount(loteId) {
    const query = `
      SELECT COUNT(*) as count
      FROM questions
      WHERE lote_id = $1 AND is_blocked = false
    `;
    const { rows } = await pool.query(query, [loteId]);
    return parseInt(rows[0].count);
  }
}

module.exports = new Question();
