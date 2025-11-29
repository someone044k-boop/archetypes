import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, Calendar, Clock, User, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API } from '@/App';
import { toast } from 'sonner';

const ChartCalculator = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    birth_time: '',
    birth_location: '',
    latitude: 0,
    longitude: 0
  });

  const searchLocations = async (query) => {
    if (query.length < 3) {
      setLocations([]);
      return;
    }

    setSearchingLocation(true);
    try {
      const response = await axios.post(`${API}/locations/search`, { query });
      setLocations(response.data);
    } catch (error) {
      console.error('Location search error:', error);
      toast.error('Помилка пошуку локації');
    } finally {
      setSearchingLocation(false);
    }
  };

  const selectLocation = (location) => {
    setFormData({
      ...formData,
      birth_location: location.display_name,
      latitude: location.lat,
      longitude: location.lon
    });
    setLocations([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.birth_date || !formData.birth_time || !formData.birth_location) {
      toast.error('Будь ласка, заповніть всі поля');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/natal-charts`, formData);
      toast.success('Натальну карту успішно розраховано!');
      navigate(`/chart/${response.data.id}`);
    } catch (error) {
      console.error('Chart calculation error:', error);
      toast.error('Помилка при розрахунку карти');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <Star size={28} />
            Астрологічний калькулятор
          </Link>
          <div className="navbar-links">
            <Link to="/calculator" className="nav-link active">Розрахувати карту</Link>
            <Link to="/my-charts" className="nav-link">Мої карти</Link>
            <Link to="/admin/login" className="nav-link">Адмін</Link>
          </div>
        </div>
      </nav>

      <div style={{ padding: '3rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div className="glass-card">
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#c4b5fd' }}>Розрахунок натальної карти</h2>
          <p style={{ color: '#b8b0cc', marginBottom: '2rem' }}>Введіть дані народження для точного розрахунку</p>

          <form onSubmit={handleSubmit} data-testid="chart-form">
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">
                <User size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Ім'я
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Введіть ім'я"
                data-testid="name-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="form-label">
                  <Calendar size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  Дата народження
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  data-testid="date-input"
                />
              </div>
              <div>
                <label className="form-label">
                  <Clock size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  Час народження
                </label>
                <input
                  type="time"
                  className="form-input"
                  value={formData.birth_time}
                  onChange={(e) => setFormData({ ...formData, birth_time: e.target.value })}
                  data-testid="time-input"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
              <label className="form-label">
                <MapPin size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Місце народження
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.birth_location}
                onChange={(e) => {
                  setFormData({ ...formData, birth_location: e.target.value });
                  searchLocations(e.target.value);
                }}
                placeholder="Почніть вводити назву міста..."
                data-testid="location-input"
              />
              {searchingLocation && (
                <div style={{ position: 'absolute', right: '1rem', top: '2.5rem' }}>
                  <Loader2 size={20} className="spinner" style={{ width: '20px', height: '20px' }} />
                </div>
              )}
              {locations.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'rgba(15, 15, 30, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '10px',
                  marginTop: '0.5rem',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  zIndex: 10
                }}>
                  {locations.map((loc, index) => (
                    <div
                      key={index}
                      onClick={() => selectLocation(loc)}
                      data-testid={`location-option-${index}`}
                      style={{
                        padding: '1rem',
                        cursor: 'pointer',
                        borderBottom: index < locations.length - 1 ? '1px solid rgba(139, 92, 246, 0.1)' : 'none',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <MapPin size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
                      {loc.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {formData.latitude !== 0 && formData.longitude !== 0 && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px', fontSize: '0.875rem', color: '#b8b0cc' }}>
                Координати: {formData.latitude.toFixed(4)}°, {formData.longitude.toFixed(4)}°
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={loading}
              data-testid="calculate-btn"
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Loader2 size={20} className="spinner" style={{ width: '20px', height: '20px' }} />
                  Розрахунок...
                </span>
              ) : (
                'Розрахувати натальну карту'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChartCalculator;