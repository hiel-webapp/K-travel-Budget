import { ingestKtoPlaces, KtoIngestOptions } from "../src/lib/kto/ingestor";
import { SupportedCity } from "../src/lib/trip-domain";

async function main() {
  const envDryRun = process.env.KTO_INGEST_DRY_RUN;
  const envCity = process.env.KTO_INGEST_CITY;
  const envLimit = process.env.KTO_INGEST_LIMIT;

  const dryRun = envDryRun === "true" || envDryRun === "1";
  const city: SupportedCity | "ALL" =
    envCity === "BUSAN" || envCity === "ALL" ? envCity : "SEOUL";

  let limitPerCategory = 10;
  if (envLimit) {
    const parsed = parseInt(envLimit, 10);
    if (!isNaN(parsed) && parsed > 0) {
      limitPerCategory = parsed;
    }
  }

  const options: KtoIngestOptions = {
    dryRun,
    city,
    limitPerCategory,
  };

  console.log("==================================================");
  console.log("  HypeHeritage KTO Place Ingestion Runner");
  console.log("==================================================");
  console.log(`Target City         : ${options.city}`);
  console.log(`Dry Run Mode        : ${options.dryRun}`);
  console.log(`Limit Per Category  : ${options.limitPerCategory}`);
  console.log("--------------------------------------------------");

  try {
    const result = await ingestKtoPlaces(options);
    if (result.status === "FAILED") {
      console.error("Ingestion Failed (Errors or Invalid Response Structure).");
      console.error(`Total Fetched      : ${result.totalFetched}`);
      console.error(`Total Inserted     : ${result.totalInserted}`);
      console.error(`Total Updated      : ${result.totalUpdated}`);
      console.error(`Total Skipped      : ${result.totalSkipped}`);
      console.error(`Total Failed       : ${result.totalFailed}`);

      if (result.errors.length > 0) {
        console.error("--------------------------------------------------");
        console.error("Encountered Issues (Top 5):");
        for (const err of result.errors.slice(0, 5)) {
          console.error(` - ${err}`);
        }
      }
      console.error("==================================================");
      process.exit(1);
    }

    if (result.status === "PARTIAL") {
      console.log("Ingestion Completed Partially (with warnings/failures).");
    } else if (result.allCategoriesZeroWarning || result.totalFetched === 0) {
      console.warn("Ingestion Completed (No items returned from KTO API).");
      console.warn("WARNING: 모든 서울 카테고리에서 0건이 반환되었습니다. 요청 파라미터·API 승인 상태·응답 구조를 확인하세요.");
    } else {
      console.log("Ingestion Completed Successfully.");
    }

    console.log(`Total Fetched      : ${result.totalFetched}`);
    console.log(`Total Inserted     : ${result.totalInserted}`);
    console.log(`Total Updated      : ${result.totalUpdated}`);
    console.log(`Total Skipped      : ${result.totalSkipped}`);
    console.log(`Total Failed       : ${result.totalFailed}`);

    if (result.errors.length > 0) {
      console.log("--------------------------------------------------");
      console.log("Encountered Issues (Top 5):");
      for (const err of result.errors.slice(0, 5)) {
        console.log(` - ${err}`);
      }
    }
    console.log("==================================================");
  } catch (err: unknown) {
    console.error("==================================================");
    console.error("Ingestion Failed:");
    if (err instanceof Error) {
      console.error(`Message: ${err.message}`);
    } else {
      console.error("Unknown error occurred.");
    }
    console.error("==================================================");
    process.exit(1);
  }
}

main();
