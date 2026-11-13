import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import { Tracking } from "./routes/Tracking";
import { TechDay } from "./routes/TechDay";
import { TechTask } from "./routes/TechTask";

const qc = new QueryClient();

function App() {
  const [tick, setTick] = useState(0);
  const path = window.location.pathname;
  useMemo(()=>{ const onPop=()=>setTick(t=>t+1); window.addEventListener('popstate', onPop); return ()=>window.removeEventListener('popstate', onPop); },[]);
  const nav = (p:string)=>{ window.history.pushState({},'',p); setTick(t=>t+1); };

  let m = path.match(/^\/t\/([^/]+)$/);
  if (m) return <Tracking token={m[1]!} />;
  m = path.match(/^\/tech\/([^/]+)$/);
  if (m) return <TechDay token={m[1]!} onOpen={(id)=>nav(`/tech/${m[1]}/${id}`)} />;
  m = path.match(/^\/tech\/([^/]+)\/(ord_[A-Za-z0-9]+)$/);
  if (m) return <TechTask token={m[1]!} orderId={m[2]!} onBack={()=>nav(`/tech/${m[1]}`)} />;

  return <div className="page"><div className="h1">SD</div><div className="muted">Service delivery tracking</div></div>;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
