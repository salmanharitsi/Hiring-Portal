import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/src/lib/supabase/server";

type ToolRow = {
  id: string;
  name: string;
};

type ToolsGetResponse = {
  tools: ToolRow[];
};

type ToolsPostBody = {
  name: string;
};

type ToolsPostResponse =
  | {
    tool: ToolRow;
  }
  | {
    message: string;
  };

export async function GET(req: NextRequest): Promise<NextResponse<ToolsGetResponse>> {
  const supabase = await createServerSupabase();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  let query = supabase.from("tools").select("id, name").order("name", {
    ascending: true,
  });

  if (q && q.trim().length > 0) {
    query = query.ilike("name", `%${q.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      {
        tools: [],
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      tools: data ?? [],
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest): Promise<NextResponse<ToolsPostResponse>> {
  const supabase = await createServerSupabase();

  const json = (await req.json()) as Partial<ToolsPostBody>;
  const rawName = json.name ?? "";
  const trimmed = rawName.trim();

  if (!trimmed) {
    return NextResponse.json(
      { message: "Tool name is required." },
      { status: 400 }
    );
  }

  const normalized =
    trimmed.length === 0
      ? trimmed
      : trimmed[0].toUpperCase() + trimmed.slice(1);

  const { data: existing, error: existingError } = await supabase
    .from("tools")
    .select("id, name")
    .ilike("name", normalized)
    .maybeSingle();

  if (!existingError && existing) {
    return NextResponse.json(
      {
        tool: existing,
      },
      { status: 200 }
    );
  }

  const { data, error } = await supabase
    .from("tools")
    .insert({ name: normalized })
    .select("id, name")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { message: "Failed to create new tool." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      tool: data,
    },
    { status: 201 }
  );
}
