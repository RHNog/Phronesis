# PHR-TECH-007 Release Note

Phronesis now retrieves strictly matched One Piece card artwork from Bandai's official English card list and retains approved provider images in a durable local cache. Repeated views are served through Phronesis rather than refetching the provider, while ambiguous variants and provider failures continue to show honest placeholders. The cache is ignored by Git, validates every source and raster body, and does not alter catalogue prices or buying decisions.
