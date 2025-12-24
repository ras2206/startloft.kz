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
  const [selectedTournamentId, setSelectedTournamentId] = useState(initialTournament ? initialTournament._id : tournaments[0]?._id);
  const selectedTournament = tournaments.find(t => t._id === selectedTournamentId) || tournaments[0];
  const [formData, setFormData] = useState<RegistrationForm>({
    tournament_id: selectedTournament._id,
    fio: '',
    birthDate: '',
    phone: '',
    category: 'Любитель',
    rank: 'КМС',
    city_country: '',
    consent: true,
    honeypot: '',
  });
  const [country, setCountry] = useState('Казахстан');
  const [city, setCity] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Нормализуем телефон и объединяем город и страну
      const normalizedData = {
        ...formData,
        tournament_id: selectedTournamentId,
        birth_date: formData.birthDate,
        phone: normalizePhone(formData.phone),
        city_country: `${city}, ${country}`,
      };

      const response = await api.createRegistration(normalizedData);
      // Перенаправляем на страницу успеха с данными
      router.push(`/success?whatsapp=${encodeURIComponent(response.whatsapp_link)}&tournament=${encodeURIComponent(selectedTournament.title)}`);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при регистрации');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Выбор турнира по номеру */}
      {tournaments.length > 1 && (
        <div>
          <label htmlFor="tournament_id" style={{ display: 'block', color: '#333', fontWeight: '600', marginBottom: '8px', fontSize: '0.95rem' }}>
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
            style={{ width: '100%', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', fontSize: '1rem', color: '#333', outline: 'none' }}
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

      {/* ФИО */}
      <div>
        <label htmlFor="fio" style={{ display: 'block', color: '#333', fontWeight: '600', marginBottom: '8px', fontSize: '0.95rem' }}>
          ФИО <span style={{ color: '#e74c3c' }}>*</span>
        </label>
        <input
          type="text"
          id="fio"
          required
          value={formData.fio}
          onChange={(e) => setFormData({ ...formData, fio: e.target.value })}
          style={{ width: '100%', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', fontSize: '1rem', color: '#333', outline: 'none' }}
          placeholder="Иванов Иван Иванович"
        />
      </div>

      {/* Телефон */}
      <div>
        <label htmlFor="phone" style={{ display: 'block', color: '#333', fontWeight: '600', marginBottom: '8px', fontSize: '0.95rem' }}>
          Телефон (WhatsApp) <span style={{ color: '#e74c3c' }}>*</span>
        </label>
        <input
          type="tel"
          id="phone"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          style={{ width: '100%', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', fontSize: '1rem', color: '#333', outline: 'none' }}
          placeholder="+7 (707) 123-45-67"
        />
        <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '6px' }}>Формат: +7 (XXX) XXX-XX-XX</p>
      </div>

      {/* Страна */}
      <div>
        <label htmlFor="country" style={{ display: 'block', color: '#333', fontWeight: '600', marginBottom: '8px', fontSize: '0.95rem' }}>
          Страна <span style={{ color: '#e74c3c' }}>*</span>
        </label>
        <select
          id="country"
          required
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          style={{ width: '100%', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', fontSize: '1rem', color: '#333', outline: 'none' }}
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

      {/* Город */}
      <div>
        <label htmlFor="city" style={{ display: 'block', color: '#333', fontWeight: '600', marginBottom: '8px', fontSize: '0.95rem' }}>
          Город <span style={{ color: '#e74c3c' }}>*</span>
        </label>
        <input
          type="text"
          id="city"
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={{ width: '100%', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', fontSize: '1rem', color: '#333', outline: 'none' }}
          placeholder="Кызылорда"
        />
      </div>

      {/* Категория */}
      <div>
        <label htmlFor="category" style={{ display: 'block', color: '#333', fontWeight: '600', marginBottom: '8px', fontSize: '0.95rem' }}>
          Категория <span style={{ color: '#e74c3c' }}>*</span>
        </label>
        <select
          id="category"
          required
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as RegistrationForm['category'] })}
          style={{ width: '100%', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', fontSize: '1rem', color: '#333', outline: 'none' }}
        >
          <option value="Профессионал">Профессионал</option>
          <option value="Любитель">Любитель</option>
        </select>
      </div>

      {/* Разряд */}
      <div>
        <label htmlFor="rank" style={{ display: 'block', color: '#333', fontWeight: '600', marginBottom: '8px', fontSize: '0.95rem' }}>
          Спортивное звание/разряд <span style={{ color: '#e74c3c' }}>*</span>
        </label>
        <select
          id="rank"
          required
          value={formData.rank}
          onChange={(e) => setFormData({ ...formData, rank: e.target.value as any })}
          style={{ width: '100%', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', fontSize: '1rem', color: '#333', outline: 'none' }}
        >
          <option value="КМС">КМС</option>
          <option value="МС">МС</option>
          <option value="МСМК">МСМК</option>
          <option value="ЗМС">ЗМС</option>
          <option value="Не выбрано">Не выбрано</option>
        </select>
      </div>

      {/* Комментарий (опционально) */}
      {selectedTournament?.required_fields?.includes('comment') && (
        <div>
          <label htmlFor="comment" style={{ display: 'block', color: '#333', fontWeight: '600', marginBottom: '8px', fontSize: '0.95rem' }}>
            Комментарий
          </label>
          <textarea
            id="comment"
            value={formData.comment || ''}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            style={{ width: '100%', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', fontSize: '1rem', color: '#333', outline: 'none', minHeight: '80px' }}
            rows={3}
            placeholder="Дополнительная информация"
          />
        </div>
      )}

      {/* Honeypot (скрытое поле для защиты от ботов) */}
      <input
        type="text"
        name="honeypot"
        value={formData.honeypot}
        onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
      />

      {/* Кнопка отправки */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          background: loading ? '#ccc' : 'var(--accent-green)',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '1.05rem',
          padding: '14px',
          borderRadius: '10px',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
          opacity: loading ? 0.6 : 1
        }}
      >
        {loading ? 'Отправка...' : 'Зарегистрироваться'}
      </button>
    </form>
  );
}
