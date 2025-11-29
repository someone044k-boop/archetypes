import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Plus, Edit, Trash2, LogOut, Save } from 'lucide-react';
import axios from 'axios';
import { API } from '@/App';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [interpretations, setInterpretations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    category: 'planet_in_sign',
    key: '',
    title: '',
    content: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchInterpretations();
  }, []);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
  });

  const fetchInterpretations = async () => {
    try {
      const response = await axios.get(`${API}/interpretations`);
      setInterpretations(response.data);
    } catch (error) {
      console.error('Error fetching interpretations:', error);
      toast.error('Помилка завантаження тлумачень');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await axios.put(`${API}/interpretations/${editingId}`, {
          title: formData.title,
          content: formData.content
        }, getAuthHeaders());
        toast.success('Тлумачення оновлено');
      } else {
        await axios.post(`${API}/interpretations`, formData, getAuthHeaders());
        toast.success('Тлумачення створено');
      }
      
      setIsDialogOpen(false);
      setEditingId(null);
      setFormData({ category: 'planet_in_sign', key: '', title: '', content: '' });
      fetchInterpretations();
    } catch (error) {
      console.error('Error saving interpretation:', error);
      toast.error('Помилка збереження');
    }
  };

  const handleEdit = (interp) => {
    setEditingId(interp.id);
    setFormData({
      category: interp.category,
      key: interp.key,
      title: interp.title,
      content: interp.content
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Видалити це тлумачення?')) return;

    try {
      await axios.delete(`${API}/interpretations/${id}`, getAuthHeaders());
      toast.success('Тлумачення видалено');
      fetchInterpretations();
    } catch (error) {
      console.error('Error deleting interpretation:', error);
      toast.error('Помилка видалення');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    navigate('/admin/login');
  };

  const filterByCategory = (category) => interpretations.filter(i => i.category === category);

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
            <button onClick={handleLogout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }} data-testid="logout-btn">
              <LogOut size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Вийти
            </button>
          </div>
        </div>
      </nav>

      <div style={{ padding: '3rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '2rem', color: '#c4b5fd', marginBottom: '0.5rem' }}>Адмін-панель</h1>
              <p style={{ color: '#b8b0cc' }}>Керування тлумаченнями натальних карт</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button className="btn-primary" onClick={() => { setEditingId(null); setFormData({ category: 'planet_in_sign', key: '', title: '', content: '' }); }} data-testid="add-interpretation-btn">
                  <Plus size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  Додати тлумачення
                </button>
              </DialogTrigger>
              <DialogContent style={{ maxWidth: '700px', background: 'rgba(15, 15, 30, 0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#e8e6f0' }}>
                <DialogHeader>
                  <DialogTitle style={{ fontSize: '1.5rem', color: '#c4b5fd' }}>
                    {editingId ? 'Редагувати тлумачення' : 'Нове тлумачення'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} data-testid="interpretation-form">
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Категорія</label>
                    <select
                      className="form-input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      disabled={editingId}
                      data-testid="category-select"
                    >
                      <option value="planet_in_sign">Планета в знаку</option>
                      <option value="planet_in_house">Планета в домі</option>
                      <option value="aspect">Аспект</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Ключ (наприклад: sun_in_aries, moon_in_1st_house)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.key}
                      onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                      disabled={editingId}
                      placeholder="sun_in_aries"
                      data-testid="key-input"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Заголовок</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Сонце в Овні"
                      data-testid="title-input"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Тлумачення</label>
                    <textarea
                      className="form-input"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={8}
                      placeholder="Детальне тлумачення..."
                      data-testid="content-textarea"
                      required
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: '100%' }} data-testid="save-interpretation-btn">
                    <Save size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    {editingId ? 'Оновити' : 'Створити'}
                  </button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4" style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.25rem', borderRadius: '12px' }}>
            <TabsTrigger value="all">Всі ({interpretations.length})</TabsTrigger>
            <TabsTrigger value="planet_in_sign">Планети в знаках ({filterByCategory('planet_in_sign').length})</TabsTrigger>
            <TabsTrigger value="planet_in_house">Планети в домах ({filterByCategory('planet_in_house').length})</TabsTrigger>
            <TabsTrigger value="aspect">Аспекти ({filterByCategory('aspect').length})</TabsTrigger>
          </TabsList>

          {['all', 'planet_in_sign', 'planet_in_house', 'aspect'].map((tab) => (
            <TabsContent key={tab} value={tab} style={{ marginTop: '2rem' }}>
              {loading ? (
                <div className="loading"><div className="spinner"></div></div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {(tab === 'all' ? interpretations : filterByCategory(tab)).map((interp) => (
                    <div key={interp.id} className="glass-card" style={{ padding: '1.5rem' }} data-testid={`interpretation-${interp.id}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.875rem', color: '#8b5cf6', marginBottom: '0.5rem' }}>
                            {interp.category === 'planet_in_sign' && 'Планета в знаку'}
                            {interp.category === 'planet_in_house' && 'Планета в домі'}
                            {interp.category === 'aspect' && 'Аспект'}
                            {' • '}{interp.key}
                          </div>
                          <h3 style={{ fontSize: '1.25rem', color: '#c4b5fd', marginBottom: '0.75rem' }}>{interp.title}</h3>
                          <p style={{ color: '#b8b0cc', lineHeight: 1.6 }}>{interp.content}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                          <button onClick={() => handleEdit(interp)} className="btn-secondary" data-testid={`edit-${interp.id}`}>
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(interp.id)} className="btn-secondary" style={{ color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.3)' }} data-testid={`delete-${interp.id}`}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(tab === 'all' ? interpretations : filterByCategory(tab)).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#b8b0cc' }}>
                      Тлумачень ще немає
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;