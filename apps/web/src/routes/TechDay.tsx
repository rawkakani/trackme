import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { useLive } from "../lib/live";

export function TechDay({ token, onOpen }: { token: string; onOpen: (id:string)=>void }) {
  const date = new Date().toISOString().slice(0,10);
  const key = ["techday", token, date];
  const q = useQuery({ queryKey: key, queryFn: () => apiGet<any>(`/v1/tech/${token}/day?date=${date}`) });
  useLive(key, `/v1/tech/${token}/stream`, "day");
  const v = q.data;
  if (q.isLoading) return <div className="page">Loading…</div>;
  if (!v) return <div className="page">Not found</div>;
  return (
    <div className="page">
      <div className="h1">Today</div>
      <div className="muted" style={{marginBottom:12}}>{v.counts.remaining} left · {v.counts.done} done</div>
      {v.tasks.length === 0 && <div className="card">Nothing booked today.</div>}
      <div className="stack">
        {v.tasks.map((t:any)=> (
          <button key={t.orderId} className="card" style={{textAlign:'left',border:0}} onClick={()=>onOpen(t.orderId)}>
            <div style={{display:'flex',justifyContent:'space-between',gap:8}}>
              <div>
                <div style={{fontWeight:800}}>{t.position}. {t.customerName || 'Customer'}</div>
                <div className="muted">{t.addressLine}</div>
                <div className="muted">{t.appointment.kind==='window'?`${fmt(t.appointment.start)}–${fmt(t.appointment.end)}`:fmt(t.appointment.start)} · {t.service||'Service'}</div>
              </div>
              <div className="badge">{t.status}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
function fmt(iso?:string|null){if(!iso) return ''; return new Date(iso).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
