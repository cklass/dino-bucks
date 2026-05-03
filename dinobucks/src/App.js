/* eslint-disable */
const TEACHER_USER = "teacher";
const TEACHER_PASS = "dinobucks";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { saveToFirebase, subscribeToFirebase } from "./firebase";

// — Sound effects
const playSound = (type) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const c = new AudioCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g);
    g.connect(c.destination);

    if (type === "ching") {
      o.frequency.setValueAtTime(1200, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.1);
      g.gain.setValueAtTime(0.3, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
      o.start(); o.stop(c.currentTime + 0.4);
    } else if (type === "deduct") {
      o.type = "sawtooth";
      o.frequency.setValueAtTime(300, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.2);
      g.gain.setValueAtTime(0.2, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
      o.start(); o.stop(c.currentTime + 0.3);
    } else if (type === "pop") {
      o.frequency.setValueAtTime(600, c.currentTime);
      g.gain.setValueAtTime(0.2, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
      o.start(); o.stop(c.currentTime + 0.1);
    }
  } catch(e) {}
};



const sounds = {
  ching: () => playSound("ching"),
  deduct: () => playSound("deduct"),
  pop: () => playSound("pop"),
};

// ── Canadian bill colours ─────────────────────────────────────────────────────
const BILL = {
  1:   { bg:"#A0785A", light:"#f5ede6" },
  2:   { bg:"#8B9E6B", light:"#edf2e4" },
  5:   { bg:"#4A7FBF", light:"#daeaf8" },
  10:  { bg:"#7B68A8", light:"#e8e3f5" },
  20:  { bg:"#3A9A5C", light:"#d4f0e2" },
  50:  { bg:"#C0392B", light:"#fde8e8" },
  100: { bg:"#7D5A3C", light:"#f0e6d8" },
};
const billColour = n => n>=100?BILL[100]:n>=50?BILL[50]:n>=20?BILL[20]:n>=10?BILL[10]:n>=2?BILL[2]:BILL[1];
function shade(hex, amt) {
  const n = parseInt(hex.replace("#",""),16);
  const r = Math.min(255,Math.max(0,(n>>16)+amt));
  const g = Math.min(255,Math.max(0,((n>>8)&0xff)+amt));
  const b = Math.min(255,Math.max(0,(n&0xff)+amt));
  return "#"+[r,g,b].map(v=>v.toString(16).padStart(2,"0")).join("");
}

// ── SVG Dinosaurs ─────────────────────────────────────────────────────────────
function DinoSVG({ id, c, size=80 }) {
  const dk = shade(c,-35);
  const lt = shade(c,40);
  const svgs = {
    trex:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="48" cy="63" rx="26" ry="19" fill={c}/><path d="M74 66 Q92 62 96 72 Q88 76 74 70Z" fill={c}/><path d="M30 50 Q20 38 24 26" stroke={c} strokeWidth="13" strokeLinecap="round" fill="none"/><ellipse cx="24" cy="22" rx="15" ry="10" fill={c}/><path d="M10 26 Q20 36 38 30 Q36 22 10 26Z" fill={dk}/><path d="M14 26 L16 33 M20 25 L22 32 M27 24 L29 31" stroke="white" strokeWidth="1.8" strokeLinecap="round"/><circle cx="18" cy="18" r="3.5" fill="white"/><circle cx="19.5" cy="18" r="1.8" fill="#111"/><ellipse cx="14" cy="16" rx="4" ry="2" fill={dk} opacity=".5"/><path d="M38 62 Q30 54 28 58" stroke={dk} strokeWidth="5" strokeLinecap="round" fill="none"/><path d="M28 58 L22 52 M28 58 L24 62" stroke={dk} strokeWidth="3" strokeLinecap="round"/><rect x="32" y="79" width="9" height="16" rx="4" fill={dk}/><rect x="50" y="77" width="9" height="18" rx="4" fill={dk}/><path d="M30 93 Q36 98 44 93" stroke={dk} strokeWidth="4" strokeLinecap="round" fill="none"/><path d="M48 93 Q54 98 62 93" stroke={dk} strokeWidth="4" strokeLinecap="round" fill="none"/><ellipse cx="46" cy="66" rx="17" ry="11" fill={lt} opacity=".3"/></svg>),
    triceratops:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="52" cy="64" rx="28" ry="18" fill={c}/><path d="M78 66 Q96 60 98 72 Q90 76 78 70Z" fill={c}/><path d="M28 54 Q18 44 20 32" stroke={c} strokeWidth="14" strokeLinecap="round" fill="none"/><ellipse cx="20" cy="24" rx="17" ry="15" fill={dk} opacity=".7"/><ellipse cx="20" cy="26" rx="12" ry="11" fill={lt}/><ellipse cx="20" cy="34" rx="15" ry="10" fill={c}/><path d="M10 22 L4 6 L18 20" fill={dk}/><path d="M20 18 L18 2 L26 16" fill={dk}/><path d="M30 20 L34 4 L36 20" fill={dk}/><path d="M8 34 L0 32 L8 40" fill={dk}/><circle cx="14" cy="30" r="3" fill="white"/><circle cx="15.5" cy="30" r="1.5" fill="#111"/><path d="M8 40 Q14 45 22 42" stroke={dk} strokeWidth="2" fill="none" strokeLinecap="round"/><rect x="34" y="78" width="10" height="16" rx="5" fill={dk}/><rect x="52" y="76" width="10" height="18" rx="5" fill={dk}/><rect x="20" y="77" width="8" height="14" rx="4" fill={dk}/><rect x="64" y="77" width="8" height="15" rx="4" fill={dk}/><ellipse cx="52" cy="66" rx="18" ry="10" fill={lt} opacity=".3"/></svg>),
    stegosaurus:(<svg viewBox="0 0 100 100" width={size} height={size}><path d="M36 52 L30 26 L44 50" fill={dk}/><path d="M48 48 L44 20 L56 46" fill={dk}/><path d="M62 52 L60 26 L68 50" fill={dk}/><path d="M72 58 L74 36 L78 56" fill={dk}/><ellipse cx="52" cy="67" rx="30" ry="17" fill={c}/><path d="M80 68 Q96 62 98 56 Q92 60 80 64Z" fill={c}/><path d="M88 60 L96 50 L90 62" fill={dk}/><path d="M93 63 L100 56 L96 65" fill={dk}/><path d="M26 57 Q16 47 20 36" stroke={c} strokeWidth="12" strokeLinecap="round" fill="none"/><ellipse cx="18" cy="32" rx="12" ry="8" fill={c}/><circle cx="12" cy="28" r="2.8" fill="white"/><circle cx="13.5" cy="28" r="1.4" fill="#111"/><path d="M8 36 Q13 40 20 38" stroke={dk} strokeWidth="1.8" fill="none"/><rect x="32" y="80" width="10" height="14" rx="5" fill={dk}/><rect x="52" y="78" width="10" height="16" rx="5" fill={dk}/><rect x="20" y="79" width="8" height="12" rx="4" fill={dk}/><rect x="64" y="79" width="8" height="13" rx="4" fill={dk}/><ellipse cx="50" cy="69" rx="20" ry="10" fill={lt} opacity=".3"/></svg>),
    brachiosaurus:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="56" cy="72" rx="28" ry="15" fill={c}/><path d="M82 74 Q98 78 100 68 Q92 64 82 70Z" fill={c}/><path d="M36 63 Q28 46 30 26 Q32 10 40 5" stroke={c} strokeWidth="14" strokeLinecap="round" fill="none"/><ellipse cx="42" cy="6" rx="11" ry="7" fill={c}/><ellipse cx="50" cy="7" rx="5" ry="4" fill={dk}/><circle cx="37" cy="3" r="2.5" fill="white"/><circle cx="38.5" cy="3" r="1.3" fill="#111"/><path d="M36 13 Q42 17 50 14" stroke={dk} strokeWidth="1.5" fill="none"/><rect x="38" y="84" width="11" height="13" rx="5" fill={dk}/><rect x="56" y="82" width="11" height="15" rx="5" fill={dk}/><rect x="25" y="83" width="9" height="12" rx="4" fill={dk}/><rect x="68" y="83" width="9" height="12" rx="4" fill={dk}/><ellipse cx="56" cy="74" rx="19" ry="9" fill={lt} opacity=".3"/></svg>),
    pterodactyl:(<svg viewBox="0 0 100 100" width={size} height={size}><path d="M46 48 Q18 28 4 38 Q14 52 46 56Z" fill={c}/><path d="M54 48 Q82 28 96 38 Q86 52 54 56Z" fill={c}/><path d="M46 50 Q30 42 12 42" stroke={dk} strokeWidth="1.2" fill="none" opacity=".6"/><path d="M54 50 Q70 42 88 42" stroke={dk} strokeWidth="1.2" fill="none" opacity=".6"/><ellipse cx="50" cy="55" rx="14" ry="10" fill={c}/><path d="M44 48 Q36 40 34 30" stroke={c} strokeWidth="10" strokeLinecap="round" fill="none"/><path d="M28 22 L22 6 L46 28" fill={dk}/><ellipse cx="34" cy="28" rx="13" ry="8" fill={c}/><path d="M22 30 L2 34 L22 36Z" fill={dk}/><circle cx="28" cy="24" r="3" fill="white"/><circle cx="29.5" cy="24" r="1.5" fill="#111"/><path d="M60 57 Q72 64 76 74 Q72 72 60 62Z" fill={c}/><path d="M46 64 L40 72 M50 65 L50 74 M54 64 L60 72" stroke={dk} strokeWidth="2.5" strokeLinecap="round"/><ellipse cx="50" cy="57" rx="8" ry="5" fill={lt} opacity=".4"/></svg>),
    ankylosaurus:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="50" cy="67" rx="35" ry="17" fill={c}/><circle cx="32" cy="56" r="6" fill={dk}/><circle cx="46" cy="52" r="6" fill={dk}/><circle cx="60" cy="52" r="6" fill={dk}/><circle cx="72" cy="56" r="6" fill={dk}/><circle cx="38" cy="64" r="5" fill={dk}/><circle cx="52" cy="62" r="5" fill={dk}/><circle cx="66" cy="64" r="5" fill={dk}/><circle cx="32" cy="56" r="3" fill={lt} opacity=".4"/><circle cx="60" cy="52" r="3" fill={lt} opacity=".4"/><path d="M16 64 L6 56 L16 70Z" fill={dk}/><path d="M16 73 L4 71 L16 79Z" fill={dk}/><path d="M84 64 L94 56 L84 70Z" fill={dk}/><path d="M84 73 L96 71 L84 79Z" fill={dk}/><path d="M83 67 Q96 64 98 71 Q96 78 83 72Z" fill={c}/><circle cx="96" cy="70" r="8" fill={dk}/><path d="M22 58 Q16 50 18 40" stroke={c} strokeWidth="12" strokeLinecap="round" fill="none"/><ellipse cx="16" cy="36" rx="14" ry="9" fill={c}/><circle cx="10" cy="32" r="2.8" fill="white"/><circle cx="11.5" cy="32" r="1.4" fill="#111"/><path d="M6 42 Q12 47 20 44" stroke={dk} strokeWidth="2" fill="none"/><rect x="28" y="80" width="11" height="12" rx="5" fill={dk}/><rect x="46" y="80" width="11" height="12" rx="5" fill={dk}/><rect x="16" y="79" width="9" height="11" rx="4" fill={dk}/><rect x="60" y="79" width="9" height="11" rx="4" fill={dk}/><ellipse cx="50" cy="71" rx="23" ry="10" fill={lt} opacity=".25"/></svg>),
    spinosaurus:(<svg viewBox="0 0 100 100" width={size} height={size}><path d="M36 52 L28 16 L44 50" fill={dk}/><path d="M48 48 L44 8 L56 46" fill={dk}/><path d="M60 50 L60 14 L66 48" fill={dk}/><path d="M67 54 L70 24 L74 52" fill={dk}/><path d="M28 20 Q44 10 70 26" stroke={dk} strokeWidth="2.5" fill={lt} opacity=".5"/><ellipse cx="50" cy="66" rx="28" ry="18" fill={c}/><path d="M76 68 Q94 62 96 74 Q88 78 76 72Z" fill={c}/><path d="M28 54 Q18 44 20 32" stroke={c} strokeWidth="13" strokeLinecap="round" fill="none"/><ellipse cx="20" cy="28" rx="9" ry="6" fill={c}/><path d="M6 26 L-2 24 L6 32Z" fill={c}/><path d="M6 24 Q12 20 20 24" stroke={dk} strokeWidth="1.5" fill="none"/><path d="M6 30 Q12 34 20 30" stroke={dk} strokeWidth="1.5" fill="none"/><circle cx="14" cy="24" r="2.5" fill="white"/><circle cx="15.5" cy="24" r="1.2" fill="#111"/><path d="M8 26 L10 33 M13 25 L15 32 M18 24 L20 31" stroke="white" strokeWidth="1.5" strokeLinecap="round"/><rect x="34" y="80" width="10" height="15" rx="4" fill={dk}/><rect x="52" y="78" width="10" height="17" rx="4" fill={dk}/><ellipse cx="50" cy="68" rx="18" ry="10" fill={lt} opacity=".3"/></svg>),
    velociraptor:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="52" cy="58" rx="22" ry="13" fill={c} transform="rotate(-14 52 58)"/><path d="M68 52 Q88 38 96 30 Q90 36 80 46 Q76 50 68 56Z" fill={c}/><path d="M36 50 Q26 40 28 26" stroke={c} strokeWidth="10" strokeLinecap="round" fill="none"/><ellipse cx="28" cy="22" rx="14" ry="8" fill={c}/><path d="M14 22 L4 20 L14 28Z" fill={c}/><path d="M4 20 Q8 16 14 20" stroke={dk} strokeWidth="1.5" fill="none"/><path d="M4 26 Q8 30 14 28" stroke={dk} strokeWidth="1.5" fill="none"/><circle cx="20" cy="18" r="2.8" fill="white"/><circle cx="21.5" cy="18" r="1.4" fill="#111"/><path d="M6 22 L8 29 M11 21 L13 28 M17 20 L19 27" stroke="white" strokeWidth="1.3" strokeLinecap="round"/><path d="M42 50 Q38 38 44 44 M50 48 Q48 34 54 42 M58 50 Q60 36 64 44" stroke={dk} strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M40 57 Q32 50 30 54 L24 48 M30 54 L26 56 M30 54 L24 58" stroke={dk} strokeWidth="3.5" strokeLinecap="round" fill="none"/><path d="M46 68 Q43 82 38 92" stroke={dk} strokeWidth="7" strokeLinecap="round" fill="none"/><path d="M58 66 Q60 80 62 90" stroke={dk} strokeWidth="7" strokeLinecap="round" fill="none"/><path d="M36 90 L30 97 M40 92 L38 98" stroke={dk} strokeWidth="2.5" strokeLinecap="round"/><path d="M60 88 L54 96 M64 90 L64 97" stroke={dk} strokeWidth="2.5" strokeLinecap="round"/><ellipse cx="50" cy="60" rx="14" ry="8" fill={lt} opacity=".3"/></svg>),
    parasaurolophus:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="52" cy="65" rx="26" ry="17" fill={c}/><path d="M76 67 Q94 62 96 72 Q88 76 76 71Z" fill={c}/><path d="M32 54 Q22 44 24 30" stroke={c} strokeWidth="13" strokeLinecap="round" fill="none"/><ellipse cx="24" cy="26" rx="13" ry="9" fill={c}/><path d="M18 18 Q22 2 38 0 Q44 0 42 9 Q36 9 28 16Z" fill={dk}/><path d="M20 8 Q26 4 34 6" stroke={lt} strokeWidth="1.8" fill="none" opacity=".7"/><path d="M12 28 L2 28 L12 34Z" fill={dk}/><circle cx="18" cy="22" r="2.8" fill="white"/><circle cx="19.5" cy="22" r="1.4" fill="#111"/><path d="M38 60 Q52 56 66 60 M36 66 Q52 62 68 66" stroke={dk} strokeWidth="1.8" fill="none" opacity=".5"/><rect x="34" y="78" width="10" height="16" rx="4" fill={dk}/><rect x="52" y="76" width="10" height="18" rx="4" fill={dk}/><rect x="22" y="77" width="8" height="14" rx="4" fill={dk}/><ellipse cx="52" cy="67" rx="16" ry="9" fill={lt} opacity=".3"/></svg>),
    diplodocus:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="50" cy="70" rx="24" ry="14" fill={c}/><path d="M72 70 Q86 62 94 52 Q90 58 82 66 Q78 68 72 72Z" fill={c}/><path d="M28 64 Q16 56 10 44 Q6 36 8 30" stroke={c} strokeWidth="12" strokeLinecap="round" fill="none"/><ellipse cx="8" cy="26" rx="10" ry="7" fill={c}/><circle cx="3" cy="22" r="2.2" fill="white"/><circle cx="4.5" cy="22" r="1.1" fill="#111"/><path d="M2 30 Q6 34 14 31" stroke={dk} strokeWidth="1.5" fill="none"/><circle cx="2" cy="26" r="1.8" fill={dk}/><rect x="32" y="80" width="11" height="16" rx="5" fill={dk}/><rect x="50" y="78" width="11" height="18" rx="5" fill={dk}/><rect x="20" y="79" width="9" height="14" rx="4" fill={dk}/><rect x="63" y="79" width="9" height="14" rx="4" fill={dk}/><ellipse cx="50" cy="72" rx="16" ry="8" fill={lt} opacity=".3"/></svg>),
    iguanodon:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="50" cy="62" rx="26" ry="17" fill={c}/><path d="M74 64 Q90 60 92 70 Q86 74 74 68Z" fill={c}/><path d="M30 52 Q20 42 22 28" stroke={c} strokeWidth="12" strokeLinecap="round" fill="none"/><ellipse cx="22" cy="24" rx="14" ry="9" fill={c}/><circle cx="16" cy="20" r="2.8" fill="white"/><circle cx="17.5" cy="20" r="1.4" fill="#111"/><path d="M10 28 Q16 33 24 30" stroke={dk} strokeWidth="1.5" fill="none"/><path d="M36 58 Q28 50 24 52 L16 42" stroke={dk} strokeWidth="5" strokeLinecap="round" fill="none"/><path d="M16 42 L10 34" stroke={dk} strokeWidth="3.5" strokeLinecap="round"/><path d="M36 56 L30 48 L38 52Z" fill={dk}/><rect x="34" y="76" width="10" height="17" rx="4" fill={dk}/><rect x="52" y="74" width="10" height="19" rx="4" fill={dk}/><rect x="22" y="74" width="8" height="15" rx="4" fill={dk}/><ellipse cx="50" cy="64" rx="16" ry="9" fill={lt} opacity=".3"/></svg>),
    pachycephalosaurus:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="50" cy="64" rx="24" ry="16" fill={c}/><path d="M72 66 Q88 62 90 72 Q84 76 72 70Z" fill={c}/><path d="M34 54 Q26 44 28 32" stroke={c} strokeWidth="13" strokeLinecap="round" fill="none"/><ellipse cx="28" cy="28" rx="14" ry="9" fill={c}/><ellipse cx="28" cy="20" rx="13" ry="9" fill={dk}/><circle cx="16" cy="22" r="3" fill={dk}/><circle cx="40" cy="22" r="3" fill={dk}/><circle cx="20" cy="14" r="2.5" fill={dk}/><circle cx="36" cy="14" r="2.5" fill={dk}/><circle cx="28" cy="11" r="2.5" fill={dk}/><circle cx="20" cy="28" r="2.8" fill="white"/><circle cx="21.5" cy="28" r="1.4" fill="#111"/><path d="M14 34 Q20 39 28 36" stroke={dk} strokeWidth="1.5" fill="none"/><path d="M36 58 Q30 52 28 56" stroke={dk} strokeWidth="3.5" strokeLinecap="round" fill="none"/><rect x="34" y="78" width="10" height="15" rx="4" fill={dk}/><rect x="52" y="76" width="10" height="17" rx="4" fill={dk}/><ellipse cx="50" cy="66" rx="16" ry="9" fill={lt} opacity=".3"/></svg>),
    allosaurus:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="48" cy="62" rx="26" ry="18" fill={c}/><path d="M72 64 Q90 58 92 68 Q86 74 72 68Z" fill={c}/><path d="M28 52 Q18 40 20 26" stroke={c} strokeWidth="13" strokeLinecap="round" fill="none"/><ellipse cx="20" cy="22" rx="15" ry="9" fill={c}/><path d="M12 18 Q17 13 24 15 Q29 11 34 15" stroke={dk} strokeWidth="3.5" fill="none" strokeLinecap="round"/><path d="M8 26 L0 22 L8 32Z" fill={c}/><path d="M0 22 Q4 18 8 22" stroke={dk} strokeWidth="1.5" fill="none"/><path d="M0 28 Q4 32 8 30" stroke={dk} strokeWidth="1.5" fill="none"/><circle cx="14" cy="20" r="3" fill="white"/><circle cx="15.5" cy="20" r="1.5" fill="#111"/><path d="M2 24 L4 31 M7 23 L9 30 M13 21 L15 28 M19 20 L21 27" stroke="white" strokeWidth="1.5" strokeLinecap="round"/><path d="M36 60 Q28 54 26 58" stroke={dk} strokeWidth="4.5" strokeLinecap="round" fill="none"/><rect x="32" y="77" width="10" height="17" rx="4" fill={dk}/><rect x="50" y="75" width="10" height="19" rx="4" fill={dk}/><ellipse cx="48" cy="65" rx="16" ry="10" fill={lt} opacity=".3"/></svg>),
    carnotaurus:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="50" cy="63" rx="26" ry="17" fill={c}/><path d="M74 65 Q92 60 94 70 Q86 74 74 69Z" fill={c}/><path d="M30 52 Q20 42 22 28" stroke={c} strokeWidth="13" strokeLinecap="round" fill="none"/><ellipse cx="22" cy="24" rx="14" ry="9" fill={c}/><path d="M14 20 L8 7 L18 19" fill={dk}/><path d="M26 18 L24 5 L32 17" fill={dk}/><circle cx="28" cy="56" r="2.5" fill={dk} opacity=".6"/><circle cx="42" cy="54" r="2.5" fill={dk} opacity=".6"/><circle cx="56" cy="54" r="2.5" fill={dk} opacity=".6"/><circle cx="64" cy="60" r="2" fill={dk} opacity=".6"/><circle cx="16" cy="20" r="2.8" fill="white"/><circle cx="17.5" cy="20" r="1.4" fill="#111"/><path d="M10 28 Q16 33 24 30" stroke={dk} strokeWidth="1.5" fill="none"/><path d="M34 60 Q30 56 28 58" stroke={dk} strokeWidth="3.5" strokeLinecap="round" fill="none"/><rect x="34" y="77" width="10" height="16" rx="4" fill={dk}/><rect x="52" y="75" width="10" height="18" rx="4" fill={dk}/><ellipse cx="50" cy="65" rx="16" ry="9" fill={lt} opacity=".3"/></svg>),
    therizinosaurus:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="50" cy="64" rx="24" ry="17" fill={c}/><path d="M72 66 Q86 62 88 72 Q82 76 72 70Z" fill={c}/><path d="M32 54 Q22 44 24 30" stroke={c} strokeWidth="12" strokeLinecap="round" fill="none"/><ellipse cx="24" cy="26" rx="12" ry="8" fill={c}/><circle cx="18" cy="22" r="2.5" fill="white"/><circle cx="19.5" cy="22" r="1.2" fill="#111"/><path d="M36 56 Q26 46 20 48 L8 34 M20 48 L12 50" stroke={dk} strokeWidth="5.5" strokeLinecap="round" fill="none"/><path d="M8 34 L2 24" stroke={dk} strokeWidth="4" strokeLinecap="round"/><path d="M12 50 L4 44" stroke={dk} strokeWidth="3.5" strokeLinecap="round"/><path d="M44 56 Q40 42 46 50 M52 54 Q50 40 56 48 M60 56 Q62 42 66 50" stroke={dk} strokeWidth="2.5" fill="none" strokeLinecap="round"/><rect x="34" y="78" width="10" height="16" rx="4" fill={dk}/><rect x="52" y="76" width="10" height="18" rx="4" fill={dk}/><ellipse cx="50" cy="66" rx="16" ry="9" fill={lt} opacity=".3"/></svg>),
    gallimimus:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="50" cy="58" rx="20" ry="13" fill={c} transform="rotate(-10 50 58)"/><path d="M64 52 Q82 40 92 32 Q86 38 76 48 Q70 52 64 56Z" fill={c}/><path d="M34 50 Q22 36 24 18" stroke={c} strokeWidth="9" strokeLinecap="round" fill="none"/><ellipse cx="24" cy="14" rx="11" ry="7" fill={c}/><path d="M14 14 L3 12 L14 20Z" fill={dk}/><circle cx="18" cy="10" r="2.5" fill="white"/><circle cx="19.5" cy="10" r="1.2" fill="#111"/><path d="M38 52 Q34 38 40 46 M46 50 Q44 36 50 44" stroke={dk} strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M38 56 Q30 50 28 54" stroke={dk} strokeWidth="3.5" strokeLinecap="round" fill="none"/><path d="M44 68 Q40 84 36 94" stroke={dk} strokeWidth="8" strokeLinecap="round" fill="none"/><path d="M56 66 Q58 82 60 92" stroke={dk} strokeWidth="8" strokeLinecap="round" fill="none"/><path d="M34 92 L28 98 M38 94 L36 100" stroke={dk} strokeWidth="2.5" strokeLinecap="round"/><path d="M58 90 L52 97 M62 92 L62 99" stroke={dk} strokeWidth="2.5" strokeLinecap="round"/><ellipse cx="50" cy="60" rx="13" ry="7" fill={lt} opacity=".3"/></svg>),
    oviraptor:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="50" cy="62" rx="20" ry="14" fill={c}/><path d="M68 64 Q84 60 86 70 Q80 74 68 68Z" fill={c}/><path d="M34 54 Q24 44 26 30" stroke={c} strokeWidth="10" strokeLinecap="round" fill="none"/><ellipse cx="26" cy="26" rx="13" ry="8" fill={c}/><path d="M18 20 Q22 8 34 12 Q36 20 26 24Z" fill={dk}/><path d="M14 28 L4 26 L14 34Z" fill={dk}/><path d="M14 26 Q20 22 26 24" stroke={dk} strokeWidth="1.5" fill="none"/><circle cx="18" cy="22" r="2.5" fill="white"/><circle cx="19.5" cy="22" r="1.2" fill="#111"/><ellipse cx="38" cy="68" rx="8" ry="10" fill="white" stroke={dk} strokeWidth="1.8"/><path d="M34 64 Q38 60 42 64" stroke={dk} strokeWidth="1.2" fill="none" opacity=".5"/><path d="M34 58 Q30 62 30 68 Q32 72 38 74" stroke={dk} strokeWidth="4.5" strokeLinecap="round" fill="none"/><path d="M52 56 Q50 42 56 50 M60 58 Q62 44 66 52" stroke={dk} strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M44 74 Q40 86 36 94" stroke={dk} strokeWidth="6.5" strokeLinecap="round" fill="none"/><path d="M56 70 Q58 84 60 92" stroke={dk} strokeWidth="6.5" strokeLinecap="round" fill="none"/></svg>),
    kentrosaurus:(<svg viewBox="0 0 100 100" width={size} height={size}><path d="M34 54 L28 26 L42 52" fill={dk}/><path d="M46 50 L40 20 L54 48" fill={dk}/><path d="M58 52 L55 24 L66 50" fill={dk}/><path d="M70 62 L76 42 L74 64" fill={dk}/><path d="M76 64 L86 48 L80 66" fill={dk}/><path d="M82 66 L96 54 L86 68" fill={dk}/><ellipse cx="50" cy="68" rx="28" ry="16" fill={c}/><path d="M76 68 Q88 66 90 74 Q84 78 76 72Z" fill={c}/><path d="M26 58 Q16 48 20 36" stroke={c} strokeWidth="12" strokeLinecap="round" fill="none"/><ellipse cx="18" cy="32" rx="13" ry="8" fill={c}/><circle cx="11" cy="28" r="2.5" fill="white"/><circle cx="12.5" cy="28" r="1.2" fill="#111"/><path d="M8 36 Q14 41 20 38" stroke={dk} strokeWidth="1.5" fill="none"/><rect x="30" y="80" width="10" height="14" rx="4" fill={dk}/><rect x="50" y="78" width="10" height="16" rx="4" fill={dk}/><rect x="18" y="79" width="8" height="12" rx="4" fill={dk}/><rect x="62" y="79" width="8" height="13" rx="4" fill={dk}/><ellipse cx="50" cy="70" rx="18" ry="9" fill={lt} opacity=".3"/></svg>),
    styracosaurus:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="50" cy="65" rx="27" ry="17" fill={c}/><path d="M75 67 Q92 62 94 72 Q86 76 75 71Z" fill={c}/><path d="M28 54 Q18 46 20 34" stroke={c} strokeWidth="14" strokeLinecap="round" fill="none"/><ellipse cx="20" cy="30" rx="17" ry="15" fill={dk} opacity=".7"/><ellipse cx="20" cy="32" rx="11" ry="10" fill={lt}/><path d="M8 22 L2 6 L12 20" fill={dk}/><path d="M16 18 L12 2 L22 16" fill={dk}/><path d="M24 17 L24 1 L30 15" fill={dk}/><path d="M32 20 L38 4 L36 22" fill={dk}/><path d="M38 26 L46 12 L40 28" fill={dk}/><path d="M12 36 L4 24 L16 34" fill={dk}/><ellipse cx="20" cy="36" rx="14" ry="9" fill={c}/><circle cx="14" cy="32" r="2.8" fill="white"/><circle cx="15.5" cy="32" r="1.4" fill="#111"/><path d="M8 40 Q14 45 22 42" stroke={dk} strokeWidth="1.5" fill="none"/><rect x="30" y="78" width="10" height="17" rx="4" fill={dk}/><rect x="50" y="76" width="10" height="19" rx="4" fill={dk}/><rect x="18" y="77" width="8" height="15" rx="4" fill={dk}/><rect x="62" y="78" width="8" height="15" rx="4" fill={dk}/><ellipse cx="50" cy="67" rx="17" ry="9" fill={lt} opacity=".3"/></svg>),
    baryonyx:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="50" cy="62" rx="26" ry="17" fill={c}/><path d="M74 64 Q92 58 94 68 Q86 74 74 68Z" fill={c}/><path d="M28 52 Q18 42 20 28" stroke={c} strokeWidth="12" strokeLinecap="round" fill="none"/><ellipse cx="20" cy="24" rx="9" ry="6" fill={c}/><path d="M10 22 L-4 20 L10 28Z" fill={c}/><path d="M-4 20 Q4 15 10 19" stroke={dk} strokeWidth="1.5" fill="none"/><path d="M-4 26 Q4 31 10 28" stroke={dk} strokeWidth="1.5" fill="none"/><circle cx="10" cy="20" r="2.2" fill="white"/><circle cx="11.5" cy="20" r="1.1" fill="#111"/><path d="M0 21 L2 28 M4 20 L6 27 M8 20 L10 26" stroke="white" strokeWidth="1.3" strokeLinecap="round"/><path d="M36 58 Q26 48 22 50 L12 40" stroke={dk} strokeWidth="5.5" strokeLinecap="round" fill="none"/><path d="M12 40 L6 30" stroke={dk} strokeWidth="3.5" strokeLinecap="round"/><ellipse cx="8" cy="29" rx="6" ry="4" fill="#5B8FBF" transform="rotate(-30 8 29)"/><rect x="34" y="76" width="10" height="17" rx="4" fill={dk}/><rect x="52" y="74" width="10" height="19" rx="4" fill={dk}/><ellipse cx="50" cy="64" rx="16" ry="9" fill={lt} opacity=".3"/></svg>),
    pachyrhinosaurus:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="50" cy="65" rx="27" ry="17" fill={c}/><path d="M75 67 Q92 62 94 72 Q86 76 75 71Z" fill={c}/><path d="M28 55 Q18 46 20 34" stroke={c} strokeWidth="13" strokeLinecap="round" fill="none"/><ellipse cx="20" cy="30" rx="16" ry="14" fill={dk} opacity=".65"/><ellipse cx="20" cy="32" rx="11" ry="10" fill={lt}/><path d="M8 22 L4 8 L14 20" fill={dk}/><path d="M16 18 L14 4 L24 16" fill={dk}/><path d="M26 18 L28 4 L32 18" fill={dk}/><path d="M34 22 L40 10 L38 24" fill={dk}/><ellipse cx="20" cy="36" rx="14" ry="9" fill={c}/><ellipse cx="12" cy="34" rx="8" ry="6" fill={dk}/><circle cx="10" cy="32" r="1.8" fill={c}/><circle cx="14" cy="30" r="1.8" fill={c}/><circle cx="12" cy="36" r="1.8" fill={c}/><circle cx="14" cy="30" r="2.5" fill="white"/><circle cx="15.5" cy="30" r="1.2" fill="#111"/><path d="M8 40 Q14 45 22 42" stroke={dk} strokeWidth="1.5" fill="none"/><rect x="30" y="78" width="10" height="16" rx="4" fill={dk}/><rect x="50" y="76" width="10" height="18" rx="4" fill={dk}/><rect x="18" y="77" width="8" height="14" rx="4" fill={dk}/><rect x="62" y="78" width="8" height="14" rx="4" fill={dk}/><ellipse cx="50" cy="67" rx="17" ry="9" fill={lt} opacity=".3"/></svg>),
    maiasaura:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="50" cy="62" rx="26" ry="17" fill={c}/><path d="M74 64 Q90 60 92 70 Q86 74 74 68Z" fill={c}/><path d="M30 54 Q20 52 14 50" stroke={c} strokeWidth="13" strokeLinecap="round" fill="none"/><ellipse cx="12" cy="50" rx="14" ry="9" fill={c}/><ellipse cx="14" cy="42" rx="8" ry="5" fill={dk}/><path d="M0 50 L-8 48 L0 54Z" fill={dk}/><circle cx="7" cy="46" r="2.5" fill="white"/><circle cx="8.5" cy="46" r="1.2" fill="#111"/><path d="M0 54 Q6 58 14 55" stroke={dk} strokeWidth="1.5" fill="none"/><ellipse cx="6" cy="64" rx="13" ry="5" fill="#D4A76A" opacity=".7"/><ellipse cx="2" cy="62" rx="4.5" ry="3" fill="white" stroke={dk} strokeWidth="1"/><ellipse cx="8" cy="60" rx="4.5" ry="3" fill="white" stroke={dk} strokeWidth="1"/><ellipse cx="14" cy="63" rx="4" ry="2.8" fill="white" stroke={dk} strokeWidth="1"/><path d="M34 58 Q26 56 20 58" stroke={dk} strokeWidth="4" strokeLinecap="round" fill="none"/><rect x="34" y="76" width="10" height="16" rx="4" fill={dk}/><rect x="52" y="74" width="10" height="18" rx="4" fill={dk}/><rect x="22" y="75" width="8" height="14" rx="4" fill={dk}/><ellipse cx="50" cy="64" rx="16" ry="9" fill={lt} opacity=".3"/></svg>),
    suchomimus:(<svg viewBox="0 0 100 100" width={size} height={size}><path d="M44 50 L40 28 L50 48" fill={dk}/><path d="M56 48 L54 26 L62 46" fill={dk}/><ellipse cx="50" cy="62" rx="26" ry="17" fill={c}/><path d="M74 64 Q92 58 94 68 Q86 74 74 68Z" fill={c}/><path d="M28 52 Q18 42 20 28" stroke={c} strokeWidth="12" strokeLinecap="round" fill="none"/><ellipse cx="20" cy="24" rx="9" ry="6" fill={c}/><path d="M10 22 L-2 20 L10 28Z" fill={c}/><path d="M-2 20 Q4 16 10 20" stroke={dk} strokeWidth="1.5" fill="none"/><path d="M-2 26 Q4 30 10 28" stroke={dk} strokeWidth="1.5" fill="none"/><circle cx="10" cy="20" r="2.2" fill="white"/><circle cx="11.5" cy="20" r="1.1" fill="#111"/><path d="M0 21 L2 28 M4 20 L6 27 M8 20 L10 26" stroke="white" strokeWidth="1.2" strokeLinecap="round"/><path d="M36 58 Q26 48 22 50 L12 44" stroke={dk} strokeWidth="5" strokeLinecap="round" fill="none"/><path d="M12 44 L6 36 M12 44 L8 48" stroke={dk} strokeWidth="3.5" strokeLinecap="round"/><rect x="34" y="76" width="10" height="17" rx="4" fill={dk}/><rect x="52" y="74" width="10" height="19" rx="4" fill={dk}/><ellipse cx="50" cy="64" rx="16" ry="9" fill={lt} opacity=".3"/></svg>),
    ceratosaurus:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="50" cy="63" rx="26" ry="17" fill={c}/><path d="M74 65 Q92 60 94 70 Q86 74 74 69Z" fill={c}/><path d="M30 52 Q20 42 22 28" stroke={c} strokeWidth="13" strokeLinecap="round" fill="none"/><ellipse cx="22" cy="24" rx="15" ry="9" fill={c}/><path d="M16 16 L14 4 L22 14" fill={dk}/><path d="M10 18 L6 9 L14 17" fill={dk}/><path d="M24 16 L24 6 L30 14" fill={dk}/><path d="M38 50 Q46 44 54 46 Q62 43 68 47" stroke={dk} strokeWidth="3" fill="none" strokeLinecap="round"/><circle cx="16" cy="20" r="2.8" fill="white"/><circle cx="17.5" cy="20" r="1.4" fill="#111"/><path d="M8 28 Q14 33 22 30" stroke={dk} strokeWidth="1.5" fill="none"/><path d="M10 26 L12 33 M15 25 L17 32 M20 24 L22 31" stroke="white" strokeWidth="1.4" strokeLinecap="round"/><path d="M36 60 Q28 54 26 58" stroke={dk} strokeWidth="4" strokeLinecap="round" fill="none"/><rect x="34" y="77" width="10" height="16" rx="4" fill={dk}/><rect x="52" y="75" width="10" height="18" rx="4" fill={dk}/><ellipse cx="50" cy="65" rx="16" ry="9" fill={lt} opacity=".3"/></svg>),
    dilophosaurus:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="50" cy="62" rx="24" ry="16" fill={c}/><path d="M72 64 Q90 58 92 68 Q86 72 72 68Z" fill={c}/><path d="M32 52 Q22 42 24 28" stroke={c} strokeWidth="12" strokeLinecap="round" fill="none"/><ellipse cx="24" cy="24" rx="14" ry="8" fill={c}/><path d="M16 20 Q20 6 28 4 Q30 12 26 20Z" fill={dk}/><path d="M24 20 Q28 6 36 4 Q38 12 34 20Z" fill={dk}/><path d="M18 14 Q22 8 28 8" stroke={lt} strokeWidth="2" fill="none" opacity=".7"/><path d="M26 14 Q30 8 36 8" stroke={lt} strokeWidth="2" fill="none" opacity=".7"/><path d="M10 26 L0 24 L10 30Z" fill={c}/><path d="M0 24 Q4 20 10 24" stroke={dk} strokeWidth="1.5" fill="none"/><path d="M0 28 Q4 32 10 30" stroke={dk} strokeWidth="1.5" fill="none"/><circle cx="16" cy="20" r="2.5" fill="white"/><circle cx="17.5" cy="20" r="1.2" fill="#111"/><path d="M36 58 Q28 52 26 56" stroke={dk} strokeWidth="4" strokeLinecap="round" fill="none"/><rect x="34" y="76" width="10" height="15" rx="4" fill={dk}/><rect x="52" y="74" width="10" height="17" rx="4" fill={dk}/><ellipse cx="50" cy="64" rx="14" ry="8" fill={lt} opacity=".3"/></svg>),
    herrerasaurus:(<svg viewBox="0 0 100 100" width={size} height={size}><ellipse cx="50" cy="60" rx="22" ry="14" fill={c} transform="rotate(-10 50 60)"/><path d="M66 54 Q86 42 94 34 Q88 42 78 50 Q72 54 66 58Z" fill={c}/><path d="M34 50 Q24 40 26 26" stroke={c} strokeWidth="11" strokeLinecap="round" fill="none"/><ellipse cx="26" cy="22" rx="14" ry="8" fill={c}/><path d="M12 22 L2 20 L12 28Z" fill={c}/><path d="M2 20 Q6 16 12 20" stroke={dk} strokeWidth="1.5" fill="none"/><path d="M2 26 Q6 30 12 28" stroke={dk} strokeWidth="1.5" fill="none"/><circle cx="18" cy="18" r="2.8" fill="white"/><circle cx="19.5" cy="18" r="1.4" fill="#111"/><path d="M4 22 L6 29 M9 21 L11 28 M15 20 L17 27 M21 20 L23 26" stroke="white" strokeWidth="1.3" strokeLinecap="round"/><path d="M38 56 Q28 48 26 52 L18 46 M26 52 L22 54 M26 52 L20 57" stroke={dk} strokeWidth="3.5" strokeLinecap="round" fill="none"/><path d="M40 56 Q48 52 56 54 Q64 52 70 56" stroke={dk} strokeWidth="1.5" fill="none" opacity=".5"/><rect x="38" y="72" width="9" height="18" rx="4" fill={dk}/><rect x="54" y="70" width="9" height="20" rx="4" fill={dk}/><path d="M36 88 L30 96 M40 90 L38 98" stroke={dk} strokeWidth="2.5" strokeLinecap="round"/><path d="M52 88 L48 96 M56 90 L58 98" stroke={dk} strokeWidth="2.5" strokeLinecap="round"/><ellipse cx="50" cy="62" rx="14" ry="8" fill={lt} opacity=".3"/></svg>),
  };
  return svgs[id] || svgs["trex"];
}

