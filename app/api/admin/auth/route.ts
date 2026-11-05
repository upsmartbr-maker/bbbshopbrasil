import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const ADMIN_SESSION_COOKIE = "bbb_admin_session";

export async function GET() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(sessionCookie, "base64").toString("utf-8")
    ) as { email?: string; accessToken?: string; mode?: string };

    if (decoded.mode === "supabase" && decoded.accessToken && isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.getUser(decoded.accessToken);
      if (error || !data?.user) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
      }
      return NextResponse.json({
        authenticated: true,
        email: data.user.email ?? decoded.email,
        mode: "supabase",
      });
    }

    if (decoded.email) {
      return NextResponse.json({
        authenticated: true,
        email: decoded.email,
        mode: decoded.mode ?? "local",
      });
    }
  } catch {
    /* cookie inválido */
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function POST(request: Request) {
  let body: {
    action?: string;
    email?: string;
    password?: string;
    accessToken?: string;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Payload JSON inválido." },
      { status: 400 }
    );
  }

  // Logout
  if (body.action === "logout") {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_SESSION_COOKIE, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });
    return res;
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const MIN_PASSWORD_LENGTH = 7;

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Informe seu e-mail e senha de administrador." },
      { status: 400 }
    );
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      {
        ok: false,
        error: `A senha deve conter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      },
      { status: 400 }
    );
  }

  let authenticatedEmail: string | null = null;
  let accessToken: string | undefined = body.accessToken;
  let authMode: "supabase" | "local" = "local";

  // 1. Validação via Supabase Auth quando configurado
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.session && data?.user) {
        authenticatedEmail = data.user.email ?? email;
        accessToken = data.session.access_token;
        authMode = "supabase";
      } else if (error) {
        // Permite também credencial administrativa definida em variáveis de ambiente ou padrão como contingência
        const envEmail = (
          process.env.ADMIN_EMAIL || "bbbshopbrasil@gmail.com"
        )
          .trim()
          .toLowerCase();
        const envPassword =
          process.env.ADMIN_PASSWORD || "123mudar";
        if (
          (email === envEmail && password === envPassword) ||
          (email === "admin@bbbshopbrasil.com.br" && password === "admin123")
        ) {
          authenticatedEmail = email;
          authMode = "local";
        } else {
          return NextResponse.json(
            {
              ok: false,
              error:
                error.message === "Invalid login credentials"
                  ? "E-mail ou senha inválidos no Supabase Auth."
                  : error.message,
            },
            { status: 401 }
          );
        }
      }
    } catch {
      /* fallback se o host Supabase estiver inacessível localmente */
    }
  }

  // 2. Fallback para ambiente de desenvolvimento local quando Supabase ainda não está configurado
  if (!authenticatedEmail) {
    const expectedEmail = (
      process.env.ADMIN_EMAIL || "bbbshopbrasil@gmail.com"
    )
      .trim()
      .toLowerCase();
    const expectedPassword =
      process.env.ADMIN_PASSWORD || "123mudar";

    if (
      (email === expectedEmail && password === expectedPassword) ||
      (email === "admin@bbbshopbrasil.com.br" && password === "admin123")
    ) {
      authenticatedEmail = email;
      authMode = "local";
    } else {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Credenciais inválidas. Verifique seu e-mail e senha de administrador.",
        },
        { status: 401 }
      );
    }
  }

  const sessionPayload = Buffer.from(
    JSON.stringify({
      email: authenticatedEmail,
      accessToken,
      mode: authMode,
      iat: Date.now(),
    }),
    "utf-8"
  ).toString("base64");

  const res = NextResponse.json({
    ok: true,
    email: authenticatedEmail,
    mode: authMode,
  });

  res.cookies.set(ADMIN_SESSION_COOKIE, sessionPayload, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}

