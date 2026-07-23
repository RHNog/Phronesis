# PHR-WORKFLOW-002 Release Notes

Phronesis now defines CTO, Chief Architect, and Engineer role contracts with explicit product, design, implementation, conformance-review, and acceptance gates.

Role commands are now project-isolated. The repository-owned Current CTO Structure is the only authority for bare `Prompt`, `Implement`, and `Review` commands, and every role must reject mismatched project identities and non-`PHR-*` work items before acting.
