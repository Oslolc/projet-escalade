import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSite, addLogbookEntry, createRoute, updateRoute, deleteRoute } from '../api';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import type { Site, ClimbingRoute } from '../types';

const EMPTY_ROUTE_FORM = { name: '', grade: '', style: '' as ClimbingRoute['style'] | '', description: '' };

function getGradeColor(grade: string): { bg: string; color: string } {
  const num = parseFloat(grade.replace(/[abc+]/gi, ''));
  if (num < 6) return { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' };
  if (num < 7) return { bg: 'rgba(234,179,8,0.15)', color: '#eab308' };
  if (num < 8) return { bg: 'rgba(249,115,22,0.15)', color: '#f97316' };
  return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' };
}

const TYPE_LABELS: Record<string, string> = {
  Falaise: '🧗 Falaise',
  Bloc: '🪨 Bloc',
  Salle: '🏟️ Salle',
};

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Permissions
  const canManage = user?.role === 'expert' || user?.role === 'admin';
  const canDelete = user?.role === 'admin';

  // Logbook modal state
  const [addingRoute, setAddingRoute] = useState<ClimbingRoute | null>(null);
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logFeeling, setLogFeeling] = useState<number>(3);
  const [logComment, setLogComment] = useState('');
  const [logLoading, setLogLoading] = useState(false);
  const [logSuccess, setLogSuccess] = useState('');

  // Route modal state
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<ClimbingRoute | null>(null);
  const [routeForm, setRouteForm] = useState(EMPTY_ROUTE_FORM);
  const [routeFormLoading, setRouteFormLoading] = useState(false);
  const [routeFormError, setRouteFormError] = useState('');

  useEffect(() => {
    if (!id) return;
    getSite(Number(id))
      .then((res) => setSite(res.data))
      .catch(() => setError('Site introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  const openCreateRoute = () => {
    setEditingRoute(null);
    setRouteForm(EMPTY_ROUTE_FORM);
    setRouteFormError('');
    setRouteModalOpen(true);
  };

  const openEditRoute = (route: ClimbingRoute) => {
    setEditingRoute(route);
    setRouteForm({ name: route.name, grade: route.grade, style: route.style || '', description: route.description || '' });
    setRouteFormError('');
    setRouteModalOpen(true);
  };

  const handleDeleteRoute = async (route: ClimbingRoute) => {
    if (!confirm(`Supprimer "${route.name}" ?`)) return;
    try {
      await deleteRoute(route.id);
      setSite((prev) => prev ? { ...prev, climbing_routes: prev.climbing_routes?.filter((r) => r.id !== route.id) } : prev);
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  const handleRouteSubmit = async () => {
    if (!routeForm.name || !routeForm.grade) {
      setRouteFormError('Nom et cotation sont requis.');
      return;
    }
    setRouteFormLoading(true);
    setRouteFormError('');
    try {
      const data = {
        site_id: site!.id,
        name: routeForm.name,
        grade: routeForm.grade,
        style: routeForm.style || undefined,
        description: routeForm.description || undefined,
      };
      if (editingRoute) {
        const res = await updateRoute(editingRoute.id, data);
        setSite((prev) => prev ? {
          ...prev,
          climbing_routes: prev.climbing_routes?.map((r) => r.id === editingRoute.id ? res.data : r),
        } : prev);
      } else {
        const res = await createRoute(data);
        setSite((prev) => prev ? { ...prev, climbing_routes: [...(prev.climbing_routes || []), res.data] } : prev);
      }
      setRouteModalOpen(false);
    } catch {
      setRouteFormError('Une erreur est survenue.');
    } finally {
      setRouteFormLoading(false);
    }
  };

  const handleAddToLogbook = async () => {
    if (!addingRoute) return;
    setLogLoading(true);
    try {
      await addLogbookEntry({
        route_id: addingRoute.id,
        date: logDate,
        feeling: logFeeling,
        comment: logComment || undefined,
      });
      setLogSuccess(`"${addingRoute.name}" ajouté au carnet !`);
      setTimeout(() => {
        setAddingRoute(null);
        setLogSuccess('');
        setLogComment('');
        setLogFeeling(3);
      }, 1500);
    } catch {
      setError("Erreur lors de l'ajout");
    } finally {
      setLogLoading(false);
    }
  };

  if (loading) return <div className="spinner" style={{ minHeight: '60vh' }} />;
  if (error || !site) return (
    <div className="page-container">
      <div className="alert alert-error">{error || 'Site introuvable'}</div>
      <button onClick={() => navigate('/sites')} className="btn btn-secondary" style={{ marginTop: 16 }}>
        ← Retour aux sites
      </button>
    </div>
  );

  return (
    <div>
      {/* Hero */}
      <div style={{
        position: 'relative',
        height: 340,
        overflow: 'hidden',
        background: 'var(--secondary)',
      }}>
        {site.image_url && (
          <img
            src={site.image_url}
            alt={site.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)' }}
          />
        )}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(15,15,26,1) 0%, rgba(15,15,26,0.4) 100%)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '32px',
          maxWidth: 1200,
          margin: '0 auto',
        }}>
          <button
            onClick={() => navigate('/sites')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'var(--text)',
              borderRadius: 6,
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              marginBottom: 12,
            }}
          >
            ← Retour
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', fontWeight: 800 }}>
              {site.name}
            </h1>
            <span style={{
              background: 'var(--accent-light)',
              color: 'var(--accent)',
              border: '1px solid var(--border-accent)',
              borderRadius: 20,
              padding: '4px 14px',
              fontSize: '0.875rem',
              fontWeight: 700,
            }}>
              {TYPE_LABELS[site.type] || site.type}
            </span>
          </div>
          <p style={{ color: 'rgba(234,234,234,0.7)', marginTop: 6, fontSize: '0.95rem' }}>
            📍 {site.location}
          </p>
        </div>
      </div>

      <div className="page-container">
        {/* Description */}
        {site.description && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 28,
            marginBottom: 36,
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>Description</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>{site.description}</p>
          </div>
        )}

        {/* Routes */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
              Voies & Blocs
              <span style={{ marginLeft: 10, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                ({site.climbing_routes?.length || 0})
              </span>
            </h2>
            {canManage && (
              <button onClick={openCreateRoute} className="btn btn-primary btn-sm">
                + Ajouter une voie
              </button>
            )}
          </div>

          {!site.climbing_routes?.length ? (
            <div className="empty-state">
              <div className="empty-icon">🧗</div>
              <h3>Aucune voie référencée</h3>
              <p>Ce site n'a pas encore de voies dans notre base de données.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Cotation</th>
                    <th>Style</th>
                    <th>Description</th>
                    {(user || canManage) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {site.climbing_routes.map((route) => {
                    const gradeColor = getGradeColor(route.grade);
                    return (
                      <tr key={route.id}>
                        <td style={{ fontWeight: 600 }}>{route.name}</td>
                        <td>
                          <span
                            className="grade-badge"
                            style={{ background: gradeColor.bg, color: gradeColor.color }}
                          >
                            {route.grade}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            {route.style || '—'}
                          </span>
                        </td>
                        <td style={{
                          color: 'var(--text-muted)',
                          fontSize: '0.875rem',
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {route.description || '—'}
                        </td>
                        {(user || canManage) && (
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {user && (
                                <button onClick={() => setAddingRoute(route)} className="btn btn-primary btn-sm">
                                  + Carnet
                                </button>
                              )}
                              {canManage && (
                                <button onClick={() => openEditRoute(route)} className="btn btn-secondary btn-sm">
                                  Modifier
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteRoute(route)}
                                  className="btn btn-sm"
                                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                                >
                                  Supprimer
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!user && (
          <div style={{
            marginTop: 24,
            padding: '16px 20px',
            background: 'var(--accent-light)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            color: 'var(--text)',
          }}>
            <a href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Connectez-vous</a>
            {' '}pour ajouter des voies à votre carnet d'escalade.
          </div>
        )}
      </div>

      {/* Create / Edit route modal */}
      {routeModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setRouteModalOpen(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editingRoute ? 'Modifier la voie' : 'Ajouter une voie'}</h2>
              <button className="modal-close" onClick={() => setRouteModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              {routeFormError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{routeFormError}</div>}
              <div className="form-group">
                <label>Nom *</label>
                <input className="form-control" value={routeForm.name} onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })} placeholder="La Grande Voie" />
              </div>
              <div className="form-group">
                <label>Cotation *</label>
                <input className="form-control" value={routeForm.grade} onChange={(e) => setRouteForm({ ...routeForm, grade: e.target.value })} placeholder="6b+" />
              </div>
              <div className="form-group">
                <label>Style</label>
                <select className="form-control" value={routeForm.style ?? ''} onChange={(e) => setRouteForm({ ...routeForm, style: e.target.value as ClimbingRoute['style'] | '' })}>
                  <option value="">— Non précisé</option>
                  <option value="Voie">Voie</option>
                  <option value="Boulder">Boulder</option>
                  <option value="Trad">Trad</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" rows={3} value={routeForm.description} onChange={(e) => setRouteForm({ ...routeForm, description: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setRouteModalOpen(false)} className="btn btn-secondary">Annuler</button>
              <button onClick={handleRouteSubmit} className="btn btn-primary" disabled={routeFormLoading}>
                {routeFormLoading ? 'Enregistrement...' : editingRoute ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to logbook modal */}
      {addingRoute && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setAddingRoute(null);
        }}>
          <div className="modal">
            <div className="modal-header">
              <h2>Ajouter au carnet</h2>
              <button className="modal-close" onClick={() => setAddingRoute(null)}>×</button>
            </div>
            <div className="modal-body">
              {logSuccess ? (
                <div className="alert alert-success">{logSuccess}</div>
              ) : (
                <>
                  <div style={{
                    background: 'var(--bg-primary)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    marginBottom: 4,
                  }}>
                    <p style={{ fontWeight: 700 }}>{addingRoute.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      {site.name} · <span style={{ color: getGradeColor(addingRoute.grade).color }}>{addingRoute.grade}</span>
                    </p>
                  </div>

                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Ressenti</label>
                    <StarRating value={logFeeling} onChange={setLogFeeling} />
                  </div>

                  <div className="form-group">
                    <label>Commentaire (optionnel)</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Comment s'est passée votre ascension ?"
                      value={logComment}
                      onChange={(e) => setLogComment(e.target.value)}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </>
              )}
            </div>
            {!logSuccess && (
              <div className="modal-footer">
                <button onClick={() => setAddingRoute(null)} className="btn btn-secondary">
                  Annuler
                </button>
                <button
                  onClick={handleAddToLogbook}
                  className="btn btn-primary"
                  disabled={logLoading}
                >
                  {logLoading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
