const Question = require('../models/Question');
const Lote = require('../models/Lote');

// Regex patterns to detect email addresses and phone numbers
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_PATTERN = /(\+?\d{1,4}[\s-]?)?(\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/g;
const WHATSAPP_PATTERN = /\b(whatsapp|wsp|wasap|wa|tel[eé]fono|celular|contacto|llamar|llamame|ll[aá]mame)\b/gi;

// Function to check if text contains contact information
const containsContactInfo = (text) => {
  if (!text) return false;
  
  // Check for email addresses
  if (EMAIL_PATTERN.test(text)) {
    return true;
  }
  
  // Check for phone numbers (at least 7 digits)
  const phoneMatches = text.match(PHONE_PATTERN);
  if (phoneMatches && phoneMatches.some(match => match.replace(/\D/g, '').length >= 7)) {
    return true;
  }
  
  // Check for WhatsApp or phone-related keywords combined with numbers
  if (WHATSAPP_PATTERN.test(text)) {
    const hasNumbers = /\d{3,}/.test(text);
    if (hasNumbers) {
      return true;
    }
  }
  
  return false;
};

// Get all questions for a lote
exports.getQuestionsByLote = async (req, res) => {
  try {
    const { loteId } = req.params;
    
    const questions = await Question.findByLoteId(loteId);
    
    // Filter out blocked answers from each question
    const filteredQuestions = questions.map(q => ({
      ...q,
      answers: q.answers.filter(a => !a.is_blocked)
    }));
    
    res.json(filteredQuestions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Error al obtener las consultas' });
  }
};

// Create a new question
exports.createQuestion = async (req, res) => {
  try {
    const { loteId } = req.params;
    const { question_text } = req.body;
    const userId = req.userId;
    const userType = req.userType;
    
    // Verify user is a buyer
    if (userType !== 'comprador') {
      return res.status(403).json({ error: 'Solo los compradores pueden hacer preguntas' });
    }
    
    // Validate question text
    if (!question_text || question_text.trim().length === 0) {
      return res.status(400).json({ error: 'La pregunta no puede estar vacía' });
    }
    
    if (question_text.length > 1000) {
      return res.status(400).json({ error: 'La pregunta es demasiado larga (máximo 1000 caracteres)' });
    }
    
    // Check if lote exists
    const lote = await Lote.findById(loteId);
    if (!lote) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }
    
    // Check for contact information
    if (containsContactInfo(question_text)) {
      return res.status(400).json({ 
        error: 'No está permitido compartir información de contacto (email, teléfono, WhatsApp) en las consultas. Por favor, usa el sistema de mensajería de la plataforma.' 
      });
    }
    
    // Create the question
    const question = await Question.create(loteId, userId, question_text);
    
    res.status(201).json({
      message: 'Pregunta enviada exitosamente',
      question
    });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Error al crear la pregunta' });
  }
};

// Create an answer to a question
exports.createAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer_text } = req.body;
    const userId = req.userId;
    const userType = req.userType;
    
    // Verify user is a seller
    if (userType !== 'vendedor') {
      return res.status(403).json({ error: 'Solo los vendedores pueden responder preguntas' });
    }
    
    // Validate answer text
    if (!answer_text || answer_text.trim().length === 0) {
      return res.status(400).json({ error: 'La respuesta no puede estar vacía' });
    }
    
    if (answer_text.length > 1000) {
      return res.status(400).json({ error: 'La respuesta es demasiado larga (máximo 1000 caracteres)' });
    }
    
    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }
    
    // Verify that the seller owns the lote
    const lote = await Lote.findById(question.lote_id);
    if (!lote || lote.seller_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para responder esta pregunta' });
    }
    
    // Check for contact information
    if (containsContactInfo(answer_text)) {
      return res.status(400).json({ 
        error: 'No está permitido compartir información de contacto (email, teléfono, WhatsApp) en las respuestas. Por favor, usa el sistema de mensajería de la plataforma.' 
      });
    }
    
    // Create the answer
    const answer = await Question.createAnswer(questionId, userId, answer_text);
    
    res.status(201).json({
      message: 'Respuesta enviada exitosamente',
      answer
    });
  } catch (error) {
    console.error('Error creating answer:', error);
    res.status(500).json({ error: 'Error al crear la respuesta' });
  }
};

// Get question count for a lote
exports.getQuestionCount = async (req, res) => {
  try {
    const { loteId } = req.params;
    
    const count = await Question.getQuestionCount(loteId);
    
    res.json({ count });
  } catch (error) {
    console.error('Error getting question count:', error);
    res.status(500).json({ error: 'Error al obtener el conteo de preguntas' });
  }
};
