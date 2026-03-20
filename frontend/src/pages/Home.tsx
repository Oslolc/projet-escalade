import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSites } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Site } from '../types';

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ sites: 0, routes: 0 });

  useEffect(() => {
    getSites().then((res) => {
      const sites: Site[] = res.data;
      const routes = sites.reduce((acc, s) => acc + (Number(s.route_count) || 0), 0);
      setStats({ sites: sites.length, routes });
    }).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <div style={{
        position: 'relative',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Background image */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1600&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          filter: 'brightness(0.3)',
        }} />

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(15,15,26,0.3) 0%, rgba(15,15,26,0.7) 60%, rgba(15,15,26,1) 100%)',
        }} />

        {/* Content */}
        <div style={{
          position: 'relative',
          textAlign: 'center',
          padding: '0 24px',
          maxWidth: 800,
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--accent-light)',
            border: '1px solid var(--border-accent)',
            borderRadius: 20,
            padding: '6px 16px',
            fontSize: '0.85rem',
            color: 'var(--accent)',
            fontWeight: 600,
            marginBottom: 24,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            <span>⛰</span> Votre carnet d'escalade numérique
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: 24,
            background: 'linear-gradient(135deg, #ffffff 0%, #e94560 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Explorez.<br />Grimpez.<br />Progressez.
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: 'rgba(234, 234, 234, 0.8)',
            marginBottom: 40,
            maxWidth: 560,
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}>
            Découvrez les meilleurs sites d'escalade, enregistrez vos ascensions et
            suivez votre progression avec VerticalLog.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/sites" className="btn btn-primary" style={{ fontSize: '1rem', padding: '14px 32px' }}>
              Explorer les sites
            </Link>
            {user ? (
              <Link to="/logbook" className="btn btn-secondary" style={{ fontSize: '1rem', padding: '14px 32px' }}>
                Mon carnet
              </Link>
            ) : (
              <Link to="/register" className="btn btn-secondary" style={{ fontSize: '1rem', padding: '14px 32px' }}>
                Créer un compte
              </Link>
            )}
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex',
            gap: 40,
            justifyContent: 'center',
            marginTop: 60,
            flexWrap: 'wrap',
          }}>
            {[
              { label: 'Sites référencés', value: stats.sites },
              { label: 'Voies disponibles', value: stats.routes },
              { label: 'Grimpeurs actifs', value: '∞' },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: 'var(--accent)',
                  lineHeight: 1,
                }}>
                  {stat.value}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 6 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{
        background: 'var(--bg-secondary)',
        padding: '80px 24px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2rem',
            fontWeight: 800,
            marginBottom: 16,
          }}>
            Tout ce dont vous avez besoin
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 56, fontSize: '1.05rem' }}>
            Une application complète pour les passionnés d'escalade
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 24,
          }}>
            {[
              {
                icon: '🗺️',
                title: 'Topo numérique',
                desc: 'Accédez aux informations de tous les sites : description, cotations, accès. Tout au même endroit.',
              },
              {
                icon: '📓',
                title: 'Carnet de croix',
                desc: 'Enregistrez vos ascensions, notez votre ressenti et ajoutez des commentaires pour suivre votre progression.',
              },
              {
                icon: '📊',
                title: 'Statistiques',
                desc: 'Visualisez vos performances avec des graphiques interactifs. Suivez votre niveau et vos objectifs.',
              },
              {
                icon: '🔒',
                title: 'Données sécurisées',
                desc: 'Votre compte et vos données sont protégés par une authentification JWT sécurisée.',
              },
            ].map((feature) => (
              <div key={feature.title} className="card" style={{ padding: 28 }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 16 }}>{feature.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 10 }}>{feature.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        padding: '80px 24px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--secondary) 100%)',
      }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 16 }}>
          Prêt à grimper ?
        </h2>
        {user ? (
          <>
            <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '1.05rem' }}>
              Bienvenue, <strong>{user.username}</strong> ! Consultez votre carnet ou explorez les sites.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/logbook" className="btn btn-primary" style={{ fontSize: '1rem', padding: '14px 40px' }}>
                Mon carnet
              </Link>
              <Link to="/profile" className="btn btn-secondary" style={{ fontSize: '1rem', padding: '14px 40px' }}>
                Mon profil
              </Link>
            </div>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '1.05rem' }}>
              Rejoignez la communauté VerticalLog et commencez à enregistrer vos ascensions.
            </p>
            <Link to="/register" className="btn btn-primary" style={{ fontSize: '1rem', padding: '14px 40px' }}>
              Commencer gratuitement
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
