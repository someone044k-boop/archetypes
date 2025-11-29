import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Lock, User } from 'lucide-react';
import axios from 'axios';
import { API } from '@/App';
import { toast } from 'sonner';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/admin/login' : '/admin/register';
      const response = await axios.post(`${API}${endpoint}`, formData);
      
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminUsername', response.data.username);
      
      toast.success(isLogin ? 'Успішний вхід!' : 'Реєстрацію завершено!');
      navigate('/admin');
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error.response?.data?.detail || 'Помилка автентифікації');
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
            <Link to="/calculator" className="nav-link">Розрахувати карту</Link>
            <Link to="/my-charts" className="nav-link">Мої карти</Link>
            <Link to="/admin/login" className="nav-link active">Адмін</Link>
          </div>
        </div>
      </nav>

      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-card" style={{ maxWidth: '450px', width: '100%' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#c4b5fd', textAlign: 'center' }}>
            {isLogin ? 'Вхід для адміністратора' : 'Реєстрація адміністратора'}
          </h2>
          <p style={{ color: '#b8b0cc', marginBottom: '2rem', textAlign: 'center' }}>
            {isLogin ? 'Увійдіть для керування тлумаченнями' : 'Створіть обліковий запис адміністратора'}
          </p>

          <form onSubmit={handleSubmit} data-testid="admin-login-form">
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">
                <User size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Ім'я користувача
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Введіть ім'я користувача"
                data-testid="username-input"
                required
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">
                <Lock size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Пароль
              </label>
              <input
                type="password"
                className="form-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Введіть пароль"
                data-testid="password-input"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
              data-testid="submit-btn"
            >
              {loading ? 'Завантаження...' : (isLogin ? 'Увійти' : 'Зареєструватися')}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button
              onClick={() => setIsLogin(!isLogin)}
              style={{
                background: 'none',
                border: 'none',
                color: '#8b5cf6',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.95rem'
              }}
              data-testid="toggle-mode-btn"
            >
              {isLogin ? 'Немає облікового запису? Зареєструватися' : 'Вже є обліковий запис? Увійти'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;