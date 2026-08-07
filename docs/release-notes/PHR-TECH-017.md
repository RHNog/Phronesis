# PHR-TECH-017 — Cross-Platform Scanner Appliance Control Plane

Phronesis can now pair an approved scanner computer once, show its readiness in Scanner-to-Offer, queue a batch Start, coordinate Cancel, and receive front images directly into the exact recognition session.

The portable Scanner Agent runs on macOS or Windows, keeps all vendor-driver setup local, makes outbound requests only, and can be packaged as a native single executable so trusted testers do not need a repository checkout or Node.js installation. Phronesis stores only hashed pairing/device credentials and never sends remote shell or executable configuration.

This release is the control-plane foundation. Current-host macOS packaging and synthetic end-to-end behavior are verified. Signed installers, automatic background-service setup, target Windows execution, and every claimed physical scanner/driver/OS combination remain release gates before broad plug-and-play distribution.
