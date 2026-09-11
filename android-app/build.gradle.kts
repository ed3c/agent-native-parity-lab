import org.gradle.api.tasks.testing.Test

plugins {
    id("com.android.library")
    kotlin("android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "dev.ed3c.nativeparity.checkpoint"
    compileSdk = 36

    defaultConfig {
        minSdk = 24
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
    }

    sourceSets.getByName("test").resources.srcDir(rootProject.file("fixtures"))
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    implementation(project(":android-domain"))
    implementation("androidx.compose.runtime:runtime:1.10.6")
    implementation("androidx.compose.foundation:foundation:1.10.6")
    implementation("androidx.compose.ui:ui:1.10.6")

    testImplementation(kotlin("test"))
    testImplementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.9.0")
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}
