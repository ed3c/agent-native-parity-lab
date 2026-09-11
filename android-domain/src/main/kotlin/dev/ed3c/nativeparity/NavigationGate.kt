package dev.ed3c.nativeparity

enum class GateState {
    IDLE,
    WAITING_FOR_CONFIRMATION,
    EXECUTING,
    VERIFYING,
    APPLIED,
    DENIED,
    PREEMPTED,
    UNKNOWN,
}

data class NavigationProposal(
    val operationId: String,
    val targetPageId: String,
    val sourceGeneration: Long,
)

data class NavigationCommand(
    val operationId: String,
    val targetPageId: String,
)

class NavigationGate(
    initialPageId: String,
    initialGeneration: Long,
) {
    var state: GateState = GateState.IDLE
        private set
    var currentPageId: String = initialPageId
        private set
    var currentGeneration: Long = initialGeneration
        private set
    var dispatchCount: Int = 0
        private set

    val transitions = mutableListOf(GateState.IDLE)

    private var proposal: NavigationProposal? = null
    private val dispatchedOperations = mutableSetOf<String>()

    fun propose(candidate: NavigationProposal): Boolean {
        val canStart = state == GateState.IDLE || state == GateState.APPLIED ||
            state == GateState.DENIED || state == GateState.PREEMPTED
        if (!canStart) return false
        if (candidate.sourceGeneration != currentGeneration || candidate.operationId in dispatchedOperations) {
            moveTo(GateState.DENIED)
            return false
        }
        proposal = candidate
        moveTo(GateState.WAITING_FOR_CONFIRMATION)
        return true
    }

    fun approve(operationId: String): NavigationCommand? {
        val pending = proposal
        if (state != GateState.WAITING_FOR_CONFIRMATION || pending?.operationId != operationId) {
            if (state != GateState.APPLIED && state != GateState.PREEMPTED) moveTo(GateState.DENIED)
            return null
        }
        if (pending.sourceGeneration != currentGeneration) {
            proposal = null
            moveTo(GateState.PREEMPTED)
            return null
        }
        if (!dispatchedOperations.add(operationId)) {
            moveTo(GateState.DENIED)
            return null
        }

        dispatchCount += 1
        moveTo(GateState.EXECUTING)
        return NavigationCommand(operationId, pending.targetPageId)
    }

    fun platformCallback(operationId: String, accepted: Boolean): Boolean {
        if (state != GateState.EXECUTING || proposal?.operationId != operationId) return false
        moveTo(if (accepted) GateState.VERIFYING else GateState.UNKNOWN)
        return accepted
    }

    fun verify(operationId: String, landedPageId: String): GateState {
        val pending = proposal
        if (state != GateState.VERIFYING || pending?.operationId != operationId) {
            if (state != GateState.UNKNOWN) moveTo(GateState.UNKNOWN)
            return state
        }

        if (landedPageId == pending.targetPageId) {
            currentPageId = landedPageId
            moveTo(GateState.APPLIED)
        } else {
            moveTo(GateState.UNKNOWN)
        }
        proposal = null
        return state
    }

    fun userInput() {
        if (state == GateState.WAITING_FOR_CONFIRMATION) {
            proposal = null
            moveTo(GateState.PREEMPTED)
        }
    }

    fun pageIdentityChanged(pageId: String, generation: Long) {
        currentPageId = pageId
        currentGeneration = generation
        if (state == GateState.WAITING_FOR_CONFIRMATION) {
            proposal = null
            moveTo(GateState.PREEMPTED)
        }
    }

    private fun moveTo(next: GateState) {
        state = next
        transitions += next
    }
}
