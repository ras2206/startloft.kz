'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Tournament, ClubSettings } from '@/types';
import TournamentCard from '@/components/TournamentCard';
import WhatsAppButton from './WhatsAppButton';
import WhatsAppNoTournamentsCard from './WhatsAppNoTournamentsCard';
import GalleryCarousel from '@/components/GalleryCarousel';
import TournamentsCarousel from '@/components/TournamentsCarousel';

export default function HomePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [clubSettings, setClubSettings] = useState<ClubSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.getTournaments('published'),
      api.getClubSettings(),
    ])
      .then(([tournaments, clubSettings]) => {
        setTournaments(tournaments);
        setClubSettings(clubSettings);
      })
      .catch((err) => {
        setError('Ошибка загрузки данных');
      })
      .finally(() => setLoading(false));

    // Проверка успешной регистрации
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === 'true') {
      const whatsappLink = params.get('whatsapp');
      alert('Регистрация прошла успешно! Через минуту откроется WhatsApp для подтверждения.');
      if (whatsappLink) {
        setTimeout(() => {
          window.open(decodeURIComponent(whatsappLink), '_blank');
        }, 60000);
      }
      // Очищаем URL
      window.history.replaceState({}, '', '/');
    }
  }, []);

  if (loading) return <div style={{textAlign:'center',margin:'40px',fontSize:'1.3rem'}}>Загрузка...</div>;
  if (error) return <div style={{textAlign:'center',margin:'40px',fontSize:'1.3rem',color:'#e74c3c'}}>{error}</div>;

  return (
    <div style={{minHeight:'100vh',background:'var(--main-bg)',color:'#fff',fontFamily:'var(--font-family)'}}>
      <header className="header">
        <div className="section header-inner" style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'transparent',boxShadow:'none',margin:'0',padding:'0 48px'}}>
          <div className="header-brand" style={{display:'flex',alignItems:'center'}}>
            <img src="/logo.jpeg" alt="Start Loft Logo" style={{height:'44px',marginRight:'18px',borderRadius:'12px',boxShadow:'0 2px 8px rgba(0,0,0,0.10)'}} />
            <div className="loft-accent" style={{fontWeight:'bold',fontSize:'2rem'}}>Start Loft</div>
          </div>
          <nav className="header-nav" style={{marginLeft:'auto',marginRight:'0',gap:'12px',alignItems:'center',display:'flex'}}>
            <a href="#about">О клубе</a>
            <a href="#tournaments">Турниры</a>
            <a href="#contacts">Контакты</a>
            <span className="header-meta" style={{color:'#fff',fontWeight:600,marginLeft:'12px',fontSize:'1.02rem',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'2px'}}>
              <span style={{fontWeight:700,fontSize:'1.08rem',letterSpacing:'0.5px',color:'var(--accent-green)'}}>13:00 – 03:00</span>
              <span style={{fontWeight:700,fontSize:'1.08rem',opacity:0.85,color:'#eab308'}}>ул. Ходжа Ахмеда Яссави 23</span>
            </span>
            <a href="https://2gis.kz/kyzylorda/firm/70000001100786145" target="_blank" rel="noopener noreferrer" style={{marginLeft:'2px',display:'flex',alignItems:'center'}}>
              <img src="/2gis_logo.png" alt="" aria-label="2ГИС" className="gis-icon" style={{borderRadius:'6px',padding:'0'}} />
            </a>
            <WhatsAppButton phone="77718215088" type="appbar" />
          </nav>
        </div>
      </header>
      <div className="main-content">
        {/* Hero Section */}
        <section className="hero" style={{marginBottom:'20px'}}>
  <div className="hero-content" style={{background:'rgba(255,255,255,0.75)',borderRadius:'18px',boxShadow:'0 4px 24px #0002',padding:'32px 32px 28px 32px',maxWidth:'1100px',minWidth:'340px',margin:'0 auto'}}>
    <h1 style={{fontWeight:'bold',fontSize:'2.6rem',lineHeight:1.15,marginBottom:'10px',color:'#23272a',textShadow:'0 2px 8px #fff8'}}>Профессиональный бильярд в Кызылорде</h1>
    <p style={{fontWeight:'bold',fontSize:'2.1rem',marginTop:'10px',marginBottom:'18px',color:'var(--accent-green)',textShadow:'0 2px 8px #fff8'}}>Атмосфера настоящего турнира</p>
    <p style={{fontSize:'1.25rem',marginBottom:'8px',color:'#23272a',textShadow:'0 2px 8px #fff8'}}>Премиальные столы <b>START</b>, шары <b>ARAMITH 67 мм</b>, уютная кухня и бар.</p>
    <p style={{fontSize:'1.25rem',marginBottom:'18px',color:'#23272a',textShadow:'0 2px 8px #fff8'}}>Играйте на уровне профессионалов — почувствуйте разницу уже сегодня!</p>
    <div className="hero-buttons">
      <a href="#tournaments" className="button">Записаться на турнир</a>
      <a href={clubSettings?.two_gis_url} target="_blank" rel="noopener noreferrer" className="button" style={{background:'#fff',color:'var(--accent-green)',border:'1px solid var(--accent-green)'}}>Построить маршрут</a>
    </div>
  </div>
