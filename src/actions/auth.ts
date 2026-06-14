"use server";

import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/validation";
import { verifyCredentials } from "@/lib/services/auth-service";
import { createSession, destroySession } from "@/lib/session";
import { setFlash } from "@/lib/flash";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request-ip";
import { fullName } from "@/lib/current-user";
import type { Role } from "@/lib/constants";

export interface AuthFormState {
  error?: string;
  unverifiedEmail?: string;
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { email, password } = parsed.data;

  const ip = await requestIp();
  if (!rateLimit(`login:${ip}:${email}`, 10, 15 * 60 * 1000)) {
    return { error: "Too many login attempts. Try again in a few minutes." };
  }

  const result = await verifyCredentials(email, password);
  if (!result.ok) {
    if (result.reason === "unverified") {
      return {
        error: "Please verify your email before logging in.",
        unverifiedEmail: email,
      };
    }
    return { error: "Invalid email or password." };
  }

  await createSession({
    userId: result.user.id,
    role: result.user.role as Role,
    name: fullName(result.user),
  });

  const next = formData.get("next");
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    redirect(next);
  }
  redirect(result.user.role === "officer" ? "/officer/dashboard" : "/member/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  await setFlash("info", "You have been logged out.");
  redirect("/");
}
