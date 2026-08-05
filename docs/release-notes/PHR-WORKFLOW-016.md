# PHR-WORKFLOW-016 Release Notes

Added the authenticated Scanner to Offer Vendor workflow with batch-folder intake, durable session counts, evidence display, operator identity/material confirmation, server-verified exact-condition price evidence, buying-preset binding, and local offer drafts. It performs no purchase, inventory, marketplace, or publication mutation.

Privately activated the workflow at tailnet-only port `9444` with persistent user-supervised app and recognition-worker services. Session stages now reconcile from durable job and resolution truth, preventing completed or idempotently reimported batches from remaining incorrectly marked as processing.
