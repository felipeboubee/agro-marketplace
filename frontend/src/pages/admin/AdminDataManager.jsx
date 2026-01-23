import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { 
  Database,
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  Search,
  RefreshCw,
  Users,
  Package,
  CreditCard,
  FileText,
  ShoppingCart,
  MessageSquare,
  DollarSign,
  CheckSquare,
  Star,
  Settings
} from "lucide-react";
import "../../styles/admin-data-manager.css";

const TABLES = [
  { name: 'users', label: 'Usuarios', icon: Users },
  { name: 'lotes', label: 'Lotes', icon: Package },
  { name: 'offers', label: 'Ofertas', icon: ShoppingCart },
  { name: 'transactions', label: 'Transacciones', icon: DollarSign },
  { name: 'payment_methods', label: 'Métodos de Pago', icon: CreditCard },
  { name: 'payment_orders', label: 'Órdenes de Pago', icon: FileText },
  { name: 'certifications', label: 'Certificaciones', icon: CheckSquare },
  { name: 'seller_bank_accounts', label: 'Cuentas Bancarias', icon: CreditCard },
  { name: 'messages', label: 'Mensajes', icon: MessageSquare },
  { name: 'questions', label: 'Preguntas', icon: MessageSquare },
  { name: 'answers', label: 'Respuestas', icon: MessageSquare },
  { name: 'favorites', label: 'Favoritos', icon: Star },
  { name: 'notifications', label: 'Notificaciones', icon: FileText },
  { name: 'system_settings', label: 'Configuración', icon: Settings },
];