// ── Award badges ──────────────────────────────────────────────────────────────
const BADGES = [
  { threshold:  25, emoji:"🥚", label:"Hatchling",     colour:"#A0C4FF" },
  { threshold:  50, emoji:"🦕", label:"Dino Saver",    colour:"#4B9B6E" },
  { threshold: 100, emoji:"🦖", label:"Rex Saver",     colour:"#7B68A8" },
  { threshold: 150, emoji:"💎", label:"Gem Hoarder",   colour:"#4A7FBF" },
  { threshold: 200, emoji:"👑", label:"Dino King",     colour:"#C0392B" },
  { threshold: 250, emoji:"🏆", label:"Legendary",     colour:"#E8963C" },
  { threshold: 500, emoji:"🌋", label:"Volcano Vault", colour:"#7D5A3C" },
];
const getEarnedBadges = bal => BADGES.filter(b => bal >= b.threshold);

function BadgeStrip({ balance, size=15 }) {
  const earned = getEarnedBadges(balance);
  if (!earned.length) return null;
  return (
    <div style={{ display:"flex", gap:2, flexWrap:"wrap", justifyContent:"center" }}>
      {earned.map(b => (
        <span key={b.threshold} title={`${b.label} — $${b.threshold}+`}
          style={{ fontSize:size, lineHeight:1, filter:`drop-shadow(0 1px 3px ${b.colour}99)`, cursor:"default" }}>
          {b.emoji}
        </span>
      ))}
    </div>
  );
}

