"use client";
import React, { useState } from "react";

const RANKS = [
  { value: "КМС", label: "КМС (Кандидат в мастера спорта)" },
  { value: "МС", label: "МС (Мастер спорта)" },
  { value: "МСМК", label: "МСМК (Мастер спорта международного класса)" },
  { value: "ЗМС", label: "ЗМС (Заслуженный мастер спорта)" },
  { value: "Нет звания", label: "Нет звания" }
];
const COUNTRIES = [
  "Россия", 
  "Казахстан", 
  "Беларусь", 
  "Узбекистан", 
  "Киргизия", 
  "Таджикистан", 
  "Армения", 
  "Азербайджан", 
  "Молдова", 
  "Туркменистан"
];

export default function RegistrationPopup({ open, onClose, onSuccess, tournaments }: { open: boolean, onClose: () => void, onSuccess: () => void, tournaments: any[] }) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:2288";
  const [form, setForm] = useState({
    fio: "",
    phone: "",
    category: "",
    rank: "",
    country: "Казахстан",
    city: "",
    consent: true,
    honeypot: "",
    tournament_id: tournaments && tournaments[0] ? tournaments[0]._id : ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Маска для телефона
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
        return;
      }
      const data = await res.json().catch(() => ({}));
      
      // Показываем уведомление об успехе
      onSuccess();
      onClose();
      
      // Через 1 минуту переходим на WhatsApp
      if (data.whatsapp_link) {
        setTimeout(() => {
          window.open(data.whatsapp_link, '_blank');
        }, 60000);
      }
      
      if (data.whatsapp_link) {
  // Парсим номер и текст
  let url = data.whatsapp_link;
  let phone = '';
  let text = '';
  if (url.includes('wa.me/')) {
    const match = url.match(/wa\.me\/(\d+)\?text=(.*)$/);
    if (match) {
      phone = match[1];
      text = match[2];
    }
  }
  // Если не удалось распарсить, fallback на исходную ссылку
  const apiUrl = phone ? `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(decodeURIComponent(text))}` : url;
  window.open(apiUrl, '_blank');
}
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <form onSubmit={handleSubmit} style={{background:'#23272a',padding:'36px 32px',borderRadius:'18px',minWidth:'320px',maxWidth:'90vw',boxShadow:'0 8px 32px rgba(0,0,0,0.18)',display:'flex',flexDirection:'column',gap:'18px',color:'#fff',position:'relative'}} autoComplete="off">
        <input type="hidden" name="honeypot" value={form.honeypot} onChange={handleChange} />
        <input type="hidden" name="consent" value="true" />
        <h3 style={{textAlign:'center',fontWeight:'bold',fontSize:'1.35rem',marginBottom:'8px'}}>Регистрация на турнир</h3>

        {/* Выбор турнира по номеру */}
        {tournaments && tournaments.length > 0 && (
          <select name="tournament_id" value={form.tournament_id} onChange={handleChange} required style={{padding:'12px',borderRadius:'8px',border:'1px solid #ccc',fontSize:'1.08rem',marginBottom:'8px'}}>
            {tournaments.map((t, idx) => (
              <option key={t._id} value={t._id}>{`Турнир: ${t.title}`}</option>
            ))}
          </select>
        )}
        <button type="button" onClick={onClose} style={{position:'absolute',top:'16px',right:'16px',background:'none',border:'none',color:'#fff',fontSize:'1.5rem',cursor:'pointer'}}>&times;</button>
        <input name="fio" placeholder="ФИО" value={form.fio} onChange={handleChange} required style={{padding:'12px',borderRadius:'8px',border:'1px solid #ccc',fontSize:'1.08rem'}} />
        <input name="phone" placeholder="Телефон (+7 777 777-77-77)" value={form.phone} onChange={handlePhoneChange} required style={{padding:'12px',borderRadius:'8px',border:'1px solid #ccc',fontSize:'1.08rem'}} maxLength={17} />
        <select name="category" value={form.category} onChange={handleChange} required style={{padding:'12px',borderRadius:'8px',border:'1px solid #ccc',fontSize:'1.08rem'}}>
          <option value="">Выберите категорию</option>
          <option value="Профессионал +">Профессионал +</option>
          <option value="Профессионал">Профессионал</option>
          <option value="Любитель +">Любитель +</option>
          <option value="Любитель">Любитель</option>
        </select>
        
        <select name="rank" value={form.rank} onChange={handleChange} required style={{padding:'12px',borderRadius:'8px',border:'1px solid #ccc',fontSize:'1.08rem'}}>
          <option value="">Выберите разряд</option>
          {RANKS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select name="country" value={form.country} onChange={handleChange} required style={{padding:'12px',borderRadius:'8px',border:'1px solid #ccc',fontSize:'1.08rem'}}>
          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input name="city" placeholder="Город" value={form.city} onChange={handleChange} required style={{padding:'12px',borderRadius:'8px',border:'1px solid #ccc',fontSize:'1.08rem'}} />
        {error && <div style={{color:'#e74c3c',textAlign:'center'}}>{error}</div>}
        <button type="submit" disabled={loading} style={{background:'var(--accent-green)',color:'#fff',fontWeight:'bold',fontSize:'1.12rem',padding:'14px',border:'none',borderRadius:'8px',marginTop:'8px',cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1}}>
          {loading ? 'Отправка...' : 'Зарегистрироваться'}
        </button>
        {loading && <div style={{textAlign:'center',color:'#fff',marginTop:'-8px',fontSize:'0.98rem'}}>Пожалуйста, дождитесь завершения...</div>}
      </form>
    </div>
  );
}
