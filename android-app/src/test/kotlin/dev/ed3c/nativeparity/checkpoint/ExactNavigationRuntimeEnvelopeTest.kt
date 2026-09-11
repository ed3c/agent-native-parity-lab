package dev.ed3c.nativeparity.checkpoint

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.io.File
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ExactNavigationRuntimeEnvelopeTest {
    private val fixtureText =
        checkNotNull(javaClass.getResource("/exact-navigation/checkpoint.json")).readText()
    private val fixture = Json.parseToJsonElement(fixtureText).jsonObject
    private val fixtureSha256 = RuntimeEnvelope.sha256Hex(fixtureText)

    private val probe =
        ExactNavigationRuntimeProbe(
            fixtureSha256 = fixtureSha256,
            operationId = fixture.getValue("operation_id").jsonPrimitive.content,
            initialPageId = fixture.getValue("initial_page_id").jsonPrimitive.content,
            targetPageId = fixture.getValue("target_page_id").jsonPrimitive.content,
            mismatchedPageId = fixture.getValue("mismatched_page_id").jsonPrimitive.content,
            initialGeneration = fixture.getValue("initial_generation").jsonPrimitive.content.toLong(),
            staleGeneration = fixture.getValue("stale_generation").jsonPrimitive.content.toLong(),
        )

    @Test
    fun emitsAcceptedRuntimeEnvelope() {
        val json = probe.emitAccepted(runtimeClass = RuntimeEnvelope.RUNTIME_CLASS_HOST)
        val parsed = Json.parseToJsonElement(json).jsonObject
        assertEquals("ANDROID_NATIVE", parsed.getValue("subject").jsonPrimitive.content)
        assertEquals("android", parsed.getValue("platform").jsonPrimitive.content)
        assertEquals("HOST", parsed.getValue("runtime_class").jsonPrimitive.content)
        assertEquals(fixtureSha256, parsed.getValue("fixture_sha256").jsonPrimitive.content)
        assertEquals("exact-navigation.v1", parsed.getValue("checkpoint_id").jsonPrimitive.content)
        assertEquals("ACCEPTED", parsed.getValue("result").jsonPrimitive.content)
        assertEquals("1", parsed.getValue("effect_count").jsonPrimitive.content)
        System.getenv("RUNTIME_ENVELOPE_OUT")?.let { path ->
            File(path).apply {
                parentFile?.mkdirs()
                writeText(json)
            }
        }
    }

    @Test
    fun controlEnvelopesMatchComparatorExpectations() {
        val duplicate =
            Json.parseToJsonElement(
                probe.emitDuplicateRejected(runtimeClass = RuntimeEnvelope.RUNTIME_CLASS_HOST),
            ).jsonObject
        assertEquals("REJECTED", duplicate.getValue("result").jsonPrimitive.content)
        assertEquals("0", duplicate.getValue("effect_count").jsonPrimitive.content)
        assertEquals("HOST", duplicate.getValue("runtime_class").jsonPrimitive.content)

        val stale =
            Json.parseToJsonElement(
                probe.emitStaleRejected(runtimeClass = RuntimeEnvelope.RUNTIME_CLASS_HOST),
            ).jsonObject
        assertEquals("REJECTED", stale.getValue("result").jsonPrimitive.content)

        val unknown =
            Json.parseToJsonElement(
                probe.emitCallbackMismatchUnknown(runtimeClass = RuntimeEnvelope.RUNTIME_CLASS_HOST),
            ).jsonObject
        assertEquals("UNKNOWN", unknown.getValue("result").jsonPrimitive.content)
        assertTrue(unknown.getValue("effect_count").jsonPrimitive.content.toInt() <= 1)

        System.getenv("RUNTIME_CONTROLS_OUT")?.let { path ->
            val payload =
                """
                {
                  "duplicate_dispatch": ${probe.emitDuplicateRejected(runtimeClass = RuntimeEnvelope.RUNTIME_CLASS_HOST)},
                  "stale_approval": ${probe.emitStaleRejected(runtimeClass = RuntimeEnvelope.RUNTIME_CLASS_HOST)},
                  "callback_destination_mismatch": ${probe.emitCallbackMismatchUnknown(runtimeClass = RuntimeEnvelope.RUNTIME_CLASS_HOST)}
                }
                """.trimIndent()
            File(path).apply {
                parentFile?.mkdirs()
                writeText(payload)
            }
        }
    }
}
