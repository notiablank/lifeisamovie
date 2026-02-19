import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase before importing routes
const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockGetUser = vi.fn();
const mockRefreshSession = vi.fn();
const mockAdminSignOut = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
      getUser: mockGetUser,
      refreshSession: mockRefreshSession,
      admin: { signOut: mockAdminSignOut },
    },
  }),
}));

// Mock db
const mockInsert = vi.fn();
const mockSelect = vi.fn();

vi.mock("../db/index.js", () => ({
  getDb: () => ({
    insert: () => ({ values: mockInsert }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: mockSelect,
        }),
      }),
    }),
  }),
}));

vi.mock("../db/schema.js", () => ({
  users: { supabaseId: "supabase_id" },
}));

vi.mock("drizzle-orm", () => ({
  eq: (a: any, b: any) => ({ a, b }),
}));

import Fastify from "fastify";
import authPlugin from "../plugins/auth.js";
import { authRoutes } from "./auth.js";

async function buildTestApp() {
  const app = Fastify();
  await app.register(authPlugin);
  await app.register(authRoutes);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_ANON_KEY = "test-anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
});

describe("POST /auth/signup", () => {
  it("creates a user and returns session", async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: "sb-123", email: "test@example.com" },
        session: { access_token: "tok" },
      },
      error: null,
    });
    mockInsert.mockResolvedValue([]);

    const app = await buildTestApp();
    const res = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { email: "test@example.com", password: "pass123", username: "testuser" },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.user.id).toBe("sb-123");
    expect(mockSignUp).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ email: "test@example.com", username: "testuser", supabaseId: "sb-123" }),
    );
  });

  it("returns 400 on missing fields", async () => {
    const app = await buildTestApp();
    const res = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { email: "test@example.com" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 on supabase error", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "User already exists" },
    });

    const app = await buildTestApp();
    const res = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { email: "test@example.com", password: "pass123", username: "testuser" },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("POST /auth/signin", () => {
  it("returns user and session", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: { id: "sb-123", email: "test@example.com" },
        session: { access_token: "tok" },
      },
      error: null,
    });

    const app = await buildTestApp();
    const res = await app.inject({
      method: "POST",
      url: "/auth/signin",
      payload: { email: "test@example.com", password: "pass123" },
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).session.access_token).toBe("tok");
  });

  it("returns 401 on bad credentials", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid credentials" },
    });

    const app = await buildTestApp();
    const res = await app.inject({
      method: "POST",
      url: "/auth/signin",
      payload: { email: "test@example.com", password: "wrong" },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("POST /auth/signout", () => {
  it("returns 401 without auth", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "bad" } });

    const app = await buildTestApp();
    const res = await app.inject({
      method: "POST",
      url: "/auth/signout",
    });
    expect(res.statusCode).toBe(401);
  });

  it("signs out authenticated user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "sb-123", email: "test@example.com" } },
      error: null,
    });
    mockAdminSignOut.mockResolvedValue({ error: null });

    const app = await buildTestApp();
    const res = await app.inject({
      method: "POST",
      url: "/auth/signout",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).success).toBe(true);
  });
});

describe("GET /auth/me", () => {
  it("returns profile for authenticated user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "sb-123", email: "test@example.com" } },
      error: null,
    });
    mockSelect.mockResolvedValue([
      { id: "uuid-1", supabaseId: "sb-123", email: "test@example.com", username: "testuser" },
    ]);

    const app = await buildTestApp();
    const res = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).user.username).toBe("testuser");
  });

  it("returns 401 without auth", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "bad" } });

    const app = await buildTestApp();
    const res = await app.inject({
      method: "GET",
      url: "/auth/me",
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("POST /auth/refresh", () => {
  it("refreshes session", async () => {
    mockRefreshSession.mockResolvedValue({
      data: {
        user: { id: "sb-123" },
        session: { access_token: "new-tok" },
      },
      error: null,
    });

    const app = await buildTestApp();
    const res = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { refresh_token: "old-rt" },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).session.access_token).toBe("new-tok");
  });

  it("returns 400 without refresh_token", async () => {
    const app = await buildTestApp();
    const res = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});
