import Foundation
import NativeParityDomain
import XCTest
@testable import NativeCheckpointUI

/// XCTest exercised on an iOS Simulator destination (xcodebuild), not SwiftPM macOS host.
final class ExactNavigationSimulatorRuntimeEnvelopeTests: XCTestCase {
    private static let simulatorEnvelopePath = "/tmp/ios-native-simulator-envelope.json"
    private static let simulatorControlsPath = "/tmp/ios-native-simulator-controls.json"

    private lazy var fixtureText: String = {
        let bundled = try! XCTUnwrap(Bundle.module.url(forResource: "checkpoint", withExtension: "json"))
        return try! String(contentsOf: bundled, encoding: .utf8)
    }()

    private lazy var fixture: CheckpointFixture = {
        try! JSONDecoder().decode(CheckpointFixture.self, from: Data(fixtureText.utf8))
    }()

    private struct CheckpointFixture: Decodable {
        let operationID: String
        let initialPageID: String
        let targetPageID: String
        let mismatchedPageID: String
        let initialGeneration: Int64
        let staleGeneration: Int64

        enum CodingKeys: String, CodingKey {
            case operationID = "operation_id"
            case initialPageID = "initial_page_id"
            case targetPageID = "target_page_id"
            case mismatchedPageID = "mismatched_page_id"
            case initialGeneration = "initial_generation"
            case staleGeneration = "stale_generation"
        }
    }

    private lazy var probe: ExactNavigationRuntimeProbe = {
        ExactNavigationRuntimeProbe(
            fixtureSha256: RuntimeEnvelope.sha256Hex(fixtureText),
            operationID: fixture.operationID,
            initialPageID: fixture.initialPageID,
            targetPageID: fixture.targetPageID,
            mismatchedPageID: fixture.mismatchedPageID,
            initialGeneration: fixture.initialGeneration,
            staleGeneration: fixture.staleGeneration
        )
    }()

    private func requireSimulator() throws {
        #if !targetEnvironment(simulator)
        throw XCTSkip("Requires iOS Simulator destination (xcodebuild); host SwiftPM path stays runtime_class=HOST")
        #endif
    }

    func testSimulatorEmitsAcceptedRuntimeEnvelope() throws {
        try requireSimulator()
        let json = probe.emitAccepted(runtimeClass: RuntimeEnvelope.runtimeClassSimulator)
        XCTAssertTrue(json.contains("\"subject\":\"IOS_NATIVE\""))
        XCTAssertTrue(json.contains("\"runtime_class\":\"SIMULATOR\""))
        XCTAssertTrue(json.contains("\"result\":\"ACCEPTED\""))
        try json.write(toFile: Self.simulatorEnvelopePath, atomically: true, encoding: .utf8)
        if let path = ProcessInfo.processInfo.environment["RUNTIME_ENVELOPE_OUT"] {
            try FileManager.default.createDirectory(
                at: URL(fileURLWithPath: path).deletingLastPathComponent(),
                withIntermediateDirectories: true
            )
            try json.write(toFile: path, atomically: true, encoding: .utf8)
        }
        print("SIMULATOR_ENVELOPE_PATH=\(Self.simulatorEnvelopePath)")
    }

    func testSimulatorControlEnvelopes() throws {
        try requireSimulator()
        let duplicate = probe.emitDuplicateRejected(runtimeClass: RuntimeEnvelope.runtimeClassSimulator)
        let stale = probe.emitStaleRejected(runtimeClass: RuntimeEnvelope.runtimeClassSimulator)
        let unknown = probe.emitCallbackMismatchUnknown(runtimeClass: RuntimeEnvelope.runtimeClassSimulator)
        XCTAssertTrue(duplicate.contains("\"runtime_class\":\"SIMULATOR\""))
        XCTAssertTrue(stale.contains("\"result\":\"REJECTED\""))
        XCTAssertTrue(unknown.contains("\"result\":\"UNKNOWN\""))
        let payload = """
        {
          "duplicate_dispatch": \(duplicate),
          "stale_approval": \(stale),
          "callback_destination_mismatch": \(unknown)
        }
        """
        try payload.write(toFile: Self.simulatorControlsPath, atomically: true, encoding: .utf8)
        if let path = ProcessInfo.processInfo.environment["RUNTIME_CONTROLS_OUT"] {
            try FileManager.default.createDirectory(
                at: URL(fileURLWithPath: path).deletingLastPathComponent(),
                withIntermediateDirectories: true
            )
            try payload.write(toFile: path, atomically: true, encoding: .utf8)
        }
    }
}
