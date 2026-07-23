# Product Spec

## Product Name

Phronesis

## Current Positioning

Phronesis is a Professional TCG Decision Operating System.

It is not a simple price tracker. It exists to help professional trading-card buyers answer decision questions quickly, with enough evidence to act.

Every screen should answer a decision question.

## Core Product Pillars

### 1. Understand

The product understands how buyers naturally search.

Current systems:

- Query Engine
- Knowledge Platform
- Canonical Resolution
- Intent Resolution
- Entity Resolution
- Constraint Satisfaction
- Prefix Matching and Progressive Query Resolution

### 2. Know

The product normalizes card identity and market data before business engines consume it.

Current systems:

- Identity Providers
- Scryfall Identity Provider
- Market Provider abstractions
- Normalized card/listing domain objects

Pricing is still mocked. Scryfall is identity-only.

### 3. Decide

The product turns identity and market data into decisions.

Current systems:

- Opportunity Engine
- Profit Engine
- Ranking Engine
- Strategy Engine
- Vendor Workspace
- Purchase Evaluation Engine

### 4. Improve

Future systems should learn from buyer behavior and provider data without rewriting the parser or core engines.

Planned systems:

- Knowledge Feedback Engine
- Behavior Engine
- Vendor Intelligence
- Adaptive learning
- Personal vocabulary
- Community vocabulary
- AI Knowledge Curator

## Flagship Workflows

### 1. Discover

Question: What should I buy today?

Primary screen: Hot Opportunities.

### 2. Evaluate / Vendor Workspace

Question: Should I buy this card right now?

Primary screen: Vendor Workspace.

### 3. Portfolio

Question: What should I do with what I already own?

Status: future workflow.

## Sprint 13 Focus

Sprint 13 adds visual printing confirmation to Vendor Workspace and recovers project documentation for future developers and AI agents.