function BadgeShowcase({ balance }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:13, color:"#888", fontFamily:"'Nunito',sans-serif", fontWeight:700, marginBottom:6 }}>🏅 Awards</div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {BADGES.map(b => {
          const earned = balance >= b.threshold;
          return (
            <div key={b.threshold} style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:3,
              padding:"8px 10px", borderRadius:12,
              background: earned ? `linear-gradient(135deg,${b.colour}33,${b.colour}18)` : "#f5f5f5",
              border: earned ? `2px solid ${b.colour}88` : "2px solid #e0e0e0",
              opacity: earned ? 1 : 0.45, minWidth:62,
              boxShadow: earned ? `0 2px 10px ${b.colour}44` : "none",
            }}>
              <span style={{ fontSize:26, filter: earned ? `drop-shadow(0 2px 6px ${b.colour}aa)` : "grayscale(1)" }}>{b.emoji}</span>
              <span style={{ fontSize:10, fontFamily:"'Nunito',sans-serif", fontWeight:800, color: earned?"#1a1a2e":"#aaa", textAlign:"center" }}>{b.label}</span>
              <span style={{ fontSize:9, color: earned?b.colour:"#bbb", fontFamily:"'Fredoka One',sans-serif" }}>${b.threshold}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Roster ────────────────────────────────────────────────────────────────────
const DINOS = [
  { id:"trex",               name:"T-Rex",           colour:"#C0392B" },
  { id:"triceratops",        name:"Triceratops",      colour:"#1E8449" },
  { id:"stegosaurus",        name:"Stegosaurus",      colour:"#6C3483" },
  { id:"brachiosaurus",      name:"Brachiosaurus",    colour:"#1A5276" },
  { id:"pterodactyl",        name:"Pterodactyl",      colour:"#B7770D" },
  { id:"ankylosaurus",       name:"Ankylosaurus",     colour:"#0E6655" },
  { id:"spinosaurus",        name:"Spinosaurus",      colour:"#A04000" },
  { id:"velociraptor",       name:"Velociraptor",     colour:"#6E4C1E" },
  { id:"parasaurolophus",    name:"Parasaurolophus",  colour:"#117A65" },
  { id:"diplodocus",         name:"Diplodocus",       colour:"#2E4057" },
  { id:"iguanodon",          name:"Iguanodon",        colour:"#6C3483" },
  { id:"pachycephalosaurus", name:"Pachycephalosaur", colour:"#935116" },
  { id:"allosaurus",         name:"Allosaurus",       colour:"#922B21" },
  { id:"carnotaurus",        name:"Carnotaurus",      colour:"#1E8449" },
  { id:"therizinosaurus",    name:"Therizinosaurus",  colour:"#1A5276" },
  { id:"gallimimus",         name:"Gallimimus",       colour:"#9A7D0A" },
  { id:"oviraptor",          name:"Oviraptor",        colour:"#C0392B" },
  { id:"kentrosaurus",       name:"Kentrosaurus",     colour:"#1B4F72" },
  { id:"styracosaurus",      name:"Styracosaurus",    colour:"#922B21" },
  { id:"baryonyx",           name:"Baryonyx",         colour:"#117A65" },
  { id:"pachyrhinosaurus",   name:"Pachyrhinosaurus", colour:"#4A235A" },
  { id:"maiasaura",          name:"Maiasaura",        colour:"#935116" },
  { id:"suchomimus",         name:"Suchomimus",       colour:"#1E8449" },
  { id:"ceratosaurus",       name:"Ceratosaurus",     colour:"#6C3483" },
  { id:"dilophosaurus",      name:"Dilophosaurus",    colour:"#0E6655" },
  { id:"herrerasaurus",      name:"Herrerasaurus",    colour:"#6E4C1E" },
];

const CLASS_LIST = [
  { name:"Abdul Maalik Fouzan", dinoId:"trex",               username:"abdulm",    password:"abdulm"    },
  { name:"Adrianna Safronii",   dinoId:"triceratops",        username:"adriannas", password:"adriannas" },
  { name:"Alyvia Powers",       dinoId:"stegosaurus",        username:"alyviap",   password:"alyviap"   },
  { name:"Arisha Haniff",       dinoId:"brachiosaurus",      username:"arishab",   password:"arishab"   },
  { name:"Arvi Patel",          dinoId:"pterodactyl",        username:"arvip",     password:"arvip"     },
  { name:"Avi Patel",           dinoId:"ankylosaurus",       username:"avip",      password:"avip"      },
  { name:"Brandon Dobbs",       dinoId:"spinosaurus",        username:"brandond",  password:"brandond"  },
  { name:"Edwin Providence",    dinoId:"velociraptor",       username:"edwinp",    password:"edwinp"    },
  { name:"Graham Batten",       dinoId:"parasaurolophus",    username:"grahamb",   password:"grahamb"   },
  { name:"Hope Olcay",          dinoId:"diplodocus",         username:"hopeo",     password:"hopeo"     },
  { name:"Iqra Ahmed",          dinoId:"iguanodon",          username:"iqraa",     password:"iqraa"     },
  { name:"Issy McTiernan",      dinoId:"pachycephalosaurus", username:"issym",     password:"issym"     },
  { name:"Juliet Perea",        dinoId:"allosaurus",         username:"julietp",   password:"julietp"   },
  { name:"Kaelan Atkinson",     dinoId:"carnotaurus",        username:"kaelana",   password:"kaelana"   },
  { name:"Liza Nefedov",        dinoId:"therizinosaurus",    username:"lizanr",    password:"lizanr"    },
  { name:"Malika Bisultanova",  dinoId:"gallimimus",         username:"malikab",   password:"malikab"   },
  { name:"Mark Andersen",       dinoId:"oviraptor",          username:"marka",     password:"marka"     },
  { name:"Mauricio Zavala",     dinoId:"kentrosaurus",       username:"mauricioz", password:"mauricioz" },
  { name:"McKayla Disher",      dinoId:"styracosaurus",      username:"mckaylad",  password:"mckaylad"  },
  { name:"Myra Kathuria",       dinoId:"baryonyx",           username:"myrak",     password:"myrak"     },
  { name:"Nevaeh Austin",       dinoId:"pachyrhinosaurus",   username:"nevaeha",   password:"nevaeha"   },
  { name:"Riley Crane",         dinoId:"maiasaura",          username:"rileyc",    password:"rileyc"    },
  { name:"Ryan Lester",         dinoId:"suchomimus",         username:"ryanl",     password:"ryanl"     },
  { name:"Sabrina Milligan",    dinoId:"ceratosaurus",       username:"sabrinam",  password:"sabrinam"  },
  { name:"Sasmit Mahindrakar",  dinoId:"dilophosaurus",      username:"sasmitm",   password:"sasmitm"   },
  { name:"Umaima Jabbar",       dinoId:"herrerasaurus",      username:"umaimaj",   password:"umaimaj"   },
];
// DINO_STOCKS and DINO_NEWS added here

const DINO_STOCKS = [
  { id:"bananas",  name:"Brachiosaur Bananas",   emoji:"🦕", color:"#27ae60", startPrice:20, volatility:0.03, tickers:["L.TO","MRU.TO","ATD.TO"],   description:"Staples & Grocery"   },
  { id:"trextech", name:"T-Rex Tech",            emoji:"🦖", color:"#8e44ad", startPrice:50, volatility:0.10, tickers:["SHOP.TO","CSU.TO","CLS.TO"], description:"Technology"          },
  { id:"airways",  name:"Pterodactyl Airways",   emoji:"🐉", color:"#2471A3", startPrice:35, volatility:0.07, tickers:["AC.TO","DOO.TO","CJT.TO"],   description:"Travel & Leisure"    },
  { id:"energy",   name:"DinoEgg Energy",        emoji:"🥚", color:"#e67e22", startPrice:15, volatility:0.02, tickers:["ENB.TO","FTS.TO","TRP.TO"],  description:"Energy & Utilities"  },
  { id:"steel",    name:"Stegosaurus Steel",     emoji:"💎", color:"#7f8c8d", startPrice:28, volatility:0.05, tickers:["CNR.TO","CAE.TO","WSP.TO"],  description:"Industrials"         },
];

const DINO_NEWS = {
  bananas: {
    upBig:    ["Brachiosaur Bananas crushes quarterly earnings as prehistoric grocery demand surges","Brachiosaur Bananas posts record profits — analysts say the herd is buying","Brachiosaur Bananas up sharply after new fern-based product line exceeds expectations"],
    upSmall:  ["Brachiosaur Bananas edges higher amid steady leaf supply chain","Brachiosaur Bananas ticks up on resilient consumer staples demand","Brachiosaur Bananas inches forward — slow and steady wins the race"],
    downSmall:["Brachiosaur Bananas slips on mild consumer spending concerns","Brachiosaur Bananas dips slightly as rival herbivores enter the market","Brachiosaur Bananas retreats modestly on mixed economic signals"],
    downBig:  ["Brachiosaur Bananas tumbles after meteor weather disrupts harvest season","Brachiosaur Bananas sinks on supply chain chaos — too many long necks, not enough leaves","Brachiosaur Bananas falls sharply as drought hits the Jurassic valley"],
  },
  trextech: {
    upBig:    ["T-Rex Tech soars after surprise earnings beat — analysts call it extinction-proof","T-Rex Tech surges on blockbuster product launch, short-sellers flee","T-Rex Tech rockets higher after signing deal with every dinosaur on the continent"],
    upSmall:  ["T-Rex Tech gains modestly on strong mobile app downloads","T-Rex Tech edges up as developer community expands","T-Rex Tech ticks higher — tiny arms, big returns"],
    downSmall:["T-Rex Tech dips as investors question new product launch timeline","T-Rex Tech slips on light trading volume ahead of earnings","T-Rex Tech retreats slightly — market awaits next big announcement"],
    downBig:  ["T-Rex Tech plunges after CEO accidentally deletes server with one swipe of tiny arm","T-Rex Tech crashes on disappointing quarterly results — extinction event for shareholders","T-Rex Tech sinks after major product recall — customers unhappy with claw-proof keyboard"],
  },
  airways: {
    upBig:    ["Pterodactyl Airways surges after record passenger numbers over the volcano corridor","Pterodactyl Airways soars on fuel cost savings — tailwinds literally","Pterodactyl Airways posts best quarter ever as prehistoric tourism booms"],
    upSmall:  ["Pterodactyl Airways climbs on steady booking demand","Pterodactyl Airways edges higher as new routes open over the swamp region","Pterodactyl Airways up modestly — smooth skies ahead"],
    downSmall:["Pterodactyl Airways dips on rising fuel costs at the tar pit refinery","Pterodactyl Airways slips as storm season disrupts flight paths","Pterodactyl Airways retreats slightly on mixed passenger traffic data"],
    downBig:  ["Pterodactyl Airways nosedives after volcano eruption closes major routes","Pterodactyl Airways tumbles on surprise strike by wing-maintenance crew","Pterodactyl Airways sinks as travellers opt for land-based stegosaurus transit"],
  },
  energy: {
    upBig:    ["DinoEgg Energy surges after new geothermal volcano tap exceeds capacity expectations","DinoEgg Energy powers higher on strong utility demand across the Jurassic grid","DinoEgg Energy jumps after regulator approves massive tar sands expansion"],
    upSmall:  ["DinoEgg Energy ticks up on stable electricity demand","DinoEgg Energy edges higher — reliable as always","DinoEgg Energy gains modestly as natural gas prices firm up"],
    downSmall:["DinoEgg Energy slips on mild weather reducing heating demand","DinoEgg Energy dips slightly as solar competition increases in the southern swamp","DinoEgg Energy retreats on routine maintenance shutdowns"],
    downBig:  ["DinoEgg Energy tumbles after major pipeline leak near the fernwood forest","DinoEgg Energy sinks on surprise regulatory fine from the Jurassic Energy Board","DinoEgg Energy falls sharply as meteor shower disrupts power grid infrastructure"],
  },
  steel: {
    upBig:    ["Stegosaurus Steel surges as infrastructure spending bill passes Dino Parliament","Stegosaurus Steel soars on booming construction demand across the prehistoric plains","Stegosaurus Steel posts massive gains — every dino is building something"],
    upSmall:  ["Stegosaurus Steel edges up on steady industrial orders","Stegosaurus Steel ticks higher as manufacturing activity picks up","Stegosaurus Steel gains modestly — backbone of the Jurassic economy"],
    downSmall:["Stegosaurus Steel slips on softer-than-expected construction data","Stegosaurus Steel dips as raw material costs rise at the quarry","Stegosaurus Steel retreats slightly on light industrial demand"],
    downBig:  ["Stegosaurus Steel crashes after major bridge contract cancelled by Triceratops City Council","Stegosaurus Steel tumbles on recession fears — nobody is building anything","Stegosaurus Steel sinks sharply after key mining operation flooded by prehistoric rains"],
  },
};

const getNewsHeadline = (stockId, priceBefore, priceAfter) => {
  const pct = priceBefore > 0 ? (priceAfter - priceBefore) / priceBefore : 0;
  const news = DINO_NEWS[stockId];
  if (!news) return null;
  let bucket;
  if (pct > 0.03) bucket = news.upBig;
  else if (pct > 0) bucket = news.upSmall;
  else if (pct > -0.03) bucket = news.downSmall;
  else bucket = news.downBig;
  return bucket[Math.floor(Math.random() * bucket.length)];
};

const DEFAULT_STORE = [
  // Privileges
  { id:"s1",  name:"Sit Anywhere Day",         price:40,  emoji:"💺", type:"privilege" },
  { id:"s2",  name:"Brain Break DJ",           price:60,  emoji:"🎵", type:"privilege" },
  { id:"s3", name:"Show & Tell Wildcard",     price:45,  emoji:"🌟", type:"privilege" },
  // Experiences
  { id:"s4", name:"Be the Teacher 5min",      price:100, emoji:"🍎", type:"experience" },
  { id:"s5", name:"Movie Clip Pick",          price:70,  emoji:"🎬", type:"experience" },
  { id:"s6", name:"iPad Free Time 15min",     price:80,  emoji:"📱", type:"experience" },
  { id:"s7", name:"Read to the Class",        price:65,  emoji:"🎤", type:"experience" },
  { id:"s8", name:"Whiteboard Free Draw",     price:40,  emoji:"🖊️", type:"experience" },
  { id:"s9", name:"Lunch with a Friend",      price:90,  emoji:"👫", type:"experience" },
  // Physical
  { id:"s10", name:"Mechanical Pencil",        price:15,  emoji:"✒️", type:"physical" },
  { id:"s11", name:"Highlighter Set",          price:20,  emoji:"🖍️", type:"physical" },
  { id:"s12", name:"Mini Notebook",            price:18,  emoji:"📓", type:"physical" },
  { id:"s13", name:"Eraser Pack",              price:10,  emoji:"🧹", type:"physical" },
  { id:"s14", name:"Fun Pen",                  price:12,  emoji:"🖊️", type:"physical" },
  { id:"s15", name:"Sticker Sheet",            price:8,   emoji:"⭐", type:"physical" },
  { id:"s16", name:"Bookmark",                 price:10,  emoji:"🔖", type:"physical" },
  { id:"s17", name:"Stress Ball",              price:25,  emoji:"🔵", type:"physical" },
  { id:"s18", name:"Fidget Toy",               price:30,  emoji:"🌀", type:"physical" },
  // Social
  { id:"s19", name:"Shoutout on the Board",    price:25,  emoji:"📢", type:"social" },
  { id:"s20", name:"Compliment Jar Pull",      price:20,  emoji:"💌", type:"social" },
  { id:"s21", name:"Buddy Read Pick",          price:30,  emoji:"👥", type:"social" },
];
const DEFAULT_JOBS = [
  { id:"j1",  name:"Door Holder",      pay:5,  emoji:"🚪" },
  { id:"j2",  name:"Board Cleaner",    pay:10, emoji:"🧹" },
  { id:"j3",  name:"Supply Manager",   pay:10, emoji:"📦" },
  { id:"j4",  name:"Line Leader",      pay:5,  emoji:"🚶" },
  { id:"j5",  name:"Attendance Taker", pay:15, emoji:"📋" },
  { id:"j6",  name:"Tech Helper",      pay:15, emoji:"💻" },
  { id:"j7",  name:"Plant Waterer",    pay:5,  emoji:"🌱" },
  { id:"j8",  name:"Paper Passer",     pay:10, emoji:"📄" },
  { id:"j9",  name:"Librarian",        pay:10, emoji:"📚" },
  { id:"j10", name:"Banker",           pay:20, emoji:"🏦" },
];

const uuid = () => Math.random().toString(36).slice(2);
const fmt  = n  => `$${Number(n).toLocaleString()}`;
const todayStr = () => new Date().toISOString().slice(0, 10);

const SEED_STATE = () => {
  const students = CLASS_LIST.map(s => ({ id: uuid(), name: s.name, dinoId: s.dinoId }));
  const balances = {};
  students.forEach(s => { balances[s.id] = 0; });
  return { students, balances, jobs: DEFAULT_JOBS, assigned: {}, txLog: [], lastRotation: null, prevAssigned: {}, storeItems: DEFAULT_STORE, purchases: [], stockPrices: Object.fromEntries(DINO_STOCKS.map(s => [s.id, s.startPrice])), stockHistory: {}, portfolios: {}, stockNews: {} };
};
// ── Student card ──────────────────────────────────────────────────────────────
function DinoCard({ student, balance, job, onClick, selected }) {
  const dino = DINOS.find(d => d.id === student.dinoId) || DINOS[0];
  const bc   = billColour(balance);
  return (
    <div onClick={onClick} style={{
      background: selected ? `linear-gradient(160deg,${dino.colour}28,${bc.light})` : `linear-gradient(160deg,#ffffff,${bc.light}88)`,
      border: selected ? `4px solid ${dino.colour}` : `3px solid ${bc.bg}88`,
      borderRadius:20, padding:"8px 8px 12px", cursor:"pointer", transition:"all 0.18s",
      boxShadow: selected ? `0 8px 28px ${dino.colour}44` : "0 2px 10px #0002",
      transform: selected ? "scale(1.06)" : "scale(1)",
      textAlign:"center", position:"relative",
      display:"flex", flexDirection:"column", alignItems:"center", gap:3,
    }}>
      <div style={{ position:"absolute",top:0,left:0,right:0,height:6,background:bc.bg,borderRadius:"16px 16px 0 0" }}/>
      <div style={{ marginTop:6, filter:`drop-shadow(0 3px 7px ${dino.colour}55)` }}>
        <DinoSVG id={student.dinoId} c={dino.colour} size={68}/>
      </div>
      <div style={{ fontSize:12.5,fontWeight:800,color:"#1a1a2e",lineHeight:1.1,fontFamily:"'Fredoka One',sans-serif",maxWidth:110 }}>
        {student.name.split(" ")[0]}
      </div>
      <div style={{ fontSize:10.5,color:"#666",fontFamily:"'Nunito',sans-serif",fontWeight:700,lineHeight:1 }}>
        {job ? `${job.emoji} ${job.name}` : "—"}
      </div>
      <div style={{ background:bc.bg,color:"#fff",borderRadius:24,padding:"4px 13px",fontSize:15,fontWeight:800,fontFamily:"'Fredoka One',sans-serif",boxShadow:`0 2px 8px ${bc.bg}88`,marginTop:2 }}>
        {fmt(balance)}
      </div>
      <BadgeStrip balance={balance} size={15}/>
    </div>
  );
}

function TxRow({ tx, students }) {
  const s = students.find(x => x.id === tx.studentId);
  const dino = s ? DINOS.find(d => d.id === s.dinoId) : null;
  const pos = tx.amount > 0;
  return (
    <div style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 14px",borderRadius:12, background:pos?"#f0fbf4":"#fff4f4",borderLeft:`5px solid ${pos?"#27ae60":"#e74c3c"}`,marginBottom:7,fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ width:34,height:34,flexShrink:0 }}>{dino&&<DinoSVG id={s.dinoId} c={dino.colour} size={34}/>}</div>
      <div style={{ flex:1 }}>
        <strong style={{ fontSize:14 }}>{s?.name||"?"}</strong>
        <span style={{ color:"#777",marginLeft:8,fontSize:13 }}>{tx.reason}</span>
      </div>
      <span style={{ fontWeight:900,fontSize:16,color:pos?"#27ae60":"#e74c3c",fontFamily:"'Fredoka One',sans-serif" }}>
        {pos?"+":""}{fmt(tx.amount)}
      </span>
      <span style={{ color:"#bbb",fontSize:11 }}>{tx.date}</span>
    </div>
  );
}

// ── Game Area Component ───────────────────────────────────────────────────────
function GameArea({ game, studentUser, appState, update, todayStr, showToast, fmt }) {
  const earnBucks = (amt) => {
    if (!studentUser) return;
    const today = todayStr();
    const earned = appState?.gameEarnings?.[studentUser.id]?.[today] || 0;
    const canEarn = Math.min(amt, 10 - earned);
    if (canEarn <= 0) { showToast("Daily $10 limit reached! 🦕", "#e67e22"); return; }
    update(prev => ({
      ...prev,
      balances: { ...prev.balances, [studentUser.id]: (prev.balances?.[studentUser.id] || 0) + canEarn },
      gameEarnings: { ...prev.gameEarnings, [studentUser.id]: { ...(prev.gameEarnings?.[studentUser.id] || {}), [today]: earned + canEarn }},
      txLog: [{ id:Math.random().toString(36).slice(2), studentId:studentUser.id, amount:canEarn, reason:`🎮 Game earnings`, date:today }, ...(prev.txLog||[])],
    }));
    showToast(`+${fmt(canEarn)} Dino Bucks! 🎮`);
  };
  if (game === "trivia") return <TriviaGame earnBucks={earnBucks} />;
  if (game === "memory") return <MemoryGame earnBucks={earnBucks} />;
  if (game === "runner") return <RunnerGame earnBucks={earnBucks} />;
  if (game === "egg")    return <EggDropGame earnBucks={earnBucks} />;
  if (game === "digger") return <DiggerGame earnBucks={earnBucks} />;
  return null;
}

function TriviaGame({ earnBucks }) {
  const questions = [
    { q:"What is the largest dinosaur ever discovered?", a:"Argentinosaurus", choices:["T-Rex","Argentinosaurus","Brachiosaurus","Diplodocus"] },
    { q:"What did T-Rex eat?", a:"Meat", choices:["Plants","Meat","Both","Fish only"] },
    { q:"What period did most dinosaurs live in?", a:"Jurassic", choices:["Triassic","Jurassic","Cretaceous","Permian"] },
    { q:"What does 'dinosaur' mean?", a:"Terrible lizard", choices:["Giant reptile","Terrible lizard","Big beast","Stone bone"] },
    { q:"Which dinosaur had 3 horns?", a:"Triceratops", choices:["Stegosaurus","Ankylosaurus","Triceratops","Spinosaurus"] },
    { q:"What group of animals are dinosaurs most related to?", a:"Birds", choices:["Lizards","Crocodiles","Birds","Snakes"] },
    { q:"Which dinosaur had plates on its back?", a:"Stegosaurus", choices:["Stegosaurus","Diplodocus","T-Rex","Raptor"] },
    { q:"How did most dinosaurs go extinct?", a:"Asteroid impact", choices:["Ice age","Volcano only","Asteroid impact","Flood"] },
    { q:"What is a fossil?", a:"Preserved remains of ancient life", choices:["A rock","Preserved remains of ancient life","A dinosaur egg","A bone replica"] },
    { q:"Which was the fastest dinosaur?", a:"Compsognathus", choices:["T-Rex","Velociraptor","Compsognathus","Gallimimus"] },
  ];
  const [idx, setIdx] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const [feedback, setFeedback] = React.useState(null);
  const answer = (choice) => {
    if (feedback) return;
    const correct = choice === questions[idx].a;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      setFeedback(null);
      if (idx + 1 >= questions.length) { setDone(true); earnBucks(score + (correct ? 1 : 0)); }
      else setIdx(i => i + 1);
    }, 900);
  };
  if (done) return (
    <div style={{ textAlign:"center", padding:24 }}>
      <div style={{ fontSize:48 }}>🏆</div>
      <div style={{ fontFamily:"'Fredoka One',sans-serif", fontSize:24, color:"#1a472a", margin:"12px 0" }}>You scored {score}/{questions.length}!</div>
      <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:14, color:"#555", marginBottom:16 }}>You earned ${score} Dino Bucks!</div>
      <button onClick={() => { setIdx(0); setScore(0); setDone(false); }} style={{ padding:"10px 24px", background:"#27ae60", color:"#fff", border:"none", borderRadius:12, cursor:"pointer", fontFamily:"'Fredoka One',sans-serif", fontSize:16 }}>Play Again</button>
    </div>
  );
  const q = questions[idx];
  return (
    <div style={{ maxWidth:500, margin:"0 auto" }}>
      <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:"#888", marginBottom:8 }}>Question {idx+1} of {questions.length} · Score: {score}</div>
      <div style={{ fontFamily:"'Fredoka One',sans-serif", fontSize:18, color:"#1a472a", marginBottom:16, background:"#f0fbf4", padding:16, borderRadius:12 }}>{q.q}</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {q.choices.map(c => (
          <button key={c} onClick={() => answer(c)} style={{
            padding:"12px 16px", border:"2px solid #4B9B6E", borderRadius:12, cursor:"pointer",
            fontFamily:"'Nunito',sans-serif", fontSize:14, fontWeight:700,
            background: feedback && c === q.a ? "#27ae60" : feedback && c !== q.a ? "#fee" : "#fff",
            color: feedback && c === q.a ? "#fff" : "#333", transition:"all 0.2s"
          }}>{c}</button>
        ))}
      </div>
    </div>
  );
}

