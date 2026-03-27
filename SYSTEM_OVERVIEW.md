# AshaSetu - Complete System Overview & Feature Documentation

**Project Name:** AshaSetu (Blood Donation & Emergency Services Platform)  
**Platform:** React Native (Expo) Mobile Application + Node.js/Express Backend  
**Database:** PostgreSQL (Neon Cloud)  
**Date:** March 2026

---

## Table of Contents
1. [System Introduction](#system-introduction)
2. [Authentication & Login Flow](#authentication--login-flow)
3. [Core Features](#core-features)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Data Models & Database Features](#data-models--database-features)
6. [Admin Dashboard](#admin-dashboard)
7. [Payment Integration](#payment-integration)
8. [Volunteer Management](#volunteer-management)
9. [Technical Architecture](#technical-architecture)

---

## System Introduction

AshaSetu is a comprehensive mobile application designed to streamline blood donation management, emergency services coordination, and community engagement around healthcare initiatives. The platform bridges the gap between blood donors, recipients, healthcare facilities, and volunteers by providing a unified ecosystem where users can request blood, donate blood, organize donation events, request ambulance services, access first aid information, and participate in fundraising campaigns. The system is built with a mobile-first approach using React Native and Expo for cross-platform compatibility, while the backend is powered by Node.js with Express.js and uses PostgreSQL for data persistence.

The platform serves multiple user types including regular donors, blood recipients, volunteers, event organizers, and administrators. Each user role has distinct permissions and capabilities tailored to their needs. The system emphasizes community participation, real-time notifications, secure authentication, and comprehensive management tools for platform administrators.

---

## Authentication & Login Flow

### User Registration Process

When a new user opens the AshaSetu app, they are redirected to the registration screen if they are not already logged in. The registration process begins by collecting essential user information including full name, email address, phone number, and a secure password. The frontend validates the input in real-time, ensuring email format is correct, passwords meet security requirements (minimum length, special characters, etc.), and all mandatory fields are filled.

Once the user submits the registration form, the frontend sends a POST request to the `/api/auth/register` endpoint. The backend receives this request and validates the data again on the server side. It checks if the email or phone number already exists in the database to prevent duplicate accounts. The password is never stored in plain text; instead, it is hashed using bcrypt before being saved to the database. Once the account is successfully created, the user receives a response confirming account creation and is prompted to proceed to the login screen.

### Login Authentication

On the login screen, users enter their registered email and password. The frontend collects these credentials and sends them to the `/api/auth/login` endpoint. The backend retrieves the user record from the database using the provided email. Once the user is found, the backend compares the provided password with the stored hashed password using bcrypt verification. If the credentials are valid, the backend generates a JSON Web Token (JWT) that is digitally signed using a secret key stored in environment variables.

The JWT token contains encoded user information including the user ID, email, and admin status. This token serves as proof of authentication for subsequent API requests. The backend responds with the JWT token, user object (containing name, email, phone, admin status, verification status), and metadata about the user. The frontend receives this response and stores both the token and user data in AsyncStorage, which is the device's encrypted local storage. This persistence mechanism means that even if the user closes the app, the session remains active when the app is reopened.

### Session Management & Token Persistence

When the app launches, it runs an automatic bootstrap sequence through the AuthContext. This sequence checks if a valid token and user data are stored in AsyncStorage from a previous session. If they exist, the app automatically restores the user's logged-in state without requiring them to log in again. The AuthContext maintains global authentication state throughout the app's lifecycle, making the token and user information available to all screens and components.

For every protected API request, the frontend automatically includes the JWT token in the Authorization header as a Bearer token. The backend middleware intercepts all incoming requests and verifies the token's validity. If the token is valid, the request proceeds; if invalid or expired, the user is logged out and redirected to the login screen. This automatic verification ensures that only authenticated users can access protected resources.

### Password Management & Account Recovery

Users who forget their password can access the "Forgot Password" feature from the login screen. The user provides their registered email, and the backend sends a verification email containing a one-time password (OTP) to their email address. This OTP is time-limited (typically 10-15 minutes) and can only be used once. The user then enters this OTP on the verification screen, confirming they have access to the registered email. Once verified, the user can set a new password through the password reset screen. The old password is replaced with a new bcrypt-hashed password in the database, and the user can then log in with their new credentials.

---

## Core Features

### Feature 1: Blood Donation & Request Management

The blood donation feature is the heart of the AshaSetu platform. Users can request blood when they or a family member needs transfusion, or they can offer blood when they are healthy and willing to donate. The "Blood Request" screen allows users to create a new blood request by specifying the blood group needed, quantity (in units), urgency level (critical, high, normal), location where blood is needed, and contact information. Once posted, the request appears on the "Blood Request Feed" where other users can see it.

For those willing to donate, the "Find Donor" screen allows users to search for specific blood groups in their area or browse all available donors. When a blood request is made, nearby users (determined by location coordinates) receive notifications about the request, allowing them to quickly respond if they match the required blood group. Donors can accept a request, and the system facilitates communication between the donor and recipient. The system tracks donation history, including how many times a user has donated and their last donation date, ensuring compliance with medical guidelines that require minimum intervals between donations.

The donation response system maintains a complete record of all donation interactions. When a donor responds to a request, the status is tracked as pending, accepted, completed, or declined. This history helps identify reliable donors and creates accountability within the platform. Admins can view all blood requests and responses to ensure the system is functioning properly and to identify any users who may be abusing the system.

### Feature 2: Community Events & Donation Drives

Beyond individual donations, AshaSetu enables the organization of large-scale blood donation events and fundraising campaigns. Event organizers can create donation events by specifying the event title, description, date, start and end times, location, maximum number of participants, and event image. Events can be scheduled in advance, allowing time for promotion and registration. The "Create Event" screen guides organizers through this process with validation to ensure all required information is provided.

Once an event is created, it appears on the "Community Home" screen where all users can view upcoming events. Users can register for events they wish to attend, and the system prevents overbooking by checking against the maximum participant limit. Event organizers can view who has registered and manage participant lists. Registered participants receive reminders and updates about the event. The system tracks event attendance and completed donations at events, creating a record of community engagement.

Featured events appear in event feeds, and the platform allows users to filter events by location, date, or blood group focus. Events can include additional details like parking information, accessibility accommodations, and contact numbers. After an event concludes, participants can rate the event and leave feedback, which helps organizers improve future events and builds trust in the community.

### Feature 3: Emergency Ambulance Services

For critical situations, AshaSetu includes an ambulance request feature accessible from a prominent "Ambulance" screen in the main navigation. When a user needs emergency transportation, they can request an ambulance with just a few taps. The system captures the user's current GPS location and displays it on a map. The ambulance request includes the patient's medical condition, number of patients, any special requirements, and contact information.

The backend stores ambulance service provider contacts (hospitals, private ambulance services, etc.) and their service areas. When an ambulance request is made, the system identifies which providers service that geographic area and immediately sends notifications to those providers. The platform prioritizes critical requests and can automatically escalate them to emergency services. Users receive real-time updates on ambulance arrival status, estimated time of arrival, and driver contact information.

The ambulance feature integrates with the user's location services to provide accurate coordinates and can include additional context like traffic conditions affecting the arrival time. Healthcare administrators can manage ambulance provider contacts and service areas through the admin panel, ensuring that ambulance requests are routed to the nearest and most appropriate service provider.

### Feature 4: First Aid Information & Health Education

AshaSetu includes a comprehensive "First Aid" screen providing quick access to critical medical information. Users can browse first aid guides for various medical emergencies including cardiac arrest, severe bleeding, choking, burns, fractures, and more. Each guide includes step-by-step instructions with illustrations that are easy to follow even under stressful conditions.

The first aid section is searchable, allowing users to quickly find relevant guidance for their specific situation. The information is reviewed by medical professionals to ensure accuracy and adherence to current medical standards. Users can bookmark their frequently referenced guides for faster access. This feature serves as a life-saving resource for people without medical training and can be accessed offline after initial download, making information available even in areas with poor connectivity.

### Feature 5: Community Chat & Peer Support

The "Community Chat" feature enables users to join discussion rooms organized by blood group, geography, or health conditions. These chat rooms foster community engagement and allow users to share experiences, ask questions, and provide peer support. For example, users with a specific blood type can join their blood group chat to discuss donation experiences, find other donors, or share health tips.

Chat rooms are moderated by administrators to prevent harassment, misinformation, and spam. Messages are stored in the database with timestamps, creating a searchable archive of discussions. Users can create new rooms for specific purposes (e.g., "Blood Donors in Kathmandu" or "First-Time Donors Support"), making the platform highly adaptable to various community needs.

Users receive notifications for mentions, replies, and room activity, encouraging real-time engagement. The chat system supports both text messages and real-time presence indicators showing who is currently active in a room. Context-specific moderation rules apply, such as banning advertisements or health misinformation.

### Feature 6: Fundraising Campaigns

Organizations and individuals can create fundraising campaigns on the AshaSetu platform to support blood banks, medical research, disaster relief, or other health-related causes. Campaign creators provide campaign title, description, target fundraising amount, deadline, and supporting images or videos. Detailed campaign information is displayed with progress bars showing how much has been raised toward the goal.

Users interested in contributing can donate through integrated payment gateways (Khalti for Nepali users). Campaign creators receive updates on contributions and can thank donors (publicly or privately). Once campaigns reach their deadline, they move to completed status and the platform automatically processes payouts to the designated beneficiary. Campaign analytics show donors interested in similar causes, helping organizers identify their supporter base and plan future campaigns.

---

## User Roles & Permissions

### 1. Regular User / Donor

A regular user is anyone who has successfully registered and logged into the platform. Regular users can create blood requests, donate blood to existing requests, register for events, browse first aid information, and participate in community chat. They maintain a profile with their blood group, location, donation history, and personal preferences. Regular users receive notifications about blood requests in their area, event reminders, campaign updates, and community chat messages.

Regular users can view and manage their own donation responses (accepting, declining, or canceling). They can provide feedback and ratings for events they attended and can manage their account settings including password changes and privacy preferences. Regular users cannot access admin functions, cannot manage other users' accounts, and cannot moderate community content.

### 2. Volunteer / Event Organizer

Volunteers are users who have applied for volunteer status and been approved by admins. Volunteers have all the permissions of regular users plus additional capabilities. Volunteers can organize donation events, recruit other volunteers to help with event management, and coordinate large-scale blood drives. They serve as facilitators in their communities, helping increase awareness about blood donation and organizing logistical support for donation drives.

Volunteers receive special badges in the app indicating their status, building community trust. They can access reports showing their impact (events organized, donations facilitated, lives impacted). Volunteers are subject to a code of conduct and can be revoked of their status if they violate community guidelines. The platform provides training resources and guidelines to help volunteers effectively organize events and engage their communities.

### 3. Admin User

Admin users have complete access to all platform features and data. Admins can manage user accounts including viewing user details, deactivating problematic users, removing spam accounts, and managing user roles. From an admin dashboard, they can view all blood requests, responses, and donations, identifying patterns and ensuring the system is being used appropriately.

Admins can delete events, blood requests, campaigns, and other content that violates platform guidelines. They can edit event details if organizers have made mistakes or outdated information. Admins manage volunteer applications, deciding who becomes a verified volunteer and can revoke volunteer status if needed. They can send platform-wide notifications to users, manage system announcements, moderate community chat rooms, and remove inappropriate messages.

Admins have access to comprehensive analytics and reports showing platform usage statistics, user demographics, most-requested blood groups, geographic hotspots of demand, campaign success rates, and more. This data helps identify opportunities for improvement and areas needing more awareness campaigns. Admins also manage ambulance service provider contacts and can update service areas to ensure accurate routing of emergency requests.

---

## Data Models & Database Features

### Users Table

The core `users` table stores fundamental user information. Each user has a unique `user_id`, `full_name`, `email`, and `phone_number`. The email and phone number fields have unique constraints to prevent duplicate accounts. The `password_hash` field stores the bcrypted password. Boolean flags track `is_admin`, `is_verified` (email verified), `is_active` (not deactivated), and `is_volunteer` status.

The table includes `events_organized` counter tracking how many donation events a user has organized, and `total_donations` counter tracking lifetime donations. The `expo_push_token` field stores the device token needed for sending push notifications. Email verification tracking includes `verification_token` and `verification_token_expires` for the email verification flow. Password reset tracking includes `reset_otp`, `reset_otp_expiry`, and `reset_otp_verified` flags. Timestamps `created_at` and `updated_at` track account creation and last modification.

### User Profiles Table

While the `users` table tracks authentication and system-level data, the `user_profiles` table stores personal and medical information. It includes `date_of_birth`, `gender`, and a `profile_picture_url` linking to uploaded profile images. Location data is stored as `location_lat` and `location_lng` coordinates for geographic-based features. The `address` and `city` fields provide detailed location context.

Critical medical data includes the user's `blood_group` (A, B, AB, O with +/-), `willing_to_donate_blood` flag, and `last_donation_date`. The system enforces medical guidelines by checking this date before allowing new donations. Emergency contact information is stored including `emergency_contact_name` and `emergency_contact_phone_number`. Medical conditions affecting donation eligibility are stored in `medical_conditions`, and known `allergies` are recorded.

### Blood Requests Table

When users need blood, a record is stored in the `blood_requests` table. It tracks `requester_id` (the user requesting blood), `blood_group_needed`, `quantity_units`, and `urgency_level` (critical, high, normal). The location is stored as both `location_lat`/`location_lng` coordinates and text `location_description`. Additional context includes `medical_reason` (e.g., surgery, accident, medical condition) and `special_requirements` (specific blood type variations, age of blood, etc.).

The `status` field tracks the request lifecycle (active, fulfilled, expired, cancelled). A `required_by` timestamp indicates when blood is needed, helping prioritize requests. Contact information (`contact_phone`, `contact_name`) ensures donors can reach the recipient. The requester can provide a `hospital_name` or medical facility where blood is needed. The `created_at` timestamp helps identify newer requests, which are often more urgent.

### Donation Responses Table

When a donor responds to a blood request, a record is created in the `donation_responses` table. It links the `donor_id` (user offering blood) to the `request_id` (blood request). The `status` field tracks the interaction lifecycle: pending (awaiting acceptance), accepted (confirmed), completed (donation occurred), or declined (donor changed mind). Timestamps include `offered_at`, `accepted_at`, and `completed_at` tracking when each milestone occurred.

Additional fields capture `donor_blood_group` and `available_quantity_units` from the donor's perspective, confirming they can fulfill the request. If the donation is completed, `completion_notes` can include any relevant information from the transfusion. The system can track if the same donor and recipient pair have interacted before, building history and trust.

### Donation Events Table

Community events are stored in the `donation_events` table with comprehensive event information. The `organizer_id` links to the user organizing the event. Event details include `title`, `description`, `event_date`, `start_time`, `end_time`, and location information (`location`, `city`, `address`, `contact_number`). The `image_url` stores the event poster or banner image.

Event logistics include `max_participants` capacity, current participant count, and `status` (upcoming, ongoing, completed, cancelled). The `event_type` field can categorize events (regular drive, emergency drive, workplace drive, etc.). Metadata fields include `updated_at` for tracking changes, `expected_donations_collected`, and `actual_donations_collected` comparing expectations with actual results. This helps organizers refine future event planning.

### Event Participants Table

The `event_participants` table creates a many-to-many relationship between users and events. When a user registers for an event, a record is created linking `user_id` and `event_id`. The `registered_at` timestamp shows when they registered. The `attendance_status` field tracks if they actually attended (attended, no-show, cancelled). If they donated at the event, `donation_status` indicates whether they completed a donation and `units_donated` quantifies the amount.

After the event, the user's `event_rating` (1-5 stars) and feedback provide valuable information for event assessment. The system can identify which users are frequent event attendees, helping organizers understand their core supporter base.

### Campaigns Table

Fundraising campaigns are stored in the `campaigns` table. The `creator_id` identifies who started the campaign. Campaign details include `title`, `description`, `target_amount` (fundraising goal), `deadline`, and supporting `image_url`. The `status` field shows campaign state (active, completed, cancelled). Key metrics include `amount_raised`, `donor_count`, and `completion_date`.

Campaign categories (`campaign_type`) help organize drives by cause (blood bank, research, disaster relief). The `beneficiary_info` stores details about who will receive funds. Analytics fields like `visibility_score` and `engagement_metrics` track how well the campaign is performing and guide platform algorithms in promoting successful campaigns.

### Chat Messages Table

Community chat functionality is supported by the `chat_messages` table. Each message stores `sender_id` (who sent it), `room_id` (which chat room), `message_text` (content), `created_at` (timestamp), and `edited_at` if modified. A `is_pinned` flag allows moderators to highlight important announcements. `reply_to_message_id` enables threaded conversations.

The `moderation_status` field tracks if a message has been flagged for review or removed due to policy violation. Moderation notes explain why if removed. This structure enables efficient message retrieval, searching, and moderation.

### Notifications Table

All notifications are logged in the `notifications` table for audit and replay purposes. Each notification stores `recipient_id`, `notification_type` (blood_request, event_reminder, donation_response, etc.), `title`, `message_body`, `related_entity_id` (links to affected blood request, event, etc.), and `is_read` status. Timestamps track when sent and when read. The `action_url` guides the app on which screen to open when the user taps the notification.

---

## Admin Dashboard

### Dashboard Overview

The Admin Dashboard is a comprehensive management interface accessible only to users with admin privileges. When an admin opens the dashboard, they see an overview section displaying key metrics: total number of registered users, number of admins, number of verified users, and number of active (non-deactivated) users. These metrics provide at-a-glance insight into platform health and user base composition.

Below the overview, dedicated cards provide quick access to major management functions. The "Campaign Management" card links to a screen for reviewing and managing all fundraising campaigns. The "Volunteer Management" card provides access to volunteer applications and volunteer status management. The "Events Management" card allows viewing and moderating all donation events. Additional cards provide access to user management, blood request management, and system notifications.

### User Management

From the admin dashboard, administrators can navigate to the "User Management" section to view all registered users. This screen displays a searchable list of users with their profile information including name, email, phone number, blood group, city, and verification status. Users can be filtered by role (admin, volunteer, regular user), verification status (verified, unverified), or account status (active, inactive).

Clicking on a user shows detailed information including their complete profile, registration date, last activity date, blood donation history, event participation, and any associated flags or warnings. From this view, admins can take actions including deactivating a user (preventing them from logging in), promoting a user to admin status, verifying their email manually, or permanently deleting the account. Admins cannot delete their own account to prevent accidental lockouts.

### Event Management

The Event Management section displays all donation events in a timeline or list view. Each event shows the organizer name, event date, location, current participant count vs maximum capacity, and event status. Admins can view event details including description, registered participants, and comments. If an event violates platform policies or contains false information, admins can delete it.

When an event is deleted, all participant registrations are automatically cleaned up. Admins can moderate event descriptions if inappropriate content was included. They can also edit event details if the organizer made mistakes (wrong date, missing location, etc.). This management capability ensures event information is accurate and the platform maintains quality standards.

### Campaign Oversight

Through campaign management, admins monitor all fundraising campaigns. They can view campaign details, see who has donated, view donation amounts, and assess campaign progress toward the goal. Admins can flag campaigns that appear fraudulent, lack legitimate purpose, or are collecting funds for prohibited uses. Flagged campaigns can be reviewed before proceeding, and if deemed unsuitable, can be cancelled and donors refunded.

Admins can also promote high-quality campaigns that deserve more visibility, helping worthy causes receive more donations. They maintain a campaign archive showing completed campaigns and their outcomes, creating institutional knowledge about which types of campaigns succeed.

### Volunteer Management

Volunteer management includes reviewing pending volunteer applications. Users can apply for volunteer status through the app, providing information about their blood donation experience, availability, and community involvement. Admins review these applications and can approve or reject them. Approved volunteers receive special badges and expanded platform privileges.

Admins can also view a list of all active volunteers and their activities. They can see which volunteers are organizing events, how many donations they've facilitated, their community ratings, and whether they have any complaints. If a volunteer violates community standards, admins can revoke their volunteer status, reverting them to regular user status. Admins can also send targeted communications to volunteer groups, such as announcements about special drives or appreciation messages.

### System Administration

Beyond user and content management, admins access system-level administration features. They can view comprehensive platform analytics including user growth over time, active user statistics, geographic distribution of users, most requested blood groups, and seasonal trends in donations. This data informs strategic decisions about where to focus awareness campaigns and which blood groups need supply management.

Admins manage ambulance service provider contacts, including adding new providers, updating service areas, and removing inactive providers. They can manage the list of hospitals and medical facilities in the system. Admins can also broadcast system notifications to all users, send announcements about important platform updates, or alert users to critical situations (e.g., urgent blood type shortages).

---

## Payment Integration

### Khalti Payment Gateway

The AshaSetu platform integrates the Khalti payment gateway to facilitate fundraising campaign donations and future premium features. Khalti is a popular digital wallet and payment platform widely used in Nepal. When users, donate to a campaign or purchase premium services, they are directed to the Khalti payment interface.

The payment flow begins with the campaign displaying a "Donate Now" button. Clicking this button redirects the user to the Khalti payment portal where they enter the donation amount and specify their payment method (e.g., digital wallet, bank transfer, mobile money). After payment is processed and confirmed, Khalti sends a webhook notification to the backend confirming the transaction. The backend creates a donation record in the database, crediting the funds to the campaign. The user receives confirmation and is redirected back to the app showing successful donation.

### Webhook Processing

To ensure transaction security, Khalti sends server-side notifications (webhooks) to the backend API when payments are completed. These webhooks bypass the mobile app and directly communicate with the backend server, preventing users from fraudulently claiming payments they didn't make. The backend verifies webhook authenticity using Khalti's cryptographic signatures before processing any transaction.

Upon receiving a verified webhook, the backend records the transaction, updates the campaign's amount raised, increments the donor count, and sends confirmation emails to the donor. If the webhook processing fails, the backend logs the error for manual review and attempts retry with exponential backoff to ensure no legitimate transactions are missed.

### Refund Handling

If a campaign is cancelled before the deadline, or if the organizer requests a refund for donations, the payment system supports refund processing. Admins can initiate refunds for specific transactions or require users to go through customer support. Khalti handles the technical refund processing, returning funds to the original payment method with notification sent to both the user and the campaign creator.

---

## Volunteer Management

### Volunteer Application Process

Users interested in becoming volunteers navigate to the "Volunteer Application" screen where they provide information about their background. They indicate their years of blood donation experience, their area of interest (organizing events, mentoring new donors, blood bank liaison), their availability (number of hours per week, preferred days), and any certifications they hold (first aid certification, CPR training, etc.).

The application includes questions assessing the applicant's understanding of blood donation safety guidelines and community engagement motivation. Optional fields allow applicants to provide references from previous volunteer experiences or community organizations. Once submitted, the application goes into pending status and notifies all admins.

### Application Review & Approval

Admins review pending applications through the volunteer management section. They can see the application details, contact information, and any supporting documents. Based on the application quality, applicant's blood donation history (if a registered user for a while), and community feedback, admins decide to approve or reject the application.

Approved volunteers receive a notification confirming their new status and providing guidance about volunteer expectations and code of conduct. Rejected applications receive feedback explaining the decision, allowing applicants to strengthen future applications if they wish to reapply after some time.

### Volunteer Responsibilities & Expectations

Once approved, volunteers agree to a code of conduct including being truthful about blood donation information, treating all community members with respect, maintaining privacy of sensitive health information, and actively promoting platform guidelines. Volunteers who organize events are expected to provide accurate event information, manage registrations responsibly, and report accurate donation counts.

The platform provides training resources covering best practices for event organization, how to address common participant questions, safety protocols around blood handling, and how to create an inclusive community environment. Regular volunteers have access to volunteer forums where they can share experiences, ask questions, and receive support from the community.

### Volunteer Revocation

If a volunteer engages in misconduct including spreading health misinformation, organizing events that violate regulations, harassment of other users, or misrepresenting donation information, admins can revoke their volunteer status. Revocation removes volunteer privileges and badges immediately. The volunteer is notified of the revocation and provided the reason. In serious cases, the user account itself may be deactivated in addition to volunteer status revocation.

---

## Technical Architecture

### Mobile Architecture (React Native + Expo)

The AshaSetu mobile application is built using React Native with Expo for cross-platform development, allowing a single codebase to run on iOS, Android, and web platforms. The app architecture follows a screen-based navigation model where each feature (login, blood request, events, ambulance, etc.) is a separate screen component. React Navigation manages transitions between screens and maintains a navigation stack allowing users to go back through screens.

The AuthContext provides global authentication state accessible throughout the app, eliminating prop drilling and simplifying authentication logic. This context wraps the entire app at the root level and provides methods for login, logout, and checking authentication status. AsyncStorage persists the authentication token and user data locally on the device, enabling automatic session restoration on app restart.

API communication is handled through a centralized API configuration module that defines all backend endpoints and a `makeRequest` helper function that automatically includes authentication headers, handles errors, and provides consistent response formatting. Individual API modules (auth.js, admin.js, etc.) wrap backend endpoints with higher-level functions that screens can easily call.

### Backend Architecture (Node.js + Express + PostgreSQL)

The backend server is built with Node.js and Express.js, providing a RESTful API that all mobile clients communicate with. The server follows an MVC-like architecture with separate route files for each feature domain (auth routes, blood donation routes, event routes, admin routes, etc.). Each route file defines endpoints and links them to corresponding controller functions.

Controllers contain the business logic for each endpoint, including validation, database interaction, and response formatting. Middleware functions authenticate requests and check user permissions before allowing access to protected endpoints. The authentication middleware verifies JWT tokens on every protected request, ensuring only authenticated users access sensitive data.

The PostgreSQL database stores all persistent data including user accounts, blood requests, events, donations, and communications. The database is accessed through a connection pool that efficiently manages multiple concurrent connections. Database tables are created automatically on server startup if they don't exist, implementing a simple schema migration strategy.

### API Security

All API endpoints over HTTPS encrypt data in transit. Authentication is handled through JWT tokens signed with secret keys stored in environment variables (never committed to source code). Protected endpoints include the Authentication Bearer token in the Authorization header. The backend verifies token signatures and expiration before processing protected requests.

Passwords are never stored in plain text; they are hashed using bcrypt with a salt factor before storage. When users log in, the provided password is hashed and compared against the stored hash. To prevent unauthorized access even if the database is compromised, bcrypt uses cryptographic techniques that make reverse engineering passwords computationally infeasible.

Admin operations require not just a valid token but verification that the user has admin privileges. This verification queries the database (not just the JWT) to ensure that if a user's admin status was revoked, they cannot use an old token to access admin features. This provides real-time permission control.

### Data Validation & Error Handling

Both frontend and backend implement comprehensive input validation. The frontend provides real-time feedback as users type, immediately flagging invalid email formats, password too short, required fields empty, etc. This improves user experience by catching errors before submission.

The backend implements server-side validation of all inputs, regardless of what the frontend validated. This provides security protection against requests made through tools like Postman or custom scripts that bypass frontend validation. If a request contains invalid data, the backend returns a detailed error response explaining what was invalid.

Error handling throughout the app provides helpful messages without exposing system internals. Users see friendly messages like "Failed to load events" rather than database connection errors or stack traces. Developers can see detailed logs in server logs for debugging while users are protected from technical information that could be exploited for attacks.

### Push Notifications

The backend integrates with Expo push notification service to send real-time alerts to users. When significant events occur (blood request matching user's blood group, event reminder, donation response received), the backend sends push notifications to device tokens registered for that user. The app handles notification taps by opening the relevant screen (notification details, event info, blood request, etc.).

Push notifications provide timely engagement, encouraging users to check their donated blood status, respond to requests, and participate in events. Because many critical situations require rapid response, push notifications provide a direct channel to reach users even when the app isn't active.

---

## Feature Flow Examples

### Example 1: Blood Donation Request Lifecycle

A user named Rajesh urgently needs blood for a surgical procedure. He opens AshaSetu and navigates to "Blood Request." He specifies:
- Blood Group Needed: O+
- Quantity: 2 units
- Urgency: Critical (needed within 6 hours)
- Location: KIST Medical College, Kathmandu
- Hospital Name: KIST Hospital

Rajesh clicks "Submit Request" and the request is created in the database. The system immediately searches for all users with O+ blood group in the Kathmandu area within a 10km radius. It sends push notifications to 47 matched donors with the message: "Critical blood request for O+ in Kathmandu - 2 units needed urgently." Rajesh's request also appears on the Feed screen for voluntary search.

Within 15 minutes, a donor named Priya receives the notification. She has O+ blood, last donated on 15 days ago (exceeding the 14-day minimum interval), and is happy to help. She opens the notification and sees Rajesh's request details. She clicks "I can donate" and sends a response. Rajesh receives a notification that someone has responded to his request and sees Priya's profile with contact information. He calls Priya and arranges a meeting at KIST Hospital for donation.

Priya goes to the hospital, completes blood testing, and donated 2 units of O+ blood. The donation is recorded, Priya receives appreciation credit and points, and Rajesh receives a notification that the donated blood is available. The donation response status is marked "Completed." Afterward, both Rajesh and Priya can rate and provide feedback on the donation experience, helping build trust and identify reliable donors.

### Example 2: Event Organization & Participation

An organization called "Red Crescent Society" decides to organize a blood donation event to address a blood shortage. Their volunteer coordinator Anil opens AshaSetu and navigates to "Create Event." He fills in:
- Event Title: "Emergency Blood Drive - O+ Shortage Response"
- Date: April 15, 2026
- Time: 9:00 AM - 4:00 PM
- Location: Red Crescent Headquarters, Kathmandu  
- Max Participants: 500
- Description: Details about the urgent need and driving directions

Anil uploads an event poster image and clicks "Create Event." The event is published and promptly appears on the "Community Home" feed. The app sends notifications to all users in Kathmandu interested in blood donation events.

Over the next week, 287 users register for the event. The system updates the event participant count. Event organizers can see the registered list anytime. Users receive reminders 3 days and 1 day before the event.

On April 15, volunteers set up stations at the headquarters and start checking in participants. They record donors as they complete donation screening, testing, and actual donation. By 4:00 PM, 156 people have completed donations, contributing to the blood emergency effort.

The next day, registered participants receive an event completion notification with a link to rate the event. Anil sees 4.7-star average rating with feedback praising the organization, donor care, and quick response to emergency. Anil also sees that the event resulted in 156 units of O+ blood, exactly matching the emergency need. The Red Crescent coordinator shares this success with their board and plans another event.

### Example 3: Admin Platform Moderation

Admin Sarah opens the Admin Dashboard and sees a notification that a blood request has been flagged by multiple users as potentially fraudulent. She navigates to "User Management" and searches for the user who created the request. She sees that "User12345" has created 23 blood requests in 2 weeks but no corresponding donations or events. This pattern is consistent with potential fraud or system abuse.

Sarah reviews the blood requests created by this user and sees posts asking for rare blood types with no hospital affiliation - a classic pattern of people potentially seeking free blood for sales. She deactivates the user account, preventing them from creating further requests. She also manually deletes all 23 fraudulent requests to prevent confusion in the system.

Sarah then navigates to "Event Management" and reviews recent events. She sees an event titled "Free Blood Giveaway - No Donation Needed" which violates platform policies that events must involve actual donation collection, not distribution. She cancels the event and sends a message to the organizer explaining the policy violation and inviting them to contact support if they have questions.

Sarah then reviews "Volunteer Management" and sees two pending volunteer applications. She reviews the first applicant's profile - they've been a consistent blood donor for 3 years with no community complaints. She approves the application. She reviews the second applicant - they registered only 2 weeks ago, haven't donated yet, and have no community engagement. She rejects this application with a message: "We recommend registered users become familiar with our platform for 3+ months before volunteering. Please reapply in the future."

Sarah then accesses "Analytics" and sees that B+ blood requests remain unmet in 25% of cases, while A+ blood requests are usually fulfilled within 2 hours. She creates a system notification encouraging A+ donors to consider extending their donation to help fulfill B+ requests (if compatible with their health status), helping balance the supply.

---

## Conclusion & Platform Impact

AshaSetu represents a transformative approach to blood donation management and emergency services coordination. By combining structured blood request systems with community event organization, peer-to-peer support through chat, educational resources, and payment integration for fundraising, the platform addresses multiple facets of healthcare accessibility and community engagement.

The multi-tiered user role system ensures that administrators maintain quality control and platform integrity while empowering volunteers and regular users to actively participate in saving lives. The comprehensive data models enable analytics that inform public health strategies and identify critical blood supply gaps.

From the moment a user registers through their first blood donation, event participation, or volunteer contribution, AshaSetu provides both immediate impact (connecting donors with recipients) and long-term community health improvements. The platform transforms blood donation from an occasional crisis-driven activity into a seamlessly integrated part of digital health infrastructure in communities.
