package dev.ed3c.nativeparity.checkpoint

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import dev.ed3c.nativeparity.GateState
import dev.ed3c.nativeparity.NavigationCommand
import dev.ed3c.nativeparity.NavigationGate
import dev.ed3c.nativeparity.NavigationProposal

object ExactNavigationAccessibility {
    const val ROOT = "exact-navigation-root"
    const val STATE = "exact-navigation-state"
    const val APPROVE = "exact-navigation-approve"
}

enum class DispatchStatus {
    ACCEPTED,
    CHECKPOINT_DUPLICATE_DISPATCH,
}

data class DispatchReceipt(
    val status: DispatchStatus,
    val operationId: String,
)

fun interface NavigationEffectPort {
    fun dispatch(command: NavigationCommand): DispatchReceipt
}

class RecordingNavigationEffectPort : NavigationEffectPort {
    private val consumedOperationIds = mutableSetOf<String>()
    val commands = mutableListOf<NavigationCommand>()

    override fun dispatch(command: NavigationCommand): DispatchReceipt {
        if (!consumedOperationIds.add(command.operationId)) {
            return DispatchReceipt(DispatchStatus.CHECKPOINT_DUPLICATE_DISPATCH, command.operationId)
        }
        commands += command
        return DispatchReceipt(DispatchStatus.ACCEPTED, command.operationId)
    }
}

class ExactNavigationCheckpointController(
    private val gate: NavigationGate,
    private val effectPort: NavigationEffectPort,
) {
    val state: GateState
        get() = gate.state

    fun propose(operationId: String, targetPageId: String, sourceGeneration: Long): Boolean =
        gate.propose(NavigationProposal(operationId, targetPageId, sourceGeneration))

    fun approve(operationId: String): Boolean {
        val command = gate.approve(operationId) ?: return false
        return effectPort.dispatch(command).status == DispatchStatus.ACCEPTED
    }

    fun pageIdentityChanged(pageId: String, generation: Long) {
        gate.pageIdentityChanged(pageId, generation)
    }

    fun callbackAndObserve(operationId: String, accepted: Boolean, landedPageId: String): GateState {
        if (!gate.platformCallback(operationId, accepted)) return gate.state
        return gate.verify(operationId, landedPageId)
    }
}

@Composable
fun ExactNavigationCheckpointScreen(
    state: GateState,
    onApprove: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier.semantics { contentDescription = ExactNavigationAccessibility.ROOT }) {
        BasicText(
            text = "State: ${state.name}",
            modifier = Modifier.semantics {
                contentDescription = ExactNavigationAccessibility.STATE
            },
        )
        BasicText(
            text = "Approve",
            modifier = Modifier
                .semantics { contentDescription = ExactNavigationAccessibility.APPROVE }
                .clickable(onClick = onApprove),
        )
    }
}
