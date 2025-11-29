import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Calendar, MapPin, Trash2, Eye } from 'lucide-react';
import axios from 'axios';
import { API } from '@/App';
import { toast } from 'sonner';

const MyCharts = () => {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharts();
  }, []);

  const fetchCharts = async () => {
    try {
      const response = await axios.get(`${API}/natal-charts`);
      setCharts(response.data);
    } catch (error) {
      console.error('Error fetching charts:', error);
      toast.error('Помилка завантаження карт');
    } finally {
      setLoading(false);
    }
  };

  const deleteChart = async (id) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цю карту?')) return;

    try {
      await axios.delete(`${API}/natal-charts/${id}`);
      toast.success('Карту успішно видалено');
      fetchCharts();
    } catch (error) {
      console.error('Error deleting chart:', error);
      toast.error('Помилка при видаленні карти');
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
            <Link to="/calculator" className="nav-link">Розрахувати карту</Link>
            <Link to="/my-charts" className="nav-link active">Мої карти</Link>
            <Link to="/admin/login" className="nav-link">Адмін</Link>
          </div>
        </div>
      </nav>

      <div style={{ padding: '3rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="glass-card">
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#c4b5fd' }}>Мої натальні карти</h2>
          <p style={{ color: '#b8b0cc', marginBottom: '2rem' }}>Збережені розрахунки натальних карт</p>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : charts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#b8b0cc' }}>
              <p>Ще немає збережених карт</p>
              <Link to="/calculator">
                <button className="btn-primary" style={{ marginTop: '1rem' }}>Розрахувати першу карту</button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {charts.map((chart) => (
                <div
                  key={chart.id}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem',
                    background: 'rgba(139, 92, 246, 0.05)',
                    transition: 'all 0.3s ease'
                  }}
                  data-testid={`chart-item-${chart.id}`}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.25rem', color: '#c4b5fd', marginBottom: '0.5rem' }}>{chart.name}</h3>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: '#b8b0cc' }}>
                      <span>
                        <Calendar size={14} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
                        {chart.birth_date} о {chart.birth_time}
                      </span>
                      <span>
                        <MapPin size={14} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
                        {chart.birth_location}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/chart/${chart.id}`}>
                      <button className="btn-secondary" data-testid={`view-chart-${chart.id}`}>
                        <Eye size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Переглянути
                      </button>
                    </Link>
                    <button
                      className="btn-secondary"
                      onClick={() => deleteChart(chart.id)}
                      style={{ color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.3)' }}
                      data-testid={`delete-chart-${chart.id}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyCharts;