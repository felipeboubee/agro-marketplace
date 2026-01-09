const Lote = require('../models/Lote');

const loteController = {
  async createLote(req, res) {
    try {
      const seller_id = req.userId;
      const loteData = {
        seller_id,
        ...req.body
      };

      // Procesar archivos subidos
      if (req.files && req.files.length > 0) {
        loteData.photos = req.files.map(file => file.filename);
      }

      const lote = await Lote.create(loteData);
      
      res.status(201).json({
        message: 'Lote creado exitosamente',
        lote
      });
    } catch (error) {
      console.error('Error creating lote:', error);
      res.status(500).json({ error: 'Error al crear el lote' });
    }
  },

  async getSellerLotes(req, res) {
    try {
      const seller_id = req.userId;
      const lotes = await Lote.findBySeller(seller_id);
      
      res.json(lotes);
    } catch (error) {
      console.error('Error fetching seller lotes:', error);
      res.status(500).json({ error: 'Error al obtener los lotes' });
    }
  },

  async getAllLotes(req, res) {
    try {
      const { 
        location, 
        animal_type, 
        min_price, 
        max_price,
        min_weight,
        max_weight,
        sort_by = 'created_at',
        order = 'DESC'
      } = req.query;

      let query = 'SELECT * FROM lotes WHERE status = $1';
      let params = ['ofertado'];
      let paramCount = 2;

      // Aplicar filtros
      if (location) {
        query += ` AND location ILIKE $${paramCount}`;
        params.push(`%${location}%`);
        paramCount++;
      }

      if (animal_type) {
        query += ` AND animal_type = $${paramCount}`;
        params.push(animal_type);
        paramCount++;
      }

      if (min_price) {
        query += ` AND base_price >= $${paramCount}`;
        params.push(min_price);
        paramCount++;
      }

      if (max_price) {
        query += ` AND base_price <= $${paramCount}`;
        params.push(max_price);
        paramCount++;
      }

      // Ordenar
      const validSortColumns = ['created_at', 'base_price', 'total_count', 'average_weight'];
      const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
      const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      
      query += ` ORDER BY ${sortColumn} ${sortOrder}`;

      const pool = require('../config/database');
      const { rows } = await pool.query(query, params);
      
      res.json(rows);
    } catch (error) {
      console.error('Error fetching lotes:', error);
      res.status(500).json({ error: 'Error al obtener los lotes' });
    }
  }
};

module.exports = loteController;