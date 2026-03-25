import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getSites, createSite, updateSite, deleteSite } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Site } from '../types';

// Fix default marker icons (Leaflet + bundlers)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TYPE_COLORS: Record<string, string> = {
  Falaise: 'badge-falaise',
  Bloc: 'badge-bloc',
  Salle: 'badge-salle',
};

const EMPTY_FORM = { name: '', type: 'Falaise' as Site['type'], location: '', description: '', image_url: '', latitude: '', longitude: '' };

export default function Sites() {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const canManage = user?.role === 'expert' || user?.role === 'admin';
  const canDelete = user?.role === 'admin';

  const loadSites = () => getSites().then((res) => setSites(res.data)).catch(console.error);

  useEffect(() => {
    loadSites().finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditingSite(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (e: React.MouseEvent, site: Site) => {
    e.preventDefault();
    setEditingSite(site);
    setForm({
      name: site.name,
      type: site.type,
      location: site.location,
      description: site.description || '',
      image_url: site.image_url || '',
      latitude: site.latitude?.toString() || '',
      longitude: site.longitude?.toString() || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, site: Site) => {
    e.preventDefault();
    if (!confirm(`Supprimer "${site.name}" ?`)) return;
    try {
      await deleteSite(site.id);
      setSites((prev) => prev.filter((s) => s.id !== site.id));
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.type || !form.location) {
      setFormError('Nom, type et localisation sont requis.');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      const data = {
        name: form.name,
        type: form.type,
        location: form.location,
        description: form.description || undefined,
        image_url: form.image_url || undefined,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      };
      if (editingSite) {
        await updateSite(editingSite.id, data);
      } else {
        await createSite(data);
      }
      setModalOpen(false);
      loadSites();
    } catch {
      setFormError('Une erreur est survenue.');
    } finally {
      setFormLoading(false);
    }
  };

  const filtered = sites.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter ? s.type === typeFilter : true;
    return matchSearch && matchType;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Sites d'escalade</h1>
          <p>Découvrez les meilleurs spots de grimpe en France</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="btn btn-primary">
            + Nouveau site
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 32,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <input
          type="text"
          className="form-control"
          placeholder="Rechercher un site ou une ville..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, maxWidth: 400 }}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          {['', 'Falaise', 'Bloc', 'Salle'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              style={{
                padding: '8px 18px',
                borderRadius: 20,
                border: '1.5px solid',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                borderColor: typeFilter === type ? 'var(--accent)' : 'var(--border)',
                background: typeFilter === type ? 'var(--accent-light)' : 'transparent',
                color: typeFilter === type ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {type || 'Tous'}
            </button>
          ))}
        </div>
      </div>

      {/* Results count + view toggle */}
      {!loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {filtered.length} site{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
          </p>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 4 }}>
            {(['list', 'map'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: viewMode === mode ? 'var(--accent)' : 'transparent',
                  color: viewMode === mode ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                {mode === 'list' ? '▤ Liste' : '🗺 Carte'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Map view */}
      {!loading && viewMode === 'map' && (
        <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 32, height: 480 }}>
          <MapContainer
            center={[46.5, 2.5]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {filtered.filter((s) => s.latitude && s.longitude).map((site) => (
              <Marker key={site.id} position={[site.latitude!, site.longitude!]}>
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <strong>{site.name}</strong><br />
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>{site.type} · {site.location}</span><br />
                    <a href={`/sites/${site.id}`} style={{ fontSize: '0.85rem', color: '#e94560', fontWeight: 600 }}>
                      Voir le topo →
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* Grid */}
      {viewMode === 'list' && (loading ? (
        <div className="spinner" />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Aucun site trouvé</h3>
          <p>Essayez de modifier vos critères de recherche</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 24,
        }}>
          {filtered.map((site) => (
            <Link key={site.id} to={`/sites/${site.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ height: '100%' }}>
                {/* Image */}
                <div style={{
                  height: 200,
                  overflow: 'hidden',
                  position: 'relative',
                  background: 'var(--secondary)',
                }}>
                  {site.image_url ? (
                    <img
                      src={site.image_url}
                      alt={site.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                  ) : (
                    <div style={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '3rem',
                      opacity: 0.3,
                    }}>
                      ⛰️
                    </div>
                  )}
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                  }}>
                    <span className={`badge ${TYPE_COLORS[site.type] || ''}`}>
                      {site.type}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>
                    {site.name}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                      <path d="M7 0C4.24 0 2 2.24 2 5c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.5A1.5 1.5 0 115 5a1.5 1.5 0 012 1.5z"/>
                    </svg>
                    {site.location}
                  </p>
                  {site.description && (
                    <p style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {site.description}
                    </p>
                  )}
                  <div style={{
                    marginTop: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {site.route_count} voie{Number(site.route_count) !== 1 ? 's' : ''}
                    </span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {canManage && (
                        <button
                          onClick={(e) => openEdit(e, site)}
                          className="btn btn-secondary btn-sm"
                        >
                          Modifier
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={(e) => handleDelete(e, site)}
                          className="btn btn-sm"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                        >
                          Supprimer
                        </button>
                      )}
                      <span style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600 }}>
                        Voir le topo →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ))}
      {/* Create / Edit site modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editingSite ? 'Modifier le site' : 'Nouveau site'}</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{formError}</div>}
              <div className="form-group">
                <label>Nom *</label>
                <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Gorges du Verdon" />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select className="form-control" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Site['type'] })}>
                  <option value="Falaise">Falaise</option>
                  <option value="Bloc">Bloc</option>
                  <option value="Salle">Salle</option>
                </select>
              </div>
              <div className="form-group">
                <label>Localisation *</label>
                <input className="form-control" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Alpes-de-Haute-Provence, France" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label>URL de l'image</label>
                <input className="form-control" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Latitude</label>
                  <input className="form-control" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="48.8566" type="number" step="any" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Longitude</label>
                  <input className="form-control" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="2.3522" type="number" step="any" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setModalOpen(false)} className="btn btn-secondary">Annuler</button>
              <button onClick={handleSubmit} className="btn btn-primary" disabled={formLoading}>
                {formLoading ? 'Enregistrement...' : editingSite ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