function RunnerGame({ earnBucks }) {
  const OBSTACLES = ["🌵","🌵","🌵","🦴","🪨","🌿","🦖","🌴"];
  const BIRDS = ["🦅","🦜","🐦"];
  const [running, setRunning] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [dead, setDead] = React.useState(false);
  const [dinoY, setDinoY] = React.useState(0);
  const [obstacles, setObstacles] = React.useState([]);
  const [clouds, setClouds] = React.useState([
    {id:1,x:100,y:20},{id:2,x:300,y:40},{id:3,x:500,y:15}
  ]);
  const [speed, setSpeed] = React.useState(6);
  const jumpRef = React.useRef(false);
  const frameRef = React.useRef();
  const obstRef = React.useRef([]);
  const scoreRef = React.useRef(0);
  const dinoYRef = React.useRef(0);
  const speedRef = React.useRef(6);
  const cloudsRef = React.useRef([{id:1,x:100,y:20},{id:2,x:300,y:40},{id:3,x:500,y:15}]);

  const jump = React.useCallback(() => {
    if (jumpRef.current) return;
    jumpRef.current = true;
    setDinoY(110);
    dinoYRef.current = 110;
    setTimeout(() => {
      setDinoY(0);
      dinoYRef.current = 0;
      setTimeout(() => { jumpRef.current = false; }, 100);
    }, 500);
  }, []);

  React.useEffect(() => {
    if (!running) return;
    const handleKey = (e) => { if (e.code === "Space" || e.code === "ArrowUp") jump(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [running, jump]);

  React.useEffect(() => {
    if (!running) return;
    let lastObst = 0;
    const tick = (ts) => {
      scoreRef.current += 1;
      // Speed increases every 200 points
      const newSpeed = 6 + Math.floor(scoreRef.current / 200);
      if (newSpeed !== speedRef.current) { speedRef.current = newSpeed; setSpeed(newSpeed); }
      if (scoreRef.current % 10 === 0) setScore(scoreRef.current);
      // Add obstacles
      if (ts - lastObst > Math.max(600, 1400 - scoreRef.current/2) + Math.random()*600) {
        lastObst = ts;
        const isDouble = Math.random() < 0.2 && scoreRef.current > 300;
        const isBird = Math.random() < 0.25 && scoreRef.current > 150;
        const emoji = isBird ? BIRDS[Math.floor(Math.random()*BIRDS.length)] : OBSTACLES[Math.floor(Math.random()*OBSTACLES.length)];
        const birdHeight = isBird ? 50 + Math.random()*40 : 0;
        obstRef.current = [...obstRef.current, { id:Math.random(), x:520, emoji, birdHeight, isDouble }];
        if (isDouble) obstRef.current = [...obstRef.current, { id:Math.random(), x:560, emoji:OBSTACLES[Math.floor(Math.random()*OBSTACLES.length)], birdHeight:0, isDouble:false }];
      }
      obstRef.current = obstRef.current.map(o => ({ ...o, x: o.x - speedRef.current })).filter(o => o.x > -40);
      setObstacles([...obstRef.current]);
      // Move clouds
      cloudsRef.current = cloudsRef.current.map(c => ({ ...c, x: c.x - 1 < -50 ? 550 : c.x - 1 }));
      setClouds([...cloudsRef.current]);
      // Collision detection
      const hit = obstRef.current.some(o => {
        if (o.x < 90 && o.x > 25) {
          if (o.birdHeight > 0) return dinoYRef.current < o.birdHeight + 30 && dinoYRef.current > o.birdHeight - 30;
          return dinoYRef.current < 45;
        }
        return false;
      });
      if (hit) { setRunning(false); setDead(true); earnBucks(Math.floor(scoreRef.current / 50)); return; }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [running]);

  const start = () => {
    setDead(false); setScore(0); scoreRef.current=0;
    obstRef.current=[]; setObstacles([]);
    speedRef.current=6; setSpeed(6);
    setRunning(true);
  };

  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:"#888", marginBottom:8 }}>
        Press SPACE or tap to jump! Score: {score} {speed > 6 ? `⚡ Speed x${speed-4}` : ""}
      </div>
      <div onClick={jump} style={{ position:"relative", width:"100%", maxWidth:560, height:200, background:"linear-gradient(180deg,#87CEEB 0%,#c8e6f5 55%,#98c87a 55%,#7aaa55 65%,#8B6914 65%,#7a5c10 100%)", borderRadius:14, overflow:"hidden", cursor:"pointer", margin:"0 auto", border:"3px solid #4B9B6E", userSelect:"none" }}>
        {/* Clouds */}
        {clouds.map(c => (
          <div key={c.id} style={{ position:"absolute", top:c.y, left:c.x, fontSize:22, opacity:0.7 }}>☁️</div>
        ))}
        {/* Ground line */}
        <div style={{ position:"absolute", bottom:44, left:0, right:0, height:2, background:"rgba(0,0,0,0.1)" }}/>
        {/* Dino - flipped to face right */}
        <div style={{ position:"absolute", bottom:44+dinoY, left:55, fontSize:40, transition:"bottom 0.08s", transform:"scaleX(-1)" }}>🦕</div>
        {/* Obstacles */}
        {obstacles.map(o => (
          <div key={o.id} style={{ position:"absolute", bottom: o.birdHeight > 0 ? 44+o.birdHeight : 44, left:o.x, fontSize:o.birdHeight > 0 ? 24 : 30, transform: o.birdHeight > 0 ? "scaleX(-1)" : "none" }}>{o.emoji}</div>
        ))}
        {/* Score overlay */}
        <div style={{ position:"absolute", top:8, right:12, fontFamily:"'Fredoka One',sans-serif", fontSize:16, color:"rgba(0,0,0,0.4)" }}>{score}</div>
      </div>
      {!running && (
        <button onClick={start} style={{ marginTop:16, padding:"10px 24px", background:"#27ae60", color:"#fff", border:"none", borderRadius:12, cursor:"pointer", fontFamily:"'Fredoka One',sans-serif", fontSize:16 }}>
          {dead ? `💀 Game Over! Score: ${score} — Play Again` : "Start Running! 🦕"}
        </button>
      )}
      {running && <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, color:"#aaa", marginTop:6 }}>Watch out for birds 🦅 — they fly at different heights!</div>}
    </div>
  );
}

