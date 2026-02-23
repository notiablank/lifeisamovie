import type { FastifyPluginAsync } from "fastify";
import { getSupabaseClient, getSupabaseAdmin } from "../lib/supabase.js";
import { requireAuth } from "../plugins/auth.js";
import { getDb } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const authRoutes: FastifyPluginAsync = async (app) => {
  // POST /auth/signup
  app.post<{
    Body: { email: string; password: string; username: string };
  }>("/auth/signup", async (request, reply) => {
    const { email, password, username } = request.body;
    if (!email || !password || !username) {
      return reply.status(400).send({ error: "email, password, and username are required" });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return reply.status(400).send({ error: error.message });
    }

    if (!data.user) {
      return reply.status(400).send({ error: "Signup failed" });
    }

    // Insert into our users table — clean up supabase user on failure
    try {
      await getDb().insert(users).values({
        email,
        username,
        supabaseId: data.user.id,
      });
    } catch (dbError: any) {
      request.log.error(dbError, "Failed to insert user row, cleaning up Supabase user");
      try {
        const admin = getSupabaseAdmin();
        await admin.auth.admin.deleteUser(data.user.id);
      } catch (cleanupError: any) {
        request.log.error(cleanupError, "Failed to clean up orphaned Supabase user %s", data.user.id);
      }
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

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return reply.status(401).send({ error: error.message });
    }

    return { user: data.user, session: data.session };
  });

  // POST /auth/signout
  app.post("/auth/signout", async (request, reply) => {
    requireAuth(request);
    const admin = getSupabaseAdmin();
    const { error } = await admin.auth.admin.signOut(request.user!.id);

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

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error) {
      return reply.status(401).send({ error: error.message });
    }

    return { user: data.user, session: data.session };
  });
};
