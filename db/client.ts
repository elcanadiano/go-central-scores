import "dotenv/config";
import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

const globalForDb = globalThis as typeof globalThis & {
  __gocentralSql?: Sql;
};

function isLocalHost(host: string): boolean {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".local")
  );
}

function createSql(): Sql {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    return postgres(databaseUrl, {
      ssl: "require",
      connect_timeout: 10,
    });
  }

  const host = process.env.PGHOST;
  const port = process.env.PGPORT;
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  const database = process.env.PGDATABASE;

  const missing = (
    [
      ["PGHOST", host],
      ["PGPORT", port],
      ["PGUSER", user],
      ["PGPASSWORD", password],
      ["PGDATABASE", database],
    ] as const
  ).filter(([, value]) => !value);

  if (missing.length > 0) {
    throw new Error(
      `Missing env vars: ${missing.map(([name]) => name).join(", ")} (or set DATABASE_URL). Copy .env.example to .env and fill in credentials.`,
    );
  }

  return postgres({
    host,
    port: Number(port),
    user,
    password,
    database,
    ssl: isLocalHost(host!) ? undefined : "require",
    connect_timeout: 10,
  });
}

export function getSql(): Sql {
  if (!globalForDb.__gocentralSql) {
    globalForDb.__gocentralSql = createSql();
  }
  return globalForDb.__gocentralSql;
}

/** Lazy proxy so CLI scripts can keep importing `sql` as a tagged template. */
export const sql: Sql = new Proxy(function sqlProxy() {} as unknown as Sql, {
  apply(_target, _thisArg, args) {
    const client = getSql();
    return (client as unknown as (...a: unknown[]) => unknown)(...args);
  },
  get(_target, prop) {
    const client = getSql();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export async function closeDb(): Promise<void> {
  if (globalForDb.__gocentralSql) {
    await globalForDb.__gocentralSql.end();
    globalForDb.__gocentralSql = undefined;
  }
}
