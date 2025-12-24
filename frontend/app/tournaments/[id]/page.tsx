import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import RegistrationForm from '@/components/RegistrationForm';

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let tournament = null;
  let participants = [];

  try {
    tournament = await api.getTournamentById(id);
    participants = await api.getParticipants(tournament._id);
  } catch (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--main-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginBottom: '24px' }}>Турнир не найден</h1>
          <Link href="/" style={{ display: 'inline-block', background: 'var(--accent-green)', color: '#fff', fontWeight: 'bold', padding: '12px 28px', borderRadius: '10px', textDecoration: 'none' }}>
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--main-bg)', color: '#fff', fontFamily: 'var(--font-family)' }}>
      {/* Header */}
      <header style={{ padding: '20px 24px' }}>
        <Link href="/" style={{ color: '#2ebd59', fontWeight: '600', fontSize: '1.1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          ← Назад
        </Link>
      </header>

      {/* Poster */}
      {tournament.poster_image_url && (
        <div style={{ position: 'relative', height: '400px', overflow: 'hidden', marginBottom: '40px' }}>
          <img
            src={tournament.poster_image_url}
            alt={tournament.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: '0', background: 'linear-gradient(to top, var(--main-bg) 0%, transparent 100%)' }}></div>
        </div>
      )}

      <div className="section" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 60px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Заголовок */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontWeight: 'bold', fontSize: '2rem', lineHeight: '1.3', marginBottom: '12px', color: 'var(--accent-green)' }}>
              {tournament.title}
            </h1>
            {tournament.subtitle && (
              <p style={{ fontSize: '1.3rem', color: '#bbb', marginBottom: '24px' }}>{tournament.subtitle}</p>
            )}
            {tournament.registration_open && (
              <a
                href="#registration"
                style={{
                  display: 'inline-block',
                  background: 'var(--accent-green)',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '1.15rem',
                  padding: '14px 32px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                  boxShadow: '0 4px 12px rgba(46, 189, 89, 0.3)'
                }}
              >
                🎯 Зарегистрироваться на турнир
              </a>
            )}
          </div>

          {/* Ключевая информация */}
          <div style={{ background: '#fff', borderRadius: '14px', padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
            {/* Дата */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '6px', fontWeight: '600' }}>📅 Дата проведения</p>
              <p style={{ color: '#23272a', fontWeight: 'bold', fontSize: '1.1rem' }}>
                {formatDate(tournament.dates.start)} — {formatDate(tournament.dates.end)}
                {tournament.dates.start_time && <span style={{ color: '#666', fontWeight: 'normal', fontSize: '0.95rem', marginLeft: '8px' }}>(начало: {tournament.dates.start_time})</span>}
              </p>
            </div>

            {/* Место */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '6px', fontWeight: '600' }}>📍 Место проведения</p>
              <p style={{ color: '#23272a', fontWeight: 'bold', fontSize: '1.05rem', lineHeight: '1.4' }}>
                {tournament.location.city}, {tournament.location.address}
              </p>
            </div>

                        {/* Суммы - flex для одной строки */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '24px' }}>
              <div style={{ flex: '1 1 200px' }}>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '6px', fontWeight: '600' }}>💳 Вступительный взнос</p>
                <p style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '1.5rem' }}>{formatCurrency(tournament.fees.entry_fee)}</p>
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '6px', fontWeight: '600' }}>🏆 Призовой фонд</p>
                <p style={{ color: '#eab308', fontWeight: 'bold', fontSize: '1.5rem' }}>{formatCurrency(tournament.prize.fund)}</p>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '24px 0' }} />

            {/* Описание */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontWeight: 'bold', fontSize: '1.4rem', marginBottom: '12px', color: '#23272a' }}>📋 Описание</h2>
              <p style={{ color: '#333', fontSize: '1rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{tournament.description}</p>
            </div>

            {/* Формат */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontWeight: 'bold', fontSize: '1.4rem', marginBottom: '12px', color: '#23272a' }}>🎱 Формат</h2>
              <p style={{ color: '#333', fontSize: '1rem', lineHeight: '1.6' }}>{tournament.format_text}</p>
            </div>

            {/* Распределение призов - из items */}
            {tournament.prize.items && tournament.prize.items.length > 0 && (
              <div>
                <h2 style={{ fontWeight: 'bold', fontSize: '1.4rem', marginBottom: '12px', color: '#23272a' }}>💰 Распределение призов</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tournament.prize.items.map((item: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: idx < tournament.prize.items.length - 1 ? '1px solid #e0e0e0' : 'none' }}>
                      <span style={{ color: '#666', fontSize: '0.95rem' }}>{item.label}</span>
                      <span style={{ color: '#eab308', fontWeight: 'bold', fontSize: '1rem' }}>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
    </div>

          {/* Форма регистрации */}
          <div id="registration" style={{ background: '#fff', borderRadius: '14px', padding: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', scrollMarginTop: '100px' }}>
            <h2 style={{ fontWeight: 'bold', fontSize: '1.8rem', marginBottom: '24px', color: '#23272a', textAlign: 'center' }}>
              {tournament.registration_open ? '✍️ Регистрация на турнир' : '🔒 Регистрация закрыта'}
            </h2>

            {tournament.registration_open ? (
              <RegistrationForm tournaments={[tournament]} initialTournament={tournament} />
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <svg style={{ width: '64px', height: '64px', color: '#999', margin: '0 auto 16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p style={{ color: '#666', marginBottom: '24px', fontSize: '1.05rem' }}>
                  Регистрация на этот турнир закрыта
                </p>
                <a
                  href={`https://wa.me/${tournament.contact.whatsapp_phone?.replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    background: 'var(--accent-green)',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '1.05rem',
                    padding: '12px 28px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    transition: 'background 0.2s'
                  }}
                >
                  Связаться в WhatsApp
                </a>
              </div>
            )}
          </div>

          {/* Участники */}
          {participants.length > 0 && (
            <div style={{ background: '#fff', borderRadius: '14px', padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
              <h2 style={{ fontWeight: 'bold', fontSize: '1.8rem', marginBottom: '16px', color: '#23272a' }}>
                👥 Участники ({participants.length})
              </h2>
              <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px', paddingRight: '8px' }}>
                {participants.map((p: any, idx: number) => (
                  <div key={idx} style={{ background: '#f5f5f5', borderRadius: '8px', padding: '12px', border: '1px solid #e0e0e0' }}>
                    <p style={{ color: '#23272a', fontWeight: 'bold', fontSize: '0.95rem' }}>{p.fio}</p>
                    <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '4px' }}>{p.rank} • {p.city_country}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Закрывающий тег для section */}
      </div>
    </div>
  );
}
