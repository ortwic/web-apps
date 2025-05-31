import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import * as fs from "fs";

export async function setupTestEnvironment(projectId: string): Promise<RulesTestEnvironment | null> {
  try {
    const testEnv = await initializeTestEnvironment({
      projectId,
      firestore: {
        rules: fs.readFileSync("firebase/firestore-test.rules", "utf8"),
      },
    });
    
    return testEnv;
  } catch (err) {
    console.warn("Failed to setup test environment");
    return null;
  }
}
