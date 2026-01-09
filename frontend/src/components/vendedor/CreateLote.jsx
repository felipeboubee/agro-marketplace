import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from "../../services/api";
import '../../styles/forms.css';

const CreateLote = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    location: '',
    animal_type: 'novillitos',
    male_count: 0,
    female_count: 0,
    total_count: 0,
    average_weight: '',
    breed: '',
    base_price: '',
    feeding_type: 'engorde',
    video_url: '',
    photos: [],
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [previewPhotos, setPreviewPhotos] = useState([]);

  // Calcular total automáticamente
  useEffect(() => {
    const total = parseInt(formData.male_count) + parseInt(formData.female_count);
    setFormData(prev => ({
      ...prev,
      total_count: total
    }));
  }, [formData.male_count, formData.female_count]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = [...formData.photos];
    const newPreviews = [...previewPhotos];

    files.forEach(file => {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten imágenes');
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB');
        return;
      }

      // Agregar a la lista
      newPhotos.push(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        setPreviewPhotos([...newPreviews]);
      };
      reader.readAsDataURL(file);
    });

    setFormData(prev => ({
      ...prev,
      photos: newPhotos
    }));
  };

  const removePhoto = (index) => {
    const newPhotos = [...formData.photos];
    const newPreviews = [...previewPhotos];
    
    newPhotos.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      photos: newPhotos
    }));
    setPreviewPhotos(newPreviews);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.location) newErrors.location = 'La ubicación es requerida';
    if (!formData.animal_type) newErrors.animal_type = 'El tipo de animal es requerido';
    if (formData.total_count <= 0) newErrors.total_count = 'La cantidad total debe ser mayor a 0';
    if (!formData.average_weight || formData.average_weight <= 0) newErrors.average_weight = 'El peso promedio es requerido';
    if (!formData.base_price || formData.base_price <= 0) newErrors.base_price = 'El precio base es requerido';
    if (!formData.breed) newErrors.breed = 'La raza es requerida';
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Crear FormData para enviar archivos
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'photos') {
          formData.photos.forEach(photo => {
            formDataToSend.append('photos', photo);
          });
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await api.post('/lotes/create', formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Redirigir a la página del lote creado
      navigate(`/vendedor/lote/${response.data.lote.id}`);
    } catch (error) {
      console.error('Error creating lote:', error);
      alert('Error al crear el lote. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const animalTypes = [
    { value: 'novillitos', label: 'Novillitos' },
    { value: 'vaquillonas', label: 'Vaquillonas' },
    { value: 'vacas', label: 'Vacas' },
    { value: 'toros', label: 'Toros' },
    { value: 'terneros', label: 'Terneros' }
  ];

  const feedingTypes = [
    { value: 'engorde', label: 'Engorde a corral' },
    { value: 'pastura', label: 'Pastura natural' },
    { value: 'mixto', label: 'Mixto' },
    { value: 'recría', label: 'Recría' }
  ];

  return (
    <div className="form-container">
      <div className="form-header">
        <h1>Publicar Nuevo Lote</h1>
        <p>Completa todos los datos para ofrecer tu lote en el mercado</p>
      </div>

      <form onSubmit={handleSubmit} className="lote-form">
        {/* Sección 1: Información Básica */}
        <div className="form-section">
          <h3 className="section-title">Información Básica</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="location">
                Ubicación del Lote *
                {errors.location && <span className="error-text"> {errors.location}</span>}
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ej: Estancia La Esperanza, Córdoba"
                className={errors.location ? 'error' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="animal_type">
                Tipo de Animal *
                {errors.animal_type && <span className="error-text"> {errors.animal_type}</span>}
              </label>
              <select
                id="animal_type"
                name="animal_type"
                value={formData.animal_type}
                onChange={handleChange}
                className={errors.animal_type ? 'error' : ''}
              >
                {animalTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="breed">
                Raza *
                {errors.breed && <span className="error-text"> {errors.breed}</span>}
              </label>
              <input
                type="text"
                id="breed"
                name="breed"
                value={formData.breed}
                onChange={handleChange}
                placeholder="Ej: Angus, Hereford, Brangus"
                className={errors.breed ? 'error' : ''}
              />
            </div>
          </div>
        </div>

        {/* Sección 2: Cantidad y Peso */}
        <div className="form-section">
          <h3 className="section-title">Cantidad y Peso</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="male_count">Cantidad de Machos</label>
              <input
                type="number"
                id="male_count"
                name="male_count"
                value={formData.male_count}
                onChange={handleChange}
                min="0"
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="female_count">Cantidad de Hembras</label>
              <input
                type="number"
                id="female_count"
                name="female_count"
                value={formData.female_count}
                onChange={handleChange}
                min="0"
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="total_count">
                Cantidad Total *
                {errors.total_count && <span className="error-text"> {errors.total_count}</span>}
              </label>
              <input
                type="number"
                id="total_count"
                name="total_count"
                value={formData.total_count}
                readOnly
                className="readonly"
              />
              <small>Calculado automáticamente</small>
            </div>

            <div className="form-group">
              <label htmlFor="average_weight">
                Peso Promedio (kg) *
                {errors.average_weight && <span className="error-text"> {errors.average_weight}</span>}
              </label>
              <input
                type="number"
                id="average_weight"
                name="average_weight"
                value={formData.average_weight}
                onChange={handleChange}
                min="1"
                step="0.1"
                placeholder="Ej: 350.5"
                className={errors.average_weight ? 'error' : ''}
              />
            </div>
          </div>
        </div>

        {/* Sección 3: Precio y Tipo de Engorde */}
        <div className="form-section">
          <h3 className="section-title">Precio y Alimentación</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="base_price">
                Precio Base por Kg ($) *
                {errors.base_price && <span className="error-text"> {errors.base_price}</span>}
              </label>
              <input
                type="number"
                id="base_price"
                name="base_price"
                value={formData.base_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Ej: 4.85"
                className={errors.base_price ? 'error' : ''}
              />
              <small>Precio sugerido según mercado: $4.85 - $5.20</small>
            </div>

            <div className="form-group">
              <label htmlFor="feeding_type">Tipo de Engorde/Crianza</label>
              <select
                id="feeding_type"
                name="feeding_type"
                value={formData.feeding_type}
                onChange={handleChange}
              >
                {feedingTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sección 4: Multimedia */}
        <div className="form-section">
          <h3 className="section-title">Fotos y Videos</h3>
          
          {/* Upload de Fotos */}
          <div className="form-group">
            <label>Fotos del Lote (Máx. 10)</label>
            <div className="file-upload-area">
              <input
                type="file"
                id="photos"
                name="photos"
                onChange={handleFileChange}
                multiple
                accept="image/*"
                style={{ display: 'none' }}
              />
              <label htmlFor="photos" className="file-upload-label">
                <div className="upload-icon">📷</div>
                <p>Haz clic para subir fotos</p>
                <small>Formatos: JPG, PNG. Máx. 5MB por foto</small>
              </label>
            </div>

            {/* Preview de Fotos */}
            {previewPhotos.length > 0 && (
              <div className="photos-preview">
                <h4>Fotos seleccionadas ({previewPhotos.length})</h4>
                <div className="preview-grid">
                  {previewPhotos.map((preview, index) => (
                    <div key={index} className="preview-item">
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-photo"
                        onClick={() => removePhoto(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Campo de Video */}
          <div className="form-group">
            <label htmlFor="video_url">URL de Video (opcional)</label>
            <input
              type="url"
              id="video_url"
              name="video_url"
              value={formData.video_url}
              onChange={handleChange}
              placeholder="https://youtube.com/watch?v=..."
            />
            <small>Puedes subir un video a YouTube y pegar el enlace aquí</small>
          </div>
        </div>

        {/* Sección 5: Descripción */}
        <div className="form-section">
          <h3 className="section-title">Descripción Adicional</h3>
          <div className="form-group">
            <label htmlFor="description">Descripción del Lote</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Describe las condiciones del lote, alimentación, sanidad, etc..."
            />
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/vendedor')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Publicando...' : 'Publicar Lote'}
          </button>
        </div>
      </form>

      {/* Resumen del Lote */}
      <div className="form-summary">
        <h3>Resumen del Lote</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Valor Total Estimado:</span>
            <span className="summary-value">
              ${formData.total_count && formData.average_weight && formData.base_price 
                ? (formData.total_count * formData.average_weight * formData.base_price).toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })
                : '0.00'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Peso Total:</span>
            <span className="summary-value">
              {formData.total_count && formData.average_weight 
                ? (formData.total_count * formData.average_weight).toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) + ' kg'
                : '0 kg'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateLote;