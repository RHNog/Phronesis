# PHR-TECH-007 Release Note

Phronesis now retrieves strictly matched One Piece card artwork from Bandai's official English card list and retains approved provider images in a durable local cache. Repeated views are served through Phronesis rather than refetching the provider, while ambiguous variants and provider failures continue to show honest placeholders. The cache is ignored by Git, validates every source and raster body, and does not alter catalogue prices or buying decisions.

### 2026-07-30 reliability fix

Resolved Magic artwork now downloads through the local cache using a provider-compatible Phronesis request identity. Lorcana partial searches also expand their exact catalogue result into a Lorcast-compatible name, allowing strict Mulan Winterspell thumbnails to render. Unsupported or ambiguous records still show placeholders.
