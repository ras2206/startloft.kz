'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Tournament } from '@/types';
import { useRouter } from 'next/navigation';

const RANKS = [
  { value: "КМС", label: "КМС (Кандидат в мастера спорта)" },
  { value: "МС", label: "МС (Мастер спорта)" },
  { value: "МСМК", label: "МСМК (Мастер спорта международного класса)" },
  { value: "ЗМС", label: "ЗМС (Заслуженный мастер спорта)" },
  { value: "Нет звания", label: "Нет звания" }
];

const COUNTRIES = [
  "Россия", "Казахстан", "Беларусь", "Узбекистан", 
  "Киргизия", "Таджикистан", "Армения", "Азербайджан", 
  "Молдова", "Туркменистан"
];

export default function RegistrationPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fio: "",
    phone: "",
    category: "",
    rank: "",
    country: "Казахстан",
    city: "",
    consent: true,
    honeypot: "",
    tournament_id: ""
  });

  useEffect(() => {
    api.getTournaments('published').then(data => {
      setTournaments(data);
      if (data.length > 0) {
        setForm(f => ({ ...f, tournament_id: data[0]._id }));
      }
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.startsWith("8")) value = "7" + value.slice(1);
    if (value.length > 11) value = value.slice(0, 11);
    let formatted = "+7 ";
    if (value.length > 1) formatted += value.slice(1, 4);
    if (value.length > 4) formatted += " " + value.slice(4, 7);
    if (value.length > 7) formatted += "-" + value.slice(7, 9);
    if (value.length > 9) formatted += "-" + value.slice(9, 11);
    setForm({ ...form, phone: formatted.trim() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const payload = {
      fio: form.fio,
      phone: form.phone,
      category: form.category,
      rank: form.rank,
      city_country: form.city + ", " + form.country,
      consent: true,
      honeypot: "",
      tournament_id: form.tournament_id
    };

    try {
      const res = await fetch(`${apiBase}/api/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detailMessage = Array.isArray(data.detail)
          ? data.detail[0]?.msg
          : typeof data.detail === "string"
            ? data.detail
            : data.detail
              ? JSON.stringify(data.detail)
              : "";
        if (detailMessage && detailMessage.includes("уже зарегистрированы")) {
          setError("Этот номер уже зарегистрирован на этот турнир");
        } else {
          setError(detailMessage || "Ошибка отправки. Попробуйте позже.");
        }
        setLoading(false);
        return;
      }

      const data = await res.json().catch(() => ({}));
      
      // Переходим на главную с параметром success
      router.push('/?registered=true&whatsapp=' + encodeURIComponent(data.whatsapp_link || ''));
    } catch (err) {
      setError("Ошибка соединения");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--main-bg)', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', background: '#232826', borderRadius: '16px', padding: '40px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', marginBottom: '40px' }}>
        <h1 style={{ color: 'var(--accent-green)', fontSize: '2rem', fontWeight: 'bold', marginBottom: '30px', textAlign: 'center' }}>
          Регистрация на турнир
        </h1>

        {error && (
          <div style={{ background: '#ef4444', color: '#fff', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {tournaments.length > 1 && (
            <div>
              <label style={{ color: '#fff', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                Турнир <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                name="tournament_id"
                required
                value={form.tournament_id}
                onChange={handleChange}
                style={{ width: '100%', height: '48px', padding: '0 12px', borderRadius: '8px', border: '1px solid #444', background: '#1a1a1a', color: '#fff', fontSize: '16px' }}
              >
                {tournaments.map((t, idx) => (
                  <option key={t._id} value={t._id}>
                    Турнир №{idx + 1}: {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ color: '#fff', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
              ФИО <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              name="fio"
              required
              value={form.fio}
              onChange={handleChange}
              placeholder="Иванов Иван Иванович"
              style={{ width: '100%', height: '48px', padding: '0 12px', borderRadius: '8px', border: '1px solid #444', background: '#1a1a1a', color: '#fff', fontSize: '16px' }}
            />
          </div>

          <div>
            <label style={{ color: '#fff', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
              Телефон (WhatsApp) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={form.phone}
              onChange={handlePhoneChange}
              placeholder="+7 777 123-45-67"
              style={{ width: '100%', height: '48px', padding: '0 12px', borderRadius: '8px', border: '1px solid #444', background: '#1a1a1a', color: '#fff', fontSize: '16px' }}
            />
          </div>

          <div>
            <label style={{ color: '#fff', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
              Категория <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              name="category"
              required
              value={form.category}
              onChange={handleChange}
              style={{ width: '100%', height: '48px', padding: '0 12px', borderRadius: '8px', border: '1px solid #444', background: '#1a1a1a', color: '#fff', fontSize: '16px' }}
            >
              <option value="">Выберите категорию</option>
              <option value="Любитель">Любитель</option>
              <option value="Профессионал">Профессионал</option>
              <option value="Мастер">Мастер</option>
            </select>
          </div>

          <div>
            <label style={{ color: '#fff', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
              Спортивное звание <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              name="rank"
              required
              value={form.rank}
              onChange={handleChange}
              style={{ width: '100%', height: '48px', padding: '0 12px', borderRadius: '8px', border: '1px solid #444', background: '#1a1a1a', color: '#fff', fontSize: '16px' }}
            >
              <option value="">Выберите звание</option>
              {RANKS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ color: '#fff', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
              Город <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              name="city"
              required
              value={form.city}
              onChange={handleChange}
              placeholder="Москва"
              style={{ width: '100%', height: '48px', padding: '0 12px', borderRadius: '8px', border: '1px solid #444', background: '#1a1a1a', color: '#fff', fontSize: '16px' }}
            />
          </div>

          <div>
            <label style={{ color: '#fff', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
              Страна <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              name="country"
              required
              value={form.country}
              onChange={handleChange}
              style={{ width: '100%', height: '48px', padding: '0 12px', borderRadius: '8px', border: '1px solid #444', background: '#1a1a1a', color: '#fff', fontSize: '16px' }}
            >
              {COUNTRIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 1, background: 'var(--accent-green)', color: '#fff', fontWeight: 'bold', fontSize: '18px', padding: '16px', borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Отправка...' : 'Зарегистрироваться'}
            </button>
            <a
              href="/"
              style={{ flex: 1, background: '#444', color: '#fff', fontWeight: 'bold', fontSize: '18px', padding: '16px', borderRadius: '12px', border: 'none', cursor: 'pointer', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Отмена
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
