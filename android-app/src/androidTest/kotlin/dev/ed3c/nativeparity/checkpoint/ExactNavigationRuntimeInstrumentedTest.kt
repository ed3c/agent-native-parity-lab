package dev.ed3c.nativeparity.checkpoint

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

@RunWith(AndroidJUnit4::class)
class ExactNavigationRuntimeInstrumentedTest {
    @Test
    fun instrumentationEmitsAcceptedEmulatorEnvelope() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val fixtureText =
            context.assets.open("exact-navigation/checkpoint.json").bufferedReader().use { it.readText() }
        val fixtureSha256 = RuntimeEnvelope.sha256Hex(fixtureText)
        val operationId = Regex(""""operation_id"\s*:\s*"([^"]+)"""").find(fixtureText)!!.groupValues[1]
        val initialPageId = Regex(""""initial_page_id"\s*:\s*"([^"]+)"""").find(fixtureText)!!.groupValues[1]
        val targetPageId = Regex(""""target_page_id"\s*:\s*"([^"]+)"""").find(fixtureText)!!.groupValues[1]
        val mismatchedPageId = Regex(""""mismatched_page_id"\s*:\s*"([^"]+)"""").find(fixtureText)!!.groupValues[1]
        val initialGeneration =
            Regex(""""initial_generation"\s*:\s*(\d+)""").find(fixtureText)!!.groupValues[1].toLong()
        val staleGeneration =
            Regex(""""stale_generation"\s*:\s*(\d+)""").find(fixtureText)!!.groupValues[1].toLong()

        val probe =
            ExactNavigationRuntimeProbe(
                fixtureSha256 = fixtureSha256,
                operationId = operationId,
                initialPageId = initialPageId,
                targetPageId = targetPageId,
                mismatchedPageId = mismatchedPageId,
                initialGeneration = initialGeneration,
                staleGeneration = staleGeneration,
            )
        val json = probe.emitAccepted(runtimeClass = RuntimeEnvelope.RUNTIME_CLASS_EMULATOR)
        assertTrue(json.contains(""""subject":"ANDROID_NATIVE""""))
        assertTrue(json.contains(""""runtime_class":"EMULATOR""""))
        assertTrue(json.contains(""""result":"ACCEPTED""""))
        assertEquals(1, Regex(""""effect_count":1""").findAll(json).count())

        // Primary pull path: world-readable emulator tmp (no run-as required).
        File("/data/local/tmp/android-native-runtime-envelope.json").writeText(json)

        val outDir = context.filesDir
        File(outDir, "android-native-runtime-envelope.json").writeText(json)

        val external = context.getExternalFilesDir(null)
        if (external != null) {
            File(external, "android-native-runtime-envelope.json").writeText(json)
        }
    }
}
