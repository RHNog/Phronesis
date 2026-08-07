"use client";

import { useCallback, useEffect, useState } from "react";
import AccountInviteLink from "@/components/auth/AccountInviteLink";
import CaseSourceAccessManagement from "@/components/auth/CaseSourceAccessManagement";
import CopyTextButton from "@/components/ui/CopyTextButton";
import {
  MEMBERSHIP_ROLES,
  MODULE_ACCESS_LEVELS,
  PHRONESIS_MODULES,
  type MembershipRole,
  type ModuleAccessLevel,
  type ModuleEntitlement,
  type PhronesisModule,
} from "@/lib/auth/domain";

type Member = {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  role: MembershipRole;
  status: "ACTIVE" | "DISABLED";
  entitlements: ModuleEntitlement[];
};

type AccessRequest = {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
};

function label(value: string): string {
  return value.toLowerCase().replaceAll("_", " ").replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function casePreparationSelection(): Record<
  PhronesisModule,
  ModuleAccessLevel | "NONE"
> {
  return Object.fromEntries(
    PHRONESIS_MODULES.map((module) => [
      module,
      module === "INVENTORY" ? "OPERATE" : "NONE",
    ]),
  ) as Record<PhronesisModule, ModuleAccessLevel | "NONE">;
}

function eventLedgerSelection(): Record<
  PhronesisModule,
  ModuleAccessLevel | "NONE"
> {
  return Object.fromEntries(
    PHRONESIS_MODULES.map((module) => [
      module,
      module === "EVENT_LEDGER" ? "OPERATE" : "NONE",
    ]),
  ) as Record<PhronesisModule, ModuleAccessLevel | "NONE">;
}

function entitlementSelection(
  entitlements: readonly ModuleEntitlement[],
): Record<PhronesisModule, ModuleAccessLevel | "NONE"> {
  return Object.fromEntries(PHRONESIS_MODULES.map((module) => [
    module,
    entitlements.find((entry) => entry.module === module)?.access ?? "NONE",
  ])) as Record<PhronesisModule, ModuleAccessLevel | "NONE">;
}

function MemberEntitlements({ member, onSaved }: { member: Member; onSaved: () => Promise<void> }) {
  const [values, setValues] = useState<Record<PhronesisModule, ModuleAccessLevel | "NONE">>(() => entitlementSelection(member.entitlements));
  const [status, setStatus] = useState<string | null>(null);

  async function save(
    nextValues: Record<PhronesisModule, ModuleAccessLevel | "NONE"> = values,
  ): Promise<void> {
    setStatus("Saving…");
    const entitlements = PHRONESIS_MODULES.flatMap((module) =>
      nextValues[module] === "NONE" ? [] : [{ module, access: nextValues[module] as ModuleAccessLevel }],
    );
    const response = await fetch(`/api/administration/memberships/${member.id}/entitlements`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entitlements }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: string };
      setStatus(body.error ?? "Entitlements could not be saved.");
      return;
    }
    setStatus("Saved");
    await onSaved();
  }

  async function addEventLedger(): Promise<void> {
    const savedValues = entitlementSelection(member.entitlements);
    const nextValues = {
      ...savedValues,
      EVENT_LEDGER:
        savedValues.EVENT_LEDGER === "ADMIN" ? "ADMIN" as const : "OPERATE" as const,
    };
    setValues(nextValues);
    await save(nextValues);
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {PHRONESIS_MODULES.map((module) => (
        <label key={module} className="text-xs font-medium text-zinc-400">
          {label(module)}
          <select
            value={values[module]}
            onChange={(event) => setValues((current) => ({ ...current, [module]: event.target.value as ModuleAccessLevel | "NONE" }))}
            className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100"
          >
            <option value="NONE">Not assigned</option>
            {MODULE_ACCESS_LEVELS.map((access) => <option key={access} value={access}>{label(access)}</option>)}
          </select>
          {module === "INVENTORY" ? (
            <span className="mt-1 block text-[11px] text-emerald-300">
              Operate enables private Case Source preparation.
            </span>
          ) : null}
          {module === "EVENT_LEDGER" ? (
            <span className="mt-1 block text-[11px] text-sky-300">
              Changes apply to an ongoing ledger on the next request.
            </span>
          ) : null}
        </label>
      ))}
      <div className="flex flex-wrap items-end gap-3">
        <button
          type="button"
          onClick={() => void addEventLedger()}
          className="min-h-11 rounded-lg border border-sky-800 px-4 text-sm font-semibold text-sky-200"
        >
          Add Event Ledger
        </button>
        <button type="button" onClick={() => void save()} className="min-h-11 rounded-lg bg-cyan-300 px-4 text-sm font-semibold text-zinc-950 hover:bg-cyan-200">
          Save modules
        </button>
        {status ? <span role="status" className="pb-3 text-xs text-zinc-400">{status}</span> : null}
      </div>
    </div>
  );
}

