'use client';

import { Tournament } from '@/types';
import TournamentCard from './TournamentCard';
import Link from 'next/link';

export default function TournamentsCarousel({ tournaments }: { tournaments: Tournament[] }) {
  if (tournaments.length === 0) return null;

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
      <div 
        style={{
          display: 'flex',
          gap: '20px',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          padding: '20px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--accent-green) #232826',
          maxWidth: '100%',
          margin: '0 auto'
        }}
      >
        {tournaments.map((tournament, idx) => (
          <div
            key={tournament._id}
            style={{
              minWidth: '300px',
              maxWidth: '300px',
              flex: '0 0 auto',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <TournamentCard 
              tournament={tournament} 
              number={idx + 1} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
