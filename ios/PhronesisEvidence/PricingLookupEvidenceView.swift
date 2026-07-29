import SwiftUI

/// A non-shipping UI-test host for Mac Worker accessibility and device evidence.
/// The product remains the web application; this target exposes the same approved
/// hierarchy and uncertainty language to XCTest without introducing native scope.
struct PricingLookupEvidenceView: View {
    @State private var query = "151"
    @State private var condition = "Lightly Played"
    @State private var expanded = false

    private let conditions = [
        "Near Mint", "Lightly Played", "Moderately Played",
        "Heavily Played", "Damaged"
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Delivered-price evidence for English Pokémon singles and sealed product. This panel reports data; it does not recommend a purchase.")
                        .font(.subheadline)
                        .foregroundStyle(.primary)

                    Text("Search by card, set, collector number, or sealed product")
                        .font(.headline)
                    TextField("Search", text: $query)
                        .textFieldStyle(.roundedBorder)
                        .frame(height: 44)
                        .contentShape(Rectangle())
                        .accessibilityIdentifier("pricing-search")

                    Text("English Pokémon · snapshot Jul 28 · Current")
                        .font(.footnote)
                        .accessibilityIdentifier("category-freshness")

                    Group {
                        Text("Sealed products").font(.title2.bold())
                        Text("Condition selection does not apply.").font(.caption).foregroundStyle(.primary)
                        EvidenceCard(
                            kind: "Sealed · no condition",
                            name: "Scarlet & Violet—151 Booster Bundle",
                            spokenName: "151 Booster Bundle",
                            identity: "151 · Booster Bundle",
                            rarity: nil,
                            delivered: "$47.26 delivered",
                            breakdown: "$42.99 listing + $4.27 shipping"
                        )
                        EvidenceCard(
                            kind: "Sealed · no condition",
                            name: "Scarlet & Violet—151 Elite Trainer Box",
                            spokenName: "151 Elite Trainer Box",
                            identity: "151 · Elite Trainer Box",
                            rarity: nil,
                            delivered: "Delivered price unavailable",
                            breakdown: "Shipping unknown"
                        )
                        if expanded {
                            EvidenceCard(
                                kind: "Sealed · no condition",
                                name: "Scarlet & Violet—151 Poster Collection",
                                spokenName: "151 Poster Collection",
                                identity: "151 · Collection",
                                rarity: nil,
                                delivered: "$25.00 delivered",
                                breakdown: "$20.00 listing + $5.00 shipping"
                            )
                        }
                        Button {
                            expanded.toggle()
                        } label: {
                            Text(expanded ? "Show fewer sealed products" : "Show all 3 sealed products")
                                .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                                .contentShape(Rectangle())
                        }
                        .foregroundStyle(.primary)
                        .tint(.primary)
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("sealed-expander")
                        .accessibilityLabel(expanded ? "Show fewer sealed products" : "Show all 3 sealed products")
                        .accessibilityValue(expanded ? "expanded" : "collapsed")
                    }

                    Section {
                        Text("Singles").font(.title2.bold())
                        EvidenceCard(
                            kind: "Single",
                            name: "Charizard ex",
                            spokenName: "Charizard ex",
                            identity: "Scarlet & Violet—151 · 199/165",
                            rarity: "Special Illustration Rare",
                            delivered: "$118.27 delivered",
                            breakdown: "$117.00 listing + $1.27 assumed shipping"
                        )
                        EvidenceCard(
                            kind: "Single",
                            name: "Charizard",
                            spokenName: "Charizard",
                            identity: "Scarlet & Violet—151 · 006/165",
                            rarity: "Reverse Holo",
                            delivered: "No listing in this condition",
                            breakdown: "Nearest priced grade: Near Mint · $7.22 delivered"
                        )
                    } header: {
                        VStack(alignment: .leading, spacing: 6) {
                            Picker("Singles condition", selection: $condition) {
                                ForEach(conditions, id: \.self, content: Text.init)
                            }
                            .tint(.primary)
                            .accessibilityIdentifier("singles-condition")
                            Text("Re-prices all singles below; sealed products are unaffected.")
                                .font(.caption)
                                .foregroundStyle(.primary)
                        }
                        .padding(12)
                        .background(.background)
                    }
                }
                .padding(16)
            }
            .navigationTitle("Price lookup")
        }
    }
}

private struct EvidenceCard: View {
    let kind: String
    let name: String
    let spokenName: String
    let identity: String
    let rarity: String?
    let delivered: String
    let breakdown: String

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            decisionFact(kind, field: "Product type")
                .font(.caption.bold()).foregroundStyle(.primary)
            decisionFact(name, field: "Product name").font(.headline)
            decisionFact(identity, field: "Printing identity")
                .font(.subheadline).foregroundStyle(.primary)
            if let rarity {
                decisionFact(rarity, field: "Rarity")
                    .font(.subheadline).foregroundStyle(.primary)
            }
            decisionFact(delivered, field: "Delivered price").font(.title3.bold())
            if breakdown.contains(" + ") {
                let parts = breakdown.components(separatedBy: " + ")
                decisionFact(parts[0], field: "Listing").font(.subheadline)
                decisionFact(parts[1], field: "Shipping").font(.subheadline)
            } else if breakdown.localizedCaseInsensitiveContains("shipping") {
                decisionFact("Unknown", field: "Shipping").font(.subheadline)
            } else {
                decisionFact(breakdown, field: "Price breakdown").font(.subheadline)
            }
            decisionFact("No history yet", field: "History")
                .font(.subheadline).foregroundStyle(.primary)
            decisionFact("Snapshot Jul 28", field: "Snapshot date")
                .font(.caption).foregroundStyle(.primary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Color(uiColor: .secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12))
        .overlay {
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.primary.opacity(0.22), lineWidth: 1)
        }
        // Keep each decision fact independently speakable. Combining the whole
        // card produces one long VoiceOver utterance that host capture can
        // truncate before price, history, and snapshot information.
        .accessibilityElement(children: .contain)
    }

    private func decisionFact(_ value: String, field: String) -> some View {
        Text(value)
            .lineLimit(nil)
            .fixedSize(horizontal: false, vertical: true)
            // Prefix every independently traversable fact with its result name.
            // Repeated values such as "No history yet" therefore remain
            // attributable to each card in the genuine VoiceOver transcript.
            .accessibilityLabel("\(spokenName). \(field). \(value)")
    }
}
