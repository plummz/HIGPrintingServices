import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
try {
  await db.rateLimit.deleteMany({
    where: { lastRequest: { lt: BigInt(Date.now() - 24 * 3600_000) } },
  });
  await db.verification.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  console.log(
    "Expired sessions, verification records and rate-limit buckets removed.",
  );
} finally {
  await db.$disconnect();
}
