#!/usr/bin/env python3
"""Describe and validate Phronesis targets for the serialized Mac Worker.

This script deliberately does not launch a browser, simulator, or application. It
provides a stable, machine-readable handoff so the host worker can own runtime
capture and accessibility evidence.
"""

from __future__ import annotations

import argparse
import json
import math
import os
from pathlib import Path
import sys


SCHEMA = "jarvis.runtime-evidence-targets/v1"
ASSIGNMENT_ID = "019fa79e-34a1-75e9-9516-99399a01cbcf"
EVIDENCE_WEB_SCRIPT = (
    "JARVIS_RUNTIME_EVIDENCE=1 next dev --webpack --hostname 127.0.0.1"
)
EVIDENCE_DIST_DIR = ".next-evidence"


def zoom_result_schema() -> dict[str, object]:
    """Return the exact serialized shape required for a zoom pass.

    The Worker must populate measurements from rendered DOM nodes. Nullable
    prose-only summaries previously allowed a pass with no identified controls
    or results, which is not runtime evidence.
    """
    rect = {
        "x": "finite number",
        "y": "finite number",
        "width": "finite number greater than 0",
        "height": "finite number greater than 0",
        "top": "finite number",
        "right": "finite number",
        "bottom": "finite number",
        "left": "finite number",
    }
    control = {
        "selector": "non-empty string matching exactly one visible element",
        "reflow_marker": "true",
        "class_list": "array of strings; must not contain sticky",
        "sticky_class_present": False,
        "computed_position": "static",
        "bounding_rect": rect,
    }
    return {
        "status": ["pass", "fail"],
        "diagnostic": "non-empty string on pass or fail",
        "page_url": "exact zoom scenario URL",
        "search_panel": control,
        "condition_panel": control,
        "visible_identities": {
            "type": "non-empty array",
            "minimum_items": 1,
            "items": {
                "selector": "non-empty unique [data-pricing-result-sku] selector",
                "sku": "non-empty data-pricing-result-sku value",
                "product_type": "non-empty visible text and data-pricing-result-product-type value",
                "product_name": "non-empty visible text and data-pricing-result-name value",
                "printing_identity": "non-empty visible text and data-pricing-result-printing value",
                "visible": True,
                "bounding_rect": rect,
                "field_bounds": {
                    "product_type": rect,
                    "product_name": rect,
                    "printing_identity": rect,
                },
            },
        },
        "intersections": {
            "type": "array with exactly two entries per visible identity",
            "items": {
                "control": ["search_panel", "condition_panel"],
                "identity_selector": "must equal a visible_identities selector",
                "identity_sku": "must equal the matching visible identity SKU",
                "intersects": False,
            },
        },
        "horizontal_overflow": {
            "viewport_width_css_px": "finite number greater than 0",
            "document_scroll_width_css_px": "finite number greater than 0",
            "overflow_css_px": 0,
        },
        "reject_pass_if": [
            "either control is absent, null, hidden, or matches other than exactly one element",
            "visible_identities is empty or any identity value, selector, or bound is null/empty",
            "an intersection entry is missing for either control and any visible identity",
            "any control/identity or identity-field rectangle has non-positive width or height",
            "any intersects value is true or overflow_css_px is not zero",
        ],
    }


def repository_root() -> Path:
    return Path(__file__).resolve().parents[1]


RAW_TEXT_ROLES = {"StaticText", "InlineTextBox"}


def _positive_rect(value: object) -> bool:
    if not isinstance(value, dict):
        return False
    required = ("x", "y", "width", "height", "top", "right", "bottom", "left")
    if any(not isinstance(value.get(key), (int, float)) or not math.isfinite(value[key]) for key in required):
        return False
    return value["width"] > 0 and value["height"] > 0


