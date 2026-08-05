# PHR-ARCH-010 Product Identity Validation

## Required Checks

- Case-insensitive repository-content scan returns no retired-name match outside Git internals and generated dependencies.
- Sidebar, package metadata, Atlas project metadata, provider user agents, browser history namespace, and README identify Phronesis.
- Lint and TypeScript validation pass.
- Relevant automated tests pass.

## Result

Validated on 2026-07-22.

- Legacy identity content scan: passed with zero matches outside excluded Git internals and generated dependencies.
- `npm run lint`: passed.
- `npm run build`: passed; all application routes compiled and page generation completed.
- `npx tsc --noEmit`: application build type checking passed, but the standalone repository command remains blocked by pre-existing `TS5097` errors in tests that import `.ts` extensions while `allowImportingTsExtensions` is disabled.
- External follow-up: the active checkout directory and GitHub repository/remote retain the former repository slug and require a coordinated external rename.

## 2026-08-05 Visual Asset Recovery

- Product Owner source `/Users/ramonnogueira/Downloads/Phronesis Logo.png` was recovered exactly to `public/brand/phronesis-logo.png`.
- Source and repository SHA-256 both equal `29062e6fb7657458e17f594290380e50670431c0116824393b922a460ca54984`.
- The 1254×1254 PNG remains byte-identical and is used by desktop/sidebar, mobile navigation, and the Next.js icon metadata responses.
- Live `/icon` returned HTTP 200, `image/png`, 1,332,804 bytes, and the exact recorded hash.
- Browser metadata exposed `/icon` and `/apple-icon`; both shell images completed at their intended intrinsic display sizes with no console warning/error.
- Focused tests, full 403/403 tests, TypeScript, warning-free lint, production build, and diff hygiene passed.

## 2026-08-05 Dedicated Application Icon

- Supplied JPEG source: 1254×1254, SHA-256 `e0373e63b8d8e0b7e68f23742e2c9397396db353c4a8f53fc0d28019e55656d9`.
- Canonical PNG: 1254×1254, SHA-256 `0fc335597c0f7fbe7407d6d8faec0b1d084a12b8937ec052405820565b5e0dbb`.
- Browser icon: 512×512 PNG, SHA-256 `2bdc7e40c845234eac0d148f787c26ec03b8d7ea6ca5417602543d8bab1ee632`.
- Apple touch icon: 180×180 PNG, SHA-256 `5e149948b3a4b92fc0cd5694d831931f4703fdd453739134025887abe9b9bdfe`.
- Root favicon: one 32×32 ICO resource, SHA-256 `4ed3a7ecdb376d54aec6bd5bb2054874f1c718a2733c3debfbb5f59deb7c237e`.
- Visual inspection confirmed the supplied composition remains intact at browser and Apple sizes.
- Fresh production HTML declared `rel=icon` for the ICO and PNG plus `rel=apple-touch-icon` for the Apple PNG, with correct MIME types and intrinsic sizes.
- All three local production routes returned HTTP 200 and bytes matching the repository hashes.
- Focused `snapshot-vendor-workspace` tests passed 6/6; full tests passed 404/404; standalone TypeScript, lint, Next.js 16.2.12 production build, and diff hygiene passed.
- The launch-managed private runtime was restarted; local and tailnet Vendor Workspace returned HTTP 200, and the live runtime served all three new metadata tags and exact icon hashes.
