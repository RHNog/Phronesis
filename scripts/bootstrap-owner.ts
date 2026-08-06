import { getAuthorizationRepository } from "@/lib/auth/server";

const email = process.argv[2];
if (!email) {
  throw new Error("Usage: npm run auth:bootstrap-owner -- owner@example.com");
}

const invitation = getAuthorizationRepository().createInvitation({ email, role: "OWNER" });
console.log(`Initial owner invitation created for ${invitation.email}; expires ${invitation.expiresAt}.`);
