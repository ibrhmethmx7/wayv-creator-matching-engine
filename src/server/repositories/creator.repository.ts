import { supabase } from "@/lib/supabase";
import { CreatorSchema, type Creator } from "@/lib/schemas";
import { z } from "zod";

export const creatorRepository = {
    async findAll(): Promise<Creator[]> {
        const { data, error } = await supabase()
            .from("creators")
            .select("*")
            .order("followers", { ascending: false });
        if (error) throw new Error(`[CreatorRepository.findAll] ${error.message}`);
        return z.array(CreatorSchema).parse(data ?? []);
    },

    async findById(id: string): Promise<Creator> {
        const { data, error } = await supabase()
            .from("creators")
            .select("*")
            .eq("id", id)
            .single();
        if (error || !data) throw new Error(`[CreatorRepository.findById] ${error?.message ?? "Not found"}`);
        return CreatorSchema.parse(data);
    },

    async findByLocation(location: string): Promise<Creator[]> {
        const { data, error } = await supabase()
            .from("creators")
            .select("*")
            .eq("country", location)
            .order("engagement_rate", { ascending: false });
        if (error) throw new Error(`[CreatorRepository.findByLocation] ${error.message}`);
        return z.array(CreatorSchema).parse(data ?? []);
    },

    async count(): Promise<number> {
        const { count, error } = await supabase()
            .from("creators")
            .select("*", { count: "exact", head: true });
        if (error) throw new Error(`[CreatorRepository.count] ${error.message}`);
        return count ?? 0;
    },

    async topByEngagement(limit = 5): Promise<Creator[]> {
        const { data, error } = await supabase()
            .from("creators")
            .select("*")
            .order("engagement_rate", { ascending: false })
            .limit(limit);
        if (error) throw new Error(`[CreatorRepository.topByEngagement] ${error.message}`);
        return z.array(CreatorSchema).parse(data ?? []);
    },
};
