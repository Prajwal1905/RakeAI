import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Train, Package, AlertTriangle,
  TrendingUp, RefreshCw, CheckCircle
} from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const C = {
  bg: '#0a0a0a',
  surface: '#111111',
  elevated: '#1a1a1a',
  border: '#222222',
  borderHi: '#2e2e2e',
  accent: '#c8a96e',
  accentDim: '#c8a96e33',
  text: '#e8e8e8',
  textSub: '#888888',
  textDim: '#444444',
  danger: '#e05c5c',
  warn: '#d4915a',
  success: '#5ca87a',
  info: '#6a9fd4',
};

const PRODUCT_COLORS = ['#c8a96e', '#d4915a', '#6a9fd4', '#5ca87a', '#9b7fd4', '#d4c26a', '#7fd4c8'];

const styles = {
  label: { fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textSub, fontWeight: 600 },
  mono: { fontFamily: "'JetBrains Mono', 'Courier New', monospace" },
};


const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&display=swap';
document.head.appendChild(fontLink);

const globalStyle = document.createElement('style');
globalStyle.textContent = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:${C.bg}; color:${C.text}; font-family:'DM Sans',sans-serif; font-size:14px; }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:${C.surface}; }
  ::-webkit-scrollbar-thumb { background:${C.borderHi}; border-radius:2px; }
  input, select { outline:none; font-family:'DM Sans',sans-serif; }
  button { font-family:'DM Sans',sans-serif; }
