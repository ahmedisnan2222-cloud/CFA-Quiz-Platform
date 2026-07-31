import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

async function main() {
  const [email, newPassword] = process.argv.slice(2);

  if (!email || !newPassword) {
    throw new Error(
      "Usage: npm run reset-password -- <email> <newPassword>"
    );
  }

  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  console.log(`Password reset for ${user.email} (${user.role}).`);
}

main()
  .catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
