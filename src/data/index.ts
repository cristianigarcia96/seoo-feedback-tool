// Chooses the concrete Repository once, based on config. Everything else imports
// `repository` from here and never knows which backend is live.

import { useSupabase } from "@/lib/supabase";
import type { Repository } from "./repository";
import { createMockRepository } from "./mockRepository";
import { createSupabaseRepository } from "./supabaseRepository";

export const repository: Repository = useSupabase
  ? createSupabaseRepository()
  : createMockRepository();

export const dataSource: "supabase" | "demo" = useSupabase ? "supabase" : "demo";

export type { Repository } from "./repository";
