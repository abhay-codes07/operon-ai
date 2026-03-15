"use client";

import AnimatedShaderHero from "@/components/ui/animated-shader-hero";

export default function HeroDemo(): JSX.Element {
  return (
    <div className="w-full">
      <AnimatedShaderHero
        trustBadge={{
          text: "Trusted by forward-thinking teams.",
          icons: ["✨"],
        }}
        headline={{
          line1: "Launch Your",
          line2: "Workflow Into Orbit",
        }}
        subtitle="Supercharge productivity with AI-powered automation and integrations built for next-generation operations teams."
        buttons={{
          primary: {
            text: "Get Started for Free",
            onClick: () => {
              window.location.href = "/auth/sign-up";
            },
          },
          secondary: {
            text: "Explore Dashboard",
            onClick: () => {
              window.location.href = "/dashboard";
            },
          },
        }}
      />
    </div>
  );
}
