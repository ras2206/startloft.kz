import { Tournament } from '@/types';
import { formatDate, formatCurrency, getTournamentStatus } from '@/lib/utils';
import React from 'react';
import Link from 'next/link';

export default function TournamentCard({ tournament, number }: { tournament: Tournament, number?: number }) {
  const status = getTournamentStatus(tournament);
  return (
    <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', border: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', transition: 'box-shadow 0.3s' }}>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '1.35rem', marginBottom: '10px', color: 'var(--accent-green)', lineHeight: '1.3' }}>{tournament.title}</h3>
        {tournament.subtitle && (
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '12px', fontWeight: '500' }}>{tournament.subtitle}</p>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ color: '#333', fontSize: '0.95rem', marginBottom: '12px' }}>
          <span style={{ fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '0.95rem' }}>
            📅 {formatDate(tournament.dates.start)} — {formatDate(tournament.dates.end)}
          </span>
          <span style={{ fontWeight: 'normal', display: 'block', lineHeight: '1.4', fontSize: '0.95rem' }}>
            📍 <strong>{tournament.location.city}</strong>, {tournament.location.address}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div style={{ background: '#232826', borderRadius: '10px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#2ebd59' }}>Взнос</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>{formatCurrency(Number(tournament.fees.entry_fee))}</div>
          </div>
          <div style={{ background: '#232826', borderRadius: '10px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#fbbf24' }}>🏆 Приз</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>{formatCurrency(Number(tournament.prize.fund))}</div>
          </div>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '12px 0' }} />
        {tournament._id ? (
          <Link 
            href={`/tournaments/${tournament._id}`}
            style={{
              width: '100%',
              display: 'block',
              background: 'var(--accent-green)',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '1rem',
              borderRadius: '10px',
              padding: '10px 0',
              boxSizing: 'border-box',
              cursor: 'pointer',
              border: 'none',
              transition: 'background 0.2s',
              textAlign: 'center',
              textDecoration: 'none',
              margin: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-green-light)'} 
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent-green)'}
          >
            Подробнее
          </Link>
        ) : (
          <span style={{
            width: '100%',
            display: 'block',
            background: 'var(--accent-green)',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '1rem',
            borderRadius: '10px',
            padding: '10px 0',
            opacity: 0.7,
            textAlign: 'center',
            margin: 0
          }}>
            Подробнее
          </span>
        )}
      </div>
    </div>
  );
}
