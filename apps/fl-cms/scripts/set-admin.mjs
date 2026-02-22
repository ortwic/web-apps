import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
config({ path: ".env.local" });

const UID = process.env.TARGET_UID;
try {
    const serviceAccount = JSON.parse(readFileSync(process.env.SERVICE_ACCOUNT_PATH, "utf8"));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

    await admin.auth().setCustomUserClaims(UID, { role: "admin" });
    console.log("Done.\n");
} catch (error) {
    console.error(error);
    process.exit(1);
}

const user = await admin.auth().getUser(UID);
console.log('Custom claims:', user.customClaims);
process.exit(0);