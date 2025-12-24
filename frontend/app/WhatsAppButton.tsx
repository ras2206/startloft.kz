"use client";
import React from "react";

export default function WhatsAppButton({ phone, type = "tournament" }: { phone: string, type?: "tournament" | "appbar" }) {
  const handleClick = () => {
    let text = "";
    if (type === "tournament") {
      text = "Здравствуйте, хотел узнать ближайшие турниры";
    } else {
      text = "Здравствуйте, пишу с сайта, есть вопрос.";
    }
    const url = `https://wa.me/${phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };
  return type === "appbar" ? (
    <button
      className="button"
      style={{background:'none',border:'none',padding:'0',marginLeft:'8px',cursor:'pointer',display:'flex',alignItems:'center'}}
      onClick={handleClick}
      aria-label="WhatsApp"
    >
      <img src="/whatsApp_icon.png" alt="WhatsApp" className="whatsapp-appbar-icon" />
    </button>
  ) : (
    <button
      className="button"
      style={{
        fontWeight: "bold",
        fontSize: "1.25rem",
        padding: "18px 36px",
        marginTop: "12px",
        background: "var(--accent-green)",
        color: "#fff",
        border: "none",
        borderRadius: "12px",
        boxShadow: "0 2px 12px rgba(27,125,58,0.13)",
        cursor: "pointer",
      }}
      onClick={handleClick}
    >
      Написать в WhatsApp
    </button>
  );
}
