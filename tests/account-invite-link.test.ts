import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ACCOUNT_SIGN_UP_PATH,
  buildAccountSignUpUrl,
} from "../lib/auth/accountInvite.ts";

test("account invite uses restricted public origin before private fallback", () => {
  assert.equal(ACCOUNT_SIGN_UP_PATH, "/sign-up");
  assert.equal(
    buildAccountSignUpUrl(
      "https://access.phronesis.com",
      "https://private.example:9444",
    ),
    "https://access.phronesis.com/sign-up",
  );
  assert.equal(
    buildAccountSignUpUrl(null, "https://private.example:9444"),
    "https://private.example:9444/sign-up",
  );
  assert.equal(buildAccountSignUpUrl(null, null), "/sign-up");
});

test("People and access exposes a generic zero-access Sign Up invitation", () => {
  const page = readFileSync(
    new URL("../app/settings/page.tsx", import.meta.url),
    "utf8",
  );
  const settings = readFileSync(
    new URL(
      "../features/settings/components/SettingsControlCenter.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const access = readFileSync(
    new URL("../components/auth/AccessManagement.tsx", import.meta.url),
    "utf8",
  );
  const invite = readFileSync(
    new URL("../components/auth/AccountInviteLink.tsx", import.meta.url),
    "utf8",
  );

  assert.match(page, /getActiveRestrictedPublicOrigin/);
  assert.match(page, /restrictedPublicOrigin=\{restrictedPublicOrigin\}/);
  assert.match(settings, /restrictedPublicOrigin=\{restrictedPublicOrigin\}/);
  assert.match(access, /AccountInviteLink/);
  assert.match(invite, /Invite people to Phronesis/);
  assert.match(invite, /grants zero access/);
  assert.match(invite, /CopyTextButton/);
  assert.match(invite, /navigator\.share/);
  assert.match(invite, /Share invite/);
  assert.match(invite, /Preview Sign Up/);
  assert.match(invite, /min-h-11/);
  assert.doesNotMatch(invite, /activate#code|[?&](email|role|module)=/);
});
