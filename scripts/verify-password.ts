import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

async function main() {
  const [email, password] = process.argv.slice(2);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log("No user found with that email.");
    return;
  }
  const matches = await bcrypt.compare(password, user.passwordHash);
  console.log(`User: ${user.email} | role: ${user.role} | password matches: ${matches}`);
}

main().finally(() => prisma.$disconnect());
