import dotenv from "dotenv";
import path from "path";
import { supabaseFetch } from "../src/lib/supabase/client";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  console.log("Testing Supabase connection...");
  console.log("SUPABASE_URL:", process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not Set");
  console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not Set");

  try {
    const res = await supabaseFetch("places?select=count", { method: "GET" });
    console.log("✅ Supabase query succeeded:", res);
  } catch (err: any) {
    console.log("⚠️ Supabase query response:", err.message);
  }
}

main();
