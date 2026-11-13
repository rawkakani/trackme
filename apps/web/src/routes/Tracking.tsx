import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { useLive } from "../lib/live";

export function Tracking({ token }: { token: string }) {
  const key = ["tracking", token];
  const q = useQuery({ queryKey: key, queryFn: () => apiGet<any>(`/v1/track/${token}`) });
  useLive(key, `/v1/track/${token}/stream`, "tracking");
  const v = q.data;
  if (q.isLoading) return <div className="page"><div className="muted">Loading…</div></div>;
  if (q.error || !v) return <div className="page"><div className="h1">Not found</div></div>;

  const place = v.queue;
  return (
    <div className="page">
      {v.state === "waiting" && (
        <>
          <div className="muted">Your place in today’s queue</div>
          <div className="big">{place.position}{ordinal(place.position)}</div>
          <div className="muted">of {place.total} today · {place.ahead} ahead of you</div>
          <div className="meter"><div style={{width: `${(place.position/place.total)*100}%`}} /></div>
          {v.eta && <div className="card"><div className="muted">Most likely</div><div className="h1">{fmtTime(v.eta.at)}</div><div className="muted">{v.eta.basis === 'live' ? 'Based on live location' : v.eta.basis === 'queue' ? 'Estimate from the queue' : 'Estimate from the schedule'}</div></div>}
          <div className="muted" style={{marginTop:8}}>You booked {v.appointment.kind === 'window' ? `a window ${fmtRange(v.appointment)}` : `an exact time ${fmtTime(v.appointment.start)}`}</div>
        </>
      )}
      {v.state === "your_turn" && (
        <>
          <div className="muted">On the way</div>
          <div className="big">{v.eta ? minsFromNow(v.eta.at) : "—"}</div>
          <div className="h1">{v.technician?.name || "Technician"} is on the way</div>
          {v.technician?.distanceMeters != null && <div className="muted">{(v.technician.distanceMeters/1000).toFixed(1)} km away</div>}
          {v.eta && <div className="muted">Most likely {fmtTime(v.eta.at)}</div>}
          {v.contact?.phone && <div className="bottom"><a className="btn" href={`tel:${v.contact.phone}`}>Call</a></div>}
        </>
      )}
      {v.state === "on_site" && (
        <>
          <div className="big">Here</div>
          <div className="h1">{v.technician?.name || "Technician"} has arrived</div>
          <div className="muted">{v.service || "Service in progress"}</div>
        </>
      )}
      {v.state === "done" && (
        <>
          <div className="big">Done</div>
          <div className="h1">All complete</div>
          <div className="muted">{v.service || "Service completed"}</div>
        </>
      )}
      {(v.state === "unable" || v.state === "cancelled") && (
        <>
          <div className="big">Not today</div>
          <div className="card">
            <div className="h1" style={{fontSize:'1.1rem'}}>{v.state === 'cancelled' ? 'Cancelled' : "Couldn't complete"}</div>
            <div className="muted">{v.message || "Please contact support for next steps."}</div>
          </div>
          {v.contact?.phone && <div className="bottom"><a className="btn" href={`tel:${v.contact.phone}`}>Call</a></div>}
        </>
      )}
      <div style={{marginTop:24}} className="muted">Order {v.orderId} · {v.status}</div>
    </div>
  );
}

function ordinal(n:number){const s=["th","st","nd","rd"],v=n%100;return s[(v-20)%10]||s[v]||s[0]}
function fmtTime(iso?:string|null){if(!iso) return "—"; const d=new Date(iso); return d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
function fmtRange(a:any){return `${fmtTime(a.start)}–${fmtTime(a.end)}`}
function minsFromNow(iso:string){const m=Math.max(1,Math.round((new Date(iso).getTime()-Date.now())/60000)); return `${m} min`}