</section>

        {/* About Section */}
        <section id="about" className="section about-section" style={{scrollMarginTop:'80px',background:'var(--section-bg)',borderRadius:'32px',boxShadow:'0 4px 24px rgba(0,0,0,0.10)',padding:'18px 20px',margin:'12px auto',maxWidth:'1100px',display:'flex',flexWrap:'wrap',justifyContent:'center',alignItems:'center',gap:'32px',marginBottom:'20px'}}>
  <div className="about-inner" style={{display:'flex',width:'100%',maxWidth:'1060px',gap:'32px',alignItems:'center',justifyContent:'center',padding:'0 20px'}}>
    <div className="about-text" style={{flex:'1 1 320px',minWidth:'280px',maxWidth:'520px',background:'none',borderRadius:'0',boxShadow:'none',padding:'0',color:'#e6e6e6',height:'520px',display:'flex',flexDirection:'column',justifyContent:'center'}}>
      <h3 style={{fontWeight:'bold',fontSize:'2rem',color:'var(--accent-green)',marginBottom:'16px'}}>Start Loft — место для настоящих ценителей бильярда</h3>
      <ul style={{paddingLeft:'22px',marginBottom:'22px',fontSize:'1.25rem',lineHeight:'1.8'}}>
        <li>Премиальные столы START</li>
        <li>Шары ARAMITH 67 мм</li>
        <li>Профессиональное освещение</li>
        <li>Кухня и бар</li>
        <li>Турниры и мастер-классы</li>
        <li>Дружелюбная атмосфера</li>
      </ul>
      <div style={{marginTop:'auto',fontSize:'1.18rem',color:'var(--text-muted)'}}>Для новичков и профи. Всегда рады новым гостям!</div>
    </div>
    <div className="about-media" style={{flex:'1 1 320px',minWidth:'280px',maxWidth:'420px',background:'none',padding:'0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative'}}>
      <video className="about-video" src="/startloft.mp4" controls poster="/video_bg.jpg" style={{height:'420px',width:'auto',borderRadius:'12px',boxShadow:'none',background:'none',maxHeight:'420px',maxWidth:'100%',marginBottom:'0'}} />
    </div>
  </div>
</section>

        {/* Tournaments */}
        <section id="tournaments" className="section fullbleed-section" style={{
  scrollMarginTop:'80px',
  background: "url('/biliard_2.jpg') center/cover no-repeat",
  boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
  padding: '24px 0',
  margin: 0,
  width: '100vw',
  position: 'relative',
  left: '50%',
  right: '50%',
  marginLeft: '-50vw',
  marginRight: '-50vw',
  borderRadius: 0,
  minWidth: '100vw',
  marginBottom:'20px'
}}>
  <div style={{maxWidth:'1100px',margin:'0 auto'}}>
    <h2 style={{textAlign:'center',fontWeight:'bold',fontSize:'2.4rem',color:'#fff',textShadow:'0 2px 12px #000a',marginBottom:'18px'}}>Турниры</h2>
    <p style={{textAlign:'center',margin:'24px 0',fontSize:'1.25rem',color:'#fff',textShadow:'0 2px 12px #000a',fontWeight:'bold'}}>Выбирайте ближайший турнир и оставляйте заявку.</p>
    {tournaments.length === 0 ? null : <TournamentsCarousel tournaments={tournaments} />}
    {tournaments.length === 0 && (
      <WhatsAppNoTournamentsCard phone={clubSettings?.whatsapp_phone || ''} />
    )}
  </div>
