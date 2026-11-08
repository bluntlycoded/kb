import { Gamepad2, MessagesSquare, Newspaper, Sparkles } from "lucide-react";
import { Logo } from "@/components/shell/logo";

const POINTS = [
  { icon: Sparkles, title: "Recognition that counts", text: "Praise colleagues and earn points for great work." },
  { icon: Gamepad2, title: "Play together", text: "See who's free and invite them to a quick quiz." },
  { icon: MessagesSquare, title: "Chat and groups", text: "Direct messages and team groups in one place." },
  { icon: Newspaper, title: "News that matters", text: "Local updates and news from your industry." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="relative hidden overflow-hidden bg-brand text-brand-fg lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgb(255 255 255 / 0.35), transparent 40%), radial-gradient(circle at 85% 75%, rgb(255 255 255 / 0.25), transparent 45%)",
          }}
          aria-hidden
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2.5 text-lg font-bold">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white/15">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                <path d="M5 12a7 7 0 0 1 12-4.9M19 12a7 7 0 0 1-12 4.9" />
                <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
              </svg>
            </span>
            Engage
          </span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl leading-tight font-bold tracking-tight">Where great work gets noticed.</h2>
          <p className="mt-3 text-lg opacity-85">One home for recognition, news, games and conversations across your company.</p>
          <ul className="mt-10 space-y-5">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm opacity-80">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm opacity-70">Trusted by teams in logistics, pharma, retail and more.</p>
      </section>

      <main className="flex min-w-0 flex-col px-5 py-8 sm:px-10">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