`;
document.head.appendChild(globalStyle);



function Tag({ children, color = C.accent }) {
  return (
    <span style={{
      fontSize: 9, letterSpacing: '0.14em', fontWeight: 700,
      textTransform: 'uppercase', color,
      border: `1px solid ${color}55`,
      background: `${color}11`,
      padding: '2px 8px', borderRadius: 2
    }}>{children}</span>
  );
}

function Badge({ text }) {
  const map = { Critical: C.danger, High: C.warn, Medium: C.info, Low: C.success, Planned: C.success };
  const color = map[text] || C.textSub;
  return <Tag color={color}>{text}</Tag>;
}


function StatCard({ icon: Icon, label, value, color = C.accent }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 4, padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={styles.label}>{label}</span>
        <Icon size={14} color={C.textDim} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 300, color, ...styles.mono, letterSpacing: '-0.02em' }}>
        {value}
      </div>
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{ width: 2, height: 14, background: C.accent, borderRadius: 1 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text, letterSpacing: '0.01em' }}>{title}</span>
      </div>
      {sub && <p style={{ fontSize: 11, color: C.textSub, paddingLeft: 12 }}>{sub}</p>}
    </div>
  );
}

function Table({ headers, rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {headers.map(h => (
              <th key={h} style={{
                padding: '10px 14px', textAlign: 'left',
                ...styles.label, whiteSpace: 'nowrap'
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

function Panel({ children, style = {} }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 4, padding: 20, ...style
    }}>{children}</div>
  );
}


function Dashboard({ summary, savings, alerts }) {
  if (!summary) return <div style={{ color: C.textDim }}>Loading…</div>;

  const fillData = [
    { name: 'Manual', value: 70 },
    { name: 'Target', value: 85 },
    { name: 'Achieved', value: summary.avg_fill },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.map((a, i) => {
            const c = a.type === 'danger' ? C.danger : a.type === 'warning' ? C.warn : C.textDim;
            return (
              <div key={i} style={{
                background: `${c}08`, border: `1px solid ${c}33`,
                borderLeft: `2px solid ${c}`, borderRadius: 4,
                padding: '10px 16px', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: c }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>{a.detail}</div>
                </div>
                <Tag color={c}>{a.type}</Tag>
              </div>
            );
          })}
        </div>
      )}


      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        <StatCard icon={Package} label="Pending Orders" value={summary.pending_orders} color={C.info} />
        <StatCard icon={AlertTriangle} label="Critical" value={summary.critical_orders} color={C.danger} />
        <StatCard icon={Train} label="Rakes Planned" value={summary.rakes_planned} color={C.accent} />
        <StatCard icon={TrendingUp} label="Avg Fill" value={`${summary.avg_fill}%`} color={C.success} />
      </div>


      {savings && savings.status === 'success' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Panel>
            <SectionHeader title="Cost Savings — Today" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Manual Planning (70% fill)', value: `₹${savings.manual_crore} Cr`, color: C.danger },
                { label: 'RakeAI Optimizer', value: `₹${savings.actual_crore} Cr`, color: C.success },
                { label: 'Saved Today', value: `₹${savings.savings_crore} Cr`, color: C.accent },
                { label: 'Annual Projection', value: `₹${(savings.savings_crore * 365).toFixed(0)} Cr`, color: C.accent },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '9px 12px', borderRadius: 3,
                  background: C.elevated, borderLeft: `2px solid ${row.color}33`
                }}>
                  <span style={{ fontSize: 11, color: C.textSub }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: row.color, ...styles.mono }}>{row.value}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionHeader title="Fill Rate Comparison" sub="Manual vs Target vs Achieved" />
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={fillData} barSize={32}>
                <CartesianGrid strokeDasharray="2 4" stroke={C.border} vertical={false} />
                <XAxis dataKey="name" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textSub }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} stroke={C.textDim} tick={{ fontSize: 10, fill: C.textSub }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 11 }}
                  formatter={(v) => [`${v}%`]}
                />
                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  <Cell fill={C.danger} />
                  <Cell fill={C.textDim} />
                  <Cell fill={C.success} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      )}


      <Panel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
          {[
            { label: 'Orders Assigned', value: summary.orders_assigned },
            { label: 'Available Rakes', value: summary.available_rakes },
            { label: 'Total Inventory', value: `${summary.total_inventory.toLocaleString()} T` },
            { label: 'Total Cost', value: `₹${(summary.total_cost / 10000000).toFixed(2)} Cr` },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '14px 20px',
              borderRight: i < 3 ? `1px solid ${C.border}` : 'none'
            }}>
              <div style={styles.label}>{item.label}</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: C.text, marginTop: 6, ...styles.mono }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div style={{ fontSize: 10, color: C.textDim, textAlign: 'right', ...styles.mono }}>
        Last updated {summary.last_updated}
      </div>
    </div>
  );
}

function RakePlan({ plan, onRefresh }) {
  const [confirmDispatch, setConfirmDispatch] = useState(null);
  const [toast, setToast] = useState(null);

  if (!plan) return <div style={{ color: C.textDim }}>Loading…</div>;

  const handleDispatch = async (rakeId, orderIds) => {
    try {
      await axios.post(`${API}/dispatch-rake/${rakeId}?order_ids=${encodeURIComponent(orderIds)}`);
      setConfirmDispatch(null);
      setToast({ type: 'success', text: `${rakeId} dispatched successfully` });
      await onRefresh();
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast({ type: 'error', text: 'Error dispatching rake' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 20, marginBottom: 16, fontSize: 11, color: C.textSub }}>
        <span style={styles.mono}>{plan.total_rakes} rakes</span>
        <span style={styles.mono}>{plan.total_orders} orders</span>
        <span style={{ color: C.success, ...styles.mono }}>{plan.avg_fill}% avg fill</span>
      </div>
      <Panel style={{ padding: 0 }}>
        <Table
          headers={['Rake', 'Wagon', 'Destination', 'Products', 'Orders', 'Quantity', 'Fill', 'Risk', 'Cost', '']}
          rows={plan.plan.map((row, i) => (
            <tr key={i} style={{
              borderBottom: `1px solid ${C.border}`,
              background: i % 2 === 0 ? 'transparent' : `${C.elevated}55`
            }}>
              <td style={{ padding: '11px 14px', color: C.accent, fontWeight: 600, ...styles.mono, fontSize: 12 }}>{row.rake_id}</td>
              <td style={{ padding: '11px 14px', color: C.textSub }}>{row.wagon_type}</td>
              <td style={{ padding: '11px 14px', color: C.text, fontWeight: 500 }}>{row.primary_destination}</td>
              <td style={{ padding: '11px 14px', color: C.textSub, maxWidth: 140, fontSize: 11 }}>{row.products}</td>
              <td style={{ padding: '11px 14px', color: C.text, textAlign: 'center', ...styles.mono }}>{row.orders_clubbed}</td>
              <td style={{ padding: '11px 14px', color: C.text, ...styles.mono }}>{row.quantity_loaded.toLocaleString()} T</td>
              <td style={{ padding: '11px 14px' }}>
                <span style={{
                  color: row.fill_percentage >= 90 ? C.success : row.fill_percentage >= 75 ? C.warn : C.danger,
                  fontWeight: 600, ...styles.mono, fontSize: 12
                }}>{row.fill_percentage}%</span>
              </td>
              <td style={{ padding: '11px 14px' }}>
                <span style={{
                  color: row.avg_delay_risk > 0.5 ? C.danger : row.avg_delay_risk > 0.3 ? C.warn : C.success,
                  ...styles.mono, fontSize: 12
                }}>{(row.avg_delay_risk * 100).toFixed(0)}%</span>
              </td>
              <td style={{ padding: '11px 14px', color: C.textSub, ...styles.mono, fontSize: 11 }}>
                ₹{(row.total_cost / 100000).toFixed(1)}L
              </td>
              <td style={{ padding: '11px 14px' }}>
                <button onClick={() => setConfirmDispatch({ rakeId: row.rake_id, orderIds: row.order_ids })} style={{
                  background: 'transparent', color: C.success,
                  border: `1px solid ${C.success}44`, borderRadius: 2,
                  padding: '4px 12px', cursor: 'pointer', fontSize: 11,
                  letterSpacing: '0.05em'
                }}>Dispatch</button>
              </td>
            </tr>
          ))}
        />
      </Panel>

      
      {confirmDispatch && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000000aa',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: C.elevated, border: `1px solid ${C.border}`,
            borderRadius: 6, padding: 24, width: 320
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8 }}>
              Dispatch {confirmDispatch.rakeId}?
            </div>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 20 }}>
              This will mark all orders in this rake as dispatched. This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDispatch(null)} style={{
                background: 'transparent', color: C.textSub,
                border: `1px solid ${C.border}`, borderRadius: 3,
                padding: '7px 16px', cursor: 'pointer', fontSize: 12
              }}>Cancel</button>
              <button onClick={() => handleDispatch(confirmDispatch.rakeId, confirmDispatch.orderIds)} style={{
                background: C.success, color: '#0a0a0a',
                border: 'none', borderRadius: 3,
                padding: '7px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600
              }}>Confirm Dispatch</button>
            </div>
          </div>
        </div>
      )}

      
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: C.elevated,
          border: `1px solid ${toast.type === 'success' ? C.success : C.danger}55`,
          borderLeft: `3px solid ${toast.type === 'success' ? C.success : C.danger}`,
          borderRadius: 4, padding: '12px 18px',
          color: toast.type === 'success' ? C.success : C.danger,
          fontSize: 12, fontWeight: 500, zIndex: 1000
        }}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
function Orders({ orders }) {
  const [filter, setFilter] = useState('All');
  if (!orders) return <div style={{ color: C.textDim }}>Loading…</div>;

  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const filtered = filter === 'All' ? orders.orders : orders.orders.filter(o => o.priority === filter);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {priorities.map(p => (
          <button key={p} onClick={() => setFilter(p)} style={{
            padding: '5px 14px', borderRadius: 2, border: `1px solid ${filter === p ? C.accent : C.border}`,
            cursor: 'pointer', fontSize: 11, letterSpacing: '0.06em',
            background: filter === p ? C.accentDim : 'transparent',
            color: filter === p ? C.accent : C.textSub
          }}>{p}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: C.textDim, alignSelf: 'center', ...styles.mono }}>
          {filtered.length} orders
        </span>
      </div>
      <Panel style={{ padding: 0, maxHeight: 520, overflowY: 'auto' }}>
        <Table
          headers={['Order ID', 'Product', 'Destination', 'Qty', 'Priority', 'Deadline', 'Type', 'Delay Risk']}
          rows={filtered.slice(0, 60).map((row, i) => (
            <tr key={i} style={{
              borderBottom: `1px solid ${C.border}`,
              background: i % 2 === 0 ? 'transparent' : `${C.elevated}55`
            }}>
              <td style={{ padding: '10px 14px', color: C.accent, ...styles.mono, fontSize: 11 }}>{row.order_id}</td>
              <td style={{ padding: '10px 14px', color: C.text, fontSize: 12 }}>{row.product}</td>
              <td style={{ padding: '10px 14px', color: C.textSub, fontSize: 12 }}>{row.destination_city}</td>
              <td style={{ padding: '10px 14px', color: C.text, ...styles.mono, fontSize: 11 }}>{row.quantity_tonnes} T</td>
              <td style={{ padding: '10px 14px' }}><Badge text={row.priority} /></td>
              <td style={{ padding: '10px 14px', color: C.textSub, ...styles.mono, fontSize: 11 }}>{row.deadline}</td>
              <td style={{ padding: '10px 14px', color: C.textSub, fontSize: 11 }}>{row.order_type}</td>
              <td style={{ padding: '10px 14px' }}>
                <span style={{
                  color: row.delay_risk > 50 ? C.danger : row.delay_risk > 30 ? C.warn : C.success,
                  fontWeight: 600, ...styles.mono, fontSize: 12
                }}>{row.delay_risk}%</span>
              </td>
            </tr>
          ))}
        />
      </Panel>
    </div>
  );
}

function Forecast({ forecast }) {
  if (!forecast || !forecast.forecast) return <div style={{ color: C.textDim }}>Loading…</div>;

  const chartData = Object.keys(forecast.forecast).map((product, i) => ({
    product,
    total: Math.round(forecast.forecast[product].total || 0),
    daily: Math.round(forecast.forecast[product].avg || 0),
    color: PRODUCT_COLORS[i % PRODUCT_COLORS.length]
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Panel>
        <SectionHeader title="7-Day Demand Forecast" sub="ARIMA time-series model — next 7 days by product" />
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} layout="vertical" barSize={18}>
            <CartesianGrid strokeDasharray="2 4" stroke={C.border} horizontal={false} />
            <XAxis type="number" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textSub }} axisLine={false} tickLine={false} />
            <YAxis dataKey="product" type="category" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textSub }} axisLine={false} tickLine={false} width={90} />
            <Tooltip
              contentStyle={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 11 }}
              formatter={(v) => [`${v.toLocaleString()} T`]}
            />
            <Bar dataKey="total" radius={[0, 2, 2, 0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {chartData.map((item, i) => (
          <Panel key={i} style={{ borderTop: `2px solid ${item.color}`, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: C.textSub, marginBottom: 6 }}>{item.product}</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: item.color, ...styles.mono }}>
              {item.total.toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>~{item.daily.toLocaleString()} T/day</div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function WhatIf() {
  const [rakeId, setRakeId] = useState('RK105');
  const [delayDays, setDelayDays] = useState(2);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/whatif?rake_id=${rakeId}&delay_days=${delayDays}`);
      setResult(res.data);
    } catch { alert('Error'); }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Panel>
        <SectionHeader title="What-If Simulator" sub="Model financial impact of rake delays before they happen" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          {[
            { label: 'Rake ID', value: rakeId, set: setRakeId, type: 'text', placeholder: 'e.g. RK105' },
            { label: 'Delay Days', value: delayDays, set: setDelayDays, type: 'number', placeholder: '1-10' },
          ].map((field, i) => (
            <div key={i}>
              <div style={{ ...styles.label, marginBottom: 6 }}>{field.label}</div>
              <input
                type={field.type} value={field.value} placeholder={field.placeholder}
                onChange={e => field.set(field.type === 'number' ? parseInt(e.target.value) : e.target.value)}
                style={{
                  width: '100%', background: C.elevated,
                  border: `1px solid ${C.border}`, borderRadius: 3,
                  padding: '9px 12px', color: C.text, fontSize: 13, ...styles.mono
                }}
              />
            </div>
          ))}
          <button onClick={run} disabled={loading} style={{
            background: C.accentDim, color: C.accent,
            border: `1px solid ${C.accent}55`, borderRadius: 3,
            padding: '9px 24px', cursor: 'pointer', fontSize: 12,
            fontWeight: 600, letterSpacing: '0.06em'
          }}>{loading ? 'Running…' : 'Analyze'}</button>
        </div>
      </Panel>

      {result && result.status === 'success' && (
        <>
          <div style={{
            background: `${result.total_impact > 500000 ? C.danger : C.warn}0d`,
            border: `1px solid ${result.total_impact > 500000 ? C.danger : C.warn}44`,
            borderLeft: `2px solid ${result.total_impact > 500000 ? C.danger : C.warn}`,
            borderRadius: 4, padding: '12px 16px',
            fontSize: 13, fontWeight: 500,
            color: result.total_impact > 500000 ? C.danger : C.warn
          }}>{result.recommendation}</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {[
              { label: 'Orders Affected', value: result.orders_affected, color: C.info },
              { label: 'Missed Deadlines', value: result.missed_deadlines, color: C.danger },
              { label: 'Extra Demurrage', value: `₹${(result.extra_demurrage / 100000).toFixed(1)}L`, color: C.warn },
              { label: 'Total Impact', value: `₹${result.total_impact_lakh}L`, color: C.danger },
            ].map((item, i) => (
              <Panel key={i} style={{ borderTop: `2px solid ${item.color}` }}>
                <div style={{ ...styles.label, marginBottom: 8 }}>{item.label}</div>
                <div style={{ fontSize: 22, fontWeight: 500, color: item.color, ...styles.mono }}>{item.value}</div>
              </Panel>
            ))}
          </div>

          {result.missed_orders.length > 0 && (
            <Panel style={{ padding: 0 }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Orders Missing Deadline</span>
              </div>
              <Table
                headers={['Order ID', 'Product', 'Priority', 'Deadline', 'Penalty']}
                rows={result.missed_orders.map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '10px 14px', color: C.accent, ...styles.mono, fontSize: 11 }}>{row.order_id}</td>
                    <td style={{ padding: '10px 14px', color: C.text, fontSize: 12 }}>{row.product}</td>
                    <td style={{ padding: '10px 14px' }}><Badge text={row.priority} /></td>
                    <td style={{ padding: '10px 14px', color: C.textSub, ...styles.mono, fontSize: 11 }}>{row.deadline}</td>
                    <td style={{ padding: '10px 14px', color: C.danger, fontWeight: 600, ...styles.mono, fontSize: 12 }}>
                      ₹{row.penalty.toLocaleString()}
                    </td>
                  </tr>
                ))}
              />
              <div style={{
                padding: '12px 18px', borderTop: `1px solid ${C.border}`,
                display: 'flex', justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: 11, color: C.textSub }}>Total Penalty</span>
                <span style={{ color: C.danger, fontWeight: 700, ...styles.mono }}>₹{result.total_penalty.toLocaleString()}</span>
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}

