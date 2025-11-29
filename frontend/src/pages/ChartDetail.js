import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Star, Calendar, MapPin, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { API } from '@/App';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NatalChartWheel from '@/components/NatalChartWheel';

const ChartDetail = () => {
  const { id } = useParams();
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChart();
  }, [id]);

  const fetchChart = async () => {
    try {
      const response = await axios.get(`${API}/natal-charts/${id}`);
      setChart(response.data);
    } catch (error) {
      console.error('Error fetching chart:', error);
      toast.error('Помилка завантаження карти');
    } finally {
      setLoading(false);
    }
  };

  const getAspectClass = (aspectType) => {
    const normalizedType = aspectType.toLowerCase();
    if (normalizedType.includes('кон')) return 'aspect-conjuction';
    if (normalizedType.includes('тригон')) return 'aspect-trine';
    if (normalizedType.includes('квадрат')) return 'aspect-square';
    if (normalizedType.includes('опозиц')) return 'aspect-opposition';
    if (normalizedType.includes('секстиль')) return 'aspect-sextile';
    return 'aspect-badge';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!chart) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p>Карту не знайдено</p>
        <Link to="/my-charts">
          <button className="btn-primary" style={{ marginTop: '1rem' }}>Повернутися до карт</button>
        </Link>
      </div>
    );
  }

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
            <Link to="/my-charts" className="nav-link">Мої карти</Link>
            <Link to="/admin/login" className="nav-link">Адмін</Link>
          </div>
        </div>
      </nav>

      <div style={{ padding: '3rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <Link to="/my-charts" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#c4b5fd', marginBottom: '2rem', textDecoration: 'none' }}>
          <ArrowLeft size={20} />
          Назад до карт
        </Link>

        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#c4b5fd' }}>{chart.name}</h1>
          <div style={{ display: 'flex', gap: '2rem', color: '#b8b0cc', fontSize: '1rem' }}>
            <span>
              <Calendar size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
              {chart.birth_date} о {chart.birth_time}
            </span>
            <span>
              <MapPin size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
              {chart.birth_location}
            </span>
          </div>
        </div>

        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#c4b5fd', textAlign: 'center' }}>Натальна карта</h2>
          <NatalChartWheel chart={chart} />
          
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#c4b5fd', marginBottom: '1rem' }}>Легенда символів планет:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', fontSize: '0.95rem' }}>
              <div><span style={{ color: '#fbbf24', fontWeight: 'bold' }}>☉</span> Сонце</div>
              <div><span style={{ color: '#e0e7ff', fontWeight: 'bold' }}>☽</span> Місяць</div>
              <div><span style={{ color: '#93c5fd', fontWeight: 'bold' }}>☿</span> Меркурій</div>
              <div><span style={{ color: '#f9a8d4', fontWeight: 'bold' }}>♀</span> Венера</div>
              <div><span style={{ color: '#f87171', fontWeight: 'bold' }}>♂</span> Марс</div>
              <div><span style={{ color: '#fb923c', fontWeight: 'bold' }}>♃</span> Юпітер</div>
              <div><span style={{ color: '#a78bfa', fontWeight: 'bold' }}>♄</span> Сатурн</div>
              <div><span style={{ color: '#c4b5fd', fontWeight: 'bold' }}>♅</span> Уран</div>
              <div><span style={{ color: '#c4b5fd', fontWeight: 'bold' }}>♆</span> Нептун</div>
              <div><span style={{ color: '#c4b5fd', fontWeight: 'bold' }}>♇</span> Плутон</div>
              <div><span style={{ color: '#c4b5fd', fontWeight: 'bold' }}>⚷</span> Хірон</div>
              <div><span style={{ color: '#c4b5fd', fontWeight: 'bold' }}>☊</span> Півн. вузол</div>
              <div><span style={{ color: '#c4b5fd', fontWeight: 'bold' }}>☋</span> Півд. вузол</div>
              <div><span style={{ color: '#c4b5fd', fontWeight: 'bold' }}>⚸</span> Ліліт</div>
              <div><span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>ASC</span> Асцендент</div>
              <div><span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>MC</span> Середина Неба</div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="planets" className="w-full">
          <TabsList className="grid w-full grid-cols-3" style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.25rem', borderRadius: '12px' }}>
            <TabsTrigger value="planets" data-testid="planets-tab">Планети</TabsTrigger>
            <TabsTrigger value="houses" data-testid="houses-tab">Доми</TabsTrigger>
            <TabsTrigger value="aspects" data-testid="aspects-tab">Аспекти</TabsTrigger>
          </TabsList>

          <TabsContent value="planets" style={{ marginTop: '2rem' }}>
            <div className="glass-card">
              <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', color: '#c4b5fd' }}>Позиції планет</h2>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {chart.planets.map((planet, index) => (
                  <div key={index} className="planet-item" data-testid={`planet-${index}`}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#e8e6f0', marginBottom: '0.25rem' }}>
                        {planet.name}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#b8b0cc' }}>
                        {planet.sign} {planet.degree.toFixed(2)}°
                        {planet.house && ` • ${planet.house} дім`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.875rem', color: '#8b5cf6' }}>
                      {planet.longitude.toFixed(4)}°
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="houses" style={{ marginTop: '2rem' }}>
            <div className="glass-card">
              <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', color: '#c4b5fd' }}>Система домів (Плацидус)</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                {chart.houses.map((house, index) => (
                  <div
                    key={index}
                    className="glass-card"
                    style={{ background: 'rgba(139, 92, 246, 0.05)', padding: '1.25rem' }}
                    data-testid={`house-${index}`}
                  >
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6', marginBottom: '0.5rem' }}>
                      {house.number} дім
                    </div>
                    <div style={{ color: '#e8e6f0', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                      {house.sign}
                    </div>
                    <div style={{ color: '#b8b0cc', fontSize: '0.875rem' }}>
                      Куспід: {house.cusp.toFixed(2)}°
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="aspects" style={{ marginTop: '2rem' }}>
            <div className="glass-card">
              <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', color: '#c4b5fd' }}>Аспекти між планетами</h2>
              {chart.aspects.length === 0 ? (
                <p style={{ color: '#b8b0cc' }}>Значимих аспектів не знайдено</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {chart.aspects.map((aspect, index) => (
                    <div
                      key={index}
                      className={`aspect-badge ${getAspectClass(aspect.aspect_type)}`}
                      data-testid={`aspect-${index}`}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                        {aspect.planet1} {aspect.aspect_type} {aspect.planet2}
                      </div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                        {aspect.angle.toFixed(2)}° (орб: {aspect.orb.toFixed(2)}°)
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ChartDetail;