import copy
import unittest

from jarvis_runtime_evidence import (
    validate_manifest_results,
    validate_semantic_diagnostic,
    validate_zoom_diagnostic,
)


RECT = {"x": 0, "y": 0, "width": 100, "height": 44, "top": 0, "right": 100, "bottom": 44, "left": 0}


def valid_zoom():
    control = {
        "selector": "[data-control]",
        "reflow_marker": True,
        "class_list": ["panel"],
        "sticky_class_present": False,
        "computed_position": "static",
        "bounding_rect": RECT,
    }
    identity = {
        "selector": '[data-pricing-result-sku="SKU-1"]',
        "sku": "SKU-1",
        "product_type": "Single",
        "product_name": "Charizard",
        "printing_identity": "Base Set · 4/102 · Holofoil",
        "visible": True,
        "bounding_rect": RECT,
        "field_bounds": {
            "product_type": RECT,
            "product_name": RECT,
            "printing_identity": RECT,
        },
    }
    return {
        "status": "pass",
        "diagnostic": "All required rendered measurements passed.",
        "search_panel": copy.deepcopy(control),
        "condition_panel": copy.deepcopy(control),
        "visible_identities": [identity],
        "intersections": [
            {"control": name, "identity_selector": identity["selector"], "identity_sku": "SKU-1", "intersects": False}
            for name in ("search_panel", "condition_panel")
        ],
        "horizontal_overflow": {
            "viewport_width_css_px": 640,
            "document_scroll_width_css_px": 640,
            "overflow_css_px": 0,
        },
    }


def valid_semantics():
    return {
        "capture_root": ".pricing-lookup",
        "capture_root_match_count": 1,
        "capture_root_backend_node_id": 17,
        "capture_api": "Accessibility.getFullAXTree",
        "accessibility_enabled": True,
        "page_target_session_id": "page-session",
        "scoped_root_role": "region",
        "scoped_root_name": "Price lookup",
        "accessibility_nodes": [
            {"role": "region", "name": "Price lookup", "description": None, "state": {}},
            {"role": "searchbox", "name": "Search card, set, collector number, or sealed product", "description": None, "state": {}},
            {"role": "listitem", "name": "Single. Charizard. Base Set, 4/102, Holofoil. $101.27 delivered. $100 listing plus $1.27 assumed shipping. No history yet. Snapshot Jul 27.", "description": None, "state": {}},
        ],
        "derived_spoken_sequence": [
            "Price lookup",
            "Search card, set, collector number, or sealed product",
            "Single. Charizard. Base Set, 4/102, Holofoil. $101.27 delivered. $100 listing plus $1.27 assumed shipping. No history yet. Snapshot Jul 27.",
        ],
    }


class RuntimeEvidenceValidatorTests(unittest.TestCase):
    def test_accepts_complete_zoom_measurements(self):
        self.assertEqual(validate_zoom_diagnostic(valid_zoom(), "zoom"), [])

    def test_rejects_legacy_count_only_zoom_pass(self):
        legacy = {
            "status": "pass",
            "diagnostic": "passed",
            "search_panel_computed_position": "static",
            "condition_panel_computed_position": "static",
            "required_visible_identity_fields": [{"visible_non_empty": True, "count": 5}],
            "search_panel_identity_intersections": 0,
            "condition_panel_identity_intersections": 0,
            "horizontal_overflow_css_px": 0,
        }
        errors = validate_zoom_diagnostic(legacy, "zoom")
        self.assertTrue(any("structured control record" in error for error in errors))
        self.assertTrue(any("visible_identities" in error for error in errors))
        self.assertTrue(any("intersections" in error for error in errors))

    def test_accepts_pruned_semantic_sequence(self):
        self.assertEqual(validate_semantic_diagnostic(valid_semantics(), "semantics"), [])

    def test_rejects_raw_static_text_and_duplicated_sequence(self):
        payload = valid_semantics()
        payload["accessibility_nodes"].append({"role": "StaticText", "name": "Charizard", "description": None, "state": {}})
        payload["derived_spoken_sequence"].append("Charizard")
        payload["derived_spoken_sequence"].append("Charizard")
        errors = validate_semantic_diagnostic(payload, "semantics")
        self.assertTrue(any("raw StaticText" in error for error in errors))
        self.assertTrue(any("duplicate semantic utterances" in error for error in errors))

    def test_accepts_only_final_explained_manifest_check_statuses(self):
        manifest = {
            "accessibility": {
                "screen_reader_output": {
                    "status": "pass",
                    "surface_results": {
                        "web": {"status": "pass"},
                        "ios": {"status": "not-applicable", "reason": "Not an iOS check."},
                    },
                }
            },
            "local_visual_analysis": {"status": "not-applicable", "reason": "Worker policy does not require advisory analysis."},
        }
        self.assertEqual(validate_manifest_results(manifest), [])

    def test_rejects_skipped_or_unexplained_manifest_check_statuses(self):
        manifest = {
            "accessibility": {"contrast": {"status": "not-applicable"}},
            "local_visual_analysis": {"status": "skipped", "reason": "Retry later."},
        }
        errors = validate_manifest_results(manifest)
        self.assertTrue(any("must explain not-applicable" in error for error in errors))
        self.assertTrue(any("got 'skipped'" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
