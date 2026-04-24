import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Train, Package, AlertTriangle,
  TrendingUp, RefreshCw, CheckCircle,
  Clock, DollarSign
} from 'lucide-react';

const API = 'http://127.0.0.1:8000';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];


function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div style={{
      background: '#1e293b',
      borderRadius: 12,
      padding: '20px 24px',
      borderLeft: `4px solid ${color}`,
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }}>
      <div style={{
        background: color + '22',
        borderRadius: 10,
        padding: 12
      }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Badge({ text }) {
  const colors = {
    Critical: '#ef4444',
    High: '#f59e0b',
    Medium: '#3b82f6',
    Low: '#10b981',
    Planned: '#10b981'
  };
  const color = colors[text] || '#94a3b8';
  return (
    <span style={{
      background: color + '22',
      color,
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      border: `1px solid ${color}44`
    }}>
      {text}
    </span>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{title}</h2>
      {sub && <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{sub}</p>}
    </div>
  );
}



function Dashboard({ summary }) {
  if (!summary) return <div style={{ color: '#64748b' }}>Loading summary...</div>;

  const fillData = [
    { name: 'Target', value: 85 },
    { name: 'Achieved', value: summary.avg_fill }
  ];

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 28
      }}>
        <StatCard icon={Package} label="Pending Orders" value={summary.pending_orders} color="#3b82f6" />
        <StatCard icon={AlertTriangle} label="Critical Orders" value={summary.critical_orders} color="#ef4444" />
        <StatCard icon={Train} label="Rakes Planned" value={summary.rakes_planned} color="#10b981" />
        <StatCard icon={TrendingUp} label="Avg Fill %" value={`${summary.avg_fill}%`} color="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20 }}>
          <SectionTitle title="Today's Cost Summary" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Total Logistics Cost', value: `₹${(summary.total_cost / 10000000).toFixed(2)} Cr`, color: '#ef4444' },
              { label: 'Orders Assigned', value: summary.orders_assigned, color: '#10b981' },
              { label: 'Available Rakes', value: summary.available_rakes, color: '#3b82f6' },
              { label: 'Total Inventory', value: `${summary.total_inventory.toLocaleString()} T`, color: '#f59e0b' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: '#0f172a',
                borderRadius: 8,
                borderLeft: `3px solid ${item.color}`
              }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>{item.label}</span>
                <span style={{ color: item.color, fontWeight: 700 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>


        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20 }}>
          <SectionTitle title="Fill % vs Target" sub="Target: 85% | Achieved today" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={fillData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis domain={[0, 100]} stroke="#64748b" />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155' }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{
        marginTop: 16,
        padding: '10px 16px',
        background: '#1e293b',
        borderRadius: 8,
        fontSize: 12,
        color: '#64748b'
      }}>
        Last updated: {summary.last_updated}
      </div>
    </div>
  );
}

