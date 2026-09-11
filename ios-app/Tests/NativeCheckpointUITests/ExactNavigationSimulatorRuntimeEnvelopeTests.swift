import Foundation
import NativeParityDomain
import XCTest
@testable import NativeCheckpointUI

/// XCTest exercised on an iOS Simulator destination (xcodebuild), not SwiftPM macOS host.
final class ExactNavigationSimulatorRuntimeEnvelopeTests: XCTestCase {
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

    /// Guest `/tmp` is not visible to `simctl spawn cat` (SIMULATOR_ENVELOPE_FILE_MISSING_AFTER_XCTEST).
    /// CI scrapes compact JSON / base64 markers from the xcodebuild log instead.
    private func emitMarked(_ label: String, _ payload: String) {
        let begin = "<<<\(label)_BEGIN>>>"
        let end = "<<<\(label)_END>>>"
        let b64 = Data(payload.utf8).base64EncodedString()
        let block = """
        \(begin)
        \(payload)
        \(end)
        <<<\(label)_B64>>>\(b64)<<<\(label)_B64_END>>>
        """
        print(block)
        if let data = Data((block + "\n").utf8) {
            FileHandle.standardOutput.write(data)
            FileHandle.standardError.write(data)
        }
        fflush(stdout)
        fflush(stderr)
        NSLog("%@", "<<<\(label)_B64>>>\(b64)<<<\(label)_B64_END>>>")
        let attachment = XCTAttachment(string: payload)
        attachment.name = label
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    func testSimulatorEmitsAcceptedRuntimeEnvelope() throws {
        try requireSimulator()
        let json = probe.emitAccepted(runtimeClass: RuntimeEnvelope.runtimeClassSimulator)
        XCTAssertTrue(json.contains("\"subject\":\"IOS_NATIVE\""))
        XCTAssertTrue(json.contains("\"runtime_class\":\"SIMULATOR\""))
        XCTAssertTrue(json.contains("\"result\":\"ACCEPTED\""))
        emitMarked("IOS_SIM_ENVELOPE", json)
        let tmp = FileManager.default.temporaryDirectory.appendingPathComponent(
            "ios-native-simulator-envelope.json"
        )
        try? json.write(to: tmp, atomically: true, encoding: .utf8)
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
        emitMarked("IOS_SIM_CONTROLS", payload)
    }
}
