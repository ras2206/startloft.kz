"use client";
import React from "react";
import WhatsAppButton from "./WhatsAppButton";

export default function WhatsAppNoTournamentsCard({ phone }: { phone: string }) {
  return (
    <div style={{
      background: 'rgba(34,36,38,0.72)',
      borderRadius: '0',
      padding: '36px 32px',
      textAlign: 'center',
      color: '#fff',
      boxShadow: '0 6px 32px rgba(0,0,0,0.18)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      width: '100%',
      maxWidth: '1100px',
      margin: '0 auto',
      boxSizing: 'border-box',
      height: '100%',
      minHeight: '220px',
    }}>
      <WhatsAppButton phone={phone} />
      <div style={{fontWeight:'bold',fontSize:'1.15rem',color:'#fff',textShadow:'0 2px 12px #000a',marginTop:'8px'}}>Сейчас открытых турниров нет</div>
      <div style={{fontSize:'1.08rem',color:'#e0e0e0',textShadow:'0 2px 12px #000a',marginTop:'2px'}}>Напишите в WhatsApp — сообщим о ближайшем</div>
    </div>
  );
}
