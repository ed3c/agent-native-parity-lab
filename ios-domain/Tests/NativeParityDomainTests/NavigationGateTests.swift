import XCTest
@testable import NativeParityDomain

final class NavigationGateTests: XCTestCase {
    func testConfirmedNavigationIsAppliedExactlyOnce() {
        let gate = NavigationGate(initialPageID: "page-a", initialGeneration: 1)
        XCTAssertTrue(gate.propose(.init(operationID: "nav-001", targetPageID: "page-b", sourceGeneration: 1)))
        let command = gate.approve(operationID: "nav-001")!
        XCTAssertTrue(gate.platformCallback(operationID: command.operationID, accepted: true))
        XCTAssertEqual(gate.verify(operationID: command.operationID, landedPageID: "page-b"), .applied)
        XCTAssertEqual(gate.dispatchCount, 1)
    }

    func testDispatchBeforeApprovalIsDenied() {
        let gate = NavigationGate(initialPageID: "page-a", initialGeneration: 1)
        XCTAssertNil(gate.approve(operationID: "nav-001"))
        XCTAssertEqual(gate.state, .denied)
        XCTAssertEqual(gate.dispatchCount, 0)
    }

    func testDuplicateOperationIsNotDispatchedTwice() {
        let gate = NavigationGate(initialPageID: "page-a", initialGeneration: 1)
        gate.propose(.init(operationID: "nav-001", targetPageID: "page-b", sourceGeneration: 1))
        let command = gate.approve(operationID: "nav-001")!
        gate.platformCallback(operationID: command.operationID, accepted: true)
        gate.verify(operationID: command.operationID, landedPageID: "page-b")

        XCTAssertFalse(gate.propose(.init(operationID: "nav-001", targetPageID: "page-c", sourceGeneration: 1)))
        XCTAssertEqual(gate.dispatchCount, 1)
        XCTAssertEqual(gate.state, .denied)
    }

    func testDistinctOperationCanStartAfterAppliedResult() {
        let gate = NavigationGate(initialPageID: "page-a", initialGeneration: 1)
        gate.propose(.init(operationID: "nav-001", targetPageID: "page-b", sourceGeneration: 1))
        let first = gate.approve(operationID: "nav-001")!
        gate.platformCallback(operationID: first.operationID, accepted: true)
        gate.verify(operationID: first.operationID, landedPageID: "page-b")

        XCTAssertTrue(gate.propose(.init(operationID: "nav-002", targetPageID: "page-c", sourceGeneration: 1)))
        XCTAssertEqual(gate.approve(operationID: "nav-002")?.operationID, "nav-002")
        XCTAssertEqual(gate.dispatchCount, 2)
    }

    func testPageGenerationChangePreemptsPendingProposal() {
        let gate = NavigationGate(initialPageID: "page-a", initialGeneration: 1)
        gate.propose(.init(operationID: "nav-001", targetPageID: "page-b", sourceGeneration: 1))
        gate.pageIdentityChanged(pageID: "page-a-reloaded", generation: 2)

        XCTAssertNil(gate.approve(operationID: "nav-001"))
        XCTAssertEqual(gate.state, .preempted)
        XCTAssertEqual(gate.dispatchCount, 0)
    }

    func testCallbackSuccessWithMismatchedPostconditionIsUnknown() {
        let gate = NavigationGate(initialPageID: "page-a", initialGeneration: 1)
        gate.propose(.init(operationID: "nav-001", targetPageID: "page-b", sourceGeneration: 1))
        let command = gate.approve(operationID: "nav-001")!
        XCTAssertTrue(gate.platformCallback(operationID: command.operationID, accepted: true))

        XCTAssertEqual(gate.verify(operationID: command.operationID, landedPageID: "page-c"), .unknown)
        XCTAssertEqual(gate.dispatchCount, 1)
    }

    func testUnknownEffectBlocksNewProposalUntilReconciliationExists() {
        let gate = NavigationGate(initialPageID: "page-a", initialGeneration: 1)
        gate.propose(.init(operationID: "nav-001", targetPageID: "page-b", sourceGeneration: 1))
        let command = gate.approve(operationID: "nav-001")!
        gate.platformCallback(operationID: command.operationID, accepted: true)
        gate.verify(operationID: command.operationID, landedPageID: "page-c")

        XCTAssertFalse(gate.propose(.init(operationID: "nav-002", targetPageID: "page-d", sourceGeneration: 1)))
        XCTAssertEqual(gate.state, .unknown)
        XCTAssertEqual(gate.dispatchCount, 1)
    }

    func testUserInputPreemptsPendingProposal() {
        let gate = NavigationGate(initialPageID: "page-a", initialGeneration: 1)
        gate.propose(.init(operationID: "nav-001", targetPageID: "page-b", sourceGeneration: 1))
        gate.userInput()

        XCTAssertNil(gate.approve(operationID: "nav-001"))
        XCTAssertEqual(gate.state, .preempted)
    }
}
