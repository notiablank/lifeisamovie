import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { createSupabaseClient } from "../lib/supabase.js";

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
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!anonKey) return;

    const supabase = createSupabaseClient(anonKey);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return;

    request.user = {
      id: data.user.id,
      email: data.user.email ?? "",
    };
  });
};

export default fp(authPlugin, { name: "auth" });

export function requireAuth(request: FastifyRequest) {
  if (!request.user) {
    throw { statusCode: 401, message: "Unauthorized" };
  }
}
