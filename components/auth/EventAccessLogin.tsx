"use client";
import { useState } from "react";

export default function EventAccessLogin({ callbackURL = "/vendor" }: { callbackURL?: string }) {
  const [code, setCode] = useState(""); const [message, setMessage] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); setBusy(true); setMessage(null); const response=await fetch("/api/auth/event-access",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code})}); const body=await response.json().catch(()=>({})) as {destination?:string;error?:string}; if(response.ok){window.location.assign(body.destination??callbackURL);return;} setMessage(body.error??"Code could not be accepted.");setBusy(false); }
  return <form onSubmit={submit} className="mt-5 border-t border-zinc-800 pt-5">
    <h2 className="font-semibold text-white">Event worker</h2><p className="mt-1 text-sm text-zinc-400">No account required. Enter the code provided by the event owner.</p>
    <label className="mt-4 block text-sm text-zinc-300">Event access code<input required autoCapitalize="characters" autoComplete="one-time-code" inputMode="text" value={code} onChange={(e)=>setCode(e.target.value)} placeholder="XXXX-XXXX-XXXX-XXXX" className="mt-1 min-h-12 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 font-mono uppercase tracking-wider text-white" /></label>
    <button disabled={busy} className="mt-3 min-h-12 w-full rounded-lg border border-cyan-700 px-4 font-semibold text-cyan-200 disabled:opacity-60">{busy?"Checking…":"Enter event workspace"}</button>{message?<p role="alert" className="mt-3 text-sm text-amber-200">{message}</p>:null}
  </form>;
}