def validate_zoom_diagnostic(data: object, label: str) -> list[str]:
    """Reject prose/count-only zoom reports before they can support a pass."""
    errors: list[str] = []
    if not isinstance(data, dict):
        return [f"{label}: diagnostic must be a JSON object"]
    if data.get("status") != "pass":
        return [f"{label}: status is not pass"]
    if not isinstance(data.get("diagnostic"), str) or not data["diagnostic"].strip():
        errors.append(f"{label}: diagnostic is empty")

    controls: dict[str, dict[str, object]] = {}
    for control_name in ("search_panel", "condition_panel"):
        control = data.get(control_name)
        if not isinstance(control, dict):
            errors.append(f"{label}: {control_name} is missing its structured control record")
            continue
        controls[control_name] = control
        if control.get("reflow_marker") is not True:
            errors.append(f"{label}: {control_name}.reflow_marker must be true")
        classes = control.get("class_list")
        if not isinstance(classes, list) or any(not isinstance(item, str) for item in classes):
            errors.append(f"{label}: {control_name}.class_list must be a complete string array")
        elif any("sticky" in item.split("-") for item in classes) or control.get("sticky_class_present") is not False:
            errors.append(f"{label}: {control_name} retains a sticky class")
        if control.get("computed_position") != "static":
            errors.append(f"{label}: {control_name}.computed_position must be static")
        if not _positive_rect(control.get("bounding_rect")):
            errors.append(f"{label}: {control_name}.bounding_rect is missing or invalid")

    identities = data.get("visible_identities")
    if not isinstance(identities, list) or not identities:
        errors.append(f"{label}: visible_identities must be a non-empty array")
        identities = []
    identity_keys: set[tuple[str, str]] = set()
    for index, identity in enumerate(identities):
        prefix = f"{label}: visible_identities[{index}]"
        if not isinstance(identity, dict):
            errors.append(f"{prefix} must be an object")
            continue
        selector = identity.get("selector")
        sku = identity.get("sku")
        if not isinstance(selector, str) or not selector.strip() or not isinstance(sku, str) or not sku.strip():
            errors.append(f"{prefix} requires non-empty selector and SKU")
            continue
        key = (selector, sku)
        if key in identity_keys:
            errors.append(f"{prefix} duplicates selector/SKU {key}")
        identity_keys.add(key)
        for field in ("product_type", "product_name", "printing_identity"):
            if not isinstance(identity.get(field), str) or not identity[field].strip():
                errors.append(f"{prefix}.{field} must be non-empty")
        if identity.get("visible") is not True or not _positive_rect(identity.get("bounding_rect")):
            errors.append(f"{prefix} must be visible with a positive bounding_rect")
        field_bounds = identity.get("field_bounds")
        for field in ("product_type", "product_name", "printing_identity"):
            if not isinstance(field_bounds, dict) or not _positive_rect(field_bounds.get(field)):
                errors.append(f"{prefix}.field_bounds.{field} is missing or invalid")

    intersections = data.get("intersections")
    if not isinstance(intersections, list):
        errors.append(f"{label}: intersections must be an explicit array")
        intersections = []
    observed: set[tuple[str, str, str]] = set()
    for entry in intersections:
        if not isinstance(entry, dict):
            errors.append(f"{label}: every intersection must be an object")
            continue
        key = (str(entry.get("control")), str(entry.get("identity_selector")), str(entry.get("identity_sku")))
        if key in observed:
            errors.append(f"{label}: duplicate intersection {key}")
        observed.add(key)
        if entry.get("intersects") is not False:
            errors.append(f"{label}: intersection {key} must explicitly be false")
    expected = {(control, selector, sku) for selector, sku in identity_keys for control in controls}
    if observed != expected:
        errors.append(f"{label}: intersections do not exactly cover both controls for every visible identity")

    overflow = data.get("horizontal_overflow")
    if not isinstance(overflow, dict) or overflow.get("overflow_css_px") != 0:
        errors.append(f"{label}: horizontal_overflow must explicitly report zero overflow")
    elif not all(isinstance(overflow.get(key), (int, float)) and overflow[key] > 0 for key in ("viewport_width_css_px", "document_scroll_width_css_px")):
        errors.append(f"{label}: horizontal_overflow requires positive viewport and scroll widths")
    return errors


def validate_semantic_diagnostic(data: object, label: str) -> list[str]:
    """Require a scoped, pruned semantic sequence rather than a raw AX dump."""
    if not isinstance(data, dict):
        return [f"{label}: diagnostic must be a JSON object"]
    errors: list[str] = []
    required = {
        "capture_root": ".pricing-lookup",
        "capture_root_match_count": 1,
        "capture_api": "Accessibility.getFullAXTree",
        "accessibility_enabled": True,
        "scoped_root_role": "region",
        "scoped_root_name": "Price lookup",
    }
    for key, expected in required.items():
        if data.get(key) != expected:
            errors.append(f"{label}: {key} must equal {expected!r}")
    for key in ("capture_root_backend_node_id", "page_target_session_id"):
        if data.get(key) in (None, ""):
            errors.append(f"{label}: {key} is required")
    nodes = data.get("accessibility_nodes")
    sequence = data.get("derived_spoken_sequence")
    if not isinstance(nodes, list) or not nodes:
        errors.append(f"{label}: accessibility_nodes must be a non-empty array")
        nodes = []
    if not isinstance(sequence, list) or not sequence:
        errors.append(f"{label}: derived_spoken_sequence must be a non-empty array")
        sequence = []
    expected_sequence: list[str] = []
    for index, node in enumerate(nodes):
        if not isinstance(node, dict):
            errors.append(f"{label}: accessibility_nodes[{index}] must be an object")
            continue
        role = node.get("role")
        name = node.get("name")
        if role in RAW_TEXT_ROLES:
            errors.append(f"{label}: raw {role} node was not pruned")
        if not isinstance(name, str) or not name.strip():
            errors.append(f"{label}: accessibility_nodes[{index}] has no accessible name")
        else:
            expected_sequence.append(name.strip())
    if sequence != expected_sequence:
        errors.append(f"{label}: derived_spoken_sequence must be derived once from the pruned semantic nodes in order")
    if len(sequence) != len(set(sequence)):
        errors.append(f"{label}: derived_spoken_sequence contains duplicate semantic utterances")
    if not sequence or sequence[0] != "Price lookup":
        errors.append(f"{label}: the first spoken item must be the Price lookup region")
    return errors


