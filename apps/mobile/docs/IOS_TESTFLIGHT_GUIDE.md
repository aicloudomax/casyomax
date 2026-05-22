# iOS Distribution Guide (TestFlight)

This guide explains how to build the `care-sync-mobile` application and distribute it to testers using TestFlight, specifically from a **Windows** environment using Expo Application Services (EAS).

## Prerequisites

1.  **Apple Developer Account**: You need a valid Apple Developer account.
    *   Since your organization is setting this up, wait until you receive the invitation to join the Apple Developer Team.
    *   **Action**: Accept the invitation and ensure you have `Admin` or `App Manager` role permissions to create apps and upload builds.
2.  **EAS Account**: You need an Expo account.
    *   Run `npx eas-cli login` in your terminal and log in with your Expo credentials.

## Step 1: App Store Connect Setup

Before you can upload a build, the app must exist in App Store Connect.

1.  Go to [App Store Connect](https://appstoreconnect.apple.com/).
2.  Click **"My Apps"**.
3.  Click the **"+"** button and select **"New App"**.
4.  Fill in the details:
    *   **Platforms**: iOS
    *   **Name**: CareSync (or your desired app name)
    *   **Primary Language**: English (US)
    *   **Bundle ID**: Select `com.caresync.app` (If it doesn't appear, you may need to register it in the [Apple Developer Portal/Identifiers](https://developer.apple.com/account/resources/identifiers/list) first, but EAS often handles this automatically during the build process).
    *   **SKU**: A unique ID (e.g., `caresync-mobile-001`).
    *   **User Access**: Full Access.

## Step 2: Build the App (EAS)

Since you are on Windows, you cannot use Xcode to build the app. You must use **EAS Build** to build it in the cloud.

1.  Open your terminal in the `care-sync-mobile` directory.
2.  Run the build command:
    ```powershell
    npx eas-cli build --platform ios
    ```
3.  **Follow the interactive prompts**:
    *   If asked to log in to your Apple account, provide your Apple ID and App-Specific Password (not your regular password). You can generate one at [appleid.apple.com](https://appleid.apple.com).
    *   **Certificates & Provisioning Profiles**: Allow EAS to generate these for you. Answer "Y" (Yes) to establish the credentials.
4.  **Wait**: The build will get queued and processed on Expo's servers. This can take 15-30 minutes.
5.  **Result**: Once finished, EAS will provide a download link for the `.ipa` file. You don't need to download it manually if you use EAS Submit.

## Step 3: Submit to App Store Connect

Once the build is successful, you need to send it to Apple.

1.  Run the submit command:
    ```powershell
    npx eas-cli submit --platform ios
    ```
2.  Select the build you just created from the list.
3.  EAS will upload the binary to App Store Connect.

## Step 4: Configure TestFlight

1.  Go back to [App Store Connect](https://appstoreconnect.apple.com/) > **My Apps** > **CareSync**.
2.  Click the **TestFlight** tab.
3.  You should see your uploaded build (it may say "Processing" for a while).

### Adding Internal Testers (Your Team)
*   Go to **App Store Connect Users** in the left sidebar.
*   Click **(+)** and add your team members.
*   They will get an email immediately and can install the app via the TestFlight app on their iOS device.

### Adding External Testers (Stakeholders/Clients)
*   Go to **External Testing** in the left sidebar.
*   Click **(+)** to create a new group (e.g., "Stakeholders").
*   Click **(+)** next to "Builds" and select your uploaded build.
    *   *Note*: The first external build requires a quick "Beta App Review" by Apple (usually takes 24-48 hours).
*   Add testers by email or generate a **Public Link** to share.

## Troubleshooting

*   **Bundle ID Error**: Ensure `app.json` (`ios.bundleIdentifier`) matches exactly what you created in App Store Connect.
*   **Credentials**: If EAS fails to authenticate with Apple, verify your App Specific Password.
