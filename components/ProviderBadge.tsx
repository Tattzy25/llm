import React from "react";

type Provider = "openai" | "anthropic" | "google" | "meta" | "mistral" | "other";

const providerStyles: Record<Provider, string> = {
  openai: "bg-[#10a37f]",
  anthropic: "bg-[#171717]",
  google: "bg-[#4285F4]",
  meta: "bg-[#0064e0]",
  mistral: "bg-[#ff6b00]",
  other: "bg-gray-400",
};

export function ProviderBadge({ provider = "other", rounded = "full" as const }: { provider?: Provider; rounded?: "full" | "md" }) {
  const shape = rounded === "md" ? "rounded-md" : "rounded-full";
  return <span className={["inline-block w-6 h-6", shape, providerStyles[provider]].join(" ")} />;
}
