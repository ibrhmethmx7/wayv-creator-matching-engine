import { createClient } from "@supabase/supabase-js";

type LooseTable = {
    Row: Record<string, unknown>;
    Insert: Record<string, unknown>;
    Update: Record<string, unknown>;
    Relationships: [];
};

type LooseDatabase = {
    public: {
        Tables: Record<string, LooseTable>;
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
};

type SupabaseClientInstance = ReturnType<typeof createClient<LooseDatabase>>;
let _client: SupabaseClientInstance | null = null;

export function supabase(): SupabaseClientInstance {
    if (!_client) {
        _client = createClient<LooseDatabase>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }
    return _client;
}