function RakePlan({ plan }) {
  if (!plan) return <div style={{ color: '#64748b' }}>Loading rake plan...</div>;

  return (
    <div>
      <SectionTitle
        title="Today's Rake Formation Plan"
        sub={`${plan.total_rakes} rakes planned | ${plan.total_orders} orders assigned | Avg fill: ${plan.avg_fill}%`}
      />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#1e293b' }}>
              {['Rake ID', 'Wagon', 'Destination', 'Products', 'Orders', 'Quantity', 'Fill %', 'Delay Risk', 'Cost', 'Status'].map(h => (
                <th key={h} style={{
                  padding: '12px 14px',
                  textAlign: 'left',
                  color: '#64748b',
                  fontWeight: 600,
                  borderBottom: '1px solid #334155'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plan.plan.map((row, i) => (
              <tr key={i} style={{
                borderBottom: '1px solid #1e293b',
                background: i % 2 === 0 ? '#0f172a' : '#111827'
              }}>
                <td style={{ padding: '11px 14px', color: '#3b82f6', fontWeight: 600 }}>{row.rake_id}</td>
                <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{row.wagon_type}</td>
                <td style={{ padding: '11px 14px', color: '#f1f5f9' }}>{row.primary_destination}</td>
                <td style={{ padding: '11px 14px', color: '#94a3b8', maxWidth: 160 }}>{row.products}</td>
                <td style={{ padding: '11px 14px', color: '#10b981', textAlign: 'center' }}>{row.orders_clubbed}</td>
                <td style={{ padding: '11px 14px', color: '#f1f5f9' }}>{row.quantity_loaded.toLocaleString()} T</td>
                <td style={{ padding: '11px 14px' }}>
                  <span style={{
                    color: row.fill_percentage >= 90 ? '#10b981' : row.fill_percentage >= 75 ? '#f59e0b' : '#ef4444',
                    fontWeight: 700
                  }}>
                    {row.fill_percentage}%
                  </span>
                </td>
                <td style={{ padding: '11px 14px' }}>
                  <span style={{
                    color: row.avg_delay_risk > 0.5 ? '#ef4444' : row.avg_delay_risk > 0.3 ? '#f59e0b' : '#10b981',
                    fontWeight: 600
                  }}>
                    {(row.avg_delay_risk * 100).toFixed(0)}%
                  </span>
                </td>
                <td style={{ padding: '11px 14px', color: '#f59e0b' }}>
                  ₹{(row.total_cost / 100000).toFixed(1)}L
                </td>
                <td style={{ padding: '11px 14px' }}><Badge text={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Orders({ orders }) {
  const [filter, setFilter] = useState('All');
  if (!orders) return <div style={{ color: '#64748b' }}>Loading orders...</div>;

  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const filtered = filter === 'All'
    ? orders.orders
    : orders.orders.filter(o => o.priority === filter);

  return (
    <div>
      <SectionTitle
        title="Pending Customer Orders"
        sub={`${orders.total_orders} total | ${orders.critical} critical | ${orders.high} high priority`}
      />


      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {priorities.map(p => (
          <button key={p} onClick={() => setFilter(p)} style={{
            padding: '6px 16px',
            borderRadius: 20,
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            background: filter === p ? '#3b82f6' : '#1e293b',
            color: filter === p ? '#fff' : '#94a3b8'
          }}>{p}</button>
        ))}
      </div>

      <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ position: 'sticky', top: 0 }}>
            <tr style={{ background: '#1e293b' }}>
              {['Order ID', 'Product', 'Destination', 'Quantity', 'Priority', 'Deadline', 'Type', 'Delay Risk'].map(h => (
                <th key={h} style={{
                  padding: '12px 14px',
                  textAlign: 'left',
                  color: '#64748b',
                  fontWeight: 600,
                  borderBottom: '1px solid #334155'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map((row, i) => (
              <tr key={i} style={{
                borderBottom: '1px solid #1e293b',
                background: i % 2 === 0 ? '#0f172a' : '#111827'
              }}>
                <td style={{ padding: '10px 14px', color: '#3b82f6', fontWeight: 600 }}>{row.order_id}</td>
                <td style={{ padding: '10px 14px', color: '#f1f5f9' }}>{row.product}</td>
                <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{row.destination_city}</td>
                <td style={{ padding: '10px 14px', color: '#f1f5f9' }}>{row.quantity_tonnes} T</td>
                <td style={{ padding: '10px 14px' }}><Badge text={row.priority} /></td>
                <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{row.deadline}</td>
                <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{row.order_type}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{
                    color: row.delay_risk > 50 ? '#ef4444' : row.delay_risk > 30 ? '#f59e0b' : '#10b981',
                    fontWeight: 600
                  }}>
                    {row.delay_risk}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Forecast({ forecast }) {
  if (!forecast) return <div style={{ color: '#64748b' }}>Loading forecast...</div>;

  const chartData = forecast && forecast.forecast ? Object.keys(forecast.forecast).map(product => ({
    product,
    total: Math.round(forecast.forecast[product].total),
    daily: Math.round(forecast.forecast[product].avg)
  })) : [];

  return (
    <div>
      <SectionTitle
        title="7-Day Demand Forecast"
        sub="ARIMA model predictions — production planning guide"
      />

      <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h3 style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>
          Total Demand by Product (Next 7 Days)
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" stroke="#64748b" />
            <YAxis dataKey="product" type="category" stroke="#64748b" width={100} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155' }}
              formatter={(v) => [`${v.toLocaleString()} T`, 'Total']}
            />
            <Bar dataKey="total" radius={[0, 6, 6, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>


      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12
      }}>
        {chartData.map((item, i) => (
          <div key={i} style={{
            background: '#1e293b',
            borderRadius: 10,
            padding: '14px 16px',
            borderTop: `3px solid ${COLORS[i % COLORS.length]}`
          }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{item.product}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: COLORS[i % COLORS.length] }}>
              {item.total.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#475569' }}>tonnes / 7 days</div>
            <div style={{ fontSize: 11, color: '#475569' }}>~{item.daily.toLocaleString()} T/day</div>
          </div>
        ))}
      </div>
    </div>
  );
}
function SavingsCard({ savings }) {
  if (!savings || savings.status !== 'success') return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      border: '1px solid #10b98144',
      borderRadius: 12,
      padding: 20,
      marginBottom: 20
    }}>
      <div style={{
        fontSize: 13,
        color: '#10b981',
        fontWeight: 700,
        marginBottom: 16,
        letterSpacing: 1
      }}>
        COST SAVINGS CALCULATOR — TODAY
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 12,
        marginBottom: 16
      }}>
        {/* Manual */}
        <div style={{
          background: '#ef444415',
          border: '1px solid #ef444433',
          borderRadius: 10,
          padding: '14px 16px'
        }}>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
            Manual Planning
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
            Industry avg fill: {savings.manual_fill}%
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#ef4444' }}>
            ₹{savings.manual_crore} Cr
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            estimated cost
          </div>
        </div>

        {/* RakeAI */}
        <div style={{
          background: '#10b98115',
          border: '1px solid #10b98133',
          borderRadius: 10,
          padding: '14px 16px'
        }}>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
            RakeAI Optimizer
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
            Achieved fill: {savings.actual_fill}%
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>
            ₹{savings.actual_crore} Cr
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            actual cost
          </div>
        </div>

        {/* Savings */}
        <div style={{
          background: '#3b82f615',
          border: '1px solid #3b82f633',
          borderRadius: 10,
          padding: '14px 16px'
        }}>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
            Today's Saving
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
            Efficiency gain: +{savings.efficiency_gain}%
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#3b82f6' }}>
            ₹{savings.savings_crore} Cr
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            saved today
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        background: '#10b98122',
        borderRadius: 8,
        padding: '10px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ color: '#94a3b8', fontSize: 12 }}>
          Annual projection at current efficiency
        </span>
        <span style={{ color: '#10b981', fontWeight: 800, fontSize: 16 }}>
          ₹{(savings.savings_crore * 365).toFixed(0)} Cr / year saved
        </span>
      </div>
    </div>
  );
}

function WhatIf() {
  const [rakeId, setRakeId] = useState('RK105');
  const [delayDays, setDelayDays] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API}/whatif?rake_id=${rakeId}&delay_days=${delayDays}`
      );
      setResult(res.data);
    } catch (e) {
      alert('Error running analysis');
    }
    setLoading(false);
  };

  return (
    <div>
      <SectionTitle
        title="What-If Simulator"
        sub="Analyze financial impact of rake delays before they happen"
      />

      
      <div style={{
        background: '#1e293b',
        borderRadius: 12,
        padding: 24,
        marginBottom: 20
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto',
          gap: 16,
          alignItems: 'end'
        }}>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>
              Rake ID
            </label>
            <input
              value={rakeId}
              onChange={e => setRakeId(e.target.value)}
              placeholder="e.g. RK105"
              style={{
                width: '100%',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#f1f5f9',
                fontSize: 14
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>
              Delay Days
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={delayDays}
              onChange={e => setDelayDays(parseInt(e.target.value))}
              style={{
                width: '100%',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#f1f5f9',
                fontSize: 14
              }}
            />
          </div>
          <button
            onClick={runAnalysis}
            disabled={loading}
            style={{
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 14
            }}
          >
            {loading ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </div>

      
      {result && result.status === 'success' && (
        <div>
          
          <div style={{
            background: result.total_impact > 500000 ? '#ef444420' : '#f59e0b20',
            border: `1px solid ${result.total_impact > 500000 ? '#ef4444' : '#f59e0b'}`,
            borderRadius: 10,
            padding: '14px 18px',
            marginBottom: 16,
            fontSize: 14,
            fontWeight: 700,
            color: result.total_impact > 500000 ? '#ef4444' : '#f59e0b'
          }}>
            {result.recommendation}
          </div>

          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 20
          }}>
            {[
              { label: 'Orders Affected', value: result.orders_affected, color: '#3b82f6' },
              { label: 'Missed Deadlines', value: result.missed_deadlines, color: '#ef4444' },
              { label: 'Extra Demurrage', value: `₹${(result.extra_demurrage / 100000).toFixed(1)}L`, color: '#f59e0b' },
              { label: 'Total Impact', value: `₹${result.total_impact_lakh}L`, color: '#ef4444' },
            ].map((item, i) => (
              <div key={i} style={{
                background: '#1e293b',
                borderRadius: 10,
                padding: '16px',
                borderTop: `3px solid ${item.color}`
              }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>

          
          {result.missed_orders.length > 0 && (
            <div style={{ background: '#1e293b', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>
                Orders That Will Miss Deadline
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['Order ID', 'Product', 'Priority', 'Deadline', 'Penalty'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px',
                        textAlign: 'left',
                        color: '#64748b',
                        fontWeight: 600,
                        borderBottom: '1px solid #334155'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.missed_orders.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #0f172a' }}>
                      <td style={{ padding: '10px 14px', color: '#3b82f6', fontWeight: 600 }}>{row.order_id}</td>
                      <td style={{ padding: '10px 14px', color: '#f1f5f9' }}>{row.product}</td>
                      <td style={{ padding: '10px 14px' }}><Badge text={row.priority} /></td>
                      <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{row.deadline}</td>
                      <td style={{ padding: '10px 14px', color: '#ef4444', fontWeight: 700 }}>
                        ₹{row.penalty.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{
                marginTop: 12,
                padding: '10px 14px',
                background: '#ef444415',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>Total Penalty Cost</span>
                <span style={{ color: '#ef4444', fontWeight: 800 }}>
                  ₹{result.total_penalty.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {result && result.status === 'error' && (
        <div style={{
          background: '#ef444420',
          border: '1px solid #ef4444',
          borderRadius: 8,
          padding: '14px 18px',
          color: '#ef4444'
        }}>
          {result.message}
        </div>
      )}
    </div>
  );
}

function AlertBanner({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  const colorMap = {
    danger: { bg: '#ef444420', border: '#ef4444', text: '#ef4444' },
    warning: { bg: '#f59e0b20', border: '#f59e0b', text: '#f59e0b' },
    success: { bg: '#1e293b', border: '#334155', text: '#64748b' },
  };

  return (
    <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {alerts.map((alert, i) => {
        const c = colorMap[alert.type] || colorMap.warning;
        return (
          <div key={i} style={{
            background: c.bg,
            border: `1px solid ${c.border}`,
            borderLeft: `4px solid ${c.border}`,
            borderRadius: 8,
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ color: c.text, fontWeight: 700, fontSize: 13 }}>
                {alert.title}
              </div>
              <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
                {alert.detail}
              </div>
            </div>
            <span style={{
              background: c.border,
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 10px',
              borderRadius: 20
            }}>
              {alert.type.toUpperCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [summary, setSummary] = useState(null);
  const [plan, setPlan] = useState(null);
  const [orders, setOrders] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [savings, setSavings] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, p, o, f, a, sv] = await Promise.all([
        axios.get(`${API}/summary`),
        axios.get(`${API}/rake-plan`),
        axios.get(`${API}/orders`),
        axios.get(`${API}/forecast`),
        axios.get(`${API}/alerts`),
        axios.get(`${API}/cost-savings`),
      ]);
      setSummary(s.data.summary);
      setPlan(p.data);
      setOrders(o.data);
      setForecast(f.data);
      setAlerts(a.data.alerts || []);
      setSavings(sv.data);
    } catch (e) {
      console.error('API error:', e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'rakeplan', label: 'Rake Plan', icon: Train },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'forecast', label: 'Forecast', icon: BarChart },
    { id: 'whatif', label: 'What-If', icon: AlertTriangle },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      <div style={{
        width: 220,
        background: '#1e293b',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        borderRight: '1px solid #334155'
      }}>

        <div style={{ marginBottom: 28, paddingLeft: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Train size={24} color="#3b82f6" />
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#f1f5f9' }}>RakeAI</div>
              <div style={{ fontSize: 10, color: '#475569' }}>SAIL Bokaro</div>
            </div>
          </div>
        </div>


        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setPage(id)} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            background: page === id ? '#3b82f622' : 'transparent',
            color: page === id ? '#3b82f6' : '#64748b',
            fontWeight: page === id ? 700 : 400,
            fontSize: 14,
            textAlign: 'left',
            width: '100%'
          }}>
            <Icon size={17} />
            {label}
          </button>
        ))}


        <button onClick={fetchAll} style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid #334155',
          cursor: 'pointer',
          background: 'transparent',
          color: '#64748b',
          fontSize: 13
        }}>
          <RefreshCw size={14} />
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>


      <div style={{ flex: 1, padding: 28, overflowY: 'auto' }}>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>
              {navItems.find(n => n.id === page)?.label}
            </h1>
            <p style={{ fontSize: 13, color: '#475569' }}>
              SAIL Bokaro Steel Plant — Rake Formation System
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#1e293b',
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 12,
            color: '#10b981'
          }}>
            <CheckCircle size={13} />
            System Active
          </div>
        </div>


        {page === 'dashboard' && (
          <>
            <AlertBanner alerts={alerts} />
            <SavingsCard savings={savings} />
            <Dashboard summary={summary} />
          </>
        )}
        {page === 'rakeplan' && <RakePlan plan={plan} onRefresh={fetchAll} />}
        {page === 'orders' && <Orders orders={orders} />}
        {page === 'forecast' && <Forecast forecast={forecast} />}
        {page === 'whatif' && <WhatIf />}
      </div>
    </div>
  );
}