-- Create questions table for buyer-seller Q&A
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  lote_id INTEGER NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
  buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_blocked BOOLEAN DEFAULT FALSE,
  CONSTRAINT check_question_text_length CHECK (char_length(question_text) <= 1000)
);

CREATE INDEX idx_questions_lote_id ON questions(lote_id);
CREATE INDEX idx_questions_buyer_id ON questions(buyer_id);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);