def validate_evidence_directory(directory: Path) -> list[str]:
    probe = directory / "web-host/probe"
    errors: list[str] = []
    for filename, validator in (
        ("zoom-200.json", validate_zoom_diagnostic),
        ("zoom-400.json", validate_zoom_diagnostic),
        ("screen-reader-output.json", validate_semantic_diagnostic),
    ):
        path = probe / filename
        if not path.is_file():
            errors.append(f"{filename}: required artifact is missing")
            continue
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            errors.append(f"{filename}: unreadable JSON: {error}")
            continue
        errors.extend(validator(payload, filename))
    manifest_path = directory / "manifest.json"
    if not manifest_path.is_file():
        errors.append("manifest.json: required artifact is missing")
    else:
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            errors.append(f"manifest.json: unreadable JSON: {error}")
        else:
            errors.extend(validate_manifest_results(manifest))
    return errors


FINAL_CHECK_STATUSES = {"pass", "fail", "not-applicable"}


def _validate_check_status(check: object, label: str) -> list[str]:
    if not isinstance(check, dict):
        return [f"manifest.json: {label} must be an object"]
    status = check.get("status")
    errors: list[str] = []
    if status not in FINAL_CHECK_STATUSES:
        errors.append(
            f"manifest.json: {label}.status must be pass, fail, or not-applicable; got {status!r}"
        )
    if status == "not-applicable" and not any(
        isinstance(check.get(field), str) and check[field].strip()
        for field in ("explanation", "reason", "diagnostic")
    ):
        errors.append(f"manifest.json: {label} must explain not-applicable")
    return errors


def validate_manifest_results(manifest: object) -> list[str]:
    """Reject retryable or unexplained states in a completed evidence manifest."""
    if not isinstance(manifest, dict):
        return ["manifest.json: root must be an object"]
    errors: list[str] = []
    accessibility = manifest.get("accessibility")
    if not isinstance(accessibility, dict) or not accessibility:
        errors.append("manifest.json: accessibility checks must be a non-empty object")
    else:
        for name, check in accessibility.items():
            errors.extend(_validate_check_status(check, f"accessibility.{name}"))
            if isinstance(check, dict) and isinstance(check.get("surface_results"), dict):
                for surface, surface_check in check["surface_results"].items():
                    errors.extend(
                        _validate_check_status(
                            surface_check, f"accessibility.{name}.surface_results.{surface}"
                        )
                    )
    if "local_visual_analysis" not in manifest:
        errors.append("manifest.json: local_visual_analysis check is missing")
    else:
        errors.extend(
            _validate_check_status(manifest["local_visual_analysis"], "local_visual_analysis")
        )
    return errors


