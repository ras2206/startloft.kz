"use client";
import React, { useState } from "react";

export default function RegistrationSection({ tournaments }: { tournaments: any[] }) {
  const [popupOpen, setPopupOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  return (
    <section className="section" style={{background:'#23272a',borderRadius:'24px',boxShadow:'0 4px 24px rgba(0,0,0,0.10)',padding:'36px 0',margin:'32px auto',maxWidth:'1100px'}}>
      <h2 style={{textAlign:'center',fontWeight:'bold',fontSize:'2.2rem',color:'#fff',marginBottom:'18px',letterSpacing:'0.5px'}}>Зарегистрироваться на турнир</h2>
      <div style={{display:'flex',gap:'32px',flexWrap:'wrap',justifyContent:'center',marginTop:'32px'}}>
        {[
          { num: '01', title: 'Выберите турнир', desc: 'Найдите подходящий турнир' },
          { num: '02', title: 'Заполните данные', desc: 'ФИО, телефон, разряд, город' },
          { num: '03', title: 'Подтверждение', desc: 'Подтвердим в WhatsApp' },
        ].map((step, idx) => (
          <div key={idx} style={{background:'#fff',borderRadius:'16px',padding:'32px 28px',minWidth:'220px',boxShadow:'0 4px 18px rgba(0,0,0,0.10)',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:'10px',maxWidth:'320px'}}>
            <div className="loft-accent" style={{fontSize:'2.4rem',marginBottom:'8px',color:'var(--accent-green)',fontWeight:'bold'}}>{step.num}</div>
            <div style={{fontWeight:'bold',fontSize:'1.18rem',marginBottom:'8px',color:'#23272a'}}>{step.title}</div>
            <div style={{color:'#666',fontSize:'1.08rem'}}>{step.desc}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'center',marginTop:'36px'}}>
        <a href="/registration" style={{background:'var(--accent-green)',color:'#fff',fontWeight:'bold',fontSize:'1.18rem',padding:'18px 38px',border:'none',borderRadius:'12px',boxShadow:'0 2px 12px rgba(27,125,58,0.13)',cursor:'pointer',textDecoration:'none',display:'inline-block'}}>Войти в число участников</a>
      </div>
    </section>
  );
}
