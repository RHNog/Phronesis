# Phronesis Vision Worker

Local macOS OCR and image-feature evidence worker for `PHR-TECH-014`. It uses Apple Vision, performs no network requests, and returns versioned JSON. A worker failure is recognition evidence failure and must become abstention; this executable has no identity, pricing, offer, purchase, inventory, credential, or publication authority.

~~~sh
swift run phronesis-vision-worker analyze /absolute/path/to/card.jpg
swift run phronesis-vision-worker distance '<query-feature>' '<reference-feature>'
~~~

Feature prints are secure-archived Vision observations scoped to the active platform/runtime index version. Corpus manifests retain source provenance and the original reference hash; a feature-print archive is derived evidence, not a source asset.
