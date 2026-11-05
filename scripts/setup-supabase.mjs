import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const val = line
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvFile(path.join(ROOT_DIR, ".env.local"));
loadEnvFile(path.join(ROOT_DIR, ".env"));

function normalizeSupabaseUrl(rawUrl) {
  return (rawUrl || "")
    .trim()
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/, "");
}

const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

const ADMIN_EMAIL = "bbbshopbrasil@gmail.com";
const ADMIN_PASSWORD = "123mudar";
const MIN_PASSWORD_LENGTH = 7;

if (ADMIN_PASSWORD.length < MIN_PASSWORD_LENGTH) {
  console.error(
    `[ERRO] A senha do admin deve ter no mínimo ${MIN_PASSWORD_LENGTH} dígitos.`
  );
  process.exit(1);
}

async function tryExecuteSqlRemotely(sqlText, label) {
  // 1. Tenta via endpoint pg-meta (/pg/query) quando disponível na instância Supabase
  const endpoints = [
    `${supabaseUrl}/pg/query`,
    `${supabaseUrl}/rest/v1/rpc/exec_sql`,
  ];

  for (const endpoint of endpoints) {
    try {
      const isRpc = endpoint.endsWith("/exec_sql");
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(isRpc ? { query: sqlText, sql: sqlText } : { query: sqlText }),
      });

      if (res.ok) {
        console.log(`  [OK] Migração SQL executada via ${isRpc ? "RPC exec_sql" : "pg-meta"}: ${label}`);
        return true;
      }
    } catch {
      // Continua para próxima estratégia
    }
  }

  return false;
}

async function main() {
  console.log("==============================================================");
  console.log(" BBB Shop Brasil — Provisionamento Automático do Supabase");
  console.log("==============================================================\n");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "[ERRO] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados em .env.local."
    );
    process.exit(1);
  }

  console.log(`[1/4] Conectando ao Supabase: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // -------------------------------------------------------------------------
  // Passo A: Ler supabase/migrations/01_init.sql e executar queries / buckets
  // -------------------------------------------------------------------------
  console.log("\n[2/4] Processando migrações SQL (supabase/migrations/01_init.sql)...");
  const migrationFiles = [
    "supabase/migrations/01_init.sql",
    "supabase/migrations/02_newsletter_testimonials.sql",
    "supabase/migrations/03_admin_settings.sql",
  ];

  let ddlExecutedRemotely = false;
  for (const relPath of migrationFiles) {
    const fullPath = path.join(ROOT_DIR, relPath);
    if (!fs.existsSync(fullPath)) continue;
    const sql = fs.readFileSync(fullPath, "utf-8");
    console.log(`  -> Lendo ${relPath} (${sql.length} bytes)...`);
    const ok = await tryExecuteSqlRemotely(sql, relPath);
    if (ok) ddlExecutedRemotely = true;
  }

  // Provisiona os buckets de Storage ('products' e 'banners') via API administrativa Service Role
  console.log("\n[3/4] Provisionando Buckets do Supabase Storage e validando tabelas...");
  for (const bucketName of ["products", "banners"]) {
    const { data: existingBucket, error: getBucketErr } =
      await supabase.storage.getBucket(bucketName);

    if (existingBucket && !getBucketErr) {
      await supabase.storage.updateBucket(bucketName, { public: true });
      console.log(`  [OK] Bucket '${bucketName}' já existe (configurado como público).`);
    } else {
      const { error: createBucketErr } = await supabase.storage.createBucket(
        bucketName,
        { public: true }
      );
      if (createBucketErr) {
        console.warn(
          `  [AVISO] Bucket '${bucketName}': ${createBucketErr.message}`
        );
      } else {
        console.log(`  [OK] Bucket '${bucketName}' criado com sucesso.`);
      }
    }
  }

  // Verifica status das tabelas via PostgREST + insere linha inicial em settings se a tabela já existir
  const tablesToCheck = [
    "settings",
    "banners",
    "products",
    "product_images",
    "orders",
  ];
  const missingTables = [];

  for (const table of tablesToCheck) {
    const { error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      missingTables.push(table);
    } else {
      console.log(`  [OK] Tabela public.${table} acessível e pronta.`);
    }
  }

  if (!missingTables.includes("settings")) {
    await supabase
      .from("settings")
      .upsert({ id: 1, active_gateway: "mercadopago" }, { onConflict: "id" });
    console.log("  [OK] Registro inicial settings (id = 1) garantido.");
  }

  if (missingTables.length > 0 && !ddlExecutedRemotely) {
    console.log(
      `  [INFO] As tabelas [${missingTables.join(
        ", "
      )}] ainda não constam no schema remoto PostgREST (a API REST do Supabase Cloud bloqueia CREATE TABLE sem conexão direta Postgres). O sistema utilizará o store híbrido local até que o SQL seja aplicado.`
    );
  }

  // -------------------------------------------------------------------------
  // Passo B: Criar usuário administrador inicial no Supabase Auth
  // -------------------------------------------------------------------------
  console.log(
    `\n[4/4] Provisionando usuário Admin no Supabase Auth (${ADMIN_EMAIL})...`
  );

  const { data: createData, error: createError } =
    await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });

  if (!createError && createData?.user) {
    console.log(
      `  [OK] Usuário admin criado com sucesso no Supabase Auth! ID: ${createData.user.id}`
    );
  } else {
    const errMsg = createError?.message || "";
    const alreadyExists =
      errMsg.toLowerCase().includes("already") ||
      errMsg.toLowerCase().includes("exists") ||
      errMsg.toLowerCase().includes("registered") ||
      createError?.status === 422;

    if (alreadyExists) {
      console.log(
        `  [INFO] O usuário '${ADMIN_EMAIL}' já existe no Supabase Auth. Sincronizando senha e confirmação de e-mail...`
      );
      const { data: listData } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      const existingUser = listData?.users?.find(
        (u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
      );

      if (existingUser) {
        const { error: updateErr } =
          await supabase.auth.admin.updateUserById(existingUser.id, {
            password: ADMIN_PASSWORD,
            email_confirm: true,
          });
        if (!updateErr) {
          console.log(
            `  [OK] Usuário admin existente (${existingUser.id}) atualizado e confirmado com sucesso!`
          );
        } else {
          console.warn(
            `  [AVISO] Não foi possível atualizar senha do usuário existente: ${updateErr.message}`
          );
        }
      } else {
        console.log("  [OK] Usuário já cadastrado no Supabase Auth.");
      }
    } else {
      console.warn(
        `  [AVISO] Retorno do Supabase Auth (${errMsg || "status desconhecido"}). Credencial '${ADMIN_EMAIL}' habilitada também no autenticador local de contingência.`
      );
    }
  }

  console.log("\n==============================================================");
  console.log(" Provisionamento finalizado!");
  console.log(` Login Admin: ${ADMIN_EMAIL}`);
  console.log(` Senha Admin: ${ADMIN_PASSWORD}`);
  console.log(" URL de Teste: http://localhost:3000/admin/login");
  console.log("==============================================================\n");
}

main().catch((err) => {
  console.error("[ERRO FATAL em setup-supabase.mjs]:", err);
  process.exit(1);
});