def target_contract(root: Path) -> dict[str, object]:
    return {
        "schema": SCHEMA,
        "assignment_id": ASSIGNMENT_ID,
        "web": {
            "working_directory": str(root),
            "command": ["npm", "run", "evidence:web", "--", "--port", "3000"],
            "url": "http://127.0.0.1:3000/price-lookup/evidence?scenario=sealed",
            "readiness": {
                "url": "http://127.0.0.1:3000/price-lookup/evidence?scenario=sealed",
                "expected_status": 200,
                "expected_text": "Price lookup",
                "timeout_seconds": 120,
                "poll_interval_ms": 500,
            },
            "interactive_readiness": {
                "selector": '.pricing-lookup[data-interactive-ready="true"]',
                "timeout_seconds": 30,
                "required_before": [
                    "keyboard_operation",
                    "visible_focus",
                    "screen_reader_output",
                    "scenario_capture",
                ],
            },
            "server": {
                "host": "127.0.0.1",
                "port": 3000,
                "bundler": "webpack",
                "dist_dir": EVIDENCE_DIST_DIR,
                "browser_launch": "isolated-worker-only",
            },
            "route": "app/price-lookup/page.tsx",
            "evidence_route": "app/price-lookup/evidence/page.tsx",
            "scenarios": {
                "sealed_plus_singles": "http://127.0.0.1:3000/price-lookup/evidence?scenario=sealed",
                "single_specific": "http://127.0.0.1:3000/price-lookup/evidence?scenario=single",
                "missing_price": "http://127.0.0.1:3000/price-lookup/evidence?scenario=missing",
                "stale": "http://127.0.0.1:3000/price-lookup/evidence?scenario=stale",
                "error": "http://127.0.0.1:3000/price-lookup/evidence?scenario=error",
                "category_not_loaded": "http://127.0.0.1:3000/price-lookup/evidence?scenario=category-not-loaded",
                "no_match": "http://127.0.0.1:3000/price-lookup/evidence?scenario=no-match",
                "loading": "http://127.0.0.1:3000/price-lookup/evidence?scenario=loading",
            },
            "required_scenario_artifacts": {
                "sealed_plus_singles": "web-host/scenarios/sealed-plus-singles.png",
                "single_specific": "web-host/scenarios/single-specific.png",
                "missing_price": "web-host/scenarios/missing-price.png",
                "stale": "web-host/scenarios/stale.png",
                "category_not_loaded": "web-host/scenarios/category-not-loaded.png",
                "no_match": "web-host/scenarios/no-match.png",
                "loading": "web-host/scenarios/loading.png",
                "error": "web-host/scenarios/error-retry.json",
            },
            "required_web_environment_artifacts": {
                "reduced_motion": {
                    "screenshot": "web-host/probe/reduced-motion.png",
                    "diagnostic": "web-host/probe/reduced-motion.json",
                    "surface": "web",
                    "required_environment": "prefers-reduced-motion: reduce",
                    "required_assertion": "The rendered web surface reports the enabled media query and records computed motion behavior.",
                },
                "increased_contrast": {
                    "screenshot": "web-host/probe/increased-contrast.png",
                    "diagnostic": "web-host/probe/increased-contrast.json",
                    "surface": "web",
                    "required_environment": "prefers-contrast: more",
                    "required_assertion": "The rendered web surface reports the enabled media query and records computed contrast adaptations.",
                },
            },
            "required_manifest_results": {
                "reduced_motion": {"surface": "web", "status": ["pass", "fail", "not-applicable"], "diagnostic_required": True},
                "increased_contrast": {"surface": "web", "status": ["pass", "fail", "not-applicable"], "diagnostic_required": True},
                "contrast": {"surface": "web", "status": ["pass", "fail", "not-applicable"], "diagnostic_required": True},
            },
            "capture_widths_css_px": [320, 768, 1200, 1440],
            "required_zoom_artifacts": {
                "200_percent": {
                    "url": "http://127.0.0.1:3000/price-lookup/evidence?scenario=sealed&zoom=200",
                    "screenshot": "web-host/probe/zoom-200.png",
                    "diagnostic": "web-host/probe/zoom-200.json",
                    "required_environment": "640px desktop fine-pointer zoom viewport",
                    "required_assertion": "Search and the Singles condition control both reflow in normal document order, and neither obscures result product type, name, or identity text.",
                    "pass_criteria": {
                        "search_panel_selector": ".pricing-search-panel",
                        "search_panel_computed_position": "static",
                        "search_panel_sticky_class": False,
                        "search_panel_reflow_attribute": "true",
                        "condition_panel_selector": "[data-pricing-condition-panel]",
                        "condition_panel_computed_position": "static",
                        "condition_panel_sticky_class": False,
                        "condition_panel_reflow_attribute": "true",
                        "identity_selector": "[data-pricing-result-identity]",
                        "required_visible_identity_fields": [
                            "[data-pricing-product-type]",
                            "[data-pricing-product-name]",
                            "[data-pricing-printing-identity]",
                        ],
                        "search_panel_identity_intersections": 0,
                        "condition_panel_identity_intersections": 0,
                        "horizontal_overflow_css_px": 0,
                    },
                    "capture_selectors": {
                        "search_panel": "[data-pricing-search-panel]",
                        "condition_panel": "[data-pricing-condition-panel]",
                        "identities": "[data-pricing-result-identity][data-pricing-result-sku]",
                        "product_type": "[data-pricing-product-type]",
                        "product_name": "[data-pricing-product-name]",
                        "printing_identity": "[data-pricing-printing-identity]",
                    },
                    "result_schema": zoom_result_schema(),
                },
                "400_percent": {
                    "url": "http://127.0.0.1:3000/price-lookup/evidence?scenario=sealed&zoom=400",
                    "screenshot": "web-host/probe/zoom-400.png",
                    "diagnostic": "web-host/probe/zoom-400.json",
                    "required_environment": "320px desktop fine-pointer zoom viewport",
                    "required_assertion": "Search and the Singles condition control both reflow in normal document order, and neither obscures result product type, name, or identity text.",
                    "pass_criteria": {
                        "search_panel_selector": ".pricing-search-panel",
                        "search_panel_computed_position": "static",
                        "search_panel_sticky_class": False,
                        "search_panel_reflow_attribute": "true",
                        "condition_panel_selector": "[data-pricing-condition-panel]",
                        "condition_panel_computed_position": "static",
                        "condition_panel_sticky_class": False,
                        "condition_panel_reflow_attribute": "true",
                        "identity_selector": "[data-pricing-result-identity]",
                        "required_visible_identity_fields": [
                            "[data-pricing-product-type]",
                            "[data-pricing-product-name]",
                            "[data-pricing-printing-identity]",
                        ],
                        "search_panel_identity_intersections": 0,
                        "condition_panel_identity_intersections": 0,
                        "horizontal_overflow_css_px": 0,
                    },
                    "capture_selectors": {
                        "search_panel": "[data-pricing-search-panel]",
                        "condition_panel": "[data-pricing-condition-panel]",
                        "identities": "[data-pricing-result-identity][data-pricing-result-sku]",
                        "product_type": "[data-pricing-product-type]",
                        "product_name": "[data-pricing-product-name]",
                        "printing_identity": "[data-pricing-printing-identity]",
                    },
                    "result_schema": zoom_result_schema(),
                },
            },
            "required_accessibility_artifacts": {
                "keyboard_operation": {
                    "path": "jarvis-runtime-evidence/web-host/probe/keyboard-operation.json",
                    "required_assertion": "Tab and Shift+Tab reach every visible native control in logical DOM order, and Enter or Space operates buttons and disclosure controls.",
                    "result_schema": {
                        "status": ["pass", "fail"],
                        "diagnostic": "non-empty string on pass or fail",
                        "tab_order": "non-empty array of control names in observed order",
                        "reverse_tab_order": "non-empty array of control names in observed order",
                        "activations": "non-empty array recording control, key, before state, and after state",
                    },
                    "failure_diagnostic_required_fields": [
                        "failed_control",
                        "attempted_key",
                        "observed_before_state",
                        "observed_after_state",
                        "page_url",
                    ],
                    "reject_diagnostics": ["", "no diagnostic", "null"],
                    "required_named_controls": {
                        'input[type="search"]': "Search card, set, collector number, or sealed product",
                        "[data-pricing-condition-panel] select": "Singles condition",
                    },
                },
                "visible_focus": {
                    "path": "jarvis-runtime-evidence/web-host/probe/visible-focus.json",
                    "required_assertion": "Every visible keyboard target has a visually distinguishable focus indicator, including search, Clear, sealed expander, Singles condition, disclosures, and asking-price inputs.",
                    "pass_criteria": {
                        "selector_match_alone_is_insufficient": True,
                        "computed_indicator_required": True,
                        "reject_outline_style": ["none", "hidden"],
                        "reject_fully_transparent_box_shadow": True,
                    },
                    "diagnostic_required": True,
                    "diagnostic_must_be_non_null": True,
                    "required_named_controls": {
                        'input[type="search"]': "Search card, set, collector number, or sealed product",
                        "[data-pricing-condition-panel] select": "Singles condition",
                    },
                },
                "focus_traversal": {
                    "path": "jarvis-runtime-evidence/web-host/probe/focus-traversal.json",
                    "required_assertion": "Every visible tabbable control, including Singles condition, has focus_visible true.",
                },
                "screen_reader_output": {
                    "path": "jarvis-runtime-evidence/web-host/probe/screen-reader-output.json",
                    "required_assertion": "The rendered web accessibility tree records names, roles, states, and reading order for the lookup controls and results.",
                    "capture_root": ".pricing-lookup",
                    "capture_algorithm": {
                        "resolve_root": "querySelector('.pricing-lookup') must match exactly one rendered element after interactive readiness",
                        "resolve_backend_node": "DOM.describeNode on the matched element supplies its backendNodeId",
                        "cdp_session": "use the same page-target CDP session that navigated the evidence URL; browser-target accessibility commands are forbidden",
                        "enable_accessibility": "call Accessibility.enable on the page-target session before resolving or capturing accessibility nodes",
                        "capture_tree": "Accessibility.getFullAXTree on the page-target session, then locate the labelled Price lookup region by the resolved .pricing-lookup backendNodeId",
                        "root_boundary": "retain only the matched Price lookup region and AX descendants reachable through childIds; never retain document ancestors, siblings, or unrelated nodes",
                        "semantic_order": "reconstruct depth-first order from AXNode childIds beginning at the matched Price lookup region",
                        "first_spoken_node": {"role": "region", "name": "Price lookup"},
                    },
                    "result_schema": {
                        "capture_root": ".pricing-lookup",
                        "capture_root_match_count": 1,
                        "capture_root_backend_node_id": "non-null backendNodeId for the matched .pricing-lookup element",
                        "capture_api": "Accessibility.getFullAXTree",
                        "accessibility_enabled": True,
                        "page_target_session_id": "non-null session id used for navigation and every DOM/Accessibility command",
                        "scoped_root_role": "region",
                        "scoped_root_name": "Price lookup",
                        "accessibility_nodes": "product nodes only, each with role, non-null accessible name, description, and state",
                        "derived_spoken_sequence": "non-empty sequence derived once from exposed semantic nodes in accessibility-tree order",
                        "required_result_content": [
                            "product type",
                            "product name",
                            "printing identity",
                            "delivered-price state",
                            "listing and shipping breakdown",
                            "history",
                            "snapshot date",
                        ],
                        "excluded_node_roles": ["StaticText", "InlineTextBox"],
                        "excluded_runtime_content": ["Open Next.js Dev Tools", "Next.js Dev Tools"],
                    },
                    "reject_if": [
                        "capture_api is not Accessibility.getFullAXTree",
                        "Accessibility.enable, DOM resolution, and getFullAXTree did not use the same page-target session",
                        "capture-root metadata is absent, ambiguous, or does not identify .pricing-lookup",
                        "the full tree has no node whose backendDOMNodeId matches the resolved .pricing-lookup backendNodeId",
                        "the matched root is not a region named Price lookup",
                        "the scoped descendant traversal returns zero accessibility nodes",
                        "the capture includes nodes outside .pricing-lookup",
                        "the first derived spoken node is not the Price lookup region",
                        "the spoken sequence includes development-runtime content",
                        "raw StaticText or InlineTextBox descendants duplicate an exposed parent",
                        "either required named control is absent or has a different accessible name",
                        "any visible result lacks one intelligible semantic node naming its product type, product name, printing identity, delivered-price state, listing and shipping breakdown, history, or snapshot date",
                    ],
                    "required_named_controls": {
                        'input[type="search"]': "Search card, set, collector number, or sealed product",
                        "[data-pricing-condition-panel] select": "Singles condition",
                    },
                },
                "contrast": {
                    "path": "jarvis-runtime-evidence/web-host/probe/contrast.json",
                    "surface": "web",
                    "required_assertion": "Every rendered text sample meets its applicable WCAG contrast threshold.",
                    "diagnostic_required": True,
                    "diagnostic_must_be_non_null": True,
                },
            },
        },
        "ios": {
            "working_directory": str(root),
            "project": "ios/PhronesisEvidence.xcodeproj",
            "scheme": "PhronesisEvidence",
            "application_target": "PhronesisEvidence",
            "ui_test_target": "PhronesisEvidenceUITests",
            "test_plan": [
                "PhronesisEvidenceUITests/testNamedControlsAndRuntimeAccessibility",
                "PhronesisEvidenceUITests/testSealedExpansion",
                "PhronesisEvidenceUITests/testVoiceOverProducesRealUtterances",
            ],
            "required_voiceover_artifact": {
                "path": "jarvis-runtime-evidence/ios-host/voiceover-utterances.json",
                "source": "genuine XCUIVoiceOverService.Output utterances",
                "required_content": [
                    "product type", "printing identity including full variant",
                    "delivered-price state", "listing and shipping breakdown",
                    "history", "snapshot date",
                ],
                "reject_if": [
                    "a required decision fact is absent",
                    "a printing identity or other required phrase is truncated",
                    "the transcript originates outside PhronesisEvidence",
                ],
            },
            "required_device_runs": {
                "compact_iphone_baseline": {
                    "content_size_category": "large",
                    "increased_contrast": False,
                    "required_artifact": "jarvis-runtime-evidence/ios-host/compact-iphone-baseline.png",
                },
                "large_iphone_baseline": {
                    "content_size_category": "large",
                    "increased_contrast": False,
                    "required_artifact": "jarvis-runtime-evidence/ios-host/large-iphone-baseline.png",
                },
                "large_iphone_accessibility": {
                    "content_size_category": "accessibility-extra-extra-extra-large",
                    "increased_contrast": True,
                    "required_artifact": "jarvis-runtime-evidence/ios-host/large-iphone-accessibility.png",
                },
            },
        },
        "ownership": {
            "executor": "serialized Mac Worker",
            "engineer_must_not_claim_runtime_passes": True,
        },
    }