function EggDropGame({ earnBucks }) {
  const [playing, setPlaying] = React.useState(false);
  const [basketX, setBasketX] = React.useState(200);
  const [eggs, setEggs] = React.useState([]);
  const [score, setScore] = React.useState(0);
  const [missed, setMissed] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const frameRef = React.useRef();
  const eggsRef = React.useRef([]);
  const scoreRef = React.useRef(0);
  const missedRef = React.useRef(0);
  const basketRef = React.useRef(200);
  React.useEffect(() => {
    const move = (e) => {
      const rect = document.getElementById("eggcanvas")?.getBoundingClientRect();
      if (rect) { basketRef.current = Math.max(40, Math.min(rect.width-40, e.clientX - rect.left)); setBasketX(basketRef.current); }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  React.useEffect(() => {
    if (!playing) return;
    let last = 0;
    const tick = (ts) => {
      if (ts - last > 800) { last = ts; eggsRef.current = [...eggsRef.current, { id:Math.random(), x:Math.random()*400+20, y:0 }]; }
      eggsRef.current = eggsRef.current.map(e => ({ ...e, y: e.y+4 }));
      const caught = eggsRef.current.filter(e => e.y > 220 && Math.abs(e.x - basketRef.current) < 50);
      const fell = eggsRef.current.filter(e => e.y > 280 && Math.abs(e.x - basketRef.current) >= 50);
      if (caught.length) { scoreRef.current += caught.length; setScore(scoreRef.current); }
      if (fell.length) { missedRef.current += fell.length; setMissed(missedRef.current); }
      eggsRef.current = eggsRef.current.filter(e => e.y <= 280);
      setEggs([...eggsRef.current]);
      if (missedRef.current >= 5) { setPlaying(false); setDone(true); earnBucks(Math.floor(scoreRef.current/3)); return; }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [playing]);
  const start = () => { setDone(false); setScore(0); setMissed(0); scoreRef.current=0; missedRef.current=0; eggsRef.current=[]; setEggs([]); setPlaying(true); };
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:"#888", marginBottom:8 }}>Move your mouse to catch eggs! Caught: {score} | Missed: {missed}/5</div>
      <div id="eggcanvas" style={{ position:"relative", width:"100%", maxWidth:500, height:280, background:"linear-gradient(180deg,#87CEEB,#98FB98)", borderRadius:12, overflow:"hidden", margin:"0 auto", border:"3px solid #4B9B6E" }}>
        {eggs.map(e => <div key={e.id} style={{ position:"absolute", left:e.x, top:e.y, fontSize:24, transform:"translateX(-50%)" }}>🥚</div>)}
        <div style={{ position:"absolute", bottom:10, left:basketX, transform:"translateX(-50%)", fontSize:36 }}>🧺</div>
      </div>
      {!playing && (
        <button onClick={start} style={{ marginTop:16, padding:"10px 24px", background:"#e67e22", color:"#fff", border:"none", borderRadius:12, cursor:"pointer", fontFamily:"'Fredoka One',sans-serif", fontSize:16 }}>
          {done ? `Game Over! Caught ${score} — Play Again` : "Start Catching! 🥚"}
        </button>
      )}
    </div>
  );
}

function DiggerGame({ earnBucks }) {
  const GRID = 16;
  const [cells, setCells] = React.useState(() => Array(GRID).fill(null).map((_,i) => ({ id:i, dug:false, hasBone:Math.random()<0.35, hasRock:Math.random()<0.2 })));
  const [timeLeft, setTimeLeft] = React.useState(20);
  const [score, setScore] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const timerRef = React.useRef();
  React.useEffect(() => {
    if (!playing) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setPlaying(false); setDone(true); return 0; }
        return t-1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [playing]);
  const dig = (id) => {
    if (!playing) return;
    const cell = cells.find(c => c.id === id);
    if (cell.dug) return;
    setCells(prev => prev.map(c => c.id === id ? { ...c, dug:true } : c));
    if (cell.hasBone) setScore(s => s+1);
  };
  const start = () => {
    setCells(Array(GRID).fill(null).map((_,i) => ({ id:i, dug:false, hasBone:Math.random()<0.35, hasRock:Math.random()<0.2 })));
    setTimeLeft(20); setScore(0); setDone(false); setPlaying(true);
  };
  React.useEffect(() => { if (done) earnBucks(score); }, [done]);
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:"#888", marginBottom:8 }}>Click to dig! Time: {timeLeft}s | Bones: {score}</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, maxWidth:320, margin:"0 auto 16px" }}>
        {cells.map(c => (
          <div key={c.id} onClick={() => dig(c.id)} style={{
            height:64, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:28, cursor:playing?"pointer":"default", transition:"all 0.15s",
            background: c.dug ? "#f5e6c8" : "#8B6914",
            border:"3px solid #6b4f10", boxShadow:"0 2px 6px #0002"
          }}>{c.dug ? (c.hasBone ? "🦴" : c.hasRock ? "🪨" : "💨") : "🟫"}</div>
        ))}
      </div>
      {!playing && (
        <button onClick={start} style={{ padding:"10px 24px", background:"#c0392b", color:"#fff", border:"none", borderRadius:12, cursor:"pointer", fontFamily:"'Fredoka One',sans-serif", fontSize:16 }}>
          {done ? `Found ${score} bones! Play Again` : "Start Digging! 🦴"}
        </button>
      )}
    </div>
  );
}
export default function App() {
  const [appState, setAppState]   = useState(null);   // full synced state
  const [loading,  setLoading]    = useState(true);
  const [syncing,  setSyncing]    = useState(false);  // brief write indicator
  const [tab,      setTab]        = useState("dashboard");
  const [selected, setSelected]   = useState(null);
  const [toast,    setToast]      = useState(null);
  const [payAmt,   setPayAmt]     = useState("");
  const [payReason,setPayReason]  = useState("Job completed");
  const [payAll,   setPayAll]     = useState(false);
  const [newJobName, setNewJobName]   = useState("");
  const [newJobPay,  setNewJobPay]    = useState("10");
  const [newJobEmoji,setNewJobEmoji]  = useState("⭐");
  const [showReset,  setShowReset]    = useState(false);
  const [deductModal, setDeductModal] = useState(false);
  const [isTeacher,    setIsTeacher]    = useState(false);
  const [studentUser,  setStudentUser]  = useState(null);
  const [loginUser,    setLoginUser]    = useState("");
  const [loginPass,    setLoginPass]    = useState("");
  const [loginError,   setLoginError]   = useState("");
  const [stuLoginUser, setStuLoginUser] = useState("");
  const [stuLoginPass, setStuLoginPass] = useState("");
  const [stuLoginError,setStuLoginError]= useState("");
  const [showChangePw, setShowChangePw] = useState(false);
  const [newPw1,       setNewPw1]       = useState("");
  const [newPw2,       setNewPw2]       = useState("");
  const [changePwError,setChangePwError]= useState("");
  const [showStudentLogin, setShowStudentLogin] = useState(false);
  const [activeGame, setActiveGame] = useState(null);
  const [payMulti, setPayMulti] = useState({});
  const [multiSelected, setMultiSelected] = useState([]);
  const [deductAmt, setDeductAmt] = useState("5");
  const [deductReason, setDeductReason] = useState("Deduction");
  const handleLogin = () => {
  if (loginUser === TEACHER_USER && loginPass === TEACHER_PASS) {
    setIsTeacher(true);
    setLoginError("");
  } else {
    setLoginError("Incorrect username or password.");
  }
};
  const handleStudentLogin = () => {
    const match = CLASS_LIST.find(s => s.username === stuLoginUser.trim().toLowerCase() && s.password === stuLoginPass);
    if (!match) { setStuLoginError("Wrong username or password!"); return; }
    const stuData = appState?.students?.find(s => s.name === match.name);
    if (!stuData) { setStuLoginError("Student not found in class!"); return; }
    setStudentUser({ ...match, id: stuData.id });
    setSelected(stuData.id);
    setStuLoginError("");
    };
  const handleStudentPasswordChange = () => {
    if (newPw1.length < 4) { setChangePwError("Password must be at least 4 characters!"); return; }
    if (newPw1 !== newPw2) { setChangePwError("Passwords don't match!"); return; }
    const idx = CLASS_LIST.findIndex(s => s.username === studentUser.username);
    if (idx !== -1) CLASS_LIST[idx].password = newPw1;
    setStudentUser(prev => ({ ...prev, password: newPw1 }));
    setShowChangePw(false);
    setNewPw1(""); setNewPw2(""); setChangePwError("");
    showToast("Password changed! 🦕");
  };

  // Debounce Firebase writes so rapid clicks don't spam
  const saveTimer = useRef(null);
  const latestState = useRef(null);

  const scheduleSave = useCallback((state) => {
    latestState.current = state;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSyncing(true);
      saveToFirebase(latestState.current).finally(() => setSyncing(false));
        }, 600);
  }, []);

  // ── Subscribe to Firebase on mount ────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeToFirebase((data) => {
      if (data) {
        setAppState(data);
      } else {
        // First run — seed the database
        const seed = SEED_STATE();
        setAppState(seed);
        saveToFirebase(seed);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── Helper: update state locally + schedule Firebase write ────────────────
  const update = useCallback((updater) => {
    setAppState(prev => {
      const next = updater(prev);
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);
    useEffect(() => {
    const handleClick = () => playSound("pop");
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const showToast = (msg, colour = "#27ae60") => {
    setToast({ msg, colour });
    setTimeout(() => setToast(null), 2600);
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const addTx = (studentId, amount, reason) => {
    const tx = { id: uuid(), studentId, amount, reason, date: todayStr() };
    if (amount > 0) sounds.ching(); else sounds.deduct();
    update(prev => ({
      ...prev,
      txLog: [tx, ...(prev.txLog || []).slice(0, 299)],
      balances: { ...prev.balances, [studentId]: Math.max(0, (prev.balances[studentId] || 0) + amount) },
    }));
  };

  const handlePayDay = () => {
    if (!appState) return;
    let count = 0;
    const newBalances = { ...appState.balances };
    const newTxs = [];
    appState.students.forEach(s => {
      const job = appState.jobs.find(j => j.id === appState.assigned[s.id]);
      if (job) {
        newBalances[s.id] = Math.max(0, (newBalances[s.id] || 0) + job.pay);
        newTxs.push({ id: uuid(), studentId: s.id, amount: job.pay, reason: `Salary: ${job.name}`, date: todayStr() });
        count++;
      }
    });
    update(prev => ({ ...prev, balances: newBalances, txLog: [...newTxs, ...(prev.txLog||[]).slice(0, 299 - newTxs.length)] }));
    showToast(`Payday! 🎉 ${count} dinos paid!`);
  };

  const handlePay = () => {
    const amount = parseInt(payAmt);
    if (!amount || isNaN(amount)) return showToast("Enter a valid amount", "#e74c3c");
    if (payAll) {
      appState.students.forEach(s => addTx(s.id, amount, payReason));
      showToast(`Paid ${fmt(amount)} to all ${appState.students.length} dinos!`);
    } else if (payMulti) {
      if (multiSelected.length === 0) return showToast("Select at least one student!", "#e74c3c");
      multiSelected.forEach(id => addTx(id, amount, payReason));
      showToast(`Paid ${fmt(amount)} to ${multiSelected.length} dinos!`);
      setMultiSelected([]);
    } else {
      if (!selected) return showToast("Select a student first", "#e74c3c");
      addTx(selected, amount, payReason);
      showToast(`Paid ${fmt(amount)} to ${appState.students.find(s => s.id === selected)?.name}!`);
    }
    setPayAmt("");
  };

  const buildRotation = (students, jobs, prevAssigned) => {
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const pool = [];
    while (pool.length < shuffled.length) pool.push(...[...jobs].sort(() => Math.random() - 0.5));
    const result = {};
    shuffled.forEach((s, i) => {
      let jobId = pool[i]?.id;
      if (jobId && prevAssigned[s.id] === jobId && jobs.length > 1) {
        const si = (i + 1) % shuffled.length;
        [pool[i], pool[si]] = [pool[si], pool[i]];
        jobId = pool[i]?.id;
      }
      result[s.id] = jobId || null;
    });
    return result;
  };

  const runRotation = () => {
    // Pay interest first
    update(prev => {
      const newBalances = { ...prev.balances };
      const newTxLog = [...(prev.txLog||[])];
      prev.students.forEach(s => {
        const interest = Math.round((newBalances[s.id]||0) * 0.02);
        if (interest > 0) {
          newBalances[s.id] = (newBalances[s.id]||0) + interest;
          newTxLog.unshift({ id:uuid(), studentId:s.id, amount:interest, reason:"8% Interest", date:todayStr() });
        }
      });
      return { ...prev, balances: newBalances, txLog: newTxLog };
    });
    showToast("💹 8% interest paid + new jobs assigned!");
    if (!appState) return;
    const newAssigned = buildRotation(appState.students, appState.jobs, appState.assigned || {});
    update(prev => ({ ...prev, prevAssigned: prev.assigned, assigned: newAssigned, lastRotation: todayStr() }));
    showToast("🔄 Jobs rotated for the new week!");
  };

  // Auto-rotate on Monday
  useEffect(() => {
    if (!appState?.students?.length) return;
    const isMonday = new Date().getDay() === 1;
    if (isMonday && appState.lastRotation !== todayStr()) runRotation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState?.students]);

  const handleAddJob = () => {
    if (!newJobName.trim()) return;
    const job = { id: uuid(), name: newJobName.trim(), pay: parseInt(newJobPay) || 10, emoji: newJobEmoji };
    update(prev => ({ ...prev, jobs: [...(prev.jobs||[]), job] }));
    setNewJobName(""); setNewJobPay("10"); setNewJobEmoji("⭐");
    showToast("Job added!");
  };

  const handleDeleteJob = (id) => {
    update(prev => ({
      ...prev,
      jobs: prev.jobs.filter(j => j.id !== id),
      assigned: Object.fromEntries(Object.entries(prev.assigned||{}).map(([k,v]) => [k, v===id ? null : v])),
    }));
  };


  const fetchStockChange = async (tickers) => {
    const changes = await Promise.all(tickers.map(async ticker => {
      try {
        const url = `https://corsproxy.io/?https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`;
        const res = await fetch(url);
        const data = await res.json();
        const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(Boolean);
        if (!closes || closes.length < 2) return 0;
        return (closes[closes.length-1] - closes[closes.length-2]) / closes[closes.length-2];
      } catch { return 0; }
    }));
    return changes.reduce((a, b) => a + b, 0) / changes.length;
  };

  // Auto-fetch stock prices daily
  useEffect(() => {
    if (!appState) return;
    const today = todayStr();
    if (appState?.lastStockFetch === today) return;
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return;

    const fetchStocks = async () => {
      const newPrices = { ...(appState.stockPrices || {}) };
      const newNews = {};
      for (const stock of DINO_STOCKS) {
        try {
          const avgChange = await fetchStockChange(stock.tickers);
          const currentPrice = appState.stockPrices?.[stock.id] ?? stock.startPrice;
          const newPrice = Math.max(1, currentPrice * (1 + avgChange));
          const rounded = Math.round(newPrice * 100) / 100;
          newNews[stock.id] = getNewsHeadline(stock.id, currentPrice, rounded);
          newPrices[stock.id] = rounded;
        } catch {
          const move = (Math.random() - 0.48) * stock.volatility;
          const currentPrice = appState.stockPrices?.[stock.id] ?? stock.startPrice;
          const rounded = Math.max(1, Math.round(currentPrice * (1 + move) * 100) / 100);
          newNews[stock.id] = getNewsHeadline(stock.id, currentPrice, rounded);
          newPrices[stock.id] = rounded;
        }
      }
      update(prev => ({
        ...prev,
        stockPrices: newPrices,
        lastStockFetch: today,
        stockNews: newNews,
        stockHistory: { ...(prev.stockHistory || {}), [today]: newPrices },
      }));
    };

    fetchStocks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState?.students]);


 // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#1a472a",color:"#a8d8b5",fontSize:28,fontFamily:"'Fredoka One',sans-serif",gap:16,flexDirection:"column" }}>
      <DinoSVG id="trex" c="#C0392B" size={72}/>
      <div>Loading Dino Bucks...</div>
      <div style={{ fontSize:13,color:"#6aad86",fontFamily:"'Nunito',sans-serif" }}>Connecting to Firebase...</div>
    </div>
  );

  if (!isTeacher && !studentUser) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(155deg,#145a32 0%,#1e8449 50%,#0b5345 100%)", fontFamily:"'Fredoka One',sans-serif" }}>
      <div style={{ background:"#fff", borderRadius:24, padding:"40px 36px", boxShadow:"0 12px 48px #0006", width:"100%", maxWidth:380, textAlign:"center" }}>
        <DinoSVG id="trex" c="#C0392B" size={80}/>
        <h1 style={{ fontSize:28, color:"#1a472a", margin:"12px 0 4px", letterSpacing:2 }}>DINO BUCKS</h1>
        {!showStudentLogin ? (
          <>
            <p style={{ color:"#888", fontFamily:"'Nunito',sans-serif", fontSize:13, marginBottom:24 }}>Teacher Login</p>
            <input value={loginUser} onChange={e => setLoginUser(e.target.value)} placeholder="Username"
              style={{ width:"100%", padding:"11px 14px", borderRadius:12, border:"2.5px solid #4B9B6E", fontSize:16, fontFamily:"'Nunito',sans-serif", outline:"none", marginBottom:10, boxSizing:"border-box" }}/>
            <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="Password"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{ width:"100%", padding:"11px 14px", borderRadius:12, border:"2.5px solid #4B9B6E", fontSize:16, fontFamily:"'Nunito',sans-serif", outline:"none", marginBottom:10, boxSizing:"border-box" }}/>
            {loginError && <div style={{ color:"#e74c3c", fontFamily:"'Nunito',sans-serif", fontSize:13, marginBottom:8 }}>{loginError}</div>}
            <button onClick={handleLogin} style={{ width:"100%", padding:"13px", background:"linear-gradient(135deg,#4B9B6E,#1e8449)", color:"#fff", border:"none", borderRadius:14, cursor:"pointer", fontSize:20, fontFamily:"'Fredoka One',sans-serif", boxShadow:"0 5px 18px #1e844966" }}>
              🦕 Teacher Login
            </button>
            <div style={{ margin:"16px 0 8px", borderTop:"1px solid #eee", paddingTop:16 }}>
              <button onClick={() => { setShowStudentLogin(true); setStuLoginError(""); }}
                style={{ width:"100%", padding:"13px", background:"linear-gradient(135deg,#2471A3,#1A5276)", color:"#fff", border:"none", borderRadius:14, cursor:"pointer", fontSize:20, fontFamily:"'Fredoka One',sans-serif", boxShadow:"0 5px 18px #1A527666" }}>
                🎒 Student Login
              </button>
            </div>
            <button onClick={() => setIsTeacher("display")} style={{ background:"none", border:"none", cursor:"pointer", color:"#145a32", fontFamily:"'Nunito',sans-serif", fontSize:10, marginTop:4 }}>
              📺
            </button>
          </>
        ) : (
          <>
            <p style={{ color:"#888", fontFamily:"'Nunito',sans-serif", fontSize:13, marginBottom:24 }}>Student Login</p>
            <input value={stuLoginUser} onChange={e => setStuLoginUser(e.target.value)} placeholder="Username (e.g. emmab)"
              style={{ width:"100%", padding:"11px 14px", borderRadius:12, border:"2.5px solid #2471A3", fontSize:16, fontFamily:"'Nunito',sans-serif", outline:"none", marginBottom:10, boxSizing:"border-box" }}/>
            <input type="password" value={stuLoginPass} onChange={e => setStuLoginPass(e.target.value)} placeholder="Password"
              onKeyDown={e => e.key === "Enter" && handleStudentLogin()}
              style={{ width:"100%", padding:"11px 14px", borderRadius:12, border:"2.5px solid #2471A3", fontSize:16, fontFamily:"'Nunito',sans-serif", outline:"none", marginBottom:10, boxSizing:"border-box" }}/>
            {stuLoginError && <div style={{ color:"#e74c3c", fontFamily:"'Nunito',sans-serif", fontSize:13, marginBottom:8 }}>{stuLoginError}</div>}
            <button onClick={handleStudentLogin} style={{ width:"100%", padding:"13px", background:"linear-gradient(135deg,#2471A3,#1A5276)", color:"#fff", border:"none", borderRadius:14, cursor:"pointer", fontSize:20, fontFamily:"'Fredoka One',sans-serif", boxShadow:"0 5px 18px #1A527666" }}>
              🎒 Log In
            </button>
            <button onClick={() => { setShowStudentLogin(false); setStuLoginUser(""); setStuLoginPass(""); setStuLoginError(""); }}
              style={{ background:"none", border:"none", cursor:"pointer", color:"#888", fontFamily:"'Nunito',sans-serif", fontSize:13, textDecoration:"underline", marginTop:12 }}>
              ← Back to Teacher Login
            </button>
          </>
        )}
      </div>
    </div>
  );


  // ── Whiteboard display mode ──────────────────────────────────────────
  if (isTeacher === "display") {
    const totalBal = (appState?.students || []).reduce((sum, s) => sum + (appState?.balances?.[s.id] || 0), 0);
    return (
      <div style={{ minHeight:"100vh", background:"linear-gradient(155deg,#145a32 0%,#1e8449 50%,#0b5345 100%)", fontFamily:"'Fredoka One',sans-serif", padding:24 }}>
        <style>{`* { box-sizing:border-box }`}</style>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <DinoSVG id="trex" c="#C0392B" size={52}/>
            <h1 style={{ fontSize:42, color:"#fff", margin:0, letterSpacing:3 }}>DINO BUCKS</h1>
          </div>
          <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:16, padding:"10px 24px", textAlign:"center" }}>
            <div style={{ color:"#a8d8b5", fontFamily:"'Nunito',sans-serif", fontSize:14 }}>Class Total</div>
            <div style={{ color:"#fff", fontSize:32 }}>{fmt(totalBal)}</div>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:16, marginBottom:32 }}>
          {(appState?.students || []).map(s => {
            const balance = appState?.balances?.[s.id] || 0;
            return (
              <div key={s.id} style={{ background:"rgba(255,255,255,0.95)", borderRadius:20, padding:"16px 12px", textAlign:"center", boxShadow:"0 4px 16px #0003" }}>
                <DinoSVG id={s.dinoId} c="#1e8449" size={56}/>
                <div style={{ fontSize:15, color:"#1a472a", margin:"8px 0 4px" }}>{s.name.split(" ")[0]}</div>
                <div style={{ fontSize:24, color:"#27ae60" }}>{fmt(balance)}</div>
              </div>
            );
          })}
        </div>
        <h2 style={{ fontSize:28, color:"#fff", margin:"0 0 16px" }}>🏆 Top Investors</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:12 }}>
          {(appState?.students || []).map(s => {
            const portfolio = appState?.portfolios?.[s.id] || {};
            const totalInvested = (appState?.txLog || []).filter(t => t.studentId === s.id && t.reason?.includes("Bought")).reduce((sum, t) => sum + Math.abs(t.amount), 0);
            const currentValue = DINO_STOCKS.reduce((sum, stock) => sum + (portfolio[stock.id] || 0) * (appState?.stockPrices?.[stock.id] ?? stock.startPrice), 0);
            const gain = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested * 100).toFixed(1) : null;
            return { ...s, gain, currentValue, totalInvested };
          }).filter(s => s.totalInvested > 0).sort((a, b) => b.gain - a.gain).slice(0, 6).map((s, i) => {
            const dino = DINOS.find(d => d.id === s.dinoId) || DINOS[0];
            return (
              <div key={s.id} style={{ background:"rgba(255,255,255,0.95)", borderRadius:20, padding:16, display:"flex", alignItems:"center", gap:12, boxShadow:"0 4px 16px #0003" }}>
                <div style={{ fontFamily:"'Fredoka One',sans-serif", fontSize:28, color:"#1a472a", width:36 }}>#{i+1}</div>
                <DinoSVG id={s.dinoId} c={dino.colour} size={44}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Fredoka One',sans-serif", fontSize:16, color:"#1a472a" }}>{s.name.split(" ")[0]}</div>
                  <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color: s.gain >= 0 ? "#27ae60" : "#e74c3c", fontWeight:700 }}>
                    {s.gain >= 0 ? "▲" : "▼"}{Math.abs(s.gain)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }


  if (studentUser) {
    const stuData = (appState?.students || []).find(s => s.id === studentUser.id);
    const stuBalance = appState?.balances?.[studentUser.id] || 0;
    const stuTx = (appState?.txLog || []).filter(t => t.studentId === studentUser.id);
    return (
      <div style={{ minHeight:"100vh", background:"linear-gradient(155deg,#145a32 0%,#1e8449 50%,#0b5345 100%)", fontFamily:"'Fredoka One',sans-serif", padding:20 }}>
        <style>{`* { box-sizing:border-box }`}</style>
        <div style={{ background:"#1A5276", borderRadius:16, padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <span style={{ color:"#fff", fontSize:18 }}>👋 Hi, {studentUser.name.split(" ")[0]}!</span>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setShowChangePw(true)}
              style={{ padding:"5px 12px", background:"rgba(255,255,255,0.2)", color:"#fff", border:"1.5px solid rgba(255,255,255,0.4)", borderRadius:8, cursor:"pointer", fontSize:12, fontFamily:"'Nunito',sans-serif" }}>
              🔑 Change Password
            </button>
            <button onClick={() => { setStudentUser(null); setStuLoginUser(""); setStuLoginPass(""); }}
              style={{ padding:"5px 12px", background:"rgba(255,255,255,0.2)", color:"#fff", border:"1.5px solid rgba(255,255,255,0.4)", borderRadius:8, cursor:"pointer", fontSize:12, fontFamily:"'Nunito',sans-serif" }}>
              🔒 Logout
            </button>
          </div>
        </div>
        <div style={{ background:"#fff", borderRadius:20, padding:24, textAlign:"center", marginBottom:20, boxShadow:"0 4px 20px #0003" }}>
          <DinoSVG id={stuData?.dinoId || "trex"} c="#1e8449" size={90}/>
          <h2 style={{ fontSize:24, color:"#1a472a", margin:"12px 0 4px" }}>{stuData?.name}</h2>
          <div style={{ fontSize:42, color:"#27ae60", fontFamily:"'Fredoka One',sans-serif", margin:"8px 0" }}>{fmt(stuBalance)}</div>
          <div style={{ color:"#888", fontFamily:"'Nunito',sans-serif", fontSize:13 }}>Current Balance</div>
        </div>
        <div style={{ background:"#fff", borderRadius:20, padding:24, boxShadow:"0 4px 20px #0003", marginBottom:20 }}>
          <h3 style={{ fontSize:20, color:"#1a472a", margin:"0 0 16px", fontFamily:"'Fredoka One',sans-serif" }}>📈 My Investments</h3>
          {DINO_STOCKS.map(stock => {
            const price = appState?.stockPrices?.[stock.id] ?? stock.startPrice;
            const shares = appState?.portfolios?.[studentUser.id]?.[stock.id] || 0;
            const value = shares * price;
            if (shares === 0) return null;
            return (
              <div key={stock.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #f0f0f0", fontFamily:"'Nunito',sans-serif" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:24 }}>{stock.emoji}</span>
                  <div>
                    <div style={{ fontSize:14, color:"#333", fontWeight:700 }}>{stock.name}</div>
                    <div style={{ fontSize:11, color:"#aaa" }}>{shares.toFixed(4)} shares @ {fmt(price)}</div>
                  </div>
                </div>
                <div style={{ fontFamily:"'Fredoka One',sans-serif", fontSize:18, color:stock.color }}>{fmt(value.toFixed(2))}</div>
              </div>
            );
          })}
          {DINO_STOCKS.every(stock => (appState?.portfolios?.[studentUser.id]?.[stock.id] || 0) === 0) && (
            <div style={{ color:"#aaa", fontFamily:"'Nunito',sans-serif", textAlign:"center", padding:20 }}>No investments yet!</div>
          )}
        </div>
        <div style={{ background:"#fff", borderRadius:20, padding:24, boxShadow:"0 4px 20px #0003" }}>
          <h3 style={{ fontSize:20, color:"#1a472a", margin:"0 0 16px" }}>📜 Transaction History</h3>
          {stuTx.length === 0 ? (
            <div style={{ color:"#aaa", fontFamily:"'Nunito',sans-serif", textAlign:"center", padding:20 }}>No transactions yet!</div>
          ) : (
            stuTx.slice(0, 30).map(t => (
              <div key={t.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #f0f0f0", fontFamily:"'Nunito',sans-serif" }}>
                <div>
                  <div style={{ fontSize:14, color:"#333" }}>{t.reason}</div>
                  <div style={{ fontSize:11, color:"#aaa" }}>{t.date}</div>
                </div>
                <div style={{ fontFamily:"'Fredoka One',sans-serif", fontSize:18, color: t.amount >= 0 ? "#27ae60" : "#e74c3c" }}>
                  {t.amount >= 0 ? "+" : ""}{fmt(t.amount)}
                </div>
              </div>
            ))
          )}
        </div>
        {showChangePw && (
          <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999 }}>
            <div style={{ background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:340,boxShadow:"0 12px 48px #0006" }}>
              <h3 style={{ fontSize:22,color:"#1a472a",margin:"0 0 16px",fontFamily:"'Fredoka One',sans-serif" }}>🔑 Change Password</h3>
              <input type="password" value={newPw1} onChange={e => setNewPw1(e.target.value)} placeholder="New password" autoFocus
                style={{ width:"100%",padding:"10px 14px",borderRadius:12,border:"3px solid #4B9B6E",fontSize:16,fontFamily:"'Nunito',sans-serif",outline:"none",marginBottom:10 }}/>
              <input type="password" value={newPw2} onChange={e => setNewPw2(e.target.value)} placeholder="Confirm new password"
                onKeyDown={e => e.key === "Enter" && handleStudentPasswordChange()}
                style={{ width:"100%",padding:"10px 14px",borderRadius:12,border:"3px solid #4B9B6E",fontSize:16,fontFamily:"'Nunito',sans-serif",outline:"none",marginBottom:10 }}/>
              {changePwError && <div style={{ color:"#e74c3c",fontFamily:"'Nunito',sans-serif",fontSize:13,marginBottom:8 }}>{changePwError}</div>}
              <div style={{ display:"flex",gap:10 }}>
                <button onClick={handleStudentPasswordChange}
                  style={{ flex:1,padding:"11px",background:"#4B9B6E",color:"#fff",border:"none",borderRadius:12,cursor:"pointer",fontSize:18,fontFamily:"'Fredoka One',sans-serif" }}>Save</button>
                <button onClick={() => { setShowChangePw(false); setNewPw1(""); setNewPw2(""); setChangePwError(""); }}
                  style={{ padding:"11px 18px",background:"#eee",color:"#333",border:"none",borderRadius:12,cursor:"pointer",fontSize:16,fontFamily:"'Fredoka One',sans-serif" }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }


  const { students, balances, jobs, assigned, txLog, lastRotation } = appState;
  const totalBalance = Object.values(balances || {}).reduce((a, b) => a + b, 0);
  const selStudent = students?.find(s => s.id === selected);
  const selDino    = selStudent ? DINOS.find(d => d.id === selStudent.dinoId) : null;

  const tabBtn = (t, label) => (
    <button key={t} onClick={() => setTab(t)} style={{
      padding:"12px 20px", border:"none", cursor:"pointer",
      borderRadius:"14px 14px 0 0",
      fontFamily:"'Fredoka One',sans-serif", fontSize:16, letterSpacing:0.5,
      background: tab===t ? "#fff" : "rgba(255,255,255,0.14)",
      color: tab===t ? "#1a472a" : "#e8f5e9", transition:"all 0.15s",
    }}>{label}</button>
  );

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(155deg,#145a32 0%,#1e8449 50%,#0b5345 100%)", fontFamily:"'Fredoka One',sans-serif" }}>
      <style>{`* { box-sizing:border-box } button:active { opacity:.84 } select { cursor:pointer }`}</style>

      {/* HEADER */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px 10px",background:"rgba(0,0,0,0.22)",backdropFilter:"blur(10px)",flexWrap:"wrap",gap:10 }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <DinoSVG id="trex" c="#C0392B" size={52}/>
          <div>
            <h1 style={{ margin:0,fontSize:"clamp(1.4rem,3vw,2.4rem)",color:"#f9f3e3",textShadow:"0 3px 12px #0007",letterSpacing:3 }}>DINO BUCKS</h1>
            <div style={{ color:"#a8d8b5",fontSize:13,fontFamily:"'Nunito',sans-serif",fontWeight:700,display:"flex",alignItems:"center",gap:8 }}>
              {students.length} dinos · Vault: {fmt(totalBalance)}
              {syncing && <span style={{ fontSize:11,color:"#6aad86",animation:"pulse 1s infinite" }}>● syncing</span>}
            </div>
          </div>
        </div>
        <div style={{ display:"flex",gap:10,flexWrap:"wrap",alignItems:"center" }}>
          <div style={{ textAlign:"right" }}>
            <button onClick={runRotation} style={{ padding:"10px 18px",background:"linear-gradient(135deg,#2471A3,#1A5276)",color:"#fff",border:"none",borderRadius:12,cursor:"pointer",fontSize:16,fontFamily:"'Fredoka One',sans-serif",boxShadow:"0 3px 14px #1A527666",display:"block" }}>
              🔄 New Week
            </button>
            {lastRotation && <div style={{ fontSize:10,color:"#a8d8b5",fontFamily:"'Nunito',sans-serif",marginTop:2 }}>Rotated: {lastRotation}</div>}
          </div>
          <button onClick={handlePayDay} style={{ padding:"10px 20px",background:"linear-gradient(135deg,#f39c12,#d68910)",color:"#fff",border:"none",borderRadius:12,cursor:"pointer",fontSize:18,fontFamily:"'Fredoka One',sans-serif",boxShadow:"0 3px 14px #d6891066" }}>
            💰 Payday!
          </button>
          <button onClick={() => { setIsTeacher(false); setLoginUser(""); setLoginPass(""); }}
            style={{ padding:"8px 16px",background:"rgba(255,255,255,0.2)",color:"#fff",border:"2px solid rgba(255,255,255,0.4)",borderRadius:10,cursor:"pointer",fontSize:14,fontFamily:"'Fredoka One',sans-serif" }}>
            🔒 Logout
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display:"flex",gap:4,padding:"0 20px",marginTop:12,flexWrap:"wrap" }}>
        {tabBtn("dashboard","🏠 Class")}
        {tabBtn("pay","💵 Pay")}
        {tabBtn("jobs","👷 Jobs")}
        {tabBtn("log","📋 History")}
        {tabBtn("store","🏪 Store")}
        {tabBtn("invest","📈 Invest")}
        {tabBtn("play","🎮 Play")}
        {tabBtn("settings","⚙️ Settings")}
      </div>

      {/* PANEL */}
      <div style={{ background:"#fff",margin:"0 20px 20px",borderRadius:"0 18px 18px 18px",padding:"20px 20px 30px",minHeight:500,boxShadow:"0 10px 48px #0005" }}>

        {/* ═══ DASHBOARD ═══ */}
        {tab==="dashboard" && (
          <div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(116px,1fr))",gap:12 }}>
              {students.map(s => (
                <DinoCard key={s.id} student={s} balance={balances[s.id]||0}
                  job={(jobs||{}).find(j => j.id === (assigned||{})[s.id])}
                  onClick={() => setSelected(s.id === selected ? null : s.id)}
                  selected={selected === s.id}/>
              ))}
            </div>

            {selStudent && selDino && (() => {
              const bc = billColour(balances[selected]||0);
              const sLog = (txLog||[]).filter(t => t.studentId === selected).slice(0, 6);
              return (
                <div style={{ marginTop:22,padding:22,borderRadius:20,background:`linear-gradient(135deg,${selDino.colour}15,${bc.light})`,border:`3px solid ${selDino.colour}55` }}>
                  <div style={{ display:"flex",alignItems:"center",gap:16,marginBottom:16,flexWrap:"wrap" }}>
                    <div style={{ filter:`drop-shadow(0 4px 12px ${selDino.colour}55)` }}>
                      <DinoSVG id={selStudent.dinoId} c={selDino.colour} size={90}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:26,color:"#1a1a2e",lineHeight:1 }}>{selStudent.name}</div>
                      <div style={{ color:"#666",fontSize:14,fontFamily:"'Nunito',sans-serif",fontWeight:700 }}>
                         {selDino.name} · {(jobs||[]).find(j => j.id === (assigned||{})[selected])?.name || "No job assigned"}
                      </div>
                    </div>
                    <div style={{ background:bc.bg,color:"#fff",borderRadius:24,padding:"8px 24px",fontSize:30,fontWeight:800,boxShadow:`0 4px 14px ${bc.bg}77`,fontFamily:"'Fredoka One',sans-serif" }}>
                      {fmt(balances[selected]||0)}
                    </div>
                  </div>
                  <BadgeShowcase balance={balances[selected]||0}/>
                  <div style={{ display:"flex",gap:9,flexWrap:"wrap",marginBottom:14 }}>
                    {[1,2,5,10,20,50,100].map(a => (
                       <button key={a} onClick={() => setPayAmt(String(a))}
                       style={{ padding:"5px 11px", background:billColour(a).bg, color:"#fff", border: a<=2 ? "3px solid rgba(255,255,255,0.4)" : "none", borderRadius: a<=2 ? "50%" : 8, width: a<=2 ? 44 : undefined, height: a<=2 ? 44 : undefined, cursor:"pointer", fontSize:13, fontFamily:"'Fredoka One',sans-serif", display:"flex", alignItems:"center", justifyContent:"center" }}>
                       {fmt(a)}
                       </button>
   ))}              
                    <button onClick={() => { const raw = window.prompt(`Custom bonus for ${selStudent.name}?`,""); const a = parseInt(raw||"0"); if(a>0){addTx(selected,a,"Custom bonus");showToast(`+${fmt(a)} to ${selStudent.name}! 🦕`);}}}
      style={{ padding:"8px 18px",background:"#8e44ad",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontSize:16,fontFamily:"'Fredoka One',sans-serif" }}>
      + Custom
    </button>
                    <button onClick={() => { setDeductModal(true); setDeductAmt(payAmt||""); }}
      style={{ padding:"8px 18px",background:"#e74c3c",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontSize:16,fontFamily:"'Fredoka One',sans-serif" }}>
      − Deduct
    </button>
                  </div>
                  {sLog.length > 0 && <div>{sLog.map(tx => <TxRow key={tx.id} tx={tx} students={students}/>)}</div>}
                </div>
              );
            })()}
          </div>
        )}


        {/* ═══ PAY ═══ */}
        {tab==="pay" && (
          <div style={{ maxWidth:600 }}>
            <h2 style={{ fontSize:26,color:"#1a472a",marginTop:0 }}>Pay Students 💵</h2>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"'Nunito',sans-serif",fontWeight:800,color:"#444",marginBottom:8 }}>Who gets paid?</div>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                <button onClick={() => { setPayAll(true); setPayMulti(false); setSelected(null); setMultiSelected([]); }} style={{ padding:"9px 18px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"'Fredoka One',sans-serif",fontSize:15,background:payAll?"#1a472a":"#eee",color:payAll?"#fff":"#333" }}>🌍 Everyone</button>
                <button onClick={() => { setPayAll(false); setPayMulti(true); setSelected(null); setMultiSelected([]); }} style={{ padding:"9px 18px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"'Fredoka One',sans-serif",fontSize:15,background:payMulti?"#8e44ad":"#eee",color:payMulti?"#fff":"#333" }}>🦕 Select Multiple</button>
                {students.map(s => {
                  const dino = DINOS.find(d => d.id === s.dinoId) || DINOS[0];
                  const isMultiSel = multiSelected.includes(s.id);
                  return (
                    <button key={s.id} onClick={() => {
                      if (payMulti) {
                        setMultiSelected(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]);
                      } else {
                        setPayAll(false); setPayMulti(false); setSelected(s.id);
                      }
                    }} style={{ padding:"7px 12px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontSize:12,fontWeight:800,
                      background:payMulti ? (isMultiSel?"#27ae60":"#eee") : (!payAll&&selected===s.id)?dino.colour:"#eee",
                      color:payMulti ? (isMultiSel?"#fff":"#333") : (!payAll&&selected===s.id)?"#fff":"#333",
                      display:"flex",alignItems:"center",gap:4 }}>
                      <DinoSVG id={s.dinoId} c={payMulti?(isMultiSel?"#fff":dino.colour):dino.colour} size={18}/>{s.name.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display:"flex",gap:14,flexWrap:"wrap",marginBottom:16 }}>
              <div style={{ flex:1,minWidth:140 }}>
                <div style={{ fontFamily:"'Nunito',sans-serif",fontWeight:800,color:"#444",marginBottom:6 }}>Amount</div>
                <input type="number" value={payAmt} onChange={e => setPayAmt(e.target.value)} min="1" placeholder="10"
                  style={{ width:"100%",padding:"10px 14px",borderRadius:12,border:"3px solid #4B9B6E",fontSize:22,fontFamily:"'Fredoka One',sans-serif",outline:"none" }}/>
                <div style={{ display:"flex",gap:7,marginTop:8,flexWrap:"wrap" }}>
                  {[1,2,5,10,20,50,100].map(amt => (
                    <button key={amt} onClick={() => setPayAmt(String(amt))}
                      style={{ padding:"5px 11px", background:billColour(amt).bg, color:"#fff", border: amt<=2 ? "3px solid rgba(255,255,255,0.4)" : "none", borderRadius: amt<=2 ? "50%" : 8, width: amt<=2 ? 44 : undefined, height: amt<=2 ? 44 : undefined, cursor:"pointer", fontSize:13, fontFamily:"'Fredoka One',sans-serif", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {fmt(amt)}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex:2,minWidth:200 }}>
                <div style={{ fontFamily:"'Nunito',sans-serif",fontWeight:800,color:"#444",marginBottom:6 }}>Reason</div>
                <input value={payReason} onChange={e => setPayReason(e.target.value)} placeholder="Job completed, bonus…"
                  style={{ width:"100%",padding:"10px 14px",borderRadius:12,border:"3px solid #4B9B6E",fontSize:15,fontFamily:"'Nunito',sans-serif",outline:"none" }}/>
                <div style={{ display:"flex",gap:6,marginTop:8,flexWrap:"wrap" }}>
                  {["Job completed","Great work!","Reading quietly","Respectful","Helped a classmate","Class participation"].map(r => (
                    <button key={r} onClick={() => setPayReason(r)}
                      style={{ padding:"4px 9px",background:"#e8f5e9",border:"1.5px solid #4B9B6E",borderRadius:7,cursor:"pointer",fontSize:11,fontFamily:"'Nunito',sans-serif",color:"#1a472a" }}>{r}</button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handlePay} style={{ padding:"13px 36px",background:"linear-gradient(135deg,#4B9B6E,#1e8449)",color:"#fff",border:"none",borderRadius:14,cursor:"pointer",fontSize:20,fontFamily:"'Fredoka One',sans-serif",boxShadow:"0 5px 18px #1e844966" }}>
              💸 Pay {payAll ? "Everyone" : payMulti ? `${multiSelected.length} Students` : selStudent?.name.split(" ")[0] || "…"}
            </button>
            <div style={{ marginTop:26,padding:"16px 18px",background:"#fffbf0",borderRadius:14,border:"2px solid #f39c1244" }}>
              <h3 style={{ fontSize:18,color:"#1a472a",margin:"0 0 8px" }}>Run Payroll</h3>
              <p style={{ fontFamily:"'Nunito',sans-serif",color:"#666",margin:"0 0 10px",fontSize:13 }}>Pays every student their assigned job salary at once.</p>
              <button onClick={handlePayDay} style={{ padding:"11px 26px",background:"linear-gradient(135deg,#f39c12,#d68910)",color:"#fff",border:"none",borderRadius:12,cursor:"pointer",fontSize:18,fontFamily:"'Fredoka One',sans-serif" }}>💰 Payday — Pay All Salaries</button>
            </div>
          </div>
        )}

        {/* ═══ JOBS ═══ */}
        {tab==="jobs" && (
          <div>
            <h2 style={{ fontSize:22,color:"#1a472a",marginTop:0 }}>Classroom Jobs 👷</h2>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:18,padding:"12px 16px",background:"linear-gradient(135deg,#eaf4ff,#daeaf8)",borderRadius:14,border:"2px solid #4A7FBF44" }}>
              <div style={{ fontFamily:"'Nunito',sans-serif",fontSize:13,color:"#1A5276" }}>
                <strong>🔄 Weekly Rotation</strong>
                {lastRotation ? <span style={{ marginLeft:8,color:"#555" }}>Last rotated: <strong>{lastRotation}</strong></span> : <span style={{ marginLeft:8,color:"#888" }}>Not yet rotated</span>}
                <div style={{ fontSize:11,color:"#888",marginTop:2 }}>Auto-rotates every Monday · No student repeats their job from the previous week</div>
              </div>
              <button onClick={runRotation} style={{ padding:"8px 18px",background:"linear-gradient(135deg,#2471A3,#1A5276)",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontSize:14,fontFamily:"'Fredoka One',sans-serif",whiteSpace:"nowrap" }}>🔄 Rotate Now</button>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:12,marginBottom:26 }}>
              {students.map(s => {
                const dino = DINOS.find(d => d.id === s.dinoId) || DINOS[0];
                const job = (jobs||[]).find(j => j.id === (assigned||{})[s.id]);
                return (
                  <div key={s.id} style={{ background:job?`linear-gradient(135deg,${dino.colour}14,#f0fbf4)`:"#fafafa",border:`2.5px solid ${job?dino.colour+"44":"#e0e0e0"}`,borderRadius:16,padding:"7px 10px",display:"flex",alignItems:"center",gap:10 }}>
                    <DinoSVG id={s.dinoId} c={dino.colour} size={44}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800,fontSize:16,color:"#1a1a2e" }}>{s.name.split(" ")[0]}</div>
                      <div style={{ fontSize:16,color:"#444",fontFamily:"'Nunito',sans-serif",fontWeight:700,marginTop:2 }}>{job ? `${job.emoji} ${job.name} · ${fmt(job.pay)}/payday` : "No job yet"}</div>
                    </div>
                    <select value={(assigned||{})[s.id]||""} onChange={e => update(prev => ({ ...prev, assigned: { ...prev.assigned, [s.id]: e.target.value||null } }))}
                      style={{ padding:"5px 7px",borderRadius:8,border:"2px solid #4B9B6E",fontSize:12,fontFamily:"'Nunito',sans-serif",background:"#fff",outline:"none",maxWidth:130 }}>
                      <option value="">— No job —</option>
                      {jobs.map(j => <option key={j.id} value={j.id}>{j.emoji} {j.name} ({fmt(j.pay)})</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
            <div style={{ borderTop:"2px solid #e0e0e0",paddingTop:18 }}>
              <h3 style={{ fontSize:18,color:"#1a472a",marginBottom:12 }}>All Jobs</h3>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10,marginBottom:18 }}>
                {jobs.map(j => (
                  <div key={j.id} style={{ background:"#f0fbf4",border:"2px solid #4B9B6E33",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:8 }}>
                    <span style={{ fontSize:20 }}>{j.emoji}</span>
                    <div style={{ flex:1 }}><div style={{ fontWeight:800,fontSize:13 }}>{j.name}</div><div style={{ fontSize:11,color:"#555",fontFamily:"'Nunito',sans-serif" }}>Salary: {fmt(j.pay)}</div></div>
                    <button onClick={() => handleDeleteJob(j.id)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:15,color:"#e74c3c",padding:"2px 5px",borderRadius:6 }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ background:"#f9f9f9",border:"2px dashed #4B9B6E77",borderRadius:14,padding:16,maxWidth:480 }}>
                <div style={{ fontSize:15,color:"#1a472a",marginBottom:8,fontWeight:700 }}>➕ Add a job</div>
                <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                  <input value={newJobEmoji} onChange={e => setNewJobEmoji(e.target.value)} maxLength={2} placeholder="🌟" style={{ width:48,padding:"7px",borderRadius:8,border:"2px solid #4B9B6E",fontSize:20,textAlign:"center",outline:"none" }}/>
                  <input value={newJobName} onChange={e => setNewJobName(e.target.value)} placeholder="Job name" style={{ flex:2,minWidth:120,padding:"7px 11px",borderRadius:8,border:"2px solid #4B9B6E",fontSize:14,fontFamily:"'Nunito',sans-serif",outline:"none" }}/>
                  <input type="number" value={newJobPay} onChange={e => setNewJobPay(e.target.value)} min="1" placeholder="Pay" style={{ width:74,padding:"7px",borderRadius:8,border:"2px solid #4B9B6E",fontSize:15,fontFamily:"'Fredoka One',sans-serif",outline:"none" }}/>
                  <button onClick={handleAddJob} style={{ padding:"7px 18px",background:"#4B9B6E",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:15,fontFamily:"'Fredoka One',sans-serif" }}>Add</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ HISTORY ═══ */}
        {tab==="log" && (
          <div>
            <h2 style={{ fontSize:26,color:"#1a472a",marginTop:0 }}>Transaction History 📋</h2>
            {!txLog?.length
              ? <div style={{ textAlign:"center",color:"#bbb",padding:48,fontSize:18,fontFamily:"'Nunito',sans-serif" }}>No transactions yet — run Payday or pay a student!</div>
              : <div style={{ maxHeight:560,overflowY:"auto" }}>{txLog.map(tx => <TxRow key={tx.id} tx={tx} students={students}/>)}</div>
            }
          </div>
        )}

{/* ═══ STORE ═══ */}
        {tab==="store" && (
          <div>
            <h2 style={{ fontSize:26,color:"#1a472a",marginTop:0 }}>Dino Store 🏪</h2>

            {/* Pending approvals — teacher only */}
            {isTeacher === true && (appState.purchases||[]).filter(p => p.status==="pending").length > 0 && (
              <div style={{ background:"#fffbf0",border:"2px solid #f39c1244",borderRadius:14,padding:16,marginBottom:20 }}>
                <h3 style={{ fontSize:18,color:"#1a472a",margin:"0 0 12px" }}>⏳ Pending Approvals</h3>
                {(appState.purchases||[]).filter(p => p.status==="pending").map(p => {
                  const stu = students.find(s => s.id === p.studentId);
                  const item = (appState.storeItems||[]).find(i => i.id === p.itemId);
                  return (
                    <div key={p.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#fff",borderRadius:12,marginBottom:8,border:"1.5px solid #f39c1244" }}>
                      <span style={{ fontSize:24 }}>{item?.emoji}</span>
                      <div style={{ flex:1,fontFamily:"'Nunito',sans-serif" }}>
                        <strong>{stu?.name}</strong> wants <strong>{item?.name}</strong>
                        <span style={{ color:"#e74c3c",marginLeft:8,fontFamily:"'Fredoka One',sans-serif" }}>{fmt(item?.price)}</span>
                      </div>
                      <button onClick={() => {
                        update(prev => ({
                          ...prev,
                          balances: { ...prev.balances, [p.studentId]: Math.max(0,(prev.balances[p.studentId]||0) - Math.round(item.price * 1.13)) },
                          txLog: [{ id:uuid(), studentId:p.studentId, amount:-Math.round(item.price * 1.13), reason:`Bought: ${item.name} (incl. 13% tax)`, date:todayStr() }, ...(prev.txLog||[])],
                          purchases: prev.purchases.map(x => x.id===p.id ? {...x, status:"approved"} : x),
                        }));
                        showToast(`✅ Approved ${stu?.name}'s purchase!`);
                      }} style={{ padding:"6px 14px",background:"#27ae60",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontFamily:"'Fredoka One',sans-serif",fontSize:14 }}>✅ Approve</button>
                      <button onClick={() => {
                        update(prev => ({ ...prev, purchases: prev.purchases.map(x => x.id===p.id ? {...x, status:"rejected"} : x) }));
                        showToast(`❌ Rejected`, "#e74c3c");
                      }} style={{ padding:"6px 14px",background:"#e74c3c",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontFamily:"'Fredoka One',sans-serif",fontSize:14 }}>❌ Reject</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Store items grid */}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:14,marginBottom:24 }}>
              {(appState.storeItems||[]).map(item => {
                const alreadyPending = (appState.purchases||[]).some(p => p.itemId===item.id && p.studentId===selected && p.status==="pending");
                const canAfford = selected && (balances[selected]||0) >= item.price;
                return (
                  <div key={item.id} style={{ background:"linear-gradient(135deg,#f9f9f9,#f0fbf4)",border:"2px solid #4B9B6E33",borderRadius:16,padding:16,textAlign:"center",position:"relative" }}>
                    {isTeacher === true && (
                      <button onClick={() => update(prev => ({ ...prev, storeItems: prev.storeItems.filter(i => i.id !== item.id) }))}
                        style={{ position:"absolute",top:6,right:8,background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#e74c3c" }}>✕</button>
                    )}
                    <div style={{ fontSize:36,marginBottom:6 }}>{item.emoji}</div>
                    <div style={{ fontWeight:800,fontSize:14,color:"#1a1a2e",marginBottom:4 }}>{item.name}</div>
                    <div style={{ fontSize:11,color:"#888",fontFamily:"'Nunito',sans-serif",marginBottom:8 }}>{item.type}</div>
                    <div style={{ background:billColour(item.price).bg,color:"#fff",borderRadius:20,padding:"4px 12px",fontSize:15,fontFamily:"'Fredoka One',sans-serif",display:"inline-block",marginBottom:4 }}>{fmt(item.price)}</div>
                    <div style={{ fontSize:10,color:"#888",fontFamily:"'Nunito',sans-serif",marginBottom:8 }}>+13% tax = {fmt(Math.round(item.price*1.13))}</div>
                    {isTeacher !== true && (
                      <button onClick={() => {
                        if (!selected) return showToast("Select a student first!", "#e74c3c");
                        if (!canAfford) return showToast("Not enough Dino Bucks!", "#e74c3c");
                        if (alreadyPending) return showToast("Already requested!", "#f39c12");
                        update(prev => ({ ...prev, purchases: [...(prev.purchases||[]), { id:uuid(), studentId:selected, itemId:item.id, status:"pending", date:todayStr() }] }));
                        showToast(`🛒 Request sent for ${item.name}!`, "#2471A3");
                      }} style={{ width:"100%",padding:"7px",background: alreadyPending?"#f39c12":canAfford?"#4B9B6E":"#ccc",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontFamily:"'Fredoka One',sans-serif",fontSize:13 }}>
                        {alreadyPending ? "⏳ Pending" : canAfford ? "🛒 Buy" : "Can't afford"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add item — teacher only */}
            {isTeacher === true && (
              <div style={{ background:"#f9f9f9",border:"2px dashed #4B9B6E77",borderRadius:14,padding:16,maxWidth:500 }}>
                <div style={{ fontSize:15,color:"#1a472a",marginBottom:10,fontWeight:700 }}>➕ Add Store Item</div>
                <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                  <input id="sEmoji" placeholder="🎁" maxLength={2} style={{ width:48,padding:"7px",borderRadius:8,border:"2px solid #4B9B6E",fontSize:20,textAlign:"center",outline:"none" }}/>
                  <input id="sName" placeholder="Item name" style={{ flex:2,minWidth:120,padding:"7px 11px",borderRadius:8,border:"2px solid #4B9B6E",fontSize:14,fontFamily:"'Nunito',sans-serif",outline:"none" }}/>
                  <input id="sPrice" type="number" placeholder="Price" style={{ width:80,padding:"7px",borderRadius:8,border:"2px solid #4B9B6E",fontSize:15,fontFamily:"'Fredoka One',sans-serif",outline:"none" }}/>
                  <select id="sType" style={{ padding:"7px",borderRadius:8,border:"2px solid #4B9B6E",fontSize:13,fontFamily:"'Nunito',sans-serif",outline:"none" }}>
                    <option value="privilege">Privilege</option>
                    <option value="experience">Experience</option>
                    <option value="physical">Physical</option>
                    <option value="social">Social</option>
                  </select>
                  <button onClick={() => {
                    const emoji = document.getElementById("sEmoji").value || "🎁";
                    const name  = document.getElementById("sName").value.trim();
                    const price = parseInt(document.getElementById("sPrice").value) || 10;
                    const type  = document.getElementById("sType").value;
                    if (!name) return showToast("Enter an item name!", "#e74c3c");
                    update(prev => ({ ...prev, storeItems: [...(prev.storeItems||[]), { id:uuid(), name, price, emoji, type }] }));
                    document.getElementById("sEmoji").value="";
                    document.getElementById("sName").value="";
                    document.getElementById("sPrice").value="";
                    showToast("Item added to store!");
                  }} style={{ padding:"7px 18px",background:"#4B9B6E",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:15,fontFamily:"'Fredoka One',sans-serif" }}>Add</button>
                </div>
              </div>
            )}

            {/* Student selector reminder */}
            {isTeacher !== true && !selected && (
              <div style={{ textAlign:"center",padding:"20px",background:"#f0fbf4",borderRadius:12,border:"2px solid #4B9B6E33",fontFamily:"'Nunito',sans-serif",color:"#666",fontSize:14 }}>
                👆 Go to the Class tab and click your dinosaur first, then come back to buy!
              </div>
            )}
          </div>
        )}
        {/* ═══ PLAY ═══ */}
        {tab==="play" && (
          <div style={{ padding:"0 0 40px" }}>
            <h2 style={{ fontSize:24, color:"#1a472a", margin:"0 0 8px", fontFamily:"'Fredoka One',sans-serif" }}>🎮 Dino Game Zone</h2>
            <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:"#555", marginBottom:20 }}>
              {studentUser ? `Daily earnings: ${fmt(appState?.gameEarnings?.[studentUser.id]?.[todayStr()] || 0)} / $10.00` : "Log in as a student to earn Dino Bucks!"}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:16 }}>
              {[
                { id:"runner",  name:"Dino Runner",  emoji:"🦕", desc:"Jump over obstacles!",  color:"#27ae60" },
                { id:"egg",     name:"Egg Drop",      emoji:"🥚", desc:"Catch falling eggs!",    color:"#e67e22" },
                { id:"memory",  name:"Memory Match",  emoji:"🧠", desc:"Match the dino pairs!",  color:"#8e44ad" },
                { id:"trivia",  name:"Dino Trivia",   emoji:"🦖", desc:"Answer dino questions!", color:"#2980b9" },
                { id:"digger",  name:"Bone Digger",   emoji:"🦴", desc:"Dig up bones in time!",  color:"#c0392b" },
              ].map(game => (
                <div key={game.id} onClick={() => setActiveGame(game.id)}
                  style={{ background:"#fff", borderRadius:20, padding:24, textAlign:"center", cursor:"pointer",
                    boxShadow:"0 4px 16px #0002", border:`2.5px solid ${game.color}33`,
                    transition:"transform 0.15s, box-shadow 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform="scale(1.04)"; e.currentTarget.style.boxShadow="0 8px 24px #0003"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; e.currentTarget.style.boxShadow="0 4px 16px #0002"; }}>
                  <div style={{ fontSize:48, marginBottom:10 }}>{game.emoji}</div>
                  <div style={{ fontFamily:"'Fredoka One',sans-serif", fontSize:18, color:game.color, marginBottom:6 }}>{game.name}</div>
                  <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:"#777" }}>{game.desc}</div>
                </div>
              ))}
            </div>
            {activeGame && (
              <div style={{ marginTop:24, background:"#fff", borderRadius:20, padding:24, boxShadow:"0 4px 16px #0002" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <h3 style={{ fontFamily:"'Fredoka One',sans-serif", fontSize:20, color:"#1a472a", margin:0 }}>
                    {activeGame==="runner"?"🦕 Dino Runner":activeGame==="egg"?"🥚 Egg Drop":activeGame==="memory"?"🧠 Memory Match":activeGame==="trivia"?"🦖 Dino Trivia":"🦴 Bone Digger"}
                  </h3>
                  <button onClick={() => setActiveGame(null)} style={{ padding:"6px 14px", background:"#eee", border:"none", borderRadius:8, cursor:"pointer", fontFamily:"'Fredoka One',sans-serif", fontSize:14 }}>✕ Close</button>
                </div>
                <GameArea game={activeGame} studentUser={studentUser} appState={appState} update={update} todayStr={todayStr} showToast={showToast} fmt={fmt}/>
              </div>
            )}
          </div>
        )}
        {/* ═══ SETTINGS ═══ */}
        {tab==="settings" && (
          <div style={{ maxWidth:540 }}>
            <h2 style={{ fontSize:26,color:"#1a472a",marginTop:0 }}>Settings ⚙️</h2>
            <div style={{ background:"#f0fbf4",borderRadius:16,padding:18,marginBottom:16 }}>
              <div style={{ fontWeight:800,color:"#1a472a",marginBottom:10,fontSize:16 }}>Students ({students.length})</div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8 }}>
                {students.map(s => {
                  const dino = DINOS.find(d => d.id === s.dinoId) || DINOS[0];
                  return (
                    <div key={s.id} style={{ background:"#fff",borderRadius:12,padding:"9px 11px",display:"flex",alignItems:"center",gap:9,border:"1.5px solid #4B9B6E22" }}>
                      <DinoSVG id={s.dinoId} c={dino.colour} size={34}/>
                      <div>
                        <div style={{ fontWeight:800,fontSize:12,fontFamily:"'Nunito',sans-serif" }}>{s.name}</div>
                        <div style={{ color:"#888",fontSize:11,fontFamily:"'Nunito',sans-serif" }}>{fmt(balances[s.id]||0)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ background:"#fff4f4",borderRadius:14,padding:18,border:"2px solid #ffcccc" }}>
              <div style={{ fontWeight:800,color:"#c0392b",marginBottom:8,fontSize:16 }}>⚠️ Danger Zone</div>
              <p style={{ color:"#666",fontSize:13,fontFamily:"'Nunito',sans-serif",margin:"0 0 12px" }}>Resets all balances and history. Cannot be undone.</p>
              {!showReset
                ? <button onClick={() => setShowReset(true)} style={{ padding:"8px 20px",background:"#e74c3c",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontFamily:"'Fredoka One',sans-serif",fontSize:15 }}>Reset Class</button>
                : <div style={{ display:"flex",gap:10 }}>
                    <button onClick={() => { const seed = SEED_STATE(); setAppState(seed); saveToFirebase(seed); setShowReset(false); showToast("Class reset!", "#e74c3c"); }}
                      style={{ padding:"8px 20px",background:"#c0392b",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontFamily:"'Fredoka One',sans-serif",fontSize:15 }}>Yes, Reset Everything</button>
                    <button onClick={() => setShowReset(false)} style={{ padding:"8px 20px",background:"#eee",color:"#333",border:"none",borderRadius:8,cursor:"pointer",fontFamily:"'Fredoka One',sans-serif",fontSize:15 }}>Cancel</button>
                  </div>
              }
            </div>
          </div>
        )}

        {/* ═══ INVEST ═══ */}
        {tab==="invest" && (
          <div style={{ padding:"0 0 40px" }}>
            <h2 style={{ fontSize:24, color:"#1a472a", margin:"0 0 16px", fontFamily:"'Fredoka One',sans-serif" }}>📈 Dino Stock Market</h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:16, marginBottom:32 }}>
              {DINO_STOCKS.map(stock => {
                const price = appState?.stockPrices?.[stock.id] ?? stock.startPrice;
                const change = ((price - stock.startPrice) / stock.startPrice * 100).toFixed(1);
                const portfolio = appState?.portfolios?.[selected]?.[stock.id] || 0;
                const portfolioValue = (portfolio * price).toFixed(2);
                const headline = appState?.stockNews?.[stock.id];
                return (
                  <div key={stock.id} style={{ background:"#fff", borderRadius:20, padding:20, boxShadow:"0 4px 16px #0003", border:"1.5px solid #f0f0f0" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:20 }}>{stock.emoji}</span>
                        <div>
                          <div style={{ fontFamily:"'Fredoka One',sans-serif", fontSize:16, color:"#1a472a" }}>{stock.name}</div>
                          <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, color:"#888" }}>{stock.description}</div>
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontFamily:"'Fredoka One',sans-serif", fontSize:26, color:stock.color }}>{fmt(price)}</div>
                        <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color: change >= 0 ? "#27ae60" : "#e74c3c", fontWeight:700 }}>
                          {change >= 0 ? "▲" : "▼"} {Math.abs(change)}%
                        </div>
                      </div>
                    </div>
                    {headline && (
                      <div style={{ background:"#f8f9fa", borderLeft:`4px solid ${stock.color}`, padding:"8px 12px", borderRadius:"0 8px 8px 0", marginBottom:10, fontFamily:"'Nunito',sans-serif", fontSize:12, color:"#555", fontStyle:"italic" }}>
                        {headline}
                      </div>
                    )}
                    {portfolio > 0 && (
                      <div style={{ background:"#f0fbf4", borderRadius:10, padding:"8px 12px", marginBottom:10, fontFamily:"'Nunito',sans-serif", fontSize:13 }}>
                        You own {portfolio.toFixed(4)} shares = {fmt(portfolioValue)}
                      </div>
                    )}
                    <div style={{ display:"flex", gap:8 }}>
                      <input id={`buy-${stock.id}`} type="number" placeholder="$ amount" min="1"
                        style={{ width:"70px", padding:"8px 10px", borderRadius:10, border:"2px solid #4B9B6E", fontFamily:"'Nunito',sans-serif", fontSize:14, outline:"none" }}/>
                      <button onClick={() => {
                        const amt = parseFloat(document.getElementById(`buy-${stock.id}`).value);
                        if (!amt || amt <= 0) return;
                        const bal = appState?.balances?.[selected] || 0;
                        if (amt > bal) { showToast("Not enough Dino Bucks!", "#e74c3c"); return; }
                        const shares = amt / price;
                        update(prev => ({
                          ...prev,
                          balances: { ...prev.balances, [selected]: Math.round(bal - amt) },
                          portfolios: { ...prev.portfolios, [selected]: { ...(prev.portfolios?.[selected] || {}), [stock.id]: (prev.portfolios?.[selected]?.[stock.id] || 0) + shares }},
                          txLog: [{ id:uuid(), studentId:selected, amount:-Math.round(amt), reason:`Bought ${stock.emoji} ${stock.name} shares`, date:todayStr() }, ...(prev.txLog||[])],
                        }));
                        document.getElementById(`buy-${stock.id}`).value = "";
                        showToast(`Bought ${stock.emoji} ${stock.name} shares!`);
                      }} style={{ padding:"8px 14px", background:"#27ae60", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontFamily:"'Fredoka One',sans-serif", fontSize:14 }}>Buy</button>
                      <button onClick={() => {
                        if (!portfolio || portfolio <= 0) { showToast("No shares to sell!", "#e74c3c"); return; }
                        const value = Math.round(portfolio * price);
                        update(prev => ({
                          ...prev,
                          balances: { ...prev.balances, [selected]: (prev.balances?.[selected] || 0) + value },
                          portfolios: { ...prev.portfolios, [selected]: { ...(prev.portfolios?.[selected] || {}), [stock.id]: 0 }},
                          txLog: [{ id:uuid(), studentId:selected, amount:value, reason:`Sold ${stock.emoji} ${stock.name} shares`, date:todayStr() }, ...(prev.txLog||[])],
                        }));
                        showToast(`Sold ${stock.emoji} ${stock.name} shares!`);
                      }} style={{ padding:"8px 14px", background:"#e74c3c", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontFamily:"'Fredoka One',sans-serif", fontSize:14 }}>Sell</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price History Chart */}
            <h3 style={{ fontSize:20, color:"#1a472a", margin:"0 0 12px", fontFamily:"'Fredoka One',sans-serif" }}>📊 Price History</h3>
            <div style={{ background:"#f8f9fa", borderRadius:20, padding:20, boxShadow:"0 4px 16px #0003", marginBottom:24, overflowX:"auto" }}>
              {(() => {
                const history = appState?.stockHistory || {};
                const dates = Object.keys(history).sort();
                if (dates.length < 2) return <div style={{ color:"#aaa", fontFamily:"'Nunito',sans-serif", textAlign:"center", padding:20 }}>Price history will appear after a few days of trading!</div>;
                const W = 600, H = 200, pad = 40;
                const allPrices = DINO_STOCKS.flatMap(s => dates.map(d => history[d]?.[s.id] ?? s.startPrice));
                const minP = Math.min(...allPrices) * 0.95;
                const maxP = Math.max(...allPrices) * 1.05;
                const x = i => pad + (i / (dates.length - 1)) * (W - pad * 2);
                const y = p => H - pad - ((p - minP) / (maxP - minP)) * (H - pad * 2);
                return (
                  <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", minWidth:300 }}>
                    {DINO_STOCKS.map(stock => {
                      const points = dates.map((d, i) => `${x(i)},${y(history[d]?.[stock.id] ?? stock.startPrice)}`).join(" ");
                      return <polyline key={stock.id} points={points} fill="none" stroke={stock.color} strokeWidth="2.5" strokeLinejoin="round"/>;
                    })}
                    {dates.map((d, i) => i % Math.ceil(dates.length / 5) === 0 && (
                      <text key={d} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#888">{d.slice(5)}</text>
                    ))}
                    {DINO_STOCKS.map((stock, i) => (
                      <g key={stock.id}>
                        <rect x={W - 130} y={10 + i * 22} width={12} height={12} fill={stock.color} rx={3}/>
                        <text x={W - 114} y={21 + i * 22} fontSize="11" fill="#333">{stock.emoji} {stock.name.split(" ")[0]}</text>
                      </g>
                    ))}
                  </svg>
                );
              })()}
            </div>

            {/* Investor Leaderboard */}
            <h3 style={{ fontSize:20, color:"#1a472a", margin:"0 0 12px", fontFamily:"'Fredoka One',sans-serif" }}>🏆 Investor Leaderboard</h3>
            <div style={{ background:"#f8f9fa", borderRadius:20, padding:20, boxShadow:"0 4px 16px #0003" }}>
              {(appState?.students || []).map(s => {
                const portfolio = appState?.portfolios?.[s.id] || {};
                const totalInvested = (appState?.txLog || []).filter(t => t.studentId === s.id && t.reason?.includes("Bought")).reduce((sum, t) => sum + Math.abs(t.amount), 0);
                const currentValue = DINO_STOCKS.reduce((sum, stock) => sum + (portfolio[stock.id] || 0) * (appState?.stockPrices?.[stock.id] ?? stock.startPrice), 0);
                const gain = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested * 100).toFixed(1) : null;
                return { ...s, gain, currentValue, totalInvested };
              }).filter(s => s.totalInvested > 0).sort((a, b) => b.gain - a.gain).map((s, i) => {
                const dino = DINOS.find(d => d.id === s.dinoId) || DINOS[0];
                return (
                  <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid #f0f0f0" }}>
                    <div style={{ fontFamily:"'Fredoka One',sans-serif", fontSize:20, color:"#1a472a", width:30 }}>#{i+1}</div>
                    <DinoSVG id={s.dinoId} c={dino.colour} size={36}/>
                    <div style={{ flex:1, fontFamily:"'Nunito',sans-serif" }}>
                      <div style={{ fontSize:14, fontWeight:700, color:"#333" }}>{s.name.split(" ")[0]}</div>
                      <div style={{ fontSize:12, color:"#888" }}>Invested: {fmt(s.totalInvested)} → {fmt(Math.round(s.currentValue))}</div>
                    </div>
                    <div style={{ fontFamily:"'Fredoka One',sans-serif", fontSize:20, color: s.gain >= 0 ? "#27ae60" : "#e74c3c" }}>
                      {s.gain >= 0 ? "▲" : "▼"}{Math.abs(s.gain)}%
                    </div>
                  </div>
                );
              })}
              {!(appState?.students || []).some(s => (appState?.txLog || []).some(t => t.studentId === s.id && t.reason?.includes("Bought"))) && (
                <div style={{ color:"#aaa", fontFamily:"'Nunito',sans-serif", textAlign:"center", padding:20 }}>No investors yet — buy some shares!</div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* DEDUCT MODAL */}
      {deductModal && selStudent && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9998 }}>
          <div style={{ background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:360,boxShadow:"0 12px 48px #0006",fontFamily:"'Fredoka One',sans-serif" }}>
            <h3 style={{ fontSize:22,color:"#c0392b",margin:"0 0 16px" }}>− Deduct from {selStudent.name.split(" ")[0]}</h3>
            <div style={{ fontFamily:"'Nunito',sans-serif",fontWeight:800,color:"#444",marginBottom:6 }}>Amount</div>
            <input type="number" value={deductAmt} onChange={e => setDeductAmt(e.target.value)} placeholder="5" autoFocus
              style={{ width:"100%",padding:"10px 14px",borderRadius:12,border:"3px solid #e74c3c",fontSize:22,fontFamily:"'Fredoka One',sans-serif",outline:"none",marginBottom:12 }}/>
            <div style={{ fontFamily:"'Nunito',sans-serif",fontWeight:800,color:"#444",marginBottom:6 }}>Reason</div>
            <input value={deductReason} onChange={e => setDeductReason(e.target.value)} placeholder="Reason for deduction"
              style={{ width:"100%",padding:"10px 14px",borderRadius:12,border:"3px solid #e74c3c",fontSize:15,fontFamily:"'Nunito',sans-serif",outline:"none",marginBottom:10 }}/>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:16 }}>
              {["Deduction","Late work","Lost materials","Disruptive behaviour","Fines"].map(r => (
                <button key={r} onClick={() => setDeductReason(r)}
                  style={{ padding:"4px 9px",background: deductReason===r?"#e74c3c":"#f5f5f5",color:deductReason===r?"#fff":"#333",border:"1.5px solid #e74c3c",borderRadius:7,cursor:"pointer",fontSize:11,fontFamily:"'Nunito',sans-serif" }}>{r}</button>
              ))}
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={() => {
                const a = parseInt(deductAmt||"0");
                if (a > 0) { addTx(selected, -a, deductReason); showToast(`-${fmt(a)} from ${selStudent.name}`, "#e74c3c"); }
                setDeductModal(false); setDeductAmt(""); setDeductReason("Deduction");
              }} style={{ flex:1,padding:"11px",background:"#e74c3c",color:"#fff",border:"none",borderRadius:12,cursor:"pointer",fontSize:18,fontFamily:"'Fredoka One',sans-serif" }}>− Deduct</button>
              <button onClick={() => { setDeductModal(false); setDeductAmt(""); setDeductReason("Deduction"); }}
                style={{ padding:"11px 18px",background:"#eee",color:"#333",border:"none",borderRadius:12,cursor:"pointer",fontSize:16,fontFamily:"'Fredoka One',sans-serif" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position:"fixed",bottom:34,left:"50%",transform:"translateX(-50%)",background:toast.colour||"#27ae60",color:"#fff",padding:"13px 34px",borderRadius:40,fontSize:19,fontFamily:"'Fredoka One',sans-serif",boxShadow:"0 8px 28px #0005",zIndex:9999,animation:"popUp 0.22s ease",whiteSpace:"nowrap" }}>
          {toast.msg}
        </div>
      )}
      <style>{`
        @keyframes popUp { from{opacity:0;transform:translateX(-50%) translateY(18px) scale(.92)} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </div>
  );
}
