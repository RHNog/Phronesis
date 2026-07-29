import CoreGraphics
import XCTest

final class PhronesisEvidenceUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testNamedControlsAndRuntimeAccessibility() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-AppleLanguages", "(en)", "-AppleLocale", "en_US"]
        app.launch()

        XCTAssertTrue(app.textFields["pricing-search"].waitForExistence(timeout: 5))

        if #available(iOS 17.0, *) {
            try app.performAccessibilityAudit()
        }

        // Keep the audit attached to the stable foreground launch target. The
        // bounded discovery swipes below can invalidate XCTest's audit target
        // handle on some accessibility-environment runs (error -902), even
        // though the application remains visible and queryable.
        XCTAssertTrue(find("sealed-expander", in: app))
        XCTAssertTrue(find("singles-condition", in: app))
    }

    func testSealedExpansion() {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(
            scrollToHittable("sealed-expander", in: app),
            "The sealed expander never became hittable. UI hierarchy: \(app.debugDescription)"
        )

        // Scrolling can invalidate SwiftUI's accessibility snapshot even when
        // the query still reports the old element as hittable. Re-resolve the
        // disclosure immediately before activation and prove that XCTest is
        // operating the expected collapsed control.
        let currentExpander = app.buttons["sealed-expander"]
        XCTAssertTrue(currentExpander.waitForExistence(timeout: 2))
        XCTAssertTrue(currentExpander.isHittable)
        XCTAssertEqual(currentExpander.label, "Show all 3 sealed products")
        XCTAssertEqual(currentExpander.value as? String, "collapsed")
        currentExpander.tap()

        XCTAssertTrue(
            waitForSealedExpansion(in: app),
            "The sealed expander did not expose its expanded state after activation. UI hierarchy: \(app.debugDescription)"
        )
    }

    @MainActor
    func testVoiceOverProducesRealUtterances() throws {
        guard #available(iOS 27.0, *) else {
            throw XCTSkip("XCUIVoiceOverService requires the iOS 27 runtime.")
        }
        let app = XCUIApplication()
        app.launchArguments += ["-AppleLanguages", "(en)", "-AppleLocale", "en_US"]
        app.launch()
        XCTAssertTrue(app.textFields["pricing-search"].waitForExistence(timeout: 5))

        let voiceOver = XCUIDevice.shared.voiceOverService
        try voiceOver.enable()
        defer { try? voiceOver.disable() }
        XCTAssertTrue(voiceOver.isEnabled)

        // Enabling the system service can retain VoiceOver focus in the app that
        // was previously frontmost. Reactivate this test host before traversing
        // so the transcript cannot begin in an unrelated application.
        app.activate()
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 5))
        XCTAssertTrue(app.textFields["pricing-search"].waitForExistence(timeout: 5))

        var utterances: [String] = []
        var consecutiveDuplicateUtterances = 0
        for _ in 0..<64 {
            let output: XCUIVoiceOverService.Output
            do {
                output = try voiceOver.moveForward()
            } catch {
                if utterances.isEmpty { throw error }
                break
            }
            let utterance = output.utterance.trimmingCharacters(in: .whitespacesAndNewlines)
            if utterance.isEmpty { continue }
            if utterances.contains(utterance) {
                // The traversal has wrapped. Once the transcript already carries
                // every decision-critical phrase, further moveForward() calls add
                // no evidence and only widen the window in which an external host
                // interruption can discard an otherwise complete run. The 64-move
                // ceiling above is retained as the upper bound.
                consecutiveDuplicateUtterances += 1
                if consecutiveDuplicateUtterances >= 4,
                   Self.transcriptCarriesDecisionFacts(utterances) {
                    break
                }
            } else {
                consecutiveDuplicateUtterances = 0
            }
            utterances.append(utterance)
            print("JARVIS_VOICEOVER_UTTERANCE: \(utterance)")
        }

        // Serialize and attach before asserting. The transcript is the run's
        // product evidence; an assertion failure or an external interruption in
        // the tail of this test previously discarded a transcript that had
        // already been captured in full.
        let transcript = try JSONSerialization.data(
            withJSONObject: ["utterances": utterances],
            options: [.prettyPrinted, .sortedKeys]
        )
        let attachment = XCTAttachment(data: transcript, uniformTypeIdentifier: "public.json")
        attachment.name = "VoiceOver utterance transcript"
        attachment.lifetime = .keepAlways
        add(attachment)

        // Release the system service as soon as traversal is done rather than at
        // teardown, so an interrupted run cannot leave VoiceOver enabled for the
        // next device run. The defer above remains the safety net.
        try? voiceOver.disable()

        XCTAssertFalse(utterances.isEmpty, "VoiceOver must produce host-observed speech output.")
        XCTAssertTrue(utterances.contains { utterance in
            utterance.localizedCaseInsensitiveContains("Phronesis") ||
            utterance.localizedCaseInsensitiveContains("Price lookup") ||
            utterance.localizedCaseInsensitiveContains("Search")
        })
        let spokenDecisionFlow = utterances.joined(separator: " ")
        for requiredPhrase in Self.decisionCriticalPhrases {
            XCTAssertTrue(
                spokenDecisionFlow.localizedCaseInsensitiveContains(requiredPhrase),
                "VoiceOver omitted decision-critical result content: \(requiredPhrase). Transcript: \(spokenDecisionFlow)"
            )
        }
        for result in Self.requiredResultDecisionFacts {
            for fact in result.facts {
                let contextualFact = "\(result.name). \(fact)"
                XCTAssertTrue(
                    utterances.contains { $0.localizedCaseInsensitiveContains(contextualFact) },
                    "VoiceOver omitted a separately traversable fact for \(result.name): \(fact). Transcript: \(spokenDecisionFlow)"
                )
            }
        }
    }

    /// The result content a delivered-price decision depends on. The traversal
    /// loop and the transcript assertions read the same list so an early exit can
    /// never stop before the evidence is sufficient.
    private static let decisionCriticalPhrases = [
        "Sealed", "Single", "Special Illustration Rare", "Reverse Holo",
        "delivered", "listing", "shipping", "No history yet", "Snapshot Jul 28"
    ]

    private static let requiredResultDecisionFacts = [
        (
            name: "151 Booster Bundle",
            facts: ["Listing. $42.99 listing", "Shipping. $4.27 shipping", "History. No history yet", "Snapshot date. Snapshot Jul 28"]
        ),
        (
            name: "151 Elite Trainer Box",
            facts: ["Shipping. Unknown", "History. No history yet", "Snapshot date. Snapshot Jul 28"]
        ),
        (
            name: "Charizard ex",
            facts: ["Rarity. Special Illustration Rare", "Listing. $117.00 listing", "Shipping. $1.27 assumed shipping", "History. No history yet", "Snapshot date. Snapshot Jul 28"]
        ),
        (
            name: "Charizard",
            facts: ["Rarity. Reverse Holo", "History. No history yet", "Snapshot date. Snapshot Jul 28"]
        ),
    ]

    private static func transcriptCarriesDecisionFacts(_ utterances: [String]) -> Bool {
        let spoken = utterances.joined(separator: " ")
        let generalFactsPresent = decisionCriticalPhrases.allSatisfy { phrase in
            spoken.localizedCaseInsensitiveContains(phrase)
        }
        let resultFactsPresent = requiredResultDecisionFacts.allSatisfy { result in
            result.facts.allSatisfy { fact in
                spoken.localizedCaseInsensitiveContains("\(result.name). \(fact)")
            }
        }
        return generalFactsPresent && resultFactsPresent
    }

    @discardableResult
    private func find(_ identifier: String, in app: XCUIApplication) -> Bool {
        let element = app.descendants(matching: .any)[identifier]
        if element.waitForExistence(timeout: 2) {
            return true
        }

        for _ in 0..<8 {
            app.swipeUp()
            if element.waitForExistence(timeout: 1) {
                return true
            }
        }
        return false
    }

    private func scrollToHittable(_ identifier: String, in app: XCUIApplication) -> Bool {
        guard app.buttons[identifier].waitForExistence(timeout: 5) else {
            return false
        }

        let scrollView = app.scrollViews.firstMatch
        guard scrollView.waitForExistence(timeout: 2) else {
            return false
        }

        // XCTest's convenience swipe did not move this SwiftUI ScrollView on
        // the compact iOS 27 host. Drive a bounded gesture between coordinates
        // inside the owning scroll view so the event has an unambiguous target.
        for _ in 0..<8 where !app.buttons[identifier].isHittable {
            // Re-resolve coordinates for every attempt and hold long enough for
            // SwiftUI to recognize a drag rather than a tap on card content.
            // The prior 0.08-second gesture was recorded eight times while the
            // compact host's scroll indicator remained at 0%.
            let dragStart = scrollView.coordinate(
                withNormalizedOffset: CGVector(dx: 0.5, dy: 0.72)
            )
            let dragEnd = scrollView.coordinate(
                withNormalizedOffset: CGVector(dx: 0.5, dy: 0.32)
            )
            dragStart.press(forDuration: 0.2, thenDragTo: dragEnd)
            _ = app.buttons[identifier].waitForExistence(timeout: 1)
        }
        return app.buttons[identifier].isHittable
    }

    private func waitForSealedExpansion(in app: XCUIApplication) -> Bool {
        let deadline = Date().addingTimeInterval(5)
        repeat {
            // Expansion inserts a card before the disclosure and changes its
            // frame. Resolve the query again so XCTest does not assert against
            // the pre-mutation SwiftUI accessibility snapshot.
            let currentExpander = app.buttons["sealed-expander"]
            if currentExpander.exists,
               currentExpander.value as? String == "expanded",
               currentExpander.label == "Show fewer sealed products" {
                return true
            }
            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
        } while Date() < deadline

        return false
    }
}
