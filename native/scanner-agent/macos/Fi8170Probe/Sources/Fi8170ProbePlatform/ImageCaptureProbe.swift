import Darwin
import Fi8170ProbeCore
import Foundation
import ImageCaptureCore

public final class ImageCaptureProbe: NSObject, ICDeviceBrowserDelegate, ICScannerDeviceDelegate {
  public static let localScannerBrowserMask = ICDeviceTypeMask(
    rawValue: ICDeviceTypeMask.scanner.rawValue | ICDeviceLocationTypeMask.local.rawValue)!

  private let options: ProbeOptions
  private let emitter: ProbeEventEmitter
  private let browser = ICDeviceBrowser()
  private var devices: [ICScannerDevice] = []
  private var scanner: ICScannerDevice?
  private var frameStore: AtomicFrameStore?
  private var ingestor: FrameIngestor?
  private var lifecycle = ProbeLifecycle()
  private var timeoutTimer: Timer?
  private var signalSource: DispatchSourceSignal?
  private var isFinished = false
  private var sessionIsOpen = false
  private var pendingExitCode: ProbeExitCode = .success

  public init(options: ProbeOptions, emitter: ProbeEventEmitter) {
    self.options = options
    self.emitter = emitter
    super.init()
  }

  public func run() -> ProbeExitCode {
    installSignalHandler()

    var started = ProbeEventDetails()
    started.command = options.command.rawValue
    started.query = Redactor.safeDeviceName(options.deviceQuery)
    emitter.emit(.programStarted, details: started)

    do {
      try lifecycle.transition(to: .discovering)
    } catch {
      return .sessionFailure
    }

    browser.delegate = self
    browser.browsedDeviceTypeMask = Self.localScannerBrowserMask
    browser.start()
    scheduleDiscoveryCompletion(options.discoveryTimeout)

    while !isFinished {
      RunLoop.main.run(mode: .default, before: Date(timeIntervalSinceNow: 0.1))
    }
    return pendingExitCode
  }

  public func deviceBrowser(
    _ browser: ICDeviceBrowser,
    didAdd device: ICDevice,
    moreComing: Bool
  ) {
    guard let scanner = device as? ICScannerDevice else { return }
    devices.append(scanner)

    var details = ProbeEventDetails()
    details.deviceName = Redactor.safeDeviceName(scanner.name)
    details.transport = Redactor.safeMessage(scanner.transportType ?? "unknown")
    emitter.emit(.deviceDiscovered, details: details)
  }

  public func deviceBrowser(
    _ browser: ICDeviceBrowser,
    didRemove device: ICDevice,
    moreGoing: Bool
  ) {
    devices.removeAll { $0 === device }
  }

  public func deviceBrowserDidEnumerateLocalDevices(_ browser: ICDeviceBrowser) {
    finishEnumeration()
  }

  public func device(_ device: ICDevice, didOpenSessionWithError error: Error?) {
    timeoutTimer?.invalidate()
    if let error {
      fail(error: error, message: "Scanner session could not be opened.", code: .sessionFailure)
      return
    }

    sessionIsOpen = true
    do {
      try lifecycle.transition(to: .ready)
    } catch {
      fail(
        error: error, message: "Scanner entered an invalid session state.", code: .sessionFailure)
      return
    }
    emitter.emit(.sessionOpened)

    guard let scanner = device as? ICScannerDevice else {
      fail(error: nil, message: "Opened device is not a scanner.", code: .sessionFailure)
      return
    }

    if scanner.selectedFunctionalUnit.type == .documentFeeder {
      handle(functionalUnit: scanner.selectedFunctionalUnit)
      return
    }

    let available = scanner.availableFunctionalUnitTypes.map { Int(truncating: $0) }
    guard available.contains(Int(ICScannerFunctionalUnitType.documentFeeder.rawValue)) else {
      var details = ProbeEventDetails()
      details.functionalUnitTypes = available.sorted()
      emitter.emit(.capabilityReport, details: details)
      fail(error: nil, message: "Scanner does not expose a document feeder.", code: .sessionFailure)
      return
    }

    scanner.requestSelect(.documentFeeder)
    scheduleTimeout(options.sessionTimeout, message: "Document-feeder selection timed out.")
  }