export default function AdminDataManager() {
  const [selectedTable, setSelectedTable] = useState('users');
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRowData, setNewRowData] = useState({});

  useEffect(() => {
    fetchTableData(selectedTable);
  }, [selectedTable]);

  const fetchTableData = async (tableName) => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/tables/${tableName}`);
      setData(response.data || []);
      if (response.data && response.data.length > 0) {
        // Filtrar columnas innecesarias
        const allColumns = Object.keys(response.data[0]);
        const filteredColumns = allColumns.filter(col => {
          // Excluir UUIDs (terminan en _id y son muy largos)
          if (col.includes('uuid')) return false;
          // Excluir campos de tokens y profile_data que generalmente están vacíos
          if (['profile_data', 'verification_token', 'reset_token', 'reset_token_expires'].includes(col)) return false;
          return true;
        });
        setColumns(filteredColumns);
      } else {
        setColumns([]);
      }
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error);
      setData([]);
      setColumns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row) => {
    setEditingRow(row.id);
    setEditedData({ ...row });
  };

  const handleSave = async () => {
    try {
      await api.put(`/admin/tables/${selectedTable}/${editedData.id}`, editedData);
      await fetchTableData(selectedTable);
      setEditingRow(null);
      setEditedData({});
    } catch (error) {
      console.error('Error updating record:', error);
      alert('Error al actualizar el registro');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este registro?')) return;

    try {
      await api.delete(`/admin/tables/${selectedTable}/${id}`);
      await fetchTableData(selectedTable);
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Error al eliminar el registro');
    }
  };

  const handleAdd = async () => {
    try {
      await api.post(`/admin/tables/${selectedTable}`, newRowData);
      await fetchTableData(selectedTable);
      setShowAddForm(false);
      setNewRowData({});
    } catch (error) {
      console.error('Error adding record:', error);
      alert('Error al agregar el registro');
    }
  };

  const handleInputChange = (column, value) => {
    setEditedData({ ...editedData, [column]: value });
  };

  const handleNewRowChange = (column, value) => {
    setNewRowData({ ...newRowData, [column]: value });
  };

  const getFilteredData = () => {
    if (!searchTerm) return data;
    
    return data.filter(row => {
      return Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };

  const renderTableIcon = (tableName) => {
    const table = TABLES.find(t => t.name === tableName);
    if (!table) return <Database size={20} />;
    const Icon = table.icon;
    return <Icon size={20} />;
  };

  const formatCellValue = (value, column) => {
    if (value === null || value === undefined) return '—';
    
    // Format objects/arrays as JSON string
    if (typeof value === 'object') {
      try {
        const jsonStr = JSON.stringify(value);
        if (jsonStr.length > 50) {
          return jsonStr.substring(0, 47) + '...';
        }
        return jsonStr;
      } catch {
        return '[Object]';
      }
    }
    
    // Format booleans
    if (typeof value === 'boolean') {
      return value ? '✓' : '✗';
    }
    
    // Format dates
    if (column.includes('_at') || column === 'created' || column === 'updated') {
      try {
        return new Date(value).toLocaleString('es-AR');
      } catch {
        return value;
      }
    }
    
    // Format numbers with decimals (prices)
    if (column.includes('price') || column.includes('amount')) {
      try {
        return new Intl.NumberFormat('es-AR', { 
          style: 'currency', 
          currency: 'ARS' 
        }).format(value);
      } catch {
        return value;
      }
    }
    
    // Truncate long strings
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 47) + '...';
    }
    
    return value;
  };

  const renderEditableCell = (row, column) => {
    const isEditing = editingRow === row.id;
    const value = isEditing ? editedData[column] : row[column];

    if (!isEditing) {
      return <span>{formatCellValue(value, column)}</span>;
    }

    // Don't allow editing id and timestamp fields
    if (column === 'id' || column.includes('_at')) {
      return <span className="non-editable">{formatCellValue(value, column)}</span>;
    }

    // Boolean fields
    if (typeof row[column] === 'boolean') {
      return (
        <select
          value={value}
          onChange={(e) => handleInputChange(column, e.target.value === 'true')}
          className="edit-select"
        >
          <option value="true">Sí</option>
          <option value="false">No</option>
        </select>
      );
    }

    // Text fields
    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => handleInputChange(column, e.target.value)}
        className="edit-input"
      />
    );
  };

  return (
    <div className="data-manager-container">
      <div className="page-header">
        <h1>
          <Database size={32} />
          Administrador de Base de Datos
        </h1>
        <button 
          className="btn btn-secondary"
          onClick={() => fetchTableData(selectedTable)}
          disabled={loading}
        >
          <RefreshCw size={20} className={loading ? "spin" : ""} />
          Actualizar
        </button>
      </div>

      <div className="data-manager-layout">
        {/* Sidebar con lista de tablas */}
        <div className="tables-sidebar">
          <h3>Tablas</h3>
          <div className="tables-list">
            {TABLES.map(table => (
              <button
                key={table.name}
                className={`table-item ${selectedTable === table.name ? 'active' : ''}`}
                onClick={() => setSelectedTable(table.name)}
              >
                {renderTableIcon(table.name)}
                <span>{table.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main content area */}
        <div className="data-content">
          <div className="data-header">
            <div className="data-title">
              {renderTableIcon(selectedTable)}
              <h2>{TABLES.find(t => t.name === selectedTable)?.label || selectedTable}</h2>
              <span className="record-count">({getFilteredData().length} registros)</span>
            </div>
            
            <div className="data-actions">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowAddForm(true);
                  setNewRowData({});
                }}
              >
                <Plus size={18} />
                Agregar
              </button>
            </div>
          </div>

          {/* Add Form Modal */}
          {showAddForm && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Agregar nuevo registro</h3>
                  <button 
                    className="btn-icon"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewRowData({});
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-grid">
                    {columns.filter(col => col !== 'id' && !col.includes('_at')).map(column => (
                      <div key={column} className="form-group">
                        <label>{column}</label>
                        <input
                          type="text"
                          value={newRowData[column] || ''}
                          onChange={(e) => handleNewRowChange(column, e.target.value)}
                          className="form-input"
                          placeholder={column}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewRowData({});
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={handleAdd}
                  >
                    <Save size={18} />
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Data Table */}
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Cargando datos...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="empty-state">
              <Database size={48} />
              <p>No hay datos en esta tabla</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {columns.map(column => (
                      <th key={column}>{column}</th>
                    ))}
                    <th className="actions-column">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredData().map(row => (
                    <tr key={row.id} className={editingRow === row.id ? 'editing' : ''}>
                      {columns.map(column => (
                        <td key={column}>
                          {renderEditableCell(row, column)}
                        </td>
                      ))}
                      <td className="actions-cell">
                        {editingRow === row.id ? (
                          <div className="action-buttons">
                            <button
                              className="btn-icon btn-success"
                              onClick={handleSave}
                              title="Guardar"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              className="btn-icon btn-secondary"
                              onClick={() => {
                                setEditingRow(null);
                                setEditedData({});
                              }}
                              title="Cancelar"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons">
                            <button
                              className="btn-icon btn-primary"
                              onClick={() => handleEdit(row)}
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="btn-icon btn-danger"
                              onClick={() => handleDelete(row.id)}
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