function Reorder({ reorder }) {
  if (!reorder) return <div style={{ color: C.textDim }}>Loading…</div>;

  const colorMap = {
    critical: C.danger,
    warning: C.warn,
    safe: C.success,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { label: 'Critical', value: reorder.critical, color: C.danger },
          { label: 'Warning', value: reorder.warning, color: C.warn },
          { label: 'Safe', value: reorder.safe, color: C.success },
        ].map((item, i) => (
          <Panel key={i} style={{ borderTop: `2px solid ${item.color}` }}>
            <div style={{ ...styles.label, marginBottom: 8 }}>{item.label}</div>
            <div style={{ fontSize: 28, fontWeight: 300, color: item.color, ...styles.mono }}>{item.value}</div>
          </Panel>
        ))}
      </div>

      <Panel style={{ padding: 0 }}>
        <Table
          headers={['Product', 'Stock', 'Daily Demand', 'Days Left', 'Reorder Qty', 'Status']}
          rows={reorder.alerts.map((row, i) => {
            const color = colorMap[row.status];
            return (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: '11px 14px', color: C.text, fontWeight: 500 }}>{row.product}</td>
                <td style={{ padding: '11px 14px', color: C.textSub, ...styles.mono, fontSize: 11 }}>{row.total_stock.toLocaleString()} T</td>
                <td style={{ padding: '11px 14px', color: C.textSub, ...styles.mono, fontSize: 11 }}>{row.daily_demand.toLocaleString()} T/day</td>
                <td style={{ padding: '11px 14px' }}>
                  <span style={{ color, fontWeight: 600, ...styles.mono, fontSize: 12 }}>{row.days_left}d</span>
                </td>
                <td style={{ padding: '11px 14px', color: C.accent, fontWeight: 600, ...styles.mono, fontSize: 11 }}>{row.reorder_qty.toLocaleString()} T</td>
                <td style={{ padding: '11px 14px' }}><Tag color={color}>{row.status}</Tag></td>
              </tr>
            );
          })}
        />
      </Panel>
    </div>
  );
}

