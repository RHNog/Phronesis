# PHR-ARCH-016 — Trusted Account Registration And Approval

Phronesis now lets a trusted person create a permanent email/password account. Registration grants no product access: the person waits for owner review, and Settings shows a pending queue where the owner selects the role and exact modules.

Approved users see only assigned tools. Rejected users receive no membership. Existing direct invitations and optional GitHub sign-in remain available. The top-right account menu now identifies the signed-in person and provides conditional Settings and logout.

Until verified-email delivery is implemented, owners must confirm the person outside Phronesis before approval. Password reset, passkeys, and MFA remain future security work.

People & access now provides one prominent Sign Up invite with the exact URL, resilient Copy, native Share on supported phones, and Preview. The generic link grants zero access and contains no credential or module decision. It advertises the restricted-public custom domain only after explicit infrastructure activation; until then it automatically uses the working private Phronesis origin.
