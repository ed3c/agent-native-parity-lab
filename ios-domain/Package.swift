// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "NativeParityDomain",
    platforms: [
        .macOS(.v13),
        .iOS(.v16),
    ],
    products: [
        .library(name: "NativeParityDomain", targets: ["NativeParityDomain"]),
        .executable(name: "EmitEvidence", targets: ["EmitEvidence"]),
    ],
    targets: [
        .target(name: "NativeParityDomain"),
        .executableTarget(name: "EmitEvidence", dependencies: ["NativeParityDomain"]),
        .testTarget(name: "NativeParityDomainTests", dependencies: ["NativeParityDomain"]),
    ]
)
