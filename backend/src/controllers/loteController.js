const Lote = require('../models/Lote');

const loteController = {
  async createLote(req, res) {
    try {
      const seller_id = req.userId;
      const loteData = {
        seller_id,
        ...req.body
      };

      // Log para debugging
      console.log("Lote creation request body:", req.body);
      console.log("Files received:", req.files);

      // Procesar archivos subidos
      if (req.files && req.files.length > 0) {
        loteData.photos = req.files.map(file => `/uploads/${file.filename}`);
      }

      const lote = await Lote.create(loteData);
      
      res.status(201).json({
        message: 'Lote creado exitosamente',
        lote
      });
    } catch (error) {
      console.error('Error creating lote:', error);
      res.status(500).json({ error: 'Error al crear el lote', details: error.message });
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
  },

  async getLoteById(req, res) {
    try {
      const { id } = req.params;
      const lote = await Lote.findById(id);
      
      if (!lote) {
        return res.status(404).json({ error: 'Lote no encontrado' });
      }
      
      res.json(lote);
    } catch (error) {
      console.error('Error fetching lote:', error);
      res.status(500).json({ error: 'Error al obtener el lote' });
    }
  },

  async updateLote(req, res) {
    try {
      const { id } = req.params;
      const seller_id = req.userId;
      
      // Verify ownership
      const lote = await Lote.findById(id);
      if (!lote || lote.seller_id !== seller_id) {
        return res.status(403).json({ error: 'No tienes permiso para actualizar este lote' });
      }
      
      const updateData = { ...req.body };
      
      // Manejar fotos si hay cambios
      if (req.files && req.files.length > 0) {
        // Obtener fotos existentes que se mantienen
        let existingPhotos = [];
        if (req.body.existing_photos) {
          try {
            existingPhotos = JSON.parse(req.body.existing_photos);
          } catch (e) {
            console.error('Error parsing existing_photos:', e);
          }
        }
        
        // Agregar nuevas fotos
        const newPhotos = req.files.map(file => `/uploads/${file.filename}`);
        updateData.photos = [...existingPhotos, ...newPhotos];
      } else if (req.body.existing_photos) {
        // Solo actualizar con fotos existentes (se eliminaron algunas)
        try {
          updateData.photos = JSON.parse(req.body.existing_photos);
        } catch (e) {
          console.error('Error parsing existing_photos:', e);
        }
      }
      
      // Eliminar existing_photos del objeto de actualización (no es una columna)
      delete updateData.existing_photos;
      
      console.log('Update data:', updateData);
      
      const updatedLote = await Lote.update(id, updateData);
      res.json({ message: 'Lote actualizado exitosamente', lote: updatedLote });
    } catch (error) {
      console.error('Error updating lote:', error);
      res.status(500).json({ error: 'Error al actualizar el lote', details: error.message });
    }
  },

  async deleteLote(req, res) {
    try {
      const { id } = req.params;
      const seller_id = req.userId;
      
      // Verify ownership
      const lote = await Lote.findById(id);
      if (!lote || lote.seller_id !== seller_id) {
        return res.status(403).json({ error: 'No tienes permiso para eliminar este lote' });
      }
      
      await Lote.delete(id);
      res.json({ message: 'Lote eliminado exitosamente' });
    } catch (error) {
      console.error('Error deleting lote:', error);
      res.status(500).json({ error: 'Error al eliminar el lote' });
    }
  }
};

module.exports = loteController;