  public func scannerDevice(
    _ scanner: ICScannerDevice,
    didSelect functionalUnit: ICScannerFunctionalUnit,
    error: Error?
  ) {
    timeoutTimer?.invalidate()
    if let error {
      fail(error: error, message: "Document-feeder selection failed.", code: .sessionFailure)
      return
    }
    handle(functionalUnit: functionalUnit)
  }

  public func scannerDevice(_ scanner: ICScannerDevice, didScanTo url: URL) {
    guard let ingestor else {
      fail(
        error: nil, message: "A scan frame arrived without an evidence store.", code: .scanFailure)
      return
    }
    do {
      switch try ingestor.ingest(sourceURL: url) {
      case .committed(let receipt):
        emitter.emit(.framePersisted, details: Self.details(for: receipt))
      case .duplicate(let receipt):
        emitter.emit(.duplicateFrameIgnored, details: Self.details(for: receipt))
      }
    } catch {
      fail(error: error, message: "A scan frame could not be persisted.", code: .scanFailure)
    }
  }

  public func scannerDevice(_ scanner: ICScannerDevice, didCompleteScanWithError error: Error?) {
    timeoutTimer?.invalidate()

    if pendingExitCode == .cancelled {
      closeSession(code: .cancelled)
      return
    }
    if lifecycle.state == .failed, pendingExitCode != .success {
      closeSession(code: pendingExitCode)
      return
    }
    if let error {
      fail(error: error, message: "The scanner reported an incomplete scan.", code: .scanFailure)
      return
    }

    do {
      try lifecycle.transition(to: .ready)
      try ingestor?.finalize()
    } catch {
      fail(error: error, message: "Scan evidence finalization failed.", code: .scanFailure)
      return
    }

    var details = ProbeEventDetails()
    details.frameCount = ingestor?.committedCount ?? 0
    emitter.emit(.scanCompleted, details: details)
    closeSession(code: .success)
  }

  public func device(_ device: ICDevice, didCloseSessionWithError error: Error?) {
    timeoutTimer?.invalidate()
    sessionIsOpen = false

    if let error {
      var details = errorDetails(error, message: "Scanner session close reported an error.")
      details.state = lifecycle.state.rawValue
      emitter.emit(.failed, details: details)
      pendingExitCode = pendingExitCode == .success ? .sessionFailure : pendingExitCode
    } else {
      emitter.emit(.sessionClosed)
    }

    finish(code: pendingExitCode)
  }

  public func didRemove(_ device: ICDevice) {
    fail(error: nil, message: "Scanner was removed during the probe.", code: .sessionFailure)
  }

  private func finishEnumeration() {
    guard lifecycle.state == .discovering else { return }
    timeoutTimer?.invalidate()
    browser.stop()

    do {
      try lifecycle.transition(to: .enumerationComplete)
    } catch {
      fail(
        error: error, message: "Scanner enumeration entered an invalid state.",
        code: .sessionFailure)
      return
    }

    var details = ProbeEventDetails()
    details.deviceCount = devices.count
    emitter.emit(.enumerationCompleted, details: details)

    if options.command == .list {
      finish(code: .success)
      return
    }

    let query = options.deviceQuery.lowercased()
    guard let scanner = devices.first(where: { ($0.name ?? "").lowercased().contains(query) })
    else {
      var missing = ProbeEventDetails()
      missing.query = Redactor.safeDeviceName(options.deviceQuery)
      emitter.emit(.deviceNotFound, details: missing)
      finish(code: .deviceNotFound)
      return
    }

    self.scanner = scanner
    scanner.delegate = self
    do {
      try lifecycle.transition(to: .openingSession)
    } catch {
      fail(
        error: error, message: "Scanner session entered an invalid opening state.",
        code: .sessionFailure)
      return
    }

    var opening = ProbeEventDetails()
    opening.deviceName = Redactor.safeDeviceName(scanner.name)
    emitter.emit(.sessionOpening, details: opening)
    scanner.requestOpenSession()
    scheduleTimeout(options.sessionTimeout, message: "Scanner session opening timed out.")
  }

