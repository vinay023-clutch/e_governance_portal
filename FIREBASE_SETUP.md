# Firebase & Cloud Firestore Setup Instructions

This document provides step-by-step instructions to configure Firebase Authentication and Cloud Firestore for the National E-Governance Portal.

---

## Step 1: Create a Firebase Project
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Name your project (e.g., `e-gov-portal`) and click **Continue**.
4. Choose whether to enable Google Analytics (optional, you can disable it for demo/dev purposes) and click **Create project**.
5. Once your project is ready, click **Continue**.

---

## Step 2: Add a Web App to the Project
1. In the center of the project overview page, click the **Web icon** (`</>`) to add a web application.
2. Enter an App nickname (e.g., `egov-web-app`).
3. (Optional) Check **Also set up Firebase Hosting** if you intend to deploy it to Firebase Hosting.
4. Click **Register app**.
5. Firebase will display your `firebaseConfig` credentials object. Copypaste these credentials to replace the configuration object at the top of [script final.js](file:///e:/RTRP%20FINAL%20DOCUMENT/e_governance_portal/script%20final.js#L26-L35).
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
       messagingSenderId: "YOUR_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```

---

## Step 3: Enable Authentication Sign-In Methods
1. In the Firebase console left sidebar, navigate to **Build** > **Authentication**.
2. Click **Get started**.
3. Under the **Sign-in method** tab, configure the following providers:
   
   ### Email/Password Provider:
   - Select **Email/Password**.
   - Enable **Email/Password** toggles.
   - Click **Save**.

   ### Google Provider:
   - Click **Add new provider** and select **Google**.
   - Toggle **Enable**.
   - Configure a project support email (select your Google email address from the dropdown).
   - Click **Save**.

---

## Step 4: Create Cloud Firestore Database
1. In the left sidebar, navigate to **Build** > **Firestore Database**.
2. Click **Create database**.
3. Select database location (choose the region closest to your target audience). Click **Next**.
4. Start in **Test mode** (allows rapid development; database rules can be restricted for production later). Click **Create**.
5. Once the database is initialized, Firestore is ready to store citizen profiles!

---

## Step 5: Secure Security Rules for Production
When moving the project from staging/test mode to production, go to the **Rules** tab in Cloud Firestore and update your rules to protect user profile data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This ensures only authenticated users can read and write their own profile information.