function PendingAccessRequest({ request, onDecided }: { request: AccessRequest; onDecided: () => Promise<void> }) {
  const [role, setRole] = useState<Exclude<MembershipRole, "OWNER">>("VIEWER");
  const [values, setValues] = useState<Record<PhronesisModule, ModuleAccessLevel | "NONE">>(() =>
    Object.fromEntries(PHRONESIS_MODULES.map((module) => [module, "NONE"])) as Record<PhronesisModule, ModuleAccessLevel | "NONE">,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function decide(action: "APPROVE" | "REJECT") {
    const entitlements = PHRONESIS_MODULES.flatMap((module) => values[module] === "NONE" ? [] : [{ module, access: values[module] as ModuleAccessLevel }]);
    if (action === "APPROVE" && !entitlements.length) {
      setMessage("Assign at least one module before approval.");
      return;
    }
    if (action === "REJECT" && !window.confirm(`Reject the access request from ${request.email}?`)) return;
    setBusy(true);
    setMessage(action === "APPROVE" ? "Approving…" : "Rejecting…");
    const response = await fetch("/api/administration/access-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "APPROVE" ? { action, requestId: request.id, role, entitlements } : { action, requestId: request.id }),
    });
    const body = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) {
      setMessage(body.error ?? "Access request could not be decided.");
      setBusy(false);
      return;
    }
    await onDecided();
  }

  return (
    <article className="rounded-xl border border-amber-800/70 bg-amber-950/15 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-white">{request.name ?? "Unnamed account"}</p><p className="mt-1 text-sm text-zinc-400">{request.email}</p><p className="mt-1 text-xs text-zinc-600">Requested {new Date(request.requestedAt).toLocaleString()}</p></div><span className="rounded-full border border-amber-700 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">Pending</span></div>
      <p className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 text-xs leading-5 text-zinc-400"><span className="font-semibold text-zinc-200">Verify this person outside Phronesis before approval.</span> The submitted email is not yet independently verified.</p>
      <label className="mt-4 block max-w-xs text-xs font-medium text-zinc-400">Role<select value={role} onChange={(event) => setRole(event.target.value as Exclude<MembershipRole, "OWNER">)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100">{MEMBERSHIP_ROLES.filter((option) => option !== "OWNER").map((option) => <option key={option} value={option}>{label(option)}</option>)}</select></label>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setValues(casePreparationSelection())} className="min-h-11 rounded-lg border border-emerald-800 px-3 text-sm font-semibold text-emerald-200">Case preparation only</button>
        <button
          type="button"
          onClick={() => {
            setRole("OPERATOR");
            setValues(eventLedgerSelection());
          }}
          className="min-h-11 rounded-lg border border-sky-800 px-3 text-sm font-semibold text-sky-200"
        >
          Event Ledger only
        </button>
      </div>
      <fieldset className="mt-4"><legend className="text-sm font-medium text-zinc-300">Modules granted on approval</legend><div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{PHRONESIS_MODULES.map((module) => <label key={module} className="text-xs text-zinc-400">{label(module)}<select value={values[module]} onChange={(event) => setValues((current) => ({ ...current, [module]: event.target.value as ModuleAccessLevel | "NONE" }))} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-zinc-100"><option value="NONE">Not assigned</option>{MODULE_ACCESS_LEVELS.map((access) => <option key={access} value={access}>{label(access)}</option>)}</select>{module === "INVENTORY" ? <span className="mt-1 block text-[11px] text-emerald-300">Operate enables private Case Source preparation.</span> : null}{module === "EVENT_LEDGER" ? <span className="mt-1 block text-[11px] text-sky-300">Access works immediately, including during an ongoing event.</span> : null}</label>)}</div></fieldset>
      <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" disabled={busy} onClick={() => void decide("APPROVE")} className="min-h-11 rounded-lg bg-cyan-300 px-4 text-sm font-semibold text-zinc-950 disabled:opacity-50">Approve and assign modules</button><button type="button" disabled={busy} onClick={() => void decide("REJECT")} className="min-h-11 rounded-lg border border-rose-800 px-4 text-sm font-semibold text-rose-200 disabled:opacity-50">Reject</button>{message ? <span role="status" className="text-xs text-zinc-400">{message}</span> : null}</div>
    </article>
  );
}

export default function AccessManagement({
  active,
  restrictedPublicOrigin,
  caseSourceSheetUrl,
}: {
  active: boolean;
  restrictedPublicOrigin: string | null;
  caseSourceSheetUrl: string | null;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MembershipRole>("OPERATOR");
  const [inviteModules, setInviteModules] = useState<Record<PhronesisModule, ModuleAccessLevel | "NONE">>(() =>
    Object.fromEntries(PHRONESIS_MODULES.map((module) => [
      module,
      module === "VENDOR_WORKSPACE" ? "OPERATE" : "NONE",
    ])) as Record<PhronesisModule, ModuleAccessLevel | "NONE">,
  );
  const [activation, setActivation] = useState<{ code: string; url: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [directoryStatus, setDirectoryStatus] = useState<
    "LOADING" | "READY" | "ERROR"
  >("LOADING");

  const load = useCallback(async () => {
    if (!active) return;
    setDirectoryStatus("LOADING");
    const [memberResponse, requestResponse] = await Promise.all([
      fetch("/api/administration/memberships", { cache: "no-store" }),
      fetch("/api/administration/access-requests", { cache: "no-store" }),
    ]);
    if (!memberResponse.ok || !requestResponse.ok) {
      setMessage("People and access requests could not be loaded.");
      setDirectoryStatus("ERROR");
      return;
    }
    const memberBody = await memberResponse.json() as { memberships: Member[] };
    const requestBody = await requestResponse.json() as { requests: AccessRequest[] };
    setMembers(memberBody.memberships);
    setRequests(requestBody.requests);
    setDirectoryStatus("READY");
  }, [active]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    Promise.all([
      fetch("/api/administration/memberships", { cache: "no-store" }),
      fetch("/api/administration/access-requests", { cache: "no-store" }),
    ]).then(async ([memberResponse, requestResponse]) => {
      if (cancelled) return;
      if (!memberResponse.ok || !requestResponse.ok) {
        setMessage("People and access requests could not be loaded.");
        setDirectoryStatus("ERROR");
        return;
      }
      const memberBody = await memberResponse.json() as { memberships: Member[] };
      const requestBody = await requestResponse.json() as { requests: AccessRequest[] };
      if (!cancelled) {
        setMembers(memberBody.memberships);
        setRequests(requestBody.requests);
        setDirectoryStatus("READY");
      }
    }).catch(() => {
      if (!cancelled) {
        setMessage("People and access requests could not be loaded.");
        setDirectoryStatus("ERROR");
      }
    });
    return () => { cancelled = true; };
  }, [active]);

  async function invite(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMessage("Creating invitation…");
    setActivation(null);
    const entitlements = PHRONESIS_MODULES.flatMap((module) =>
      inviteModules[module] === "NONE"
        ? []
        : [{ module, access: inviteModules[module] as ModuleAccessLevel }],
    );
    if (!entitlements.length) {
      setMessage("Assign at least one module before creating the employee invitation.");
      return;
    }
    const response = await fetch("/api/administration/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role, entitlements }),
    });
    const body = await response.json().catch(() => ({})) as { activationCode?: string; error?: string; expiresAt?: string };
    if (!response.ok) {
      setMessage(body.error ?? "Invitation could not be created.");
      return;
    }
    setEmail("");
    if (!body.activationCode) {
      setMessage("Invitation was created without an activation code. Revoke it and try again.");
      return;
    }
    setActivation({
      code: body.activationCode,
      url: `${window.location.origin}/activate#code=${encodeURIComponent(body.activationCode)}`,
    });
    setMessage(`Invitation expires ${new Date(body.expiresAt as string).toLocaleString()}. The code below is shown only in this response.`);
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5" aria-labelledby="access-management-title">
      <h3 id="access-management-title" className="text-lg font-semibold text-white">People and module access</h3>
      {!active ? (
        <div className="mt-3 rounded-lg border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
          <p className="font-semibold">Employee login readiness checklist</p>
          <ol className="mt-2 list-decimal space-y-2 pl-5">
            <li>Set <code>BETTER_AUTH_URL</code> and a strong <code>BETTER_AUTH_SECRET</code> in <code>.env.local</code>.</li>
            <li>Optionally configure a private GitHub OAuth App if GitHub sign-in should remain available.</li>
            <li>Run <code>npm run auth:migrate</code> and <code>npm run auth:bootstrap-owner -- your-github-email</code>.</li>
            <li>Start with <code>PHRONESIS_AUTH_MODE=OPTIONAL</code>, restart Phronesis, and verify the owner GitHub sign-in.</li>
            <li>Create the employee code here, test the activation link and assigned modules, then promote the mode to <code>REQUIRED</code>.</li>
          </ol>
        </div>
      ) : (
        <>
          <AccountInviteLink
            restrictedPublicOrigin={restrictedPublicOrigin}
          />
          <CaseSourceAccessManagement
            members={members}
            sheetUrl={caseSourceSheetUrl}
            directoryStatus={directoryStatus}
          />
          <div className="mt-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold text-white">Pending accounts</p><p className="mt-1 text-sm text-zinc-400">Accounts stay outside every module until you verify the person and approve exact access.</p></div><span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300">{requests.length} waiting</span></div>{requests.length ? <div className="mt-4 space-y-4">{requests.map((request) => <PendingAccessRequest key={request.id} request={request} onDecided={load} />)}</div> : <p className="mt-3 rounded-lg border border-dashed border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-500">No accounts are waiting for approval.</p>}</div>
          <details className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4"><summary className="min-h-11 cursor-pointer content-center text-sm font-semibold text-zinc-200">Create a direct invitation instead</summary><p className="mt-2 text-sm leading-6 text-zinc-500">Optional owner-initiated flow. Assign modules now and send a single-use activation link.</p><form onSubmit={invite} className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <label className="text-sm text-zinc-300">Employee email
              <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-zinc-100" />
            </label>
            <label className="text-sm text-zinc-300">Role
              <select value={role} onChange={(event) => setRole(event.target.value as MembershipRole)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-zinc-100">
                {MEMBERSHIP_ROLES.map((option) => <option key={option} value={option}>{label(option)}</option>)}
              </select>
            </label>
            </div>
            <fieldset>
              <legend className="text-sm font-medium text-zinc-300">Assigned modules</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setInviteModules(Object.fromEntries(PHRONESIS_MODULES.map((module) => [module, module === "ARTWORK_REVIEW" ? "OPERATE" : "NONE"])) as Record<PhronesisModule, ModuleAccessLevel | "NONE">)}
                  className="min-h-11 rounded-lg border border-violet-700 px-3 text-sm font-semibold text-violet-200"
                >
                  Artwork Review only
                </button>
                <button
                  type="button"
                  onClick={() => setInviteModules(casePreparationSelection())}
                  className="min-h-11 rounded-lg border border-emerald-800 px-3 text-sm font-semibold text-emerald-200"
                >
                  Case preparation only
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole("OPERATOR");
                    setInviteModules(eventLedgerSelection());
                  }}
                  className="min-h-11 rounded-lg border border-sky-800 px-3 text-sm font-semibold text-sky-200"
                >
                  Event Ledger only
                </button>
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {PHRONESIS_MODULES.map((module) => (
                  <label key={module} className="text-xs text-zinc-400">{label(module)}
                    <select value={inviteModules[module]} onChange={(event) => setInviteModules((current) => ({ ...current, [module]: event.target.value as ModuleAccessLevel | "NONE" }))} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-zinc-100">
                      <option value="NONE">Not assigned</option>
                      {MODULE_ACCESS_LEVELS.map((access) => <option key={access} value={access}>{label(access)}</option>)}
                    </select>
                    {module === "INVENTORY" ? <span className="mt-1 block text-[11px] text-emerald-300">Operate enables private Case Source preparation.</span> : null}
                    {module === "EVENT_LEDGER" ? <span className="mt-1 block text-[11px] text-sky-300">Access works immediately, including during an ongoing event.</span> : null}
                  </label>
                ))}
              </div>
            </fieldset>
            <button type="submit" className="min-h-11 rounded-lg bg-cyan-300 px-4 font-semibold text-zinc-950 hover:bg-cyan-200">Create employee code</button>
          </form></details>
          {message ? <p role="status" className="mt-3 text-sm text-zinc-400">{message}</p> : null}
          {activation ? (
            <div className="mt-4 rounded-lg border border-cyan-800 bg-cyan-950/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Single-use activation</p>
              <p className="mt-2 break-all font-mono text-sm text-white">{activation.code}</p>
              <div className="mt-3">
                <CopyTextButton value={activation.url} label="Copy private activation link" copiedLabel="Activation link copied" manualLabel="Private activation link" className="min-h-11 rounded-lg border border-cyan-700 px-4 text-sm font-semibold text-cyan-200" />
              </div>
            </div>
          ) : null}
          <div className="mt-6 space-y-4">
            {members.map((member) => (
              <article key={member.id} className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><p className="font-medium text-zinc-100">{member.name ?? member.email ?? member.userId}</p><p className="text-xs text-zinc-500">{member.email ?? member.userId}</p></div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">{label(member.role)} · {label(member.status)}</p>
                </div>
                <MemberEntitlements key={`${member.id}:${JSON.stringify(member.entitlements)}`} member={member} onSaved={load} />
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
