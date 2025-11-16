import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/src/lib/supabase/server";

type ApplicationStatus = "menunggu" | "diterima" | "ditolak";

interface StatusBody {
  ids: string[];
  status: ApplicationStatus;
}

function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return value === "menunggu" || value === "diterima" || value === "ditolak";
}

function isStatusBody(value: unknown): value is StatusBody {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const v = value as { ids?: unknown; status?: unknown };

  const idsValid =
    Array.isArray(v.ids) && v.ids.every((id) => typeof id === "string");

  return idsValid && isApplicationStatus(v.status);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let bodyUnknown: unknown;

  try {
    bodyUnknown = (await req.json()) as unknown;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!isStatusBody(bodyUnknown)) {
    return NextResponse.json(
      {
        error:
          "Body must contain 'ids' (string[]) and 'status' ('menunggu' | 'diterima' | 'ditolak')",
      },
      { status: 400 }
    );
  }

  const { ids, status } = bodyUnknown;

  if (ids.length === 0) {
    return NextResponse.json(
      { error: "'ids' array must not be empty" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("job_applications")
    .update({ status })
    .in("id", ids);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
