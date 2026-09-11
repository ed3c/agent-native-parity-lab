// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "NativeCheckpointUI",
    platforms: [
        .macOS(.v13),
        .iOS(.v16),
    ],
    products: [
        .library(name: "NativeCheckpointUI", targets: ["NativeCheckpointUI"]),
    ],
    dependencies: [
        .package(path: "../ios-domain"),
    ],
    targets: [
        .target(
            name: "NativeCheckpointUI",
            dependencies: [
                .product(name: "NativeParityDomain", package: "ios-domain"),
            ]
        ),
        .testTarget(
            name: "NativeCheckpointUITests",
            dependencies: [
                "NativeCheckpointUI",
                .product(name: "NativeParityDomain", package: "ios-domain"),
            ]
        ),
    ]
)
