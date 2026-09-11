import Foundation
import NativeParityDomain
import XCTest
@testable import NativeCheckpointUI

private struct CheckpointFixture: Decodable {
    let checkpointID: String
    let operationID: String
    let initialPageID: String
    let targetPageID: String
    let mismatchedPageID: String
    let initialGeneration: Int64
    let staleGeneration: Int64

    enum CodingKeys: String, CodingKey {
        case checkpointID = "checkpoint_id"
        case operationID = "operation_id"
        case initialPageID = "initial_page_id"
        case targetPageID = "target_page_id"
        case mismatchedPageID = "mismatched_page_id"
        case initialGeneration = "initial_generation"
        case staleGeneration = "stale_generation"
    }
}

final class ExactNavigationCheckpointTests: XCTestCase {
    private let fixture: CheckpointFixture = {
        var root = URL(fileURLWithPath: #filePath)
        for _ in 0..<4 { root.deleteLastPathComponent() }
        let url = root.appendingPathComponent("fixtures/exact-navigation/checkpoint.json")
        return try! JSONDecoder().decode(CheckpointFixture.self, from: Data(contentsOf: url))
    }()

    private func subject() -> (ExactNavigationCheckpointController, RecordingNavigationEffectPort) {
        let port = RecordingNavigationEffectPort()
        let controller = ExactNavigationCheckpointController(
            gate: NavigationGate(
                initialPageID: fixture.initialPageID,
                initialGeneration: fixture.initialGeneration
            ),
            effectPort: port
        )
        return (controller, port)
    }

    func testExactApprovalDispatchesOnceAndAppliesMatchingPostcondition() {
        let (controller, port) = subject()
        XCTAssertTrue(
            controller.propose(
                operationID: fixture.operationID,
                targetPageID: fixture.targetPageID,
                sourceGeneration: fixture.initialGeneration
            )
        )
        XCTAssertTrue(controller.approve(operationID: fixture.operationID))
        XCTAssertEqual(
            controller.callbackAndObserve(
                operationID: fixture.operationID,
                accepted: true,
                landedPageID: fixture.targetPageID
            ),
            .applied
        )
        XCTAssertEqual(port.commands.count, 1)
    }

    func testDispatchWithoutApprovalIsRejected() {
        let (controller, port) = subject()
        XCTAssertFalse(controller.approve(operationID: fixture.operationID))
        XCTAssertEqual(controller.state, .denied)
        XCTAssertEqual(port.commands.count, 0)
    }

    func testStalePageGenerationRejectsApproval() {
        let (controller, port) = subject()
        controller.propose(
            operationID: fixture.operationID,
            targetPageID: fixture.targetPageID,
            sourceGeneration: fixture.initialGeneration
        )
        controller.pageIdentityChanged(pageID: "page-a-reloaded", generation: fixture.staleGeneration)
        XCTAssertFalse(controller.approve(operationID: fixture.operationID))
        XCTAssertEqual(controller.state, .preempted)
        XCTAssertEqual(port.commands.count, 0)
    }

    func testMismatchedPostconditionBecomesUnknown() {
        let (controller, port) = subject()
        controller.propose(
            operationID: fixture.operationID,
            targetPageID: fixture.targetPageID,
            sourceGeneration: fixture.initialGeneration
        )
        controller.approve(operationID: fixture.operationID)
        XCTAssertEqual(
            controller.callbackAndObserve(
                operationID: fixture.operationID,
                accepted: true,
                landedPageID: fixture.mismatchedPageID
            ),
            .unknown
        )
        XCTAssertEqual(port.commands.count, 1)
    }

    func testRecordingPortRejectsPlantedDuplicateEffect() {
        let port = RecordingNavigationEffectPort()
        let command = NavigationCommand(
            operationID: fixture.operationID,
            targetPageID: fixture.targetPageID
        )
        XCTAssertEqual(port.dispatch(command).status, .accepted)
        let duplicate = port.dispatch(command)
        XCTAssertEqual(duplicate.status, .duplicate)
        XCTAssertEqual(duplicate.status.rawValue, "CHECKPOINT_DUPLICATE_DISPATCH")
        XCTAssertEqual(port.commands.count, 1)
    }

    func testAccessibilityIdentifiersMatchTheSharedCheckpoint() {
        XCTAssertEqual(fixture.checkpointID, "exact-navigation")
        XCTAssertEqual(ExactNavigationAccessibility.root, "exact-navigation-root")
        XCTAssertEqual(ExactNavigationAccessibility.state, "exact-navigation-state")
        XCTAssertEqual(ExactNavigationAccessibility.approve, "exact-navigation-approve")
    }
}
