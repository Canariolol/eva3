# Product Requirements Document (PRD): TeamInsight SaaS

## 1. Vision and Objective

*   **Vision:** To provide leaders (`Managers`) with an intuitive and powerful SaaS platform for evaluating team performance, tracking progress over time, and making data-driven decisions.
*   **Objective:** To define and document the core user flows, security model, and feature set for the multi-tenant version of TeamInsight. This document will serve as a single source of truth for development.

## 2. User Personas & Roles

| Role | Description | Key Permissions & Responsibilities |
| :--- | :--- | :--- |
| **`superadmin`** | Platform owner/administrator (internal use). | **Total Control:** Full CRUD access to all data across all companies for support, maintenance, and analytics. |
| **`manager`** | The primary client user. Registers and manages their company's workspace. | **Company-Scoped Control:** Full CRUD access *only* to data within their assigned company (`companyId`). Manages `executives`, creates `evaluations`, and configures their workspace. |
| **`executive`** | The employee being evaluated. Added by a `manager`. | **Limited Read-Only Access:** Can only read their own evaluations, their own profile, and view the main dashboard reports within their company. No write permissions. |
| **Unauthenticated** | Any visitor to the landing page. | **No Database Access:** Zero read or write permissions to any user or company data. |

## 3. Core User Flow: New Manager Onboarding

This flow details the journey of a new client from discovery to achieving their first valuable outcome.

1.  **Discovery & Registration:**
    *   **Entry Point:** The user arrives at the `LandingPage`.
    *   **Action:** Clicks "Sign Up".
    *   **Form (`SignUp.jsx`):** Fills out `fullName`, `email`, `password`, and an optional `companyName`.
    *   **Logic:** If `companyName` is blank, it defaults to the user's `fullName`.
    *   **Backend Trigger:** On submission, the `on_new_user_signup` Cloud Function fires.
        *   Creates an Auth user.
        *   Creates a new document in `/companies/{companyId}`.
        *   Creates a `headerInfo` sub-document with the company and manager's name.
        *   Creates a user profile in `/users/{uid}` with `role: 'manager'` and the new `companyId`.
        *   Sets Custom Claims (`role` and `companyId`) on the user's auth token.

2.  **First-Time Configuration (Onboarding Wizard):**
    *   **Entry Point:** The user is redirected to the dashboard for the first time.
    *   **Action:** An onboarding modal/wizard appears.
    *   **Step 1: Add Team:** The user is prompted to add their first `executive` (name, email, role).
    *   **Step 2: Review Criteria:** The user is shown the default evaluation criteria and informed they can be customized later in "Configuration".

3.  **Core Value Loop (First Evaluation):**
    *   **Entry Point:** After adding an executive, the wizard guides them to the "Evaluar" page.
    *   **Action:** The user selects the newly added executive and fills out the evaluation form.
    *   **Result:** An evaluation document is created in `/companies/{companyId}/evaluations/`.

4.  **Achieving Outcome (First Report):**
    *   **Entry Point:** The user is redirected back to the `ModernDashboard`.
    *   **Action:** The user now sees the dashboard populated with data from the evaluation they just completed.
    *   **Final Step:** The user navigates to the "Reportes" page, sees the summarized data, and can use the "Export" function to download a CSV.

## 4. Security & Data Model

*   **Data Isolation:** The primary security principle is strict data isolation between tenants (companies). This is enforced by:
    1.  **Firestore Structure:** All tenant-specific data (evaluations, executives, etc.) **must** reside in subcollections under `/companies/{companyId}`.
    2.  **Firestore Rules:** Security rules will heavily rely on checking `request.auth.token.companyId` to ensure a user can only access documents matching their assigned `companyId`.
*   **Authentication:** Firebase Authentication is the source of truth for user identity. Custom Claims are used to efficiently pass authorization data (`role`, `companyId`) to Firestore security rules.
*   **Roles:** User roles (`superadmin`, `manager`, `executive`) are stored in the `/users/{uid}` collection and mirrored in Custom Claims for security rule enforcement.

## 5. Key Features (High-Level)

*   **User Management:** Managers can add, edit, and remove executives from their team.
*   **Evaluation System:** A flexible system for creating and filling out performance evaluations based on customizable criteria.
*   **Dashboard & Reporting:** Visual dashboards with key metrics, trend graphs, and the ability to export detailed reports.
*   **Multi-Tenant Architecture:** Securely supports multiple distinct client companies on the same platform.
*   **UI Presets:** Users can switch between a "classic" and a "modern" interface.