function Weekly({ weekly }) {
  if (!weekly) return <div style={{ color: C.textDim }}>Loading…</div>;

  const destData = Object.keys(weekly.top_destinations).map(k => ({ name: k, value: weekly.top_destinations[k] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { label: 'Weekly Saving', value: `₹${weekly.weekly_summary.total_saving_cr} Cr`, color: C.success },
          { label: 'Avg Fill', value: `${weekly.weekly_summary.avg_fill_pct}%`, color: C.accent },
          { label: 'Orders Done', value: weekly.weekly_summary.total_orders, color: C.info },
          { label: 'Rakes Dispatched', value: weekly.weekly_summary.total_rakes, color: C.textSub },
        ].map((item, i) => (
          <Panel key={i}>
            <div style={{ ...styles.label, marginBottom: 8 }}>{item.label}</div>
            <div style={{ fontSize: 24, fontWeight: 400, color: item.color, ...styles.mono }}>{item.value}</div>
          </Panel>
        ))}
      </div>

      <Panel>
        <SectionHeader title="Daily Fill %" sub="This week" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weekly.daily_performance} barSize={28}>
            <CartesianGrid strokeDasharray="2 4" stroke={C.border} vertical={false} />
            <XAxis dataKey="day" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textSub }} axisLine={false} tickLine={false} />
            <YAxis domain={[80, 100]} stroke={C.textDim} tick={{ fontSize: 10, fill: C.textSub }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 11 }} formatter={(v) => [`${v}%`]} />
            <Bar dataKey="fill_pct" fill={C.accent} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Panel>
          <SectionHeader title="Daily Cost Saved" />
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weekly.daily_performance} barSize={22}>
              <CartesianGrid strokeDasharray="2 4" stroke={C.border} vertical={false} />
              <XAxis dataKey="day" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textSub }} axisLine={false} tickLine={false} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textSub }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 11 }} formatter={(v) => [`₹${v} Cr`]} />
              <Bar dataKey="cost_saved" fill={C.success} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <SectionHeader title="Top Destinations" />
          {destData.length > 0 ? destData.map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 10px', marginBottom: 6,
              background: C.elevated, borderRadius: 3,
              borderLeft: `2px solid ${PRODUCT_COLORS[i % PRODUCT_COLORS.length]}`
            }}>
              <span style={{ fontSize: 12, color: C.textSub }}>{item.name}</span>
              <span style={{ fontSize: 12, color: PRODUCT_COLORS[i % PRODUCT_COLORS.length], fontWeight: 600, ...styles.mono }}>
                {item.value} rakes
              </span>
            </div>
          )) : <div style={{ color: C.textDim, fontSize: 12 }}>No dispatches yet</div>}
        </Panel>
      </div>


      <Panel>
        <SectionHeader title="Order Priority Breakdown" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {Object.keys(weekly.priority_breakdown).map((priority, i) => {
            const colors = { Critical: C.danger, High: C.warn, Medium: C.info, Low: C.success };
            const color = colors[priority] || C.textSub;
            const total = Object.values(weekly.priority_breakdown).reduce((a, b) => a + b, 0);
            const pct = Math.round((weekly.priority_breakdown[priority] / total) * 100);
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: C.textSub }}>{priority}</span>
                  <span style={{ fontSize: 11, color, fontWeight: 600, ...styles.mono }}>{pct}%</span>
                </div>
                <div style={{ background: C.elevated, borderRadius: 2, height: 4 }}>
                  <div style={{ background: color, borderRadius: 2, height: 4, width: `${pct}%`, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ fontSize: 10, color: C.textDim, marginTop: 4, ...styles.mono }}>
                  {weekly.priority_breakdown[priority]} orders
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [summary, setSummary] = useState(null);
  const [plan, setPlan] = useState(null);
  const [orders, setOrders] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [savings, setSavings] = useState(null);
  const [reorder, setReorder] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, p, o, f, a, sv, rr, wk] = await Promise.all([
        axios.get(`${API}/summary`),
        axios.get(`${API}/rake-plan`),
        axios.get(`${API}/orders`),
        axios.get(`${API}/forecast`),
        axios.get(`${API}/alerts`),
        axios.get(`${API}/cost-savings`),
        axios.get(`${API}/reorder-alerts`),
        axios.get(`${API}/weekly-performance`),
      ]);
      setSummary(s.data.summary);
      setPlan(p.data);
      setOrders(o.data);
      setForecast(f.data);
      setAlerts(a.data.alerts || []);
      setSavings(sv.data);
      setReorder(rr.data);
      setWeekly(wk.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const navItems = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'rakeplan', label: 'Rake Plan' },
    { id: 'orders', label: 'Orders' },
    { id: 'forecast', label: 'Forecast' },
    { id: 'whatif', label: 'What-If' },
    { id: 'reorder', label: 'Reorder' },
    { id: 'weekly', label: 'Weekly' },
  ];

  const pageComponents = {
    dashboard: <Dashboard summary={summary} savings={savings} alerts={alerts} />,
    rakeplan: <RakePlan plan={plan} onRefresh={fetchAll} />,
    orders: <Orders orders={orders} />,
    forecast: <Forecast forecast={forecast} />,
    whatif: <WhatIf />,
    reorder: <Reorder reorder={reorder} />,
    weekly: <Weekly weekly={weekly} />,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>


      <div style={{
        width: 200, background: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        padding: '24px 0'
      }}>

        <div style={{ padding: '0 20px 24px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Train size={16} color={C.accent} />
            <span style={{ fontSize: 15, fontWeight: 600, color: C.text, letterSpacing: '0.02em' }}>RakeAI</span>
          </div>
          <div style={{ fontSize: 10, color: C.textDim, letterSpacing: '0.1em', textTransform: 'uppercase', paddingLeft: 24 }}>
            SAIL Bokaro
          </div>
        </div>


        <div style={{ padding: '16px 12px', flex: 1 }}>
          {navItems.map(({ id, label }) => (
            <button key={id} onClick={() => setPage(id)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '8px 12px', borderRadius: 3, border: 'none',
              cursor: 'pointer', fontSize: 12, marginBottom: 2,
              letterSpacing: '0.03em',
              background: page === id ? C.accentDim : 'transparent',
              color: page === id ? C.accent : C.textSub,
              fontWeight: page === id ? 600 : 400,
              borderLeft: page === id ? `2px solid ${C.accent}` : '2px solid transparent',
            }}>{label}</button>
          ))}
        </div>


        <div style={{ padding: '16px 12px', borderTop: `1px solid ${C.border}` }}>
          <button onClick={fetchAll} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '8px 12px', borderRadius: 3,
            border: `1px solid ${C.border}`, cursor: 'pointer',
            background: 'transparent', color: C.textDim, fontSize: 11,
            letterSpacing: '0.06em'
          }}>
            <RefreshCw size={11} color={loading ? C.accent : C.textDim}
              style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Syncing…' : 'Refresh'}
          </button>
          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </div>
      </div>


      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>


        <div style={{
          height: 52, borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', background: C.surface
        }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
              {navItems.find(n => n.id === page)?.label}
            </span>
            <span style={{ fontSize: 11, color: C.textDim, marginLeft: 10 }}>
              SAIL Bokaro Steel Plant — Rake Formation System
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.success }}>
            <CheckCircle size={11} />
            <span style={{ letterSpacing: '0.06em' }}>SYSTEM ACTIVE</span>
          </div>
        </div>


        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {pageComponents[page]}
        </div>
      </div>
    </div>
  );
}