  private func handle(functionalUnit: ICScannerFunctionalUnit) {
    timeoutTimer?.invalidate()
    guard let feeder = functionalUnit as? ICScannerFunctionalUnitDocumentFeeder else {
      fail(
        error: nil, message: "Selected functional unit is not a document feeder.",
        code: .sessionFailure)
      return
    }

    let functionalUnitType = Int(feeder.type.rawValue)
    let supportedResolutions = feeder.supportedResolutions.map { $0 }
    let preferredResolutions = feeder.preferredResolutions.map { $0 }
    let supportedBitDepths = feeder.supportedBitDepths.map { $0 }
    let supportedDocumentTypes = feeder.supportedDocumentTypes.map { $0 }
    let currentResolution = Int(feeder.resolution)
    let pixelDataType = Int(feeder.pixelDataType.rawValue)
    let bitDepth = Int(feeder.bitDepth.rawValue)
    let supportsDuplex = feeder.supportsDuplexScanning
    let duplexEnabled = feeder.duplexScanningEnabled
    let reverseFeederPageOrder = feeder.reverseFeederPageOrder
    let documentLoaded = feeder.documentLoaded
    let physicalSize = feeder.physicalSize

    let snapshot = ScannerCapabilitySnapshot(
      functionalUnitType: functionalUnitType,
      supportedResolutions: supportedResolutions,
      preferredResolutions: preferredResolutions,
      supportedBitDepths: supportedBitDepths,
      supportedDocumentTypes: supportedDocumentTypes,
      currentResolution: currentResolution,
      pixelDataType: pixelDataType,
      bitDepth: bitDepth,
      supportsDuplex: supportsDuplex,
      duplexEnabled: duplexEnabled,
      reverseFeederPageOrder: reverseFeederPageOrder,
      documentLoaded: documentLoaded,
      physicalWidth: Double(physicalSize.width),
      physicalHeight: Double(physicalSize.height)
    )
    emitter.emit(.capabilityReport, details: snapshot.eventDetails())

    if options.command == .probe {
      closeSession(code: .success)
      return
    }
    configureAndStartScan(scanner: scanner, feeder: feeder)
  }

  private func configureAndStartScan(
    scanner: ICScannerDevice?,
    feeder: ICScannerFunctionalUnitDocumentFeeder
  ) {
    guard
      options.command == .scan,
      options.allowPhysicalScan,
      let scanner,
      let outputDirectory = options.outputDirectory
    else {
      fail(
        error: nil, message: "Physical scan consent or evidence storage is missing.",
        code: .scanFailure)
      return
    }

    emitter.emit(.scanConsentConfirmed)
    let frameStore: AtomicFrameStore
    do {
      frameStore = try AtomicFrameStore(
        outputDirectory: outputDirectory,
        sessionID: emitter.sessionID
      )
      self.frameStore = frameStore
      self.ingestor = FrameIngestor(store: frameStore)
    } catch {
      fail(
        error: error, message: "The evidence staging directory could not be created.",
        code: .scanFailure)
      return
    }

    scanner.transferMode = .fileBased
    scanner.downloadsDirectory = frameStore.stagingDirectory
    scanner.documentName = "frame"
    scanner.documentUTI = "public.jpeg"

    if feeder.supportedResolutions.contains(600) {
      feeder.resolution = 600
    } else if feeder.supportedResolutions.contains(300) {
      feeder.resolution = 300
    }
    if feeder.supportsDuplexScanning {
      feeder.duplexScanningEnabled = true
    }

    var configured = ProbeEventDetails()
    configured.resolution = feeder.resolution
    configured.duplexEnabled = feeder.duplexScanningEnabled
    configured.message = "Use only owner-approved low-value test cards under direct supervision."
    emitter.emit(.scanConfigured, details: configured)

    do {
      try lifecycle.transition(to: .scanning)
    } catch {
      fail(error: error, message: "Scanner entered an invalid scan state.", code: .scanFailure)
      return
    }
    emitter.emit(.scanStarted)
    scanner.requestScan()
    scheduleTimeout(options.scanTimeout, message: "Physical scan timed out.")
  }

  private func closeSession(code: ProbeExitCode) {
    pendingExitCode = code
    guard sessionIsOpen, let scanner else {
      finish(code: code)
      return
    }
    guard lifecycle.state != .closing else { return }

    do {
      try lifecycle.transition(to: .closing)
    } catch {
      lifecycle = ProbeLifecycle()
      finish(code: code == .success ? .sessionFailure : code)
      return
    }
    emitter.emit(.sessionClosing)
    scanner.requestCloseSession()
    scheduleTimeout(options.sessionTimeout, message: "Scanner session close timed out.")
  }

