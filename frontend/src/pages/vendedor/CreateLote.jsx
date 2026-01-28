import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from "../../services/api";
import { formatPrice, formatWeight } from '../../utils/formatters';
import '../../styles/forms.css';

const CreateLote = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    estancia_name: '',
    localidad: '',
    provincia: '',
    animal_type: 'novillitos',
    male_count: '',
    female_count: '',
    total_count: 0,
    average_weight: '',
    breed: '',
    base_price: '',
    feeding_type: 'engorde',
    uniformity: 'uniformidad_media',
    video_url: '',
    photos: [],
    videos: [],
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [previewPhotos, setPreviewPhotos] = useState([]);
  const [previewVideos, setPreviewVideos] = useState([]);

  // Calcular total automáticamente
  useEffect(() => {
    const total = (parseInt(formData.male_count) || 0) + (parseInt(formData.female_count) || 0);
    setFormData(prev => ({
      ...prev,
      total_count: total
    }));
  }, [formData.male_count, formData.female_count]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? value : value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const isPhoto = e.target.name === 'photos';
    if (isPhoto) {
      const newPhotos = [...formData.photos];
      const newPreviews = [...previewPhotos];
      files.forEach(file => {
        if (!file.type.startsWith('image/')) {
          alert('Solo se permiten imágenes');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          alert('La imagen no debe superar los 5MB');
          return;
        }
        newPhotos.push(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result);
          setPreviewPhotos([...newPreviews]);
        };
        reader.readAsDataURL(file);
      });
      setFormData(prev => ({ ...prev, photos: newPhotos }));
    } else {
      // videos
      const newVideos = [...formData.videos];
      const newPreviews = [...previewVideos];
      files.forEach(file => {
        if (!file.type.startsWith('video/')) {
          alert('Solo se permiten videos');
          return;
        }
        if (file.size > 50 * 1024 * 1024) {
          alert('El video no debe superar los 50MB');
          return;
        }
        newVideos.push(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result);
          setPreviewVideos([...newPreviews]);
        };
        reader.readAsDataURL(file);
      });
      setFormData(prev => ({ ...prev, videos: newVideos }));
    }
  };

  const removePhoto = (index) => {
    const newPhotos = [...formData.photos];
    const newPreviews = [...previewPhotos];
    newPhotos.splice(index, 1);
    newPreviews.splice(index, 1);
    setFormData(prev => ({ ...prev, photos: newPhotos }));
    setPreviewPhotos(newPreviews);
  };

  const removeVideo = (index) => {
    const newVideos = [...formData.videos];
    const newPreviews = [...previewVideos];
    newVideos.splice(index, 1);
    newPreviews.splice(index, 1);
    setFormData(prev => ({ ...prev, videos: newVideos }));
    setPreviewVideos(newPreviews);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.estancia_name) newErrors.estancia_name = 'El nombre de la estancia es requerido';
    if (!formData.localidad) newErrors.localidad = 'La localidad es requerida';
    if (!formData.provincia) newErrors.provincia = 'La provincia es requerida';
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
      // Crear FormData para enviar archivos
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'photos') {
          formData.photos.forEach(photo => {
            formDataToSend.append('photos', photo);
          });
        } else if (key === 'videos') {
          formData.videos.forEach(video => {
            formDataToSend.append('videos', video);
          });
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await api.createLote(formDataToSend);
      
      // Redirigir a la página del lote creado
      navigate(`/vendedor/lote/${response.lote.id}`);
    } catch (error) {
      console.error('Error creating lote:', error);
      alert('Error al crear el lote. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const animalTypes = [
    { value: 'ternero', label: 'Ternero/a' },
    { value: 'vaquillona', label: 'Vaquillona' },
    { value: 'novillito', label: 'Novillito' },
    { value: 'novillo', label: 'Novillo' },
    { value: 'vaca', label: 'Vaca' },
    { value: 'vaca_prenada', label: 'Vaca Preñada' },
    { value: 'vaca_descarte', label: 'Vaca Descarte' },
    { value: 'toro', label: 'Toro' },
    { value: 'toro_descarte', label: 'Toro Descarte' }
  ];

  // Lógica para bloquear inputs según el tipo de animal
  const isMaleCountDisabled = () => {
    switch (formData.animal_type) {
      case 'vaquillona':
      case 'vaca':
      case 'vaca_prenada':
      case 'vaca_descarte':
        return true;
      default:
        return false;
    }
  };

  const isFemaleCountDisabled = () => {
    switch (formData.animal_type) {
      case 'novillito':
      case 'novillo':
      case 'toro':
      case 'toro_descarte':
        return true;
      default:
        return false;
    }
  };

  const feedingTypes = [
    { value: 'engorde', label: 'Engorde a corral' },
    { value: 'pastura', label: 'Pastura natural' },
    { value: 'mixto', label: 'Mixto' },
    { value: 'recría', label: 'Recría' }
  ];

  const uniformityOptions = [
    { value: 'poco_uniforme', label: 'Poco uniforme' },
    { value: 'uniformidad_media', label: 'Uniformidad media' },
    { value: 'bastante_uniforme', label: 'Bastante uniforme' },
    { value: 'completamente_uniforme', label: 'Completamente uniforme' }
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
              <label htmlFor="estancia_name">
                Nombre de la Estancia *
                {errors.estancia_name && <span className="error-text"> {errors.estancia_name}</span>}
              </label>
              <input
                type="text"
                id="estancia_name"
                name="estancia_name"
                value={formData.estancia_name}
                onChange={handleChange}
                placeholder="Ej: La Esperanza"
                className={errors.estancia_name ? 'error' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="localidad">
                Localidad *
                {errors.localidad && <span className="error-text"> {errors.localidad}</span>}
              </label>
              <input
                type="text"
                id="localidad"
                name="localidad"
                value={formData.localidad}
                onChange={handleChange}
                placeholder="Ej: Córdoba Capital"
                className={errors.localidad ? 'error' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="provincia">
                Provincia *
                {errors.provincia && <span className="error-text"> {errors.provincia}</span>}
              </label>
              <select
                id="provincia"
                name="provincia"
                value={formData.provincia}
                onChange={handleChange}
                className={errors.provincia ? 'error' : ''}
              >
                <option value="">Seleccionar provincia</option>
                <option value="Buenos Aires">Buenos Aires</option>
                <option value="Catamarca">Catamarca</option>
                <option value="Chaco">Chaco</option>
                <option value="Chubut">Chubut</option>
                <option value="Córdoba">Córdoba</option>
                <option value="Corrientes">Corrientes</option>
                <option value="Entre Ríos">Entre Ríos</option>
                <option value="Formosa">Formosa</option>
                <option value="Jujuy">Jujuy</option>
                <option value="La Pampa">La Pampa</option>
                <option value="La Rioja">La Rioja</option>
                <option value="Mendoza">Mendoza</option>
                <option value="Misiones">Misiones</option>
                <option value="Neuquén">Neuquén</option>
                <option value="Río Negro">Río Negro</option>
                <option value="Salta">Salta</option>
                <option value="San Juan">San Juan</option>
                <option value="San Luis">San Luis</option>
                <option value="Santa Cruz">Santa Cruz</option>
                <option value="Santa Fe">Santa Fe</option>
                <option value="Santiago del Estero">Santiago del Estero</option>
                <option value="Tierra del Fuego">Tierra del Fuego</option>
                <option value="Tucumán">Tucumán</option>
              </select>
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
                placeholder={formData.male_count === '' ? '0' : ''}
                disabled={isMaleCountDisabled()}
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
                placeholder={formData.female_count === '' ? '0' : ''}
                disabled={isFemaleCountDisabled()}
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

            <div className="form-group">
              <label htmlFor="uniformity">Uniformidad del Lote</label>
              <select
                id="uniformity"
                name="uniformity"
                value={formData.uniformity}
                onChange={handleChange}
              >
                {uniformityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
          {/* Upload de Videos */}
          <div className="form-group">
            <label>Videos del Lote (Máx. 2)</label>
            <div className="file-upload-area">
              <input
                type="file"
                id="videos"
                name="videos"
                onChange={handleFileChange}
                multiple
                accept="video/*"
                style={{ display: 'none' }}
              />
              <label htmlFor="videos" className="file-upload-label">
                <div className="upload-icon">🎥</div>
                <p>Haz clic para subir videos</p>
                <small>Formatos: MP4, WebM. Máx. 50MB por video</small>
              </label>
            </div>
            {/* Preview de Videos */}
            {previewVideos.length > 0 && (
              <div className="photos-preview">
                <h4>Videos seleccionados ({previewVideos.length})</h4>
                <div className="preview-grid">
                  {previewVideos.map((preview, index) => (
                    <div key={index} className="preview-item">
                      <video src={preview} controls width="100%" height="100%" />
                      <button
                        type="button"
                        className="remove-photo"
                        onClick={() => removeVideo(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Campo de Video por URL */}
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
              {formData.total_count && formData.average_weight && formData.base_price 
                ? formatPrice(formData.total_count * formData.average_weight * formData.base_price)
                : formatPrice(0)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Peso Total:</span>
            <span className="summary-value">
              {formData.total_count && formData.average_weight 
                ? formatWeight(formData.total_count * formData.average_weight)
                : '0,00 kg'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateLote;
