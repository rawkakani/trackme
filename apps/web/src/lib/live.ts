import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useLive(queryKey: any[], streamUrl: string, eventName: string) {
  const qc = useQueryClient();
  useEffect(() => {
    let es: EventSource | null = null;
    let closed = false;
    let retry = 1000;
    const connect = () => {
      if (closed) return;
      es = new EventSource(streamUrl);
      es.addEventListener(eventName, (e: MessageEvent) => {
        try { qc.setQueryData(queryKey, JSON.parse(e.data)); } catch {}
      });
      es.onerror = () => {
        es?.close();
        if (!closed) setTimeout(connect, Math.min(retry, 10000));
        retry = Math.min(retry * 2, 10000);
      };
      es.onopen = () => { retry = 1000; };
    };
    connect();
    return () => { closed = true; es?.close(); };
  }, [streamUrl, eventName]);
}
