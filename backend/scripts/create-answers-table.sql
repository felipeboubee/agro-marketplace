-- Create answers table for seller responses to buyer questions
CREATE TABLE IF NOT EXISTS answers (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_blocked BOOLEAN DEFAULT FALSE,
  CONSTRAINT check_answer_text_length CHECK (char_length(answer_text) <= 1000)
);

CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_seller_id ON answers(seller_id);
CREATE INDEX idx_answers_created_at ON answers(created_at DESC);
