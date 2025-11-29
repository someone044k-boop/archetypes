import { Link } from 'react-router-dom';
import { Sparkles, Star } from 'lucide-react';

const HomePage = () => {
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

      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Відкрийте таємниці своєї натальної карти
          </h1>
          <p className="hero-subtitle">
            Точні астрологічні розрахунки з позиціями всіх планет, домів та аспектів.
            Дізнайтеся більше про себе через мову зірок.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/calculator">
              <button className="btn-primary" data-testid="calculate-chart-btn">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={20} />
                  Розрахувати натальну карту
                </span>
              </button>
            </Link>
            <Link to="/my-charts">
              <button className="btn-secondary" data-testid="my-charts-btn">
                Мої збережені карти
              </button>
            </Link>
          </div>

          <div style={{ marginTop: '4rem' }}>
            <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#c4b5fd' }}>Що включено в розрахунок:</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
                <div>
                  <h4 style={{ color: '#8b5cf6', marginBottom: '0.5rem' }}>Планети</h4>
                  <p style={{ fontSize: '0.9rem', color: '#b8b0cc' }}>Сонце, Місяць, Меркурій, Венера, Марс, Юпітер, Сатурн, Уран, Нептун, Плутон</p>
                </div>
                <div>
                  <h4 style={{ color: '#8b5cf6', marginBottom: '0.5rem' }}>Додаткові точки</h4>
                  <p style={{ fontSize: '0.9rem', color: '#b8b0cc' }}>Хірон, Лунні вузли, Ліліт, Асцендент, Середина Неба</p>
                </div>
                <div>
                  <h4 style={{ color: '#8b5cf6', marginBottom: '0.5rem' }}>Система домів</h4>
                  <p style={{ fontSize: '0.9rem', color: '#b8b0cc' }}>Плацидус - найпопулярніша система для західної астрології</p>
                </div>
                <div>
                  <h4 style={{ color: '#8b5cf6', marginBottom: '0.5rem' }}>Аспекти</h4>
                  <p style={{ fontSize: '0.9rem', color: '#b8b0cc' }}>Кон'юнкція, Тригон, Квадрат, Опозиція, Секстиль</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;