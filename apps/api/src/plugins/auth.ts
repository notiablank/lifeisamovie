import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { getSupabaseClient } from "../lib/supabase.js";

export interface AuthUser {
  id: string;
  email: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

const authPlugin: FastifyPluginAsync = async (app) => {
  app.decorateRequest("user", undefined);

  app.addHook("onRequest", async (request: FastifyRequest) => {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) return;

    const token = header.slice(7);

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) return;

      request.user = {
        id: data.user.id,
        email: data.user.email ?? "",
      };
    } catch {
      // If supabase client isn't configured, skip auth silently
      return;
    }
  });
};

export default fp(authPlugin, { name: "auth" });

export function requireAuth(request: FastifyRequest): asserts request is FastifyRequest & { user: AuthUser } {
  if (!request.user) {
    const err = new Error("Unauthorized") as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }
}
