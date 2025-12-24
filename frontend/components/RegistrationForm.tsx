'use client';

import { useState } from 'react';
import { Tournament, RegistrationForm } from '@/types';
import { normalizePhone } from '@/lib/utils';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function RegistrationFormComponent({ tournaments, initialTournament }: { tournaments: Tournament[], initialTournament?: Tournament }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState(initialTournament ? initialTournament._id : tournaments[0]?._id);
  const selectedTournament = tournaments.find(t => t._id === selectedTournamentId) || tournaments[0];
  const [formData, setFormData] = useState<RegistrationForm>({
    tournament_id: selectedTournament._id,
    fio: '',
    birthDate: '',
    phone: '',
    category: 'Любитель',
    rank: 'Не выбрано',
    city_country: '',
    consent: true,
    honeypot: '',
  });
  const [country, setCountry] = useState('Казахстан');
  const [city, setCity] = useState('');

  // Маска для телефона +7 (XXX) XXX-XX-XX
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    let formatted = '+7';
    
    if (cleaned.length > 1) {
      const number = cleaned.substring(1);
      if (number.length > 0) formatted += ' (' + number.substring(0, 3);
      if (number.length >= 3) formatted += ') ' + number.substring(3, 6);
      if (number.length >= 6) formatted += '-' + number.substring(6, 8);
      if (number.length >= 8) formatted += '-' + number.substring(8, 10);
    }
    
    setFormData({ ...formData, phone: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalizedData = {
        ...formData,
        tournament_id: selectedTournamentId,
        birth_date: formData.birthDate,
        phone: normalizePhone(formData.phone),
        city_country: `${city}, ${country}`,
      };

      const response = await api.createRegistration(normalizedData);
      
      // Показываем уведомление успеха
      setLoading(false);
      setShowSuccess(true);
      
      // Очищаем форму
      setFormData({
        tournament_id: selectedTournamentId,
        fio: '',
        birthDate: '',
        phone: '',
        category: 'Любитель',
        rank: 'Не выбрано',
        city_country: '',
        consent: true,
        honeypot: '',
      });
      setCity('');
      setCountry('Казахстан');
      
      // Через 0.5 сек открываем WhatsApp
      setTimeout(() => {
        window.open(response.whatsapp_link, '_blank');
      }, 500);
      
      // Скрываем уведомление через 3 секунды
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при регистрации');
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: '#f5f5f5',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '14px 12px',
    fontSize: '1rem',
    color: '#333',
    outline: 'none',
    height: '50px',
    boxSizing: 'border-box' as const
  };

  const labelStyle = {
    display: 'block',
    color: '#333',
    fontWeight: '600',
    marginBottom: '8px',
    fontSize: '0.95rem'
  };

  return (
    <>
      {/* Уведомление об успехе */}
      {showSuccess && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#10b981',
          color: '#fff',
          padding: '16px 32px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
          zIndex: 9999,
          fontSize: '1.05rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          ✅ Успешно отправлено!
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {tournaments.length > 1 && (
        <div>
          <label htmlFor="tournament_id" style={labelStyle}>
            Турнир <span style={{ color: '#e74c3c' }}>*</span>
          </label>
          <select
            id="tournament_id"
            required
            value={selectedTournamentId}
            onChange={e => {
              setSelectedTournamentId(e.target.value);
              setFormData(f => ({ ...f, tournament_id: e.target.value }));
            }}
            style={inputStyle}
          >
            {tournaments.map((t, idx) => (
              <option key={t._id} value={t._id}>
                {`Турнир №${idx + 1}: ${t.title}`}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {error && (
        <div style={{ background: '#fee', border: '1px solid #e74c3c', color: '#e74c3c', padding: '12px', borderRadius: '8px', fontSize: '0.95rem' }}>
          {error}
        </div>
      )}

      <div>
        <label htmlFor="fio" style={labelStyle}>
          ФИО <span style={{ color: '#e74c3c' }}>*</span>
        </label>
        <input
          type="text"
          id="fio"
          required
          value={formData.fio}
          onChange={(e) => setFormData({ ...formData, fio: e.target.value })}
          style={inputStyle}
          placeholder="Иванов Иван Иванович"
        />
      </div>

      <div>
        <label htmlFor="birthDate" style={labelStyle}>
          Дата рождения <span style={{ color: '#e74c3c' }}>*</span>
        </label>
        <input
          type="date"
          id="birthDate"
          required
          value={formData.birthDate}
          onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
          style={inputStyle}
          max={new Date(new Date().setFullYear(new Date().getFullYear() - 5)).toISOString().split('T')[0]}
          min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0]}
        />
        <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '6px' }}>Участник должен быть старше 18 лет</p>
      </div>

      <div>
        <label htmlFor="phone" style={labelStyle}>
          Телефон (WhatsApp) <span style={{ color: '#e74c3c' }}>*</span>
        </label>
        <input
          type="tel"
          id="phone"
          required
          value={formData.phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          style={inputStyle}
          placeholder="+7 (707) 123-45-67"
          maxLength={18}
        />
        <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '6px' }}>Формат: +7 (XXX) XXX-XX-XX</p>
      </div>

      <div>
        <label htmlFor="country" style={labelStyle}>
          Страна <span style={{ color: '#e74c3c' }}>*</span>
        </label>
        <select
          id="country"
          required
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          style={inputStyle}
        >
          <option value="Казахстан">Казахстан</option>
          <option value="Россия">Россия</option>
          <option value="Узбекистан">Узбекистан</option>
          <option value="Кыргызстан">Кыргызстан</option>
          <option value="Таджикистан">Таджикистан</option>
          <option value="Туркменистан">Туркменистан</option>
          <option value="Азербайджан">Азербайджан</option>
          <option value="Беларусь">Беларусь</option>
          <option value="Другая">Другая</option>
        </select>
      </div>

      <div>
        <label htmlFor="city" style={labelStyle}>
          Город <span style={{ color: '#e74c3c' }}>*</span>
        </label>
        <input
          type="text"
          id="city"
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={inputStyle}
          placeholder="Кызылорда"
        />
      </div>

      <div>
        <label htmlFor="category" style={labelStyle}>
          Категория <span style={{ color: '#e74c3c' }}>*</span>
        </label>
        <select
          id="category"
          required
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as RegistrationForm['category'] })}
          style={inputStyle}
        >
          <option value="Профессионал">Профессионал</option>
          <option value="Любитель">Любитель</option>
        </select>
      </div>

      <div>
        <label htmlFor="rank" style={labelStyle}>
          Спортивное звание/разряд <span style={{ color: '#e74c3c' }}>*</span>
        </label>
        <select
          id="rank"
          required
          value={formData.rank}
          onChange={(e) => setFormData({ ...formData, rank: e.target.value as any })}
          style={inputStyle}
        >
          <option value="Не выбрано">Не выбрано</option>
          <option value="КМС">КМС</option>
          <option value="МС">МС</option>
          <option value="МСМК">МСМК</option>
          <option value="ЗМС">ЗМС</option>
        </select>
      </div>

      {selectedTournament?.required_fields?.includes('comment') && (
        <div>
          <label htmlFor="comment" style={labelStyle}>
            Комментарий
          </label>
          <textarea
            id="comment"
            value={formData.comment || ''}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            style={{ ...inputStyle, height: 'auto', minHeight: '80px', resize: 'vertical' }}
            rows={3}
            placeholder="Дополнительная информация"
          />
        </div>
      )}

      <input
        type="text"
        name="honeypot"
        value={formData.honeypot}
        onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
      />

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          background: loading ? '#ccc' : 'var(--accent-green)',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '1.05rem',
          padding: '16px',
          borderRadius: '10px',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
          opacity: loading ? 0.6 : 1,
          height: '56px'
        }}
      >
        {loading ? 'Отправка...' : 'Зарегистрироваться'}
      </button>
    </form>
    </>
  );
}