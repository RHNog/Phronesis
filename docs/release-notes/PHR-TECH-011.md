# PHR-TECH-011 — GitHub Handoff Continuity Verification

## Summary

Phronesis now separates clean-runner project validation from committed Handoff continuity verification. GitHub installs locked npm dependencies before tests, lint, and build; continuity checks the exact feature head and never regenerates repository truth inside the runner.

## Operational impact

- Feature-branch commits produce one pull-request workflow execution instead of duplicate push and PR runs.
- Missing dependencies are no longer misreported as simultaneous test, lint, and build defects.
- Stale or dirty Handoff state remains a real failure until canonical documents are committed and bare Handoff creates a seal.

## Boundaries

This release does not merge PR #5, deploy the application, activate public Funnel access, alter credentials, or weaken the 24-hour validation policy.
