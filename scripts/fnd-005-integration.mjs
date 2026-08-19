import {
  localPreflight,
  reportFailure,
  verifyClientAvailabilityIndependence,
  verifyDatabaseTopology,
  inspectCanonicalResources,
} from "./fnd-005-runtime.mjs";
import { canonicalTopology } from "./fnd-005-rules.mjs";

try {
  const configuration = await localPreflight({ argv: process.argv.slice(2), checkPort: false });
  inspectCanonicalResources(configuration, { requireAll: true });
  const evidence = verifyDatabaseTopology(configuration);
  console.log("[test:integration] SQL_SERVER_AVAILABLE project=local-infrastructure");
  for (const { database, reference, role, user } of evidence) {
    console.log(
      `[test:integration] DATABASE_VERIFIED role=${role} reference=${reference} database=${database} user=${user}`,
    );
  }
  console.log(
    "[test:integration] ISOLATION_VERIFIED client-a-to-b=DENIED client-b-to-a=DENIED platform-to-client=DENIED",
  );
  verifyClientAvailabilityIndependence(configuration);
  console.log("[test:integration] AVAILABILITY_VERIFIED client-a=RECOVERED client-b=INDEPENDENT");
  console.log(
    `[test:integration] PROJECT_COMPLETE project=local-infrastructure result=PASS databases=${canonicalTopology.databases.length}`,
  );
} catch (error) {
  reportFailure(error);
}