</section>

        {/* Contacts (Redesigned) */}
        <section id="contacts" className="section fullbleed-section" style={{
  scrollMarginTop:'80px',
  background: "url('/contact.jpg') center/cover no-repeat",
  borderRadius: '32px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
  padding: '24px 0',
  margin: 0,
  width: '100vw',
  position: 'relative',
  left: '50%',
  right: '50%',
  marginLeft: '-50vw',
  marginRight: '-50vw',
  minWidth: '100vw',
  marginBottom:'20px'
}}>
  <h2 style={{textAlign:'center',fontWeight:'bold',fontSize:'2rem',marginBottom:'24px',letterSpacing:'0.5px'}}>Контакты</h2>
  <div className="contacts-card" style={{background:'rgba(255,255,255,0.92)',borderRadius:'18px',boxShadow:'0 4px 24px #0001',padding:'32px 28px',maxWidth:'600px',margin:'0 auto',display:'flex',flexDirection:'row',justifyContent:'center',alignItems:'flex-start',gap:'32px',flexWrap:'wrap'}}>
    <div style={{display:'flex',flexDirection:'column',gap:'16px',minWidth:'180px',maxWidth:'260px',flex:'1 1 180px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'8px',fontWeight:700,fontSize:'1.18rem',color:'#23272a'}}>
        <span style={{fontSize:'1.4rem'}}>📍</span> Адрес
      </div>
      <div style={{color:'#444',fontSize:'1.08rem'}}>Кызылорда, ​Ходжа Ахмеда Яссави улица, 23</div>
      <div style={{display:'flex',alignItems:'center',gap:'8px',fontWeight:700,fontSize:'1.18rem',color:'#23272a'}}>
        <span style={{fontSize:'1.3rem'}}>⏰</span> Режим работы
      </div>
      <div style={{color:'#444',fontSize:'1.08rem'}}>13:00 – 03:00</div>
    </div>
    <div style={{display:'flex',flexDirection:'column',gap:'12px',minWidth:'180px',maxWidth:'240px',flex:'1 1 180px'}}>
      <a href={`https://wa.me/77718215088`} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'linear-gradient(90deg,#25d366 60%,#128c7e 100%)',color:'#fff',fontWeight:600,padding:'8px 12px',borderRadius:'7px',textDecoration:'none',fontSize:'0.98rem',boxShadow:'0 2px 8px #25d36622',width:'100%'}}>
        <span style={{fontSize:'1.1rem'}}>📞</span>
        WhatsApp +7 771 821 50 88
      </a>
      <a href="https://instagram.com/start.loft_billiard_kzo" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'#fff',color:'#eab308',border:'1px solid #eab308',fontWeight:600,padding:'8px 12px',borderRadius:'7px',textDecoration:'none',fontSize:'0.98rem',boxShadow:'0 2px 8px #eab30822',width:'100%'}}>
        <span style={{fontSize:'1.1rem'}}>📸</span>
        Instagram @start.loft_billiard_kzo
      </a>
      <a href="https://2gis.kz/kyzylorda/geo/70000001100786145" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'#fff',color:'#1d9c4b',border:'1px solid #1d9c4b',fontWeight:600,padding:'8px 12px',borderRadius:'7px',textDecoration:'none',fontSize:'0.98rem',boxShadow:'0 2px 8px #1d9c4b22',width:'100%'}}>
        <span style={{fontSize:'1.1rem'}}>🗺️</span>
        Открыть в 2ГИС
      </a>
    </div>
  </div>
</section>

        {/* Gallery Section */}
        <section style={{maxWidth:'1100px',margin:'60px auto 40px',padding:'0 20px'}}>
          <h2 style={{textAlign:'center',fontWeight:'bold',fontSize:'2rem',color:'var(--accent-green)',marginBottom:'40px'}}>Галерея клуба</h2>
          <GalleryCarousel />
        </section>

        {/* Footer */}
        <footer style={{background:'var(--section-bg)',padding:'40px 20px',marginTop:'60px',marginBottom:'40px',borderTop:'2px solid var(--accent-green)'}}>
          <div style={{maxWidth:'1100px',margin:'0 auto',textAlign:'center'}}>
            <p style={{color:'var(--text-muted)',fontSize:'1rem'}}>&copy; {new Date().getFullYear()} Start Loft. Все права защищены.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
