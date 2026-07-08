"use client";

import Link from "next/link";
import { PricingTable } from "@clerk/nextjs";
import { Sparkles, BookOpen, AudioLines, History } from "lucide-react";
import { useSubscriptionPlan } from "@/hooks/useSubscriptionPlan";

const planHighlights = [
  {
    label: "Free",
    description: "Try the app without a card.",
    icon: BookOpen,
    path: "free",
    features: [
      "1 book limit",
      "5 sessions per month",
      "5-minute conversations",
      "No session history",
    ],
  },
  {
    label: "Standard",
    description: "For regular readers and note takers.",
    icon: History,
    path: "standard",
    features: [
      "Up to 10 books",
      "50 sessions per month",
      "15-minute conversations",
      "Full session history",
    ],
  },
  {
    label: "Pro",
    description: "For heavy use and long conversations.",
    icon: AudioLines,
    path: "pro",
    features: [
      "Up to 100 books",
      "100 sessions per month",
      "50-minute conversations",
      "Priority support",
    ],
  },
] as const;

export default function SubscriptionsPage() {
  const { plan, limits, hasSessionHistory } = useSubscriptionPlan();

  return (
    <main className="clerk-subscriptions">
      <section className="w-full rounded-[32px] border border-[rgba(33,42,59,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(245,240,232,0.92))] p-6 shadow-[0_18px_50px_rgba(33,42,59,0.08)] md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(33,42,59,0.12)] bg-white px-4 py-2 text-sm font-medium text-[var(--text-secondary)] shadow-soft-sm">
              <Sparkles className="h-4 w-4 text-[var(--accent-warm)]" />
              Choose the plan that fits your reading pace
            </div>
            <div>
              <h1 className="page-title text-left !text-4xl md:!text-5xl">
                Subscriptions
              </h1>
              <p className="page-description max-w-2xl text-left">
                Upgrade your library, unlock longer conversations, and keep your
                book discussions organized in one place.
              </p>
            </div>
          </div>

          <Link
            href="/books/new"
            className="btn btn-primary inline-flex w-fit items-center gap-2 self-start md:self-auto"
          >
            Add a book
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {planHighlights.map(({ label, description, icon: Icon, path, features }) => {
            const isActive = plan === path;

            return (
              <article
                key={label}
                className={`rounded-[24px] border p-5 transition-all ${isActive ? "border-[rgba(33,42,59,0.24)] bg-white shadow-soft-md" : "border-[rgba(33,42,59,0.1)] bg-[rgba(255,255,255,0.72)] shadow-soft-sm"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-light)] text-[var(--accent-warm)]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  {isActive ? (
                    <span className="rounded-full bg-[var(--accent-warm)] px-3 py-1 text-xs font-semibold text-white">
                      Current
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
                  {label}
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {description}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                  {features?.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-warm)]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-[24px] border border-[rgba(33,42,59,0.1)] bg-white p-5 shadow-soft-sm">
            <p className="text-sm text-[var(--text-secondary)]">Plan</p>
            <p className="mt-2 text-2xl font-bold text-[var(--text-primary)] capitalize">
              {plan}
            </p>
          </div>
          <div className="rounded-[24px] border border-[rgba(33,42,59,0.1)] bg-white p-5 shadow-soft-sm">
            <p className="text-sm text-[var(--text-secondary)]">Books</p>
            <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
              {limits.maxBooks}
            </p>
          </div>
          <div className="rounded-[24px] border border-[rgba(33,42,59,0.1)] bg-white p-5 shadow-soft-sm">
            <p className="text-sm text-[var(--text-secondary)]">
              Sessions / month
            </p>
            <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
              {limits.maxSessionsPerMonth}
            </p>
          </div>
          <div className="rounded-[24px] border border-[rgba(33,42,59,0.1)] bg-white p-5 shadow-soft-sm">
            <p className="text-sm text-[var(--text-secondary)]">History</p>
            <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
              {hasSessionHistory ? "On" : "Off"}
            </p>
          </div>
        </div>
      </section>

      <section className="clerk-pricing-table-wrapper mt-10 w-full rounded-[32px] border border-[rgba(33,42,59,0.08)] bg-[rgba(255,255,255,0.78)] p-4 shadow-[0_18px_50px_rgba(33,42,59,0.08)] md:p-8">
        <PricingTable
          for="user"
          highlightedPlan="pro"
          ctaPosition="bottom"
          collapseFeatures={false}
          newSubscriptionRedirectUrl="/subscriptions"
        />
      </section>
    </main>
  );
}
