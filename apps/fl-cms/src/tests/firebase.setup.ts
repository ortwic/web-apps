import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import * as fs from "fs";

export async function setupTestEnvironment(): Promise<RulesTestEnvironment> {
  const testEnv = await initializeTestEnvironment({
    projectId: "firelighter-cms",
    firestore: {
      rules: fs.readFileSync("firebase/firestore-test.rules", "utf8"),
    },
  });
  
  return testEnv;
}
