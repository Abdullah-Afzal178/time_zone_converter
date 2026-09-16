import Link from "next/link";
import { Clock, Globe2 } from "lucide-react";

import { PoweredByBadge } from "@/components/powered-by-badge";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

const TABS = [
  { href: "/", label: "World Clock", icon: Globe2 },
  { href: "/convert", label: "Converter", icon: Clock },
];

export function SiteHeader({ active }: { active: "clock" | "convert" }) {
  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-indigo-950">
              <Globe2 className="h-5 w-5" />
            </span>
            <span className="text-xl font-semibold tracking-tight text-white">
              {SITE_NAME}
            </span>
          </Link>
          <p className="mt-1.5 text-sm text-white/50">{SITE_TAGLINE}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <nav className="flex rounded-full border border-white/15 bg-white/5 p-1">
            {TABS.map((tab) => {
              const isActive =
                (active === "clock" && tab.href === "/") ||
                (active === "convert" && tab.href === "/convert");
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                    isActive
                      ? "bg-amber-300 text-indigo-950"
                      : "text-white/60 hover:text-white",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
          <PoweredByBadge />
        </div>
      </div>
    </header>
  );
}
