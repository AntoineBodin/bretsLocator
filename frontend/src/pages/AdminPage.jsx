import React, { useState, useEffect, useCallback } from 'react';
import { fontStack, colors } from "../components/styleTokens";
import { fetchAdminConnections, fetchAdminUpdateLogs, fetchAdminConnectionStats } from "../utils/api";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connections, setConnections] = useState({ total: 0, recent: [] });
  const [logs, setLogs] = useState([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [interval, setIntervalRange] = useState('5m');
  const [stats, setStats] = useState([]);

  const loadData = useCallback(async (pwd) => {
    setLoading(true); setError(null);
    try {
      const [conn, upd, statsRows] = await Promise.all([
        fetchAdminConnections(pwd),
        fetchAdminUpdateLogs(pwd),
        fetchAdminConnectionStats(pwd, interval)
      ]);
      setConnections(conn);
      setLogs(upd);
      setStats(statsRows);
      setAuthed(true);
    } catch (e) {
      setError(e.message || 'Erreur chargement');
      setAuthed(false);
    } finally { setLoading(false); }
  }, [interval]);

  useEffect(() => {
    if (authed) loadData(password);
  }, [refreshTick, interval]);

  function handleSubmit(e) {
    e.preventDefault();
    loadData(password);
  }

  // ===== Chart (SVG) avec axe X + tooltip =====
  const chart = buildLineChart(stats, { height: 190, stroke: colors.accent, interval });

  return (
    <div style={{ fontFamily: fontStack, padding: 32, background: '#f5f7fa', minHeight: '100vh' }}>
      <h1 style={{ marginTop: 0 }}>Admin</h1>
      {!authed && (
        <form onSubmit={handleSubmit} style={{ maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Mot de passe</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #c7d1e0', borderRadius: 8 }} />
          <button type="submit" style={{ padding: '10px 16px', background: colors.accent, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Entrer</button>
          {error && <div style={{ color: 'crimson', fontSize: 13 }}>{error}</div>}
        </form>
      )}

      {authed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setRefreshTick(t=>t+1)} disabled={loading} style={{ padding: '8px 14px', background: '#fff', border: '1px solid #c7d1e0', borderRadius: 8, cursor: 'pointer' }}>↻ Rafraîchir</button>
            <button onClick={() => { setAuthed(false); setPassword(''); }} style={{ padding: '8px 14px', background: '#fff', border: '1px solid #c7d1e0', borderRadius: 8, cursor: 'pointer' }}>Déconnexion</button>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Interval:</span>
              {['5m','1h','1d'].map(i => (
                <button key={i} onClick={() => setIntervalRange(i)} style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #c7d1e0', background: i===interval? colors.accent : '#fff', color: i===interval? '#fff':'#111', cursor: 'pointer' }}>{i}</button>
              ))}
            </div>
            {loading && <span style={{ fontSize: 13, color: colors.textSoft }}>Chargement...</span>}
            {error && <span style={{ fontSize: 13, color: 'crimson' }}>{error}</span>}
          </div>

          <section>
            <h2 style={{ margin: '8px 0 12px' }}>Connexions</h2>
            <div style={{ fontSize: 14, marginBottom: 8 }}>Total: <strong>{connections.total}</strong> - Dernières: {connections.recent.length}</div>
            <div style={{ background: '#fff', border: '1px solid #d9e2ec', borderRadius: 8, padding: 12 }}>
              {chart}
            </div>
            <div style={{ overflowX: 'auto', marginTop: 16 }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', background: '#fff', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#eef2f7' }}>
                    <th style={th}>ID</th>
                    <th style={th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {connections.recent.map(c => (
                    <tr key={c.id}>
                      <td style={td}>{c.id}</td>
                      <td style={td}>{new Date(c.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 style={{ margin: '8px 0 12px' }}>Dernières mises à jour (UpdateLog)</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', background: '#fff', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#eef2f7' }}>
                    <th style={th}>ID</th>
                    <th style={th}>Date</th>
                    <th style={th}>Store</th>
                    <th style={th}>Flavor</th>
                    <th style={th}>Availability</th>
                    <th style={th}>Session</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id}>
                      <td style={td}>{l.id}</td>
                      <td style={td}>{new Date(l.createdAt).toLocaleString()}</td>
                      <td style={td}>{l.store?.name || l.storeId}</td>
                      <td style={td}>{l.flavorName}</td>
                      <td style={td}>{l.availability}</td>
                      <td style={td}>{l.sessionId || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

const th = { padding: '8px 10px', border: '1px solid #d6dee8', textAlign: 'left', fontWeight: 600 };
const td = { padding: '6px 10px', border: '1px solid #e1e8f0' };

function buildLineChart(data, { height=190, stroke='#1976d2', padding=28, interval='5m' } = {}) {
  const [hoverIdx, setHoverIdx] = React.useState(null);
  if (!data || data.length === 0) return <div style={{ fontSize: 12, color: '#667' }}>Pas de données</div>;

  // Trim leading zeros so axis starts at first real connection
  let trimmed = data;
  const firstIdx = trimmed.findIndex(d => d.count > 0);
  if (firstIdx > 0) trimmed = trimmed.slice(firstIdx);
  if (firstIdx === -1 && trimmed.length > 1) trimmed = trimmed.slice(-1);

  const values = trimmed.map(d => d.count);
  const max = Math.max(...values, 1);
  const w = Math.max(trimmed.length * 12, 360);
  const h = height;
  const innerH = h - padding*2;
  const innerW = w - padding*2;
  const yScale = v => padding + (innerH - (v / max) * innerH);
  const xScale = i => padding + (i / (trimmed.length - 1 || 1)) * innerW;
  const path = trimmed.map((d,i) => `${i===0?'M':'L'}${xScale(i)},${yScale(d.count)}`).join(' ');

  // y ticks
  const yTicks = 4;
  const yTickEls = [];
  for (let i=0;i<=yTicks;i++) {
    const v = (max / yTicks) * i;
    const y = yScale(v);
    yTickEls.push(
      <g key={i}>
        <line x1={padding} x2={w-padding} y1={y} y2={y} stroke="#eee" />
        <text x={padding-6} y={y+4} fontSize={10} textAnchor="end" fill="#555">{Math.round(v)}</text>
      </g>
    );
  }

  // x axis labels
  const formatLabel = (iso) => {
    const d = new Date(iso);
    if (interval === '1d') return d.toLocaleDateString();
    if (interval === '1h') return d.toLocaleString(undefined,{ day:'2-digit', month:'2-digit', hour:'2-digit'});
    return d.toLocaleTimeString(undefined,{ hour:'2-digit', minute:'2-digit'});
  };
  const xLabelEls = [];
  const desired = 8;
  const step = Math.ceil(trimmed.length / desired) || 1;
  trimmed.forEach((d,i) => {
    if (i % step === 0 || i === trimmed.length -1) {
      const x = xScale(i);
      xLabelEls.push(
        <g key={"xl"+i} transform={`translate(${x}, ${h - padding + 4})`}>
          <text fontSize={10} textAnchor={i===0?'start': i===trimmed.length-1? 'end':'middle'} fill="#555" dy="0.9em">{formatLabel(d.bucketStart)}</text>
        </g>
      );
    }
  });
  xLabelEls.push(<line key="x-axis" x1={padding} x2={w-padding} y1={h - padding} y2={h - padding} stroke="#ccc" />);

  // Hover tooltip
  let tooltip = null;
  if (hoverIdx != null) {
    const d = trimmed[hoverIdx];
    const x = xScale(hoverIdx);
    const y = yScale(d.count);
    const dateFull = new Date(d.bucketStart).toLocaleString();
    const lines = [dateFull, `${d.count} connexion${d.count>1?'s':''}`];
    const boxW = Math.max(...lines.map(l=> l.length * 6.2)) + 16;
    const boxH = 30 + (lines.length-2)*14;
    const boxX = Math.min(Math.max(x - boxW/2, padding), w - padding - boxW);
    const boxY = y - boxH - 10 < 4 ? y + 14 : y - boxH - 10;
    tooltip = (
      <g pointerEvents="none">
        <line x1={x} x2={x} y1={padding} y2={h - padding} stroke="#bbb" strokeDasharray="4 4" />
        <circle cx={x} cy={y} r={6} fill="#fff" stroke={stroke} strokeWidth={2} />
        <g transform={`translate(${boxX},${boxY})`}>
          <rect width={boxW} height={boxH} rx={6} ry={6} fill="#1e293b" opacity={0.9} />
          {lines.map((ln,j)=>(
            <text key={j} x={8} y={14 + j*14} fontSize={11} fill="#fff">{ln}</text>
          ))}
        </g>
      </g>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={w} height={h} style={{ display: 'block', cursor:'crosshair' }}>
        <path d={path} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {trimmed.map((d,i) => (
          <g key={i} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}>
            <circle cx={xScale(i)} cy={yScale(d.count)} r={hoverIdx===i?5:3} fill={stroke} />
          </g>
        ))}
        {yTickEls}
        {xLabelEls}
        {tooltip}
      </svg>
    </div>
  );
}
