import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "../lib/api";
import { useEffect, useState } from "react";

export function TechTask({ token, orderId, onBack }: { token: string; orderId: string; onBack: ()=>void }) {
  const key = ["task", token, orderId];
  const qc = useQueryClient();
  const q = useQuery({ queryKey: key, queryFn: () => apiGet<any>(`/v1/tech/${token}/orders/${orderId}`) });
  const [note, setNote] = useState("");
  const [showUnable, setShowUnable] = useState(false);
  const t = q.data;

  useEffect(()=>{
    let watch: number | null = null;
    if (t?.status === 'en_route' && navigator.geolocation) {
      watch = navigator.geolocation.watchPosition((pos)=>{
        apiPost(`/v1/tech/${token}/location`, { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyMeters: pos.coords.accuracy }).catch(()=>{});
      }, ()=>{}, { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 });
    }
    return ()=>{ if (watch!=null) navigator.geolocation.clearWatch(watch); };
  }, [t?.status, token]);

  if (q.isLoading || !t) return <div className="page">Loading…</div>;
  const act = async (type: string, extra: any = {}) => {
    await apiPost(`/v1/tech/${token}/orders/${t.orderId}/actions`, { type, ...extra });
    await qc.invalidateQueries({queryKey:key});
    await qc.invalidateQueries({queryKey:["techday"]});
    if (type === 'complete' || type === 'unable') onBack();
  };

  const next = t.allowedActions?.[0];
  const label: any = { start: 'Start', arrive: 'Arrived', complete: 'Done' };
  return (
    <div className="page">
      <button onClick={onBack} className="btn secondary small" style={{marginBottom:12}}>Back</button>
      <div className="h1">{t.customerName || 'Customer'}</div>
      <div className="muted">{t.addressLine}</div>
      <div className="card">
        <div><strong>Service:</strong> {t.service || '—'}</div>
        <div><strong>Notes:</strong> {t.notes || '—'}</div>
        <div><strong>Time:</strong> {t.appointment.kind==='window'?`${fmt(t.appointment.start)}–${fmt(t.appointment.end)}`:fmt(t.appointment.start)}</div>
        {t.customer?.phone && <div><strong>Phone:</strong> <a href={`tel:${t.customer.phone}`}>{t.customer.phone}</a></div>}
      </div>
      <div className="stack" style={{marginTop:12}}>
        {t.directionsUrl && <a className="btn secondary" href={t.directionsUrl} target="_blank">Directions</a>}
        {t.customer?.phone && <a className="btn secondary" href={`sms:${t.customer.phone}`}>Message</a>}
      </div>
      <div className="bottom stack">
        {next && next !== 'unable' && <button className="btn" onClick={()=>act(next)}>{label[next] || next}</button>}
        {t.allowedActions?.includes('unable') && !showUnable && <button className="btn secondary" onClick={()=>setShowUnable(true)}>Can't complete</button>}
        {showUnable && (
          <div className="card" style={{margin:0}}>
            <div style={{fontWeight:700, marginBottom:8}}>Reason (shown to customer)</div>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} />
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="btn secondary" onClick={()=>setShowUnable(false)}>Cancel</button>
              <button className="btn" disabled={!note.trim()} onClick={()=>act('unable',{note})}>Submit</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function fmt(iso?:string|null){if(!iso) return ''; return new Date(iso).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
