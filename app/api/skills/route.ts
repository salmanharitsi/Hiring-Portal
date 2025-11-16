import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/src/lib/supabase/server";

type SkillRow = {
  id: string;
  name: string;
  created_at: string;
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const supabase = await createServerSupabase();

  const baseQuery = supabase
    .from("skills")
    .select("id, name")
    .order("name", { ascending: true });

  const trimmed = q.trim();
  const result =
    trimmed.length > 0
      ? await baseQuery.ilike("name", `%${trimmed}%`)
      : await baseQuery.limit(50);

  if (result.error) {
    console.error("GET /api/skills error:", result.error);
    return NextResponse.json(
      { message: "Failed to fetch skills" },
      { status: 500 }
    );
  }

  const rows = (result.data ?? []) as SkillRow[];

  return NextResponse.json({
    skills: rows.map((row) => ({
      id: row.id,
      name: row.name,
    })),
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabase();

  let name: string | undefined;

  try {
    const body = (await req.json()) as { name?: string };
    if (typeof body.name === "string") {
      name = body.name.trim();
    }
  } catch {
    // kalau JSON invalid, akan ketangkap di validasi di bawah
  }

  if (!name) {
    return NextResponse.json(
      { message: "Name is required" },
      { status: 400 }
    );
  }

  const insertResult = await supabase
    .from("skills")
    .insert({ name })
    .select("id, name, created_at")
    .single();

  if (insertResult.error || !insertResult.data) {
    console.error("POST /api/skills error:", insertResult.error);
    return NextResponse.json(
      { message: "Failed to create skill" },
      { status: 500 }
    );
  }

  const row = insertResult.data as SkillRow;

  return NextResponse.json(
    {
      skill: {
        id: row.id,
        name: row.name,
      },
    },
    { status: 201 }
  );
}
