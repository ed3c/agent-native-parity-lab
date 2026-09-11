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

        XCTAssertNil(gate.approve(operationID: "nav-001"))
        XCTAssertEqual(gate.dispatchCount, 1)
        XCTAssertEqual(gate.state, .applied)
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

    func testUserInputPreemptsPendingProposal() {
        let gate = NavigationGate(initialPageID: "page-a", initialGeneration: 1)
        gate.propose(.init(operationID: "nav-001", targetPageID: "page-b", sourceGeneration: 1))
        gate.userInput()

        XCTAssertNil(gate.approve(operationID: "nav-001"))
        XCTAssertEqual(gate.state, .preempted)
    }
}
