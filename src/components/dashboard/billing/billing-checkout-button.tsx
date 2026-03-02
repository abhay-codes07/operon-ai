"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type BillingCheckoutButtonProps = {
  plan: "STARTER" | "GROWTH";
};

export function BillingCheckoutButton({ plan }: BillingCheckoutButtonProps): JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCheckout() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan }),
    });

    setLoading(false);

    if (!response.ok) {
      setError("Unable to initiate checkout");
      return;
    }

    const payload = (await response.json()) as { checkoutUrl?: string };
    if (!payload.checkoutUrl) {
      setError("No checkout URL returned");
      return;
    }

    router.push(payload.checkoutUrl);
  }

  return (
    <div className="space-y-1">
      <Button onClick={onCheckout} disabled={loading}>
        {loading ? "Redirecting..." : `Upgrade to ${plan}`}
      </Button>
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
