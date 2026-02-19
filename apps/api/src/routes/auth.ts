import type { FastifyPluginAsync } from "fastify";
import { createSupabaseClient, createSupabaseAdmin } from "../lib/supabase.js";
import { requireAuth } from "../plugins/auth.js";
import { getDb } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const authRoutes: FastifyPluginAsync = async (app) => {
  const getAnonKey = () => {
    const key = process.env.SUPABASE_ANON_KEY;
    if (!key) throw { statusCode: 500, message: "SUPABASE_ANON_KEY not configured" };
    return key;
  };

  const getServiceKey = () => {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw { statusCode: 500, message: "SUPABASE_SERVICE_ROLE_KEY not configured" };
    return key;
  };

  // POST /auth/signup
  app.post<{
    Body: { email: string; password: string; username: string };
  }>("/auth/signup", async (request, reply) => {
    const { email, password, username } = request.body;
    if (!email || !password || !username) {
      return reply.status(400).send({ error: "email, password, and username are required" });
    }

    const supabase = createSupabaseClient(getAnonKey());
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return reply.status(400).send({ error: error.message });
    }

    if (!data.user) {
      return reply.status(400).send({ error: "Signup failed" });
    }

    // Insert into our users table
    try {
      await getDb().insert(users).values({
        email,
        username,
        supabaseId: data.user.id,
      });
    } catch (dbError: any) {
      // If DB insert fails, still return the session but warn
      request.log.error(dbError, "Failed to insert user row");
      return reply.status(500).send({ error: "Failed to create user profile" });
    }

    return reply.status(201).send({
      user: data.user,
      session: data.session,
    });
  });

  // POST /auth/signin
  app.post<{
    Body: { email: string; password: string };
  }>("/auth/signin", async (request, reply) => {
    const { email, password } = request.body;
    if (!email || !password) {
      return reply.status(400).send({ error: "email and password are required" });
    }

    const supabase = createSupabaseClient(getAnonKey());
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return reply.status(401).send({ error: error.message });
    }

    return { user: data.user, session: data.session };
  });

  // POST /auth/signout
  app.post("/auth/signout", async (request, reply) => {
    requireAuth(request);
    const supabaseAdmin = createSupabaseAdmin(getServiceKey());
    const { error } = await supabaseAdmin.auth.admin.signOut(request.user!.id);

    if (error) {
      return reply.status(400).send({ error: error.message });
    }

    return { success: true };
  });

  // GET /auth/me
  app.get("/auth/me", async (request, reply) => {
    requireAuth(request);
    const [profile] = await getDb()
      .select()
      .from(users)
      .where(eq(users.supabaseId, request.user!.id))
      .limit(1);

    if (!profile) {
      return reply.status(404).send({ error: "Profile not found" });
    }

    return { user: profile };
  });

  // POST /auth/refresh
  app.post<{
    Body: { refresh_token: string };
  }>("/auth/refresh", async (request, reply) => {
    const { refresh_token } = request.body;
    if (!refresh_token) {
      return reply.status(400).send({ error: "refresh_token is required" });
    }

    const supabase = createSupabaseClient(getAnonKey());
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error) {
      return reply.status(401).send({ error: error.message });
    }

    return { user: data.user, session: data.session };
  });
};