  private func cancel(reason: String) {
    guard !isFinished else { return }
    timeoutTimer?.invalidate()
    pendingExitCode = .cancelled

    var details = ProbeEventDetails()
    details.message = Redactor.safeMessage(reason)
    details.state = lifecycle.state.rawValue
    emitter.emit(.cancelled, details: details)

    if lifecycle.state == .scanning {
      try? lifecycle.transition(to: .cancelling)
      scanner?.cancelScan()
      scheduleForcedFinish(
        options.sessionTimeout,
        message: "Scanner cancellation did not complete before the safety deadline.",
        code: .timedOut
      )
    } else if sessionIsOpen {
      try? lifecycle.transition(to: .cancelling)
      closeSession(code: .cancelled)
    } else {
      browser.stop()
      finish(code: .cancelled)
    }
  }

  private func fail(error: Error?, message: String, code: ProbeExitCode) {
    guard !isFinished else { return }
    timeoutTimer?.invalidate()
    pendingExitCode = code
    let stateBeforeFailure = lifecycle.state

    var details = errorDetails(error, message: message)
    details.state = lifecycle.state.rawValue
    emitter.emit(.failed, details: details)
    try? lifecycle.transition(to: .failed)

    if stateBeforeFailure == .closing || stateBeforeFailure == .failed {
      finish(code: code)
      return
    }
    if lifecycle.state == .failed, scanner?.selectedFunctionalUnit.scanInProgress == true {
      scanner?.cancelScan()
      scheduleForcedFinish(
        options.sessionTimeout,
        message: "Scanner recovery did not complete before the safety deadline.",
        code: code
      )
      return
    }
    if sessionIsOpen {
      closeSession(code: code)
    } else {
      browser.stop()
      finish(code: code)
    }
  }

  private func finish(code: ProbeExitCode) {
    guard !isFinished else { return }
    timeoutTimer?.invalidate()
    browser.stop()
    pendingExitCode = code
    if lifecycle.state != .completed {
      try? lifecycle.transition(to: .completed)
    }
    isFinished = true
  }

  private func scheduleTimeout(_ interval: TimeInterval, message: String) {
    timeoutTimer?.invalidate()
    timeoutTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: false) {
      [weak self] _ in
      self?.fail(error: nil, message: message, code: .timedOut)
    }
  }

  private func scheduleDiscoveryCompletion(_ interval: TimeInterval) {
    timeoutTimer?.invalidate()
    timeoutTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: false) {
      [weak self] _ in
      self?.finishEnumeration()
    }
  }

  private func scheduleForcedFinish(
    _ interval: TimeInterval,
    message: String,
    code: ProbeExitCode
  ) {
    timeoutTimer?.invalidate()
    timeoutTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: false) {
      [weak self] _ in
      guard let self, !self.isFinished else { return }
      var details = ProbeEventDetails()
      details.message = Redactor.safeMessage(message)
      details.state = self.lifecycle.state.rawValue
      self.emitter.emit(.failed, details: details)
      self.finish(code: code)
    }
  }

  private func installSignalHandler() {
    signal(SIGINT, SIG_IGN)
    let source = DispatchSource.makeSignalSource(signal: SIGINT, queue: .main)
    source.setEventHandler { [weak self] in
      self?.cancel(reason: "Operator requested cancellation.")
    }
    source.resume()
    signalSource = source
  }

  private func errorDetails(_ error: Error?, message: String) -> ProbeEventDetails {
    var details = ProbeEventDetails()
    details.message = Redactor.safeMessage(message)
    if let error = error as NSError? {
      details.errorDomain = Redactor.safeMessage(error.domain)
      details.errorCode = error.code
    }
    return details
  }

  private static func details(for receipt: FrameReceipt) -> ProbeEventDetails {
    var details = ProbeEventDetails()
    details.sourceName = receipt.sourceName
    details.committedName = receipt.committedName
    details.sha256 = receipt.sha256
    details.byteCount = receipt.byteCount
    details.frameSequence = receipt.frameSequence
    return details
  }
}
