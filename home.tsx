import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, useScroll, useTransform, useInView, animate, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Sector,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Brush, ReferenceLine
} from "recharts";
import {
  Sprout, Activity, BarChart3, Leaf, ArrowRight, Globe2, Sun,
  Droplets, TrendingUp, CheckCircle2, Star, Quote, Wheat,
  TreePine, Users, Eye, EyeOff, ChevronDown, ChevronUp,
  ArrowUpDown, Zap, Wind
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── palette ─────────────────────────────────────────── */
const G1 = "#3db870";
const G2 = "#1e6e42";
const BR = "#c47a3a";
const BR2 = "#8c5022";
const GD = "#f0b840";
const GD2 = "#d4921e";

/* ─── motion presets ──────────────────────────────────── */
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const fadeUp = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 15 } } };

/* ─── datasets ──────────────────────────────────────────  */
const ALL_PRODUCTIVITY = [
  { ano: "'19", convencional: 50, agroForte: 54 },
  { ano: "'20", convencional: 52, agroForte: 58 },
  { ano: "'21", convencional: 53, agroForte: 67 },
  { ano: "'22", convencional: 54, agroForte: 77 },
  { ano: "'23", convencional: 55, agroForte: 86 },
  { ano: "'24", convencional: 56, agroForte: 96 },
];

const CARBON_MONTHLY = [
  { mes: "Jan", captura: 38, meta: 30 },
  { mes: "Fev", captura: 14, meta: 12 },
  { mes: "Mar", captura: 16, meta: 14 },
  { mes: "Abr", captura: 11, meta: 12 },
  { mes: "Mai", captura: 12, meta: 13 },
  { mes: "Jun", captura: 14, meta: 13 },
  { mes: "Jul", captura: 13, meta: 14 },
  { mes: "Ago", captura: 12, meta: 13 },
  { mes: "Set", captura: 11, meta: 13 },
  { mes: "Out", captura: 14, meta: 14 },
  { mes: "Nov", captura: 7, meta: 13 },
  { mes: "Dez", captura: 12, meta: 13 },
];

const CARBON_CUMULATIVE = (() => {
  let rc = 0, rm = 0;
  return CARBON_MONTHLY.map(d => { rc += d.captura; rm += d.meta; return { mes: d.mes, captura: rc, meta: rm }; });
})();

const energyMix = [
  { name: "Solar", value: 58, color: GD,  detail: "150k MWh/ano", desc: "Painéis integrados às lavouras (agrivoltaico). Excedente vendido à rede." },
  { name: "Eólica", value: 22, color: G1, detail: "57k MWh/ano",  desc: "Turbinas de pequeno porte instaladas nos limites das propriedades." },
  { name: "Biomassa", value: 14, color: BR, detail: "36k MWh/ano", desc: "Resíduos de colheita convertidos em energia no próprio campo." },
  { name: "Rede", value: 6, color: "#5a5a5a", detail: "15k MWh/ano", desc: "Consumo residual da rede elétrica convencional, em redução constante." },
];

const techRadar = [
  { tech: "IoT", score: 96 },
  { tech: "Drones", score: 88 },
  { tech: "IA Preditiva", score: 92 },
  { tech: "Solo", score: 84 },
  { tech: "Satélite", score: 90 },
  { tech: "Blockchain", score: 78 },
];

const waterSavings = [
  { cultura: "Algodão", economia: 40, antes: 820, depois: 492 },
  { cultura: "Café",    economia: 38, antes: 660, depois: 409 },
  { cultura: "Soja",    economia: 35, antes: 540, depois: 351 },
  { cultura: "Milho",   economia: 29, antes: 480, depois: 341 },
  { cultura: "Cana",    economia: 26, antes: 1200, depois: 888 },
];

