# Monetization

This document captures monetization possibilities for Phronesis. It does not choose a final pricing model.

## Monetization Philosophy

The platform should charge for valuable intelligence and operational leverage, not for arbitrary page views.

A fair monetization model should:

- Align price with new intelligence generation.
- Reward cached intelligence reuse.
- Avoid charging repeatedly for the same fresh insight.
- Scale from solo professional buyers to stores and enterprise partners.
- Preserve trust through explainable billing events.
- Reflect internal provider costs without exposing provider complexity to customers.

## Internal And External Economy Alignment

The customer credit economy should mirror the internal Provider Economy.

Internal:

- Provider observations are cached to reduce API costs.
- Repository snapshots reduce repeated provider calls.
- Replay fixtures reduce development provider usage.
- Freshness windows avoid unnecessary refreshes.

External:

- Generated intelligence is cached to reduce customer credit consumption.
- Repeated viewing of the same fresh intelligence costs zero additional credits.
- Batch workflows should charge per unique asset requiring new intelligence, not per repeated display.
- Manual refresh can consume credits because it explicitly requests regenerated intelligence.

The platform rewards efficiency on both sides.

## Possible Models

### Credit Packs

Users buy prepaid credits. Credits are consumed when the platform generates new intelligence.

Possible advantages:

- Simple usage-based model.
- Good for occasional professional buyers.
- Clear alignment with intelligence generation.

Open questions:

- Credit expiration.
- Refunds for failed or partial intelligence.
- Different credit costs by workflow.
- Team/shared credit pools.

### Monthly Subscriptions

Users pay a recurring monthly fee for access and included usage.

Possible advantages:

- Predictable revenue.
- Easier for stores to budget.
- Can include monthly credit allocations.

Open questions:

- Plan limits.
- Rollover credits.
- Overage pricing.
- Seat-based pricing.

### Professional Plans

Plans for serious individual buyers or small professional sellers.

Possible features:

- Monthly intelligence allocation.
- Advanced Vendor Workspace.
- Watchlists and alerts.
- Portfolio or inventory tools.
- Strategy analytics.

### Store Plans

Plans for local game stores or teams.

Possible features:

- Multiple seats.
- Store-level Business Profiles.
- Employee permissions.
- Shared intelligence cache.
- Buying policy controls.
- Inventory workflows.
- Team analytics.

### Enterprise

Custom plans for large operators, marketplaces, or high-volume buyers.

Possible features:

- Custom integrations.
- API access.
- Dedicated support.
- Data export.
- White-label workflows.
- Custom provider configuration.

### API Access

External systems pay for normalized intelligence through API usage.

Possible pricing:

- Per request.
- Per generated intelligence event.
- Monthly allocation plus overage.
- Enterprise contract.

Open questions:

- Rate limits.
- Data licensing.
- Provider terms.
- Cache semantics.
- Attribution requirements.

### Marketplace Integrations

Marketplace-connected users pay for workflow acceleration and integrated intelligence.

Possible models:

- Subscription add-on.
- Transaction-based fee.
- Listing optimization plan.
- Marketplace partner revenue share.

### White-Label

Partners embed Phronesis decision intelligence into their own products.

Possible models:

- Platform license.
- Usage-based intelligence generation.
- Enterprise support.
- Revenue share.

## Intelligence Credit Economy

The Intelligence Credit Economy is a candidate model, not yet selected.

Core idea:

- Charge credits when new intelligence is generated.
- Charge zero credits for repeated viewing of cached intelligence within a freshness window.
- Charge for manual refresh when the user requests new intelligence.
- Charge batch evaluation by unique asset requiring fresh intelligence.
- Include monthly credit allocations in future subscription plans.

Example:

```text
First evaluation of Mox Opal today
  -> 1 Credit

Second evaluation of Mox Opal today
  -> 0 Credits

Manual Refresh
  -> 1 Credit

Batch Evaluation
  -> Credits per unique asset requiring fresh intelligence
```

## Possible Plan Dimensions

- Number of seats.
- Monthly included credits.
- Shared team cache.
- Provider-backed intelligence depth.
- Batch evaluation limits.
- Inventory size.
- Portfolio size.
- Alert count.
- Marketplace integrations.
- API access.
- Historical analytics.
- Multi-store support.
- White-label rights.

## Open Questions

- Should credits be the primary model or a supplement to subscriptions?
- Should every workflow consume the same credit type?
- How should partial provider data affect credits?
- Should failed provider calls consume credits?
- How long should freshness windows last?
- Should high-cost provider refreshes cost more credits?
- Should team members share intelligence freshness and credits?
- Should manually refreshed intelligence reset the freshness window for all users in an account?
- How should billing explain why a credit was or was not consumed?
