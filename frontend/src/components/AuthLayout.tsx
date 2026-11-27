import type { ReactNode } from "react";
import { MessageSquareText, TicketCheck } from "lucide-react";

/** Shared frame for sign-in / register. The perforated ticket stub is the one decorative element. */
export default function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-teal-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <TicketCheck className="text-amber-300" /> SupportDesk
        </div>

        <div className="relative my-12 max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">Every request gets an answer, and a record.</h2>
          <p className="mt-4 text-teal-100">Raise a ticket, follow its status and talk to the support team in one place.</p>

          {/* ticket stub */}
          <div className="mt-10 flex rotate-[-2deg] overflow-hidden rounded-lg bg-amber-50 text-slate-900 shadow-xl">
            <div className="flex-1 p-5">
              <p className="text-xs text-slate-500">Ticket #A41F09 · In progress</p>
              <p className="mt-1 font-semibold">Can't sign in on mobile</p>
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <MessageSquareText size={15} className="text-teal-700" />
                Support replied 4 minutes ago
              </p>
            </div>
            <div className="w-5 border-l-2 border-dashed border-teal-900/30 bg-amber-100" />
          </div>
        </div>

        <p className="text-sm text-teal-200">Fast triage for support teams. Clear answers for the people they help.</p>
      </aside>

      <main className="flex items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 font-semibold tracking-tight text-teal-900 lg:hidden">
            <TicketCheck className="text-teal-700" /> SupportDesk
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mb-8 mt-1.5 text-slate-600">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
