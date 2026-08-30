import dotenv from "dotenv";
import path from "path";
import { upsertAllFaresToDb } from "../src/lib/supabase/fares";
import { INTERCITY_FARE_TABLE } from "../src/lib/transport/intercity-fares";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const res = await upsertAllFaresToDb(INTERCITY_FARE_TABLE);
  console.log("Supabase direct sync result:", res);
}

main();
