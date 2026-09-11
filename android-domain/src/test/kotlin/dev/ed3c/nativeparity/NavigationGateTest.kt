package dev.ed3c.nativeparity

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class NavigationGateTest {
    @Test
    fun confirmedNavigationIsAppliedExactlyOnce() {
        val gate = NavigationGate("page-a", 1)
        assertTrue(gate.propose(NavigationProposal("nav-001", "page-b", 1)))
        val command = gate.approve("nav-001")!!
        assertTrue(gate.platformCallback(command.operationId, accepted = true))
        assertEquals(GateState.APPLIED, gate.verify(command.operationId, "page-b"))
        assertEquals(1, gate.dispatchCount)
    }

    @Test
    fun dispatchBeforeApprovalIsDenied() {
        val gate = NavigationGate("page-a", 1)
        assertNull(gate.approve("nav-001"))
        assertEquals(GateState.DENIED, gate.state)
        assertEquals(0, gate.dispatchCount)
    }

    @Test
    fun duplicateOperationIsNotDispatchedTwice() {
        val gate = NavigationGate("page-a", 1)
        gate.propose(NavigationProposal("nav-001", "page-b", 1))
        val command = gate.approve("nav-001")!!
        gate.platformCallback(command.operationId, accepted = true)
        gate.verify(command.operationId, "page-b")

        assertNull(gate.approve("nav-001"))
        assertEquals(1, gate.dispatchCount)
        assertEquals(GateState.APPLIED, gate.state)
    }

    @Test
    fun pageGenerationChangePreemptsPendingProposal() {
        val gate = NavigationGate("page-a", 1)
        gate.propose(NavigationProposal("nav-001", "page-b", 1))
        gate.pageIdentityChanged("page-a-reloaded", 2)

        assertNull(gate.approve("nav-001"))
        assertEquals(GateState.PREEMPTED, gate.state)
        assertEquals(0, gate.dispatchCount)
    }

    @Test
    fun callbackSuccessWithMismatchedPostconditionIsUnknown() {
        val gate = NavigationGate("page-a", 1)
        gate.propose(NavigationProposal("nav-001", "page-b", 1))
        val command = gate.approve("nav-001")!!
        assertTrue(gate.platformCallback(command.operationId, accepted = true))

        assertEquals(GateState.UNKNOWN, gate.verify(command.operationId, "page-c"))
        assertEquals(1, gate.dispatchCount)
    }

    @Test
    fun userInputPreemptsPendingProposal() {
        val gate = NavigationGate("page-a", 1)
        gate.propose(NavigationProposal("nav-001", "page-b", 1))
        gate.userInput()

        assertNull(gate.approve("nav-001"))
        assertFalse(gate.state == GateState.APPLIED)
        assertEquals(GateState.PREEMPTED, gate.state)
    }
}