/* ─── animated counter ──────────────────────────────────  */
function Counter({ to, suffix = "", decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(0, to, { duration: 1.8, ease: [0.25, 0.1, 0.25, 1], onUpdate: v => setVal(parseFloat(v.toFixed(decimals))) });
    return ctrl.stop;
  }, [inView, to, decimals]);
  return <span ref={ref}>{val.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

/* ─── tooltip ────────────────────────────────────────────  */
function Tip({ active, payload, label, unit = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "linear-gradient(135deg,#0e1a10,#1a1008)", border: "1px solid #2d4020", boxShadow: "0 12px 40px rgba(0,0,0,0.7),0 0 0 1px rgba(61,184,112,0.08)" }}
      className="rounded-2xl px-5 py-4 text-sm min-w-[170px]">
      <p className="font-bold mb-3 text-xs uppercase tracking-widest" style={{ color: GD }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-xs" style={{ color: "#9aaa90" }}>{p.name}</span>
          </div>
          <span className="font-bold text-white text-sm">{typeof p.value === "number" ? p.value.toLocaleString("pt-BR") : p.value}{unit}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── glow card ──────────────────────────────────────────  */
function GlowCard({ children, className = "", accent = G1 }: { children: React.ReactNode; className?: string; accent?: string }) {
  return (
    <div className={`relative rounded-3xl overflow-hidden ${className}`}
      style={{ background: "linear-gradient(145deg,#0d1a10,#120e06)", border: "1px solid rgba(61,184,112,0.15)", boxShadow: "0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.04)" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${accent}55,transparent)` }} />
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase mb-5" style={{ color: GD2 }}>
      <span className="w-4 h-px" style={{ background: GD2 }} />{children}<span className="w-4 h-px" style={{ background: GD2 }} />
    </span>
  );
}

/* ─── filter pill button ─────────────────────────────────  */
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
      style={{ background: active ? G1 : "rgba(61,184,112,0.08)", color: active ? "#000" : "#5a8a60", border: `1px solid ${active ? G1 : "rgba(61,184,112,0.2)"}` }}>
      {children}
    </button>
  );
}

/* ─── active donut shape ─────────────────────────────────  */
function ActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill={fill} style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 22 }}>
        {payload.value}%
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="#7a8a70" style={{ fontSize: 12 }}>
        {payload.name}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 10} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 14} outerRadius={outerRadius + 17} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
}

/* ═══════════════════════════════════════════════════════   */
export default function Home() {
  const { scrollYProgress } = useScroll();
  const yHero = useTransform(scrollYProgress, [0, 0.35], ["0%", "28%"]);
  const [scrolled, setScrolled] = useState(false);

  /* productivity */
  const [prodRange, setProdRange] = useState<"all" | "3y" | "2y">("all");
  const [hideSeries, setHideSeries] = useState<Record<string, boolean>>({});
  const prodData = prodRange === "all" ? ALL_PRODUCTIVITY : prodRange === "3y" ? ALL_PRODUCTIVITY.slice(-4) : ALL_PRODUCTIVITY.slice(-3);

  /* carbon */
  const [carbonView, setCarbonView] = useState<"acumulado" | "mensal">("acumulado");
  const carbonData = carbonView === "acumulado" ? CARBON_CUMULATIVE : CARBON_MONTHLY;

  /* water */
  const [activeWater, setActiveWater] = useState<number | null>(null);
  const [waterSort, setWaterSort] = useState<"desc" | "asc">("desc");
  const sortedWater = [...waterSavings].sort((a, b) => waterSort === "desc" ? b.economia - a.economia : a.economia - b.economia);

  /* donut */
  const [activeSlice, setActiveSlice] = useState<number | null>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const toggleSeries = (key: string) => setHideSeries(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-50 px-6 md:px-14 py-4 flex items-center justify-between transition-all duration-500 ${scrolled ? "border-b" : ""}`}
        style={{ background: scrolled ? "rgba(10,12,8,0.92)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderColor: "#1e2a18" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#3db870,#1e6e42)" }}>
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <span style={{ fontFamily: "'Space Grotesk'", color: "#e8ddc8", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>Agro Forte</span>
        </div>
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium" style={{ color: "#7a8a70" }}>
          {[["#resultados","Resultados"],["#tecnologia","Tecnologia"],["#agua","Água"],["#energia","Energia"],["#carbono","Carbono"]].map(([href,label]) => (
            <a key={href} href={href} className="hover:text-white transition-colors">{label}</a>
          ))}
        </nav>
      </header>

      {/* HERO */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: yHero }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(to bottom,rgba(0,0,0,0.62) 0%,rgba(8,14,8,0.3) 60%,#0a0c08 100%)" }} />
          <img src="/images/hero.png" alt="Campo agrícola" className="w-full h-full object-cover" />
        </motion.div>
        <div className="container relative z-20 px-6 md:px-14 text-center max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-10 text-xs font-bold tracking-widest uppercase"
            style={{ background: "rgba(240,184,64,0.15)", border: "1px solid rgba(240,184,64,0.35)", color: GD }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GD }} />
            Tecnologia & Preservação Ambiental
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 1 }}
            style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 0.9 }}
            className="text-5xl md:text-[80px] lg:text-[100px] mb-8 text-white drop-shadow-2xl">
            Força que <br />
            <span style={{ fontFamily: "'Instrument Serif',serif", fontStyle: "italic", color: GD, fontWeight: 400 }}>Transforma</span>
            <br />a Terra.
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.8 }}
            className="text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
            IoT, inteligência artificial e práticas regenerativas unidas para cultivar um futuro onde produtividade e preservação caminham juntas.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="rounded-full px-10 h-14 text-base font-bold"
              style={{ background: "linear-gradient(135deg,#3db870,#1e6e42)", color: "white", boxShadow: "0 8px 32px rgba(61,184,112,0.4)" }}>
              Descubra a Revolução <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-10 h-14 font-semibold"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}>
              Ver os Dados
            </Button>
          </motion.div>
        </div>
        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
          animate={{ y: [0,10,0] }} transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}>
          <div className="w-6 h-10 rounded-full flex items-start justify-center pt-2"
            style={{ border: "2px solid rgba(255,255,255,0.3)" }}>
            <div className="w-1.5 h-3 rounded-full" style={{ background: "rgba(255,255,255,0.5)" }} />
          </div>
        </motion.div>
      </section>

      {/* STATS BAR */}
      <section style={{ background: "#060a06", borderBottom: "1px solid #1a2418" }} className="py-12">
        <div className="container px-6 md:px-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { to: 1200, suffix: "+", label: "Propriedades Atendidas", icon: <Users className="w-4 h-4" /> },
              { to: 40,   suffix: "M ha", label: "Hectares Monitorados",  icon: <Globe2 className="w-4 h-4" /> },
              { to: 38,   suffix: "%",    label: "Mais Produtividade",     icon: <TrendingUp className="w-4 h-4" /> },
              { to: 850,  suffix: "k t",  label: "CO₂ Sequestrado",        icon: <TreePine className="w-4 h-4" /> },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="flex items-center justify-center gap-1.5 mb-2" style={{ color: GD2 }}>
                  {s.icon}
                  <span className="text-xs font-bold tracking-wider uppercase" style={{ color: GD2 }}>{s.label}</span>
                </div>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 40, color: G1, letterSpacing: "-0.03em", lineHeight: 1 }}>
                  <Counter to={s.to} suffix={s.suffix} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CHART 1 — Produtividade interativa ══ */}
      <section className="py-28" style={{ background: "#0a0c08" }} id="resultados">
        <div className="container px-6 md:px-14">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={stagger}
            className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            <motion.div variants={fadeUp}>
              <Label>Produtividade Real</Label>
              <h2 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 48, letterSpacing: "-0.04em", color: "#e8ddc8", lineHeight: 1.05 }} className="mb-6">
                Até <span style={{ color: G1 }}>+85%</span> mais<br />produção por hectare
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: "#7a8a70" }}>
                Comparativo anual entre manejo convencional e fazendas parceiras. Clique nas legendas para mostrar ou ocultar cada série. Use os filtros de período para focar nos dados mais recentes.
              </p>
              {/* interactive legends */}
              <div className="flex flex-wrap gap-3 mb-2">
                {[{ key: "agroForte", c: G1, label: "Agro Forte" }, { key: "convencional", c: "#4a6a40", label: "Convencional" }].map(l => (
                  <button key={l.key} onClick={() => toggleSeries(l.key)}
                    className="flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                    style={{ background: hideSeries[l.key] ? "rgba(255,255,255,0.04)" : `${l.c}18`, border: `1px solid ${hideSeries[l.key] ? "#2a2a2a" : l.c}55`, color: hideSeries[l.key] ? "#4a4a4a" : "#c8d8c0" }}>
                    {hideSeries[l.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" style={{ color: l.c }} />}
                    <div className="w-5 h-1.5 rounded-full" style={{ background: hideSeries[l.key] ? "#333" : l.c }} />
                    {l.label}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp}>
              <GlowCard className="p-6" accent={G1}>
                {/* period filter */}
                <div className="flex items-center justify-between mb-5">
                  <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4a6a50" }}>Sacas / hectare</p>
                  <div className="flex gap-1.5">
                    {([["all","Tudo"],["3y","3 anos"],["2y","2 anos"]] as const).map(([k,l]) => (
                      <Pill key={k} active={prodRange === k} onClick={() => setProdRange(k)}>{l}</Pill>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={prodData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gAF" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={G1} stopOpacity={0.55} />
                        <stop offset="100%" stopColor={G1} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gCV" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4a5a40" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#4a5a40" stopOpacity={0.02} />
                      </linearGradient>
                      <filter id="glow1"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#1e2a18" vertical={false} />
                    <XAxis dataKey="ano" tick={{ fill: "#4a6a50", fontSize: 13, fontFamily: "Space Grotesk" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[40, 110]} tick={{ fill: "#4a6a50", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip unit=" sc/ha" />} cursor={{ stroke: "rgba(61,184,112,0.2)", strokeWidth: 1 }} />
                    {!hideSeries.convencional && (
                      <Area type="monotone" dataKey="convencional" name="Convencional" stroke="#4a6a40" strokeWidth={2}
                        fill="url(#gCV)" dot={false} activeDot={{ r: 6, fill: "#4a6a40", strokeWidth: 0 }} />
                    )}
                    {!hideSeries.agroForte && (
                      <Area type="monotone" dataKey="agroForte" name="Agro Forte" stroke={G1} strokeWidth={2.5}
                        fill="url(#gAF)" filter="url(#glow1)"
                        dot={false} activeDot={{ r: 8, fill: G1, strokeWidth: 0, style: { filter: `drop-shadow(0 0 8px ${G1})` } }} />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
                <p className="text-xs mt-3 text-center" style={{ color: "#2e3e28" }}>Clique nas legendas acima para mostrar/ocultar séries</p>
              </GlowCard>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* IMAGE — IoT */}
      <section className="relative h-[56vh] overflow-hidden" id="tecnologia">
        <img src="/images/iot.png" alt="Sensor IoT em campo" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,rgba(0,0,0,0.78) 40%,transparent)" }} />
        <div className="absolute inset-0 flex items-center">
          <div className="container px-6 md:px-14">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.9 }} className="max-w-lg">
              <Label>IoT + Inteligência Artificial</Label>
              <h2 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 52, letterSpacing: "-0.04em", color: "white", lineHeight: 1.0 }} className="mb-6">
                A Natureza<br /><span style={{ fontFamily: "'Instrument Serif',serif", fontStyle: "italic", color: GD, fontWeight: 400 }}>Conectada.</span>
              </h2>
              <ul className="space-y-3">
                {["2,4 milhões de pontos de dados coletados por dia","Detecção de pragas 72h antes do olho humano","Drones multiespectrais com mapeamento NDVI","Alertas em tempo real via app no celular"].map((t, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium" style={{ color: "rgba(255,255,255,0.82)" }}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: G1 }} /> {t}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ CHART 2 — Água com hover de destaque ══ */}
      <section className="py-28" style={{ background: "#080a06" }} id="agua">
        <div className="container px-6 md:px-14">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            <motion.div variants={fadeUp}>
              <GlowCard className="p-6" accent={BR}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#6a5a40" }}>Economia Hídrica por Cultura</p>
                  <button onClick={() => setWaterSort(s => s === "desc" ? "asc" : "desc")}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                    style={{ background: "rgba(196,122,58,0.12)", color: BR, border: "1px solid rgba(196,122,58,0.25)" }}>
                    <ArrowUpDown className="w-3 h-3" />
                    {waterSort === "desc" ? "Maior → Menor" : "Menor → Maior"}
                  </button>
                </div>
                <p className="text-xs mb-6" style={{ color: "#4a3a28" }}>Clique em uma cultura para ver os detalhes</p>

                <div className="space-y-4">
                  {sortedWater.map((w, i) => {
                    const isActive = activeWater === i;
                    return (
                      <motion.div key={w.cultura} layout onClick={() => setActiveWater(isActive ? null : i)}
                        className="rounded-2xl p-3 cursor-pointer transition-all"
                        style={{ background: isActive ? "rgba(196,122,58,0.1)" : "transparent", border: `1px solid ${isActive ? "rgba(196,122,58,0.35)" : "transparent"}` }}>
                        <div className="flex justify-between text-sm mb-2">
                          <span style={{ color: isActive ? "#e8d0a0" : "#c8b890", fontWeight: 600 }}>{w.cultura}</span>
                          <span style={{ color: GD, fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 16 }}>{w.economia}%</span>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden" style={{ background: "#161008" }}>
                          <motion.div
                            initial={{ width: 0 }} whileInView={{ width: `${w.economia * 2.5}%` }}
                            viewport={{ once: true }} transition={{ duration: 1.1, delay: i * 0.1 }}
                            className="h-full rounded-full relative overflow-hidden"
                            style={{ background: isActive ? `linear-gradient(90deg,${BR2},${BR},${GD})` : `linear-gradient(90deg,${BR2}88,${BR}88,${GD}88)` }}>
                            <div className="absolute inset-0 opacity-40"
                              style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)" }} />
                          </motion.div>
                        </div>
                        <AnimatePresence>
                          {isActive && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden">
                              <div className="grid grid-cols-2 gap-3 mt-4 pt-3" style={{ borderTop: "1px solid rgba(196,122,58,0.2)" }}>
                                <div className="text-center">
                                  <div className="text-xs mb-1" style={{ color: "#6a5a40" }}>Antes</div>
                                  <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 20, color: "#8a6a50" }}>{w.antes} L/kg</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs mb-1" style={{ color: "#6a5a40" }}>Com Agro Forte</div>
                                  <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 20, color: GD }}>{w.depois} L/kg</div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </GlowCard>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Label>Gestão Hídrica Inteligente</Label>
              <h2 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 48, letterSpacing: "-0.04em", color: "#e8ddc8", lineHeight: 1.05 }} className="mb-6">
                Cada gota no <br /><span style={{ fontFamily: "'Instrument Serif',serif", fontStyle: "italic", color: G1, fontWeight: 400 }}>lugar certo.</span>
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: "#7a8a70" }}>
                Sensores de umidade do solo combinados com previsão climática hiperlocal. Irrigação apenas quando a planta precisa — sem desperdício, sem deficiência.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[{ v:"42%",l:"Menos energia elétrica"},{v:"3x",l:"Ciclos mais precisos"},{v:"0%",l:"Runoff desperdiçado"},{v:"28%",l:"Mais retenção no solo"}].map((s,i) => (
                  <div key={i} className="rounded-2xl p-4" style={{ background:"rgba(61,184,112,0.06)",border:"1px solid rgba(61,184,112,0.15)" }}>
                    <div style={{ fontFamily:"'Space Grotesk'",fontWeight:700,fontSize:28,color:G1,letterSpacing:"-0.03em" }}>{s.v}</div>
                    <div className="text-xs mt-1" style={{ color:"#5a7a60" }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* IMAGE — Solo */}
      <section className="relative h-[58vh] overflow-hidden">
        <img src="/images/soil.png" alt="Solo fértil" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(270deg,rgba(0,0,0,0.75) 35%,transparent)" }} />
        <div className="absolute inset-0 flex items-center justify-end">
          <div className="container px-6 md:px-14 flex justify-end">
            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.9 }} className="max-w-lg text-right">
              <Label>Agricultura Regenerativa</Label>
              <h2 style={{ fontFamily:"'Space Grotesk'",fontWeight:700,fontSize:52,letterSpacing:"-0.04em",color:"white",lineHeight:1.0 }} className="mb-5">
                O Solo é o<br /><span style={{ fontFamily:"'Instrument Serif',serif",fontStyle:"italic",color:GD,fontWeight:400 }}>maior patrimônio.</span>
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>
                Plantio direto, cobertura morta e biofertilizantes. Matéria orgânica cresce em média 12% nas propriedades parceiras em 3 anos.
              </p>
              <div className="flex justify-end gap-3 flex-wrap">
                {[["-50%","Erosão"],["+3x","Biodiversidade"],["-35%","Defensivos"],["+12%","Mat. Orgânica"]].map(([v,l],i) => (
                  <div key={i} className="rounded-2xl px-4 py-3 text-center"
                    style={{ background:"rgba(0,0,0,0.4)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.12)" }}>
                    <div style={{ fontFamily:"'Space Grotesk'",fontWeight:700,fontSize:20,color:GD }}>{v}</div>
                    <div className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.5)" }}>{l}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ CHART 3 — Carbono com toggle + brush ══ */}
      <section className="py-28" style={{ background: "#0a0c08" }} id="carbono">
        <div className="container px-6 md:px-14">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center max-w-2xl mx-auto mb-16">
              <Label>Créditos de Carbono</Label>
              <h2 style={{ fontFamily:"'Space Grotesk'",fontWeight:700,fontSize:52,letterSpacing:"-0.04em",color:"#e8ddc8",lineHeight:1.05 }} className="mb-5">
                Preservar é <span style={{ fontFamily:"'Instrument Serif',serif",fontStyle:"italic",color:G1,fontWeight:400 }}>Lucrar.</span>
              </h2>
              <p className="text-base leading-relaxed" style={{ color: "#7a8a70" }}>
                Captura de CO₂ em 2024 — real vs. meta. Superamos a meta em todos os meses do ano.
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <GlowCard className="p-6 mb-10" accent={G1}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  {/* toggle view */}
                  <div className="flex gap-1.5">
                    {([["acumulado","Acumulado"],["mensal","Mensal"]] as const).map(([k,l]) => (
                      <Pill key={k} active={carbonView === k} onClick={() => setCarbonView(k)}>{l}</Pill>
                    ))}
                  </div>
                  {/* legend */}
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                      <div className="w-6" style={{ height:3,background:G1,borderRadius:2,boxShadow:`0 0 6px ${G1}` }} />
                      <span className="text-xs font-semibold" style={{ color:G1 }}>Real</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 border-t-2 border-dashed" style={{ borderColor:GD }} />
                      <span className="text-xs font-semibold" style={{ color:GD }}>Meta</span>
                    </div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={340}>
                  <AreaChart data={carbonData} margin={{ top:10,right:10,left:-15,bottom:30 }}>
                    <defs>
                      <linearGradient id="gCarbon" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={G1} stopOpacity={0.55} />
                        <stop offset="100%" stopColor={G1} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gMeta" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={GD} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={GD} stopOpacity={0.02} />
                      </linearGradient>
                      <filter id="glowC"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#1e2a18" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fill:"#4a6a50",fontSize:12,fontFamily:"Space Grotesk" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:"#4a6a50",fontSize:12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip unit={carbonView === "acumulado" ? "k t acum." : "k t"} />}
                      cursor={{ stroke:"rgba(61,184,112,0.15)",strokeWidth:1 }} />
                    <Area type="monotone" dataKey="meta" name="Meta" stroke={GD} strokeWidth={1.5} strokeDasharray="6 4"
                      fill="url(#gMeta)" dot={false} activeDot={{ r:5,fill:GD,strokeWidth:0 }} />
                    <Area type="monotone" dataKey="captura" name="Real" stroke={G1} strokeWidth={3}
                      fill="url(#gCarbon)" filter="url(#glowC)"
                      dot={false} activeDot={{ r:8,fill:G1,strokeWidth:0,style:{ filter:`drop-shadow(0 0 10px ${G1})` } }} />
                    {/* brush for timeline scrub */}
                    <Brush dataKey="mes" height={24} y={305} travellerWidth={8}
                      stroke="#2a3a28" fill="#0a1008" travellerStroke={G1}
                      style={{ fontSize:11 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <p className="text-xs text-center mt-1" style={{ color:"#2a3a28" }}>
                  Arraste as alças abaixo do gráfico para focar em um período específico
                </p>
              </GlowCard>
            </motion.div>

            <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { icon:<Leaf className="w-6 h-6"/>,title:"Certificação REDD+",v:"R$127/t",vl:"Preço médio 2025",desc:"Apoio completo da análise até a venda em Verra e Gold Standard." },
                { icon:<TreePine className="w-6 h-6"/>,title:"Reflorestamento Produtivo",v:"3,2M ha",vl:"Em restauração",desc:"Sistemas agroflorestais que geram créditos e madeira certificada." },
                { icon:<BarChart3 className="w-6 h-6"/>,title:"MRV Digital",v:"98.5%",vl:"Precisão nos relatórios",desc:"Monitoramento, Reporte e Verificação automatizados com satélite." },
              ].map((c, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <GlowCard className="p-6 h-full" accent={G2}>
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5" style={{ background:"rgba(61,184,112,0.12)",color:G1 }}>{c.icon}</div>
                    <h3 style={{ fontFamily:"'Space Grotesk'",fontWeight:700,fontSize:18,color:"#e8ddc8" }} className="mb-2">{c.title}</h3>
                    <p className="text-sm leading-relaxed mb-5" style={{ color:"#5a7a60" }}>{c.desc}</p>
                    <div style={{ borderTop:"1px solid #1e2a18" }} className="pt-4">
                      <div style={{ fontFamily:"'Space Grotesk'",fontWeight:700,fontSize:26,color:GD,letterSpacing:"-0.03em" }}>{c.v}</div>
                      <div className="text-xs mt-0.5" style={{ color:"#4a5a40" }}>{c.vl}</div>
                    </div>
                  </GlowCard>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* IMAGE — Energia */}
      <section className="relative h-[52vh] overflow-hidden" id="energia">
        <img src="/images/renewable.png" alt="Painéis solares" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background:"rgba(0,0,0,0.62)" }} />
        <div className="absolute inset-0 flex items-center justify-center text-center text-white">
          <motion.div initial={{ opacity:0,y:40 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ duration:0.9 }}>
            <Sun className="w-12 h-12 mx-auto mb-4" style={{ color:GD,filter:`drop-shadow(0 0 20px ${GD})` }} />
            <h2 style={{ fontFamily:"'Space Grotesk'",fontWeight:700,fontSize:60,letterSpacing:"-0.04em",lineHeight:1.0 }}>
              Energia Limpa,<br />
              <span style={{ fontFamily:"'Instrument Serif',serif",fontStyle:"italic",color:GD,fontWeight:400 }}>Safra Poderosa.</span>
            </h2>
          </motion.div>
        </div>
      </section>

      {/* ══ CHART 4 — Donut clicável + Radar ══ */}
      <section className="py-28" style={{ background:"#080a06" }}>
        <div className="container px-6 md:px-14">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* Donut interativo */}
            <motion.div variants={fadeUp}>
              <GlowCard className="p-6 h-full" accent={GD}>
                <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color:"#6a6a40" }}>Matriz Energética — Clique em uma fatia</p>
                <p className="text-xs mb-4" style={{ color:"#4a4a30" }}>94% de fontes renováveis nas fazendas parceiras</p>

                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={energyMix} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                      paddingAngle={3} dataKey="value" stroke="none"
                      activeIndex={activeSlice ?? undefined}
                      activeShape={<ActiveShape />}
                      onMouseEnter={(_, idx) => setActiveSlice(idx)}
                      onMouseLeave={() => setActiveSlice(null)}
                      onClick={(_, idx) => setActiveSlice(activeSlice === idx ? null : idx)}>
                      {energyMix.map((e, i) => <Cell key={i} fill={e.color} style={{ cursor:"pointer" }} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`${v}%`]}
                      contentStyle={{ background:"#0e1a10",border:"1px solid #2d4020",borderRadius:12,color:"#e8ddc8",fontSize:12 }} />
                  </PieChart>
                </ResponsiveContainer>

                {/* detail panel */}
                <AnimatePresence mode="wait">
                  {activeSlice !== null ? (
                    <motion.div key={activeSlice} initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }}
                      transition={{ duration:0.2 }} className="mt-4 p-4 rounded-2xl"
                      style={{ background:`${energyMix[activeSlice].color}12`,border:`1px solid ${energyMix[activeSlice].color}30` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm" style={{ color:energyMix[activeSlice].color }}>{energyMix[activeSlice].name}</span>
                        <span style={{ fontFamily:"'Space Grotesk'",fontWeight:700,fontSize:20,color:energyMix[activeSlice].color }}>{energyMix[activeSlice].detail}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color:"#6a7a60" }}>{energyMix[activeSlice].desc}</p>
                    </motion.div>
                  ) : (
                    <motion.div key="default" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                      className="mt-4 space-y-2.5">
                      {energyMix.map((e, i) => (
                        <div key={i} className="flex items-center justify-between cursor-pointer px-2 py-1 rounded-lg transition-all hover:bg-white/5"
                          onClick={() => setActiveSlice(i)}>
                          <div className="flex items-center gap-2.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background:e.color }} />
                            <span className="text-sm font-medium" style={{ color:"#9aaa90" }}>{e.name}</span>
                          </div>
                          <span style={{ fontFamily:"'Space Grotesk'",fontWeight:700,fontSize:14,color:e.color }}>{e.value}%</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlowCard>
            </motion.div>

            {/* Radar */}
            <motion.div variants={fadeUp}>
              <GlowCard className="p-6 h-full" accent={G1}>
                <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color:"#4a6a50" }}>Índice de Capacidade Tecnológica</p>
                <p className="text-xs mb-2" style={{ color:"#3a4a38" }}>Score 0–100 — passe o mouse sobre cada vértice</p>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={techRadar} cx="50%" cy="50%" outerRadius={100}>
                    <PolarGrid stroke="#1e2a18" />
                    <PolarAngleAxis dataKey="tech"
                      tick={{ fill:"#6a8a70",fontSize:12,fontFamily:"Space Grotesk",fontWeight:600 }} />
                    <Radar name="Score" dataKey="score" stroke={G1} strokeWidth={2}
                      fill={G1} fillOpacity={0.18}
                      dot={{ fill:G1,strokeWidth:0,r:4 }}
                      activeDot={{ r:7,fill:GD,strokeWidth:0,style:{ filter:`drop-shadow(0 0 8px ${GD})` } }} />
                    <Tooltip content={<Tip unit="/100" />} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-8 mt-2">
                  {[{ v:"92",l:"Score médio" },{ v:"6",l:"Tecnologias ativas" }].map((s,i) => (
                    <div key={i} className="text-center">
                      <div style={{ fontFamily:"'Space Grotesk'",fontWeight:700,fontSize:26,color:G1 }}>{s.v}</div>
                      <div className="text-xs" style={{ color:"#4a6a50" }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </GlowCard>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* IMAGE — Floresta */}
      <section className="relative h-[44vh] overflow-hidden">
        <img src="/images/forest.png" alt="Floresta e fazenda" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background:"linear-gradient(to top,#080a06 0%,transparent 60%)" }} />
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24" style={{ background:"#080a06",borderTop:"1px solid #141a10" }}>
        <div className="container px-6 md:px-14">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-14">
              <Label>Casos Reais</Label>
              <h2 style={{ fontFamily:"'Space Grotesk'",fontWeight:700,fontSize:42,letterSpacing:"-0.04em",color:"#e8ddc8" }}>
                O que nossos produtores dizem
              </h2>
            </motion.div>
            <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { q:"Reduzi a conta de energia em 40% e aumentei a produção de soja em dois talhões. Em dois anos, a plataforma se pagou três vezes.",a:"Carlos Mendonça",r:"Soja — Mato Grosso" },
                { q:"Meus créditos de carbono geraram renda extra que nunca esperava ter. A Agro Forte cuidou de tudo: certificação, venda e relatórios.",a:"Ana Paula Reisman",r:"Café — Minas Gerais" },
                { q:"O sistema me avisou de uma praga 4 dias antes de eu ver qualquer sintoma. Economizei 60% no custo de defensivo nessa safra.",a:"Roberto Salave",r:"Algodão — Bahia" },
              ].map((t, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <GlowCard className="p-6 h-full" accent={G2}>
                    <div className="flex gap-1 mb-4">
                      {Array.from({length:5}).map((_,j) => <Star key={j} className="w-3.5 h-3.5" style={{ fill:GD,color:GD }} />)}
                    </div>
                    <Quote className="w-6 h-6 mb-3" style={{ color:"rgba(61,184,112,0.25)" }} />
                    <p className="text-sm leading-relaxed mb-6 italic" style={{ color:"#7a8a70" }}>"{t.q}"</p>
                    <div>
                      <div className="font-bold text-sm" style={{ color:"#c8b890" }}>{t.a}</div>
                      <div className="text-xs mt-0.5" style={{ color:"#4a5a40" }}>{t.r}</div>
                    </div>
                  </GlowCard>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-36 relative overflow-hidden"
        style={{ background:"linear-gradient(135deg,#0e200e 0%,#1a1408 50%,#0a1808 100%)" }}>
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{ backgroundImage:"radial-gradient(circle at center,#fff 1px,transparent 1px)",backgroundSize:"30px 30px" }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px"
          style={{ background:`linear-gradient(90deg,transparent,${G1},transparent)` }} />
        <div className="container relative z-10 px-6 md:px-14 text-center">
          <motion.div initial={{ opacity:0,scale:0.94 }} whileInView={{ opacity:1,scale:1 }}
            viewport={{ once:true }} transition={{ duration:0.8 }} className="max-w-3xl mx-auto">
            <Wheat className="w-12 h-12 mx-auto mb-8" style={{ color:GD,opacity:0.7,filter:`drop-shadow(0 0 16px ${GD})` }} />
            <h2 style={{ fontFamily:"'Space Grotesk'",fontWeight:700,fontSize:64,letterSpacing:"-0.04em",color:"#e8ddc8",lineHeight:1.0 }} className="mb-6">
              Faça Parte do<br />
              <span style={{ fontFamily:"'Instrument Serif',serif",fontStyle:"italic",color:G1,fontWeight:400 }}>Futuro Sustentável.</span>
            </h2>
            <p className="text-lg mb-3 max-w-xl mx-auto" style={{ color:"#7a8a70" }}>
              Junte-se a mais de 1.200 produtores que transformaram suas propriedades.
            </p>
            <p className="text-sm mb-12" style={{ color:"#4a5a40" }}>Diagnóstico gratuito. Sem compromisso. Retorno em até 24 horas úteis.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="rounded-full px-10 h-14 text-base font-bold"
                style={{ background:`linear-gradient(135deg,${G1},${G2})`,color:"white",boxShadow:`0 8px 40px rgba(61,184,112,0.35)` }}>
                Iniciar Minha Jornada <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-10 h-14 font-semibold"
                style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.12)",color:"#9aaa90" }}>
                Ver Casos de Sucesso
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:"#040604",borderTop:"1px solid #0e1208" }} className="py-14">
        <div className="container px-6 md:px-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"linear-gradient(135deg,#3db870,#1e6e42)" }}>
                  <Sprout className="w-5 h-5 text-white" />
                </div>
                <span style={{ fontFamily:"'Space Grotesk'",fontWeight:700,fontSize:18,color:"#e8ddc8",letterSpacing:"-0.02em" }}>Agro Forte</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm" style={{ color:"#3a4a38" }}>
                Tecnologia e preservação ambiental unidas para construir o agronegócio do futuro. Desde 2019.
              </p>
            </div>
            {[
              { h:"Soluções",links:["Agricultura de Precisão","IoT e Sensores","Créditos de Carbono","Energia Solar","Análise de Solo"] },
              { h:"Empresa",links:["Sobre Nós","Impacto ESG","Carreiras","Imprensa","Contato"] }
            ].map((col,i) => (
              <div key={i}>
                <h4 className="font-bold mb-4 text-xs tracking-widest uppercase" style={{ color:"#4a5a40" }}>{col.h}</h4>
                <ul className="space-y-2.5 text-sm">
                  {col.links.map(l => <li key={l}><a href="#" className="transition-colors hover:text-white" style={{ color:"#3a4a38" }}>{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid #0e1208",color:"#2a3228" }} className="pt-7 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <p>&copy; {new Date().getFullYear()} Agro Forte Tecnologias Sustentáveis Ltda.</p>
            <div className="flex gap-5">
              {["Privacidade","Termos","LGPD"].map(l => <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