def required_paths(contract: dict[str, object]) -> list[str]:
    web = contract["web"]
    ios = contract["ios"]
    assert isinstance(web, dict) and isinstance(ios, dict)
    return [
        "package.json",
        str(web["route"]),
        str(web["evidence_route"]),
        f'{ios["project"]}/project.pbxproj',
        "ios/PhronesisEvidence/PhronesisEvidenceApp.swift",
        "ios/PhronesisEvidence/PricingLookupEvidenceView.swift",
        "ios/PhronesisEvidenceUITests/PhronesisEvidenceUITests.swift",
        "ios/PhronesisEvidence.xcodeproj/xcshareddata/xcschemes/PhronesisEvidence.xcscheme",
    ]


def validate(root: Path, contract: dict[str, object]) -> list[str]:
    errors = [path for path in required_paths(contract) if not (root / path).is_file()]

    package_path = root / "package.json"
    if package_path.is_file():
        try:
            package = json.loads(package_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            errors.append(f"package.json is unreadable: {error}")
        else:
            scripts = package.get("scripts", {})
            if not isinstance(scripts, dict) or "evidence:web" not in scripts:
                errors.append("package.json is missing scripts.evidence:web")
            elif scripts["evidence:web"] != EVIDENCE_WEB_SCRIPT:
                errors.append(
                    "package.json scripts.evidence:web must use the deterministic "
                    f"isolated Webpack launcher: {EVIDENCE_WEB_SCRIPT}"
                )

    next_config_path = root / "next.config.ts"
    if not next_config_path.is_file():
        errors.append("next.config.ts is missing")
    else:
        next_config = next_config_path.read_text(encoding="utf-8")
        for marker in (
            'process.env.JARVIS_RUNTIME_EVIDENCE === "1"',
            f'"{EVIDENCE_DIST_DIR}"',
            'devIndicators: process.env.JARVIS_RUNTIME_EVIDENCE === "1" ? false : undefined',
        ):
            if marker not in next_config:
                errors.append(
                    f"next.config.ts is missing evidence build isolation marker: {marker}"
                )

    project_path = root / "ios/PhronesisEvidence.xcodeproj/project.pbxproj"
    if project_path.is_file():
        project = project_path.read_text(encoding="utf-8")
        for marker in (
            'productType = "com.apple.product-type.application"',
            'productType = "com.apple.product-type.bundle.ui-testing"',
            "PhronesisEvidenceUITests",
        ):
            if marker not in project:
                errors.append(f"Xcode project is missing marker: {marker}")

    ios_view_path = root / "ios/PhronesisEvidence/PricingLookupEvidenceView.swift"
    if ios_view_path.is_file():
        ios_view = ios_view_path.read_text(encoding="utf-8")
        for marker in (
            '.frame(height: 44)',
            '.accessibilityIdentifier("pricing-search")',
            '.frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)',
        ):
            if marker not in ios_view:
                errors.append(f"iOS evidence view is missing search hit-area marker: {marker}")

    ios_tests_path = root / "ios/PhronesisEvidenceUITests/PhronesisEvidenceUITests.swift"
    if ios_tests_path.is_file():
        ios_tests = ios_tests_path.read_text(encoding="utf-8")
        for marker in (
            'voiceOver.enable()',
            'app.activate()',
            'app.wait(for: .runningForeground',
            'for _ in 0..<64',
            'consecutiveDuplicateUtterances',
            'transcriptCarriesDecisionFacts',
            'decisionCriticalPhrases',
            'requiredResultDecisionFacts',
            'History. No history yet',
            'Snapshot date. Snapshot Jul 28',
            'spokenDecisionFlow',
            'scrollView.coordinate(',
            'CGVector(dx: 0.5, dy: 0.72)',
            'CGVector(dx: 0.5, dy: 0.32)',
            'press(forDuration: 0.2, thenDragTo: dragEnd)',
        ):
            if marker not in ios_tests:
                errors.append(f"iOS evidence tests are missing runtime-recovery marker: {marker}")

        # An externally interrupted run previously discarded a VoiceOver
        # transcript that had already been captured in full, because the
        # attachment was only written after the content assertions. The
        # transcript must be durable before anything can fail or be killed.
        attach_at = ios_tests.find("add(attachment)")
        assert_at = ios_tests.find("spokenDecisionFlow")
        if attach_at == -1 or assert_at == -1 or attach_at > assert_at:
            errors.append(
                "iOS evidence tests must attach the VoiceOver transcript before "
                "asserting decision-critical content, so an interrupted or failing "
                "run still yields the captured transcript"
            )

    lookup_path = root / "features/pricing/components/PricingLookup.tsx"
    config_path = root / "config/pricingLookup.ts"
    if lookup_path.is_file():
        lookup = lookup_path.read_text(encoding="utf-8")
        if 'role="combobox"' in lookup:
            errors.append("Pricing Lookup search must not expose incomplete combobox semantics")
        for marker in (
            'type="search"',
            '"hidden md:block"',
            'md:hidden',
            'className="pricing-lookup ',
            'focus-visible:outline-cyan-300 focus-visible:ring-2',
            'mobileSealedPreviewCount: 2',
            '!loading && !error && resultCount === 0',
            'data-interactive-ready="false"',
            'setAttribute("data-interactive-ready", "true")',
            'document.activeElement !== pending.before',
            'window.addEventListener("keyup", completeTabTraversal)',
            'targets[nextIndex]?.focus()',
            'data-pricing-condition-panel',
            'data-pricing-condition-reflow',
            'data-pricing-search-panel',
            'data-pricing-search-reflow',
            'data-pricing-result-identity',
            'data-pricing-result-sku',
            'data-pricing-result-product-type',
            'data-pricing-result-name',
            'data-pricing-result-printing',
            'data-pricing-product-type',
            'data-pricing-product-name',
            'data-pricing-printing-identity',
            'data-evidence-zoom-reflow',
            'aria-label="Search card, set, collector number, or sealed product"',
            'aria-label="Singles condition"',
        ):
            if marker not in lookup:
                if marker == 'mobileSealedPreviewCount: 2':
                    config = config_path.read_text(encoding="utf-8") if config_path.is_file() else ""
                    if marker in config:
                        continue
                errors.append(f"Pricing Lookup is missing responsive evidence marker: {marker}")

    if not config_path.is_file():
        errors.append("config/pricingLookup.ts is missing")

    global_css_path = root / "app/globals.css"
    if not global_css_path.is_file():
        errors.append("app/globals.css is missing")
    else:
        global_css = global_css_path.read_text(encoding="utf-8")
        for marker in (
            ".pricing-lookup :focus,",
            ".pricing-lookup :focus-visible",
            '.pricing-lookup[data-browser-zoom-reflow="true"] .pricing-condition-panel',
            '.pricing-lookup[data-evidence-zoom-reflow="true"] .pricing-condition-panel',
            '.pricing-lookup[data-browser-zoom-reflow="true"] .pricing-search-panel',
            '.pricing-lookup[data-evidence-zoom-reflow="true"] .pricing-search-panel',
            "@media (forced-colors: active)",
            "@media (prefers-reduced-motion: reduce)",
            "@media (prefers-contrast: more)",
        ):
            if marker not in global_css:
                errors.append(f"Pricing Lookup is missing focus fallback marker: {marker}")
    topbar_path = root / "components/ui/Topbar.tsx"
    if not topbar_path.is_file():
        errors.append("components/ui/Topbar.tsx is missing")
    else:
        topbar = topbar_path.read_text(encoding="utf-8")
        for marker in (
            "focus:border-cyan-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-cyan-300",
            'aria-label="User menu"',
            "border border-transparent bg-zinc-800",
        ):
            if marker not in topbar:
                errors.append(f"Topbar is missing opaque focus marker: {marker}")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--preflight",
        action="store_true",
        help="validate target files and emit a machine-readable result",
    )
    parser.add_argument(
        "--validate-evidence",
        type=Path,
        metavar="DIRECTORY",
        help="validate completed Worker zoom and web-semantic artifacts",
    )
    args = parser.parse_args()

    root = repository_root()
    contract = target_contract(root)
    errors = validate(root, contract) if args.preflight else []
    if args.validate_evidence is not None:
        errors.extend(validate_evidence_directory(args.validate_evidence.resolve()))
    result = {
        **contract,
        "preflight": {
            "status": "pass" if not errors else "fail",
            "errors": errors,
        },
        "evidence_validation": {
            "directory": str(args.validate_evidence.resolve()) if args.validate_evidence else None,
            "status": "pass" if args.validate_evidence is not None and not errors else "not-run" if args.validate_evidence is None else "fail",
            "errors": errors if args.validate_evidence is not None else [],
        },
    }
    json.dump(result, sys.stdout, indent=2, sort_keys=True)
    sys.stdout.write(os.linesep)
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
