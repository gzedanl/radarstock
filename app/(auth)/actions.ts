"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const aceptaTerminos = formData.get("aceptaTerminos") === "on";
  const referralCode = String(formData.get("referralCode") ?? "").trim();

  if (!aceptaTerminos) {
    redirect(
      `/signup?error=${encodeURIComponent(
        "Debes aceptar los Términos de Servicio y la Política de Privacidad."
      )}`
    );
  }

  const supabase = await createClient();

  // El trigger que crea la empresa (handle_new_user, ver
  // supabase/migrations/0011_referidos.sql) lee este código desde
  // raw_user_meta_data para resolver quién refirió a este usuario.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: referralCode ? { data: { referral_code: referralCode } } : undefined,
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // La fila en `companies` la crea un trigger en auth.users (ver
  // supabase/migrations/0003_handle_new_user.sql), no este endpoint.

  if (data.user?.email) {
    // No debe bloquear ni romper el signup si el email falla.
    await sendWelcomeEmail(data.user.email);
  }

  if (!data.session) {
    redirect(
      `/login?message=${encodeURIComponent(
        "Cuenta creada. Revisa tu email para confirmarla antes de iniciar sesión."
      )}`
    );
  }

  redirect("/dashboard");
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
