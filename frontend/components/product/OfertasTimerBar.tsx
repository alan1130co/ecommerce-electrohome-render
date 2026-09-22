"use client";

import { useEffect, useState } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getRemaining() {
  const now = new Date();
  const finDelDia = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const diff = Math.max(0, finDelDia.getTime() - now.getTime());
  return {
    h: pad(Math.floor(diff / 3600000)),
    m: pad(Math.floor((diff % 3600000) / 60000)),
    s: pad(Math.floor((diff % 60000) / 1000)),
  };
}

// Cuenta regresiva hasta medianoche local — misma lógica que el <script> del
// home.html original, reproducida como componente cliente en vez de JS suelto.
export default function OfertasTimerBar() {
  const [tiempo, setTiempo] = useState({ h: "00", m: "00", s: "00" });

  useEffect(() => {
    setTiempo(getRemaining());
    const id = setInterval(() => setTiempo(getRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="offers-timer-bar">
      <div className="timer-inner">
        <i className="fas fa-bolt" />
        <span style={{ fontWeight: 800, letterSpacing: "0.04em" }}>OFERTAS DEL DÍA</span>
        <span style={{ opacity: 0.8, fontWeight: 500 }}>Termina en:</span>
        <div className="timer-block">
          <span className="timer-number">{tiempo.h}</span>
          <span className="timer-label">Horas</span>
        </div>
        <span style={{ fontSize: "1.1rem", fontWeight: 900, opacity: 0.7 }}>:</span>
        <div className="timer-block">
          <span className="timer-number">{tiempo.m}</span>
          <span className="timer-label">Min</span>
        </div>
        <span style={{ fontSize: "1.1rem", fontWeight: 900, opacity: 0.7 }}>:</span>
        <div className="timer-block">
          <span className="timer-number">{tiempo.s}</span>
          <span className="timer-label">Seg</span>
        </div>
      </div>
    </div>
  );
}
