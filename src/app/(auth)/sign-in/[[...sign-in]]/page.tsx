"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

import { useCurrentTheme } from "@/hooks/use-current-theme";

export default function SignInPage() {
  const currentTheme = useCurrentTheme();

  return (
    <SignIn
      appearance={{
        elements: {
          cardBox: "border! shadow-none! border-lg!"
        },
        baseTheme: currentTheme === "dark" ? dark : undefined,
      }}
    />
  );
}
