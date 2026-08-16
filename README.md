# Coastal Haven Bookings

Build a complete, production-ready full-stack BNB/property booking platform called:

COASTAL HAVEN

IMPORTANT BUSINESS MODEL:
This is NOT a marketplace where properties are pre-listed by the platform.

Coastal Haven is an accommodation management and booking website for ONE HOST/ADMIN. The admin/host is responsible for adding and managing all BNB properties themselves.

The application must therefore start with an empty property inventory and provide the admin with a powerful dashboard where they can create, edit, publish, unpublish, delete and manage their own BNB listings.

TECH STACK:
- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase for PostgreSQL database, authentication and storage
- React Router
- TanStack Query
- Proper form validation
- Responsive/mobile-first design
- Clean component architecture
- Environment variables for all secrets
- Production-ready code
- No hardcoded secrets
- No fake booking/payment success states

DESIGN:
Create a premium coastal/Kilifi aesthetic.

The design should feel:
- luxurious
- tropical
- peaceful
- modern
- trustworthy
- premium but accessible

Use coastal-inspired colors such as:
- deep ocean blue
- turquoise
- sandy beige
- white
- subtle coral accents

Use beautiful cards, rounded corners, elegant typography, subtle animations and high-quality image presentation.

The website must work beautifully on:
- phones
- tablets
- laptops
- desktop screens

==================================================
1. PUBLIC WEBSITE
==================================================

Create:

HOME PAGE
- Hero section with beautiful coastal imagery
- "Stay by the Coast, Your Way" style messaging
- Search availability section
- Featured properties section
- Why Coastal Haven section
- Kilifi/coastal experience section
- Guest reviews
- Call-to-action
- Footer

IMPORTANT:
The Featured Properties section must dynamically load properties created by the admin from Supabase.

If there are no published properties yet, show a beautiful empty state such as:
"Your next coastal escape is coming soon."

Do NOT hardcode BNB properties.

PROPERTY SEARCH
Allow users to search by:
- check-in date
- check-out date
- number of guests
- property
- price range

Only show properties that are published and available.

==================================================
2. PROPERTY DETAILS
==================================================

Each property created by the admin should have:

- Property name
- Description
- Location
- Google Maps/location information
- Property type
- Maximum guests
- Bedrooms
- Beds
- Bathrooms
- Amenities
- Rules
- Check-in time
- Check-out time
- Base price
- Weekend price
- Seasonal pricing
- Cleaning fee
- Additional fees
- Photos
- Property status
- Featured status

Create a beautiful property details page.

Include:
- image gallery
- property information
- amenities
- house rules
- availability calendar
- pricing
- reviews
- booking widget
- "Book Now" button

==================================================
3. AUTHENTICATION
==================================================

Users must be able to:

- Sign up
- Log in
- Log out
- Reset password

Authentication options:
1. Google OAuth
2. Phone number authentication with OTP

Phone authentication must support international users.

Provide a country selector with international country calling codes.

Examples:
+254 Kenya
+1 USA/Canada
+44 UK
+33 France
etc.

Do NOT hardcode only Kenya.

Use Supabase Auth where appropriate.

Users should have profiles containing:
- full name
- email
- phone number
- country
- profile photo
- created_at

==================================================
4. USER DASHBOARD
==================================================

After login, users should have a dashboard containing:

- Profile
- Upcoming bookings
- Previous bookings
- Cancelled bookings
- Booking details
- Payment status
- Saved/favourite properties
- Reviews they have submitted

Allow users to edit:
- name
- phone
- country
- profile photo

==================================================
5. BOOKING SYSTEM
==================================================

THIS MUST ACTUALLY WORK.

The "Book Now" button must create a real booking in Supabase.

Do NOT create fake frontend-only booking states.

Booking flow:

1. User selects property
2. User selects check-in date
3. User selects check-out date
4. User selects guests
5. System checks availability
6. System calculates price
7. User enters/confirm guest details
8. System creates a pending booking
9. User proceeds to payment
10. Payment is verified
11. Booking becomes confirmed
12. Confirmation email is sent
13. Confirmation notification is displayed in the user's dashboard

Prevent double booking.

Before confirming a booking, check the database for overlapping confirmed/pending bookings.

Use proper database constraints/transaction logic where possible.

Booking record should include:
- booking_id
- user_id
- property_id
- check_in
- check_out
- guests
- subtotal
- fees
- total
- payment_status
- booking_status
- created_at
- updated_at

Booking statuses:
- pending
- confirmed
- cancelled
- completed

Payment statuses:
- pending
- paid
- failed
- refunded

==================================================
6. PAYMENT SYSTEM
==================================================

Build the payment architecture properly.

The system must NOT simply show:
"Payment successful"

unless payment has actually been confirmed by the payment provider.

Create a payment service abstraction so the application can support a real payment provider.

The admin must be able to configure payment details from the admin dashboard.

The architecture should support:
- M-Pesa
- card payments
- other supported payment providers

For M-Pesa, structure the application so a proper M-Pesa/STK Push integration can be connected using environment variables and secure server-side functions.

Never expose secret payment credentials in frontend code.

Payment flow:

Booking
→ Payment initiation
→ Payment provider
→ Callback/webhook
→ Verify payment
→ Update booking
→ Send confirmation

==================================================
7. EMAIL SYSTEM
==================================================

Build a proper email notification architecture.

Admin email:

coastalhavenbnb@outlook.com

The system should support transactional emails for:

- account creation
- OTP/login where applicable
- booking created
- payment successful
- booking confirmed
- booking cancelled
- booking reminder
- payment failed
- booking completed
- review invitation

The confirmation email should feel polished, similar in quality to professional travel platforms.

Example:

"Your Coastal Haven booking is confirmed 🌊"

Include:
- guest name
- property
- dates
- number of guests
- booking reference
- amount paid
- host contact details
- check-in instructions if available

Use a transactional email provider through environment variables/server-side functions.

Do NOT put email credentials in frontend code.

==================================================
8. SMS / WHATSAPP
==================================================

Create a notification service architecture that can support SMS and WhatsApp notifications.

Admin/host WhatsApp number:

+254105845387

The system should be structured so a provider such as Twilio or another appropriate provider can be connected using environment variables.

Notifications can include:

- booking received
- payment confirmed
- booking cancelled
- booking reminder

IMPORTANT:
Do not pretend WhatsApp/SMS was sent if no provider is configured.

Instead:
- create the integration layer
- use environment variables
- show a clear configuration state in the admin dashboard

==================================================
9. ADMIN / HOST DASHBOARD
==================================================

This is one of the MOST IMPORTANT parts.

Create a secure admin dashboard.

The admin must be able to manage practically the entire platform.

Admin dashboard sections:

OVERVIEW
- total bookings
- upcoming bookings
- revenue
- pending payments
- occupancy
- recent activity

PROPERTIES
- add property
- edit property
- delete property
- publish/unpublish
- feature/unfeature
- upload images
- edit amenities
- edit rules
- edit pricing
- manage availability

BOOKINGS
- view all bookings
- filter bookings
- search bookings
- view booking details
- confirm
- cancel
- mark completed
- manually create booking
- modify booking
- manage payment status where appropriate

PRICING
Admin must be able to change:
- base price
- weekend price
- seasonal price
- discounts
- cleaning fees
- additional fees

Never hardcode property prices.

SETTINGS
Admin should be able to configure:

- business name
- host name
- host email
- host phone
- WhatsApp number
- Instagram
- Facebook
- TikTok
- website/social links
- physical/location information
- check-in instructions
- check-out instructions
- cancellation policy
- booking policy
- payment instructions
- currency
- contact information
- business description

The admin should be able to change these details without editing source code.

==================================================
10. ADMIN PROPERTY CREATION
==================================================

Create an excellent "Add Property" form.

Fields:

- property name
- description
- location
- property type
- max guests
- bedrooms
- beds
- bathrooms
- amenities
- house rules
- check-in time
- check-out time
- base price
- weekend price
- seasonal pricing
- cleaning fee
- images
- featured
- published

Use Supabase Storage for property images.

Allow multiple image uploads.

Allow admin to:
- reorder images
- delete images
- select cover image

==================================================
11. AVAILABILITY MANAGEMENT
==================================================

Admin must be able to:

- view calendar
- block dates
- unblock dates
- see bookings
- manually reserve dates
- manage availability

Users must never be able to book dates that are already reserved.

==================================================
12. REVIEWS AND RATINGS
==================================================

After a completed booking, allow the user to:

- leave a written review
- give 1–5 stars

Reviews should include:
- rating
- comment
- user
- property
- date

Admin can:
- view reviews
- hide inappropriate reviews
- delete reviews if necessary

Display average rating and review count on property pages.

Do not allow users to review a property unless they have a completed booking for it.

==================================================
13. FAVOURITES
==================================================

Users can favourite properties.

Create:
- favourite button
- favourites page
- database table for favourites

==================================================
14. DATABASE
==================================================

Design a proper Supabase schema.

Suggested tables:

profiles
properties
property_images
amenities
property_amenities
bookings
payments
reviews
favorites
availability_blocks
notifications
admin_settings
pricing_rules

Use:
- foreign keys
- indexes
- timestamps
- constraints
- Row Level Security

IMPORTANT:
Implement Supabase Row Level Security correctly.

Users should only be able to access their own private information and bookings.

Admins should have appropriate management permissions.

Do not expose sensitive admin data to normal users.

==================================================
15. ADMIN ROLE
==================================================

Implement role-based access control.

Roles:

user
admin

The admin dashboard must not be accessible to ordinary users.

Protect admin routes.

Do not rely only on hiding buttons in the frontend.

Enforce authorization at the database/server level as well.

==================================================
16. NOTIFICATIONS
==================================================

Create an in-app notification center.

Users can see:
- booking confirmation
- payment confirmation
- cancellation
- reminders
- other account notifications

Admin can see:
- new booking
- payment received
- cancellation
- new review
- failed payment

==================================================
17. SECURITY
==================================================

Follow secure production practices.

Never expose:
- service role keys
- payment secrets
- email passwords
- API secrets

Frontend may only use safe public Supabase credentials.

Use environment variables.

Validate all user input.

Protect admin routes.

Protect database with RLS.

Do not trust frontend payment status.

Verify payment server-side/webhook-side.

==================================================
18. ERROR HANDLING
==================================================

Do not let the application silently fail.

Every important operation should have:
- loading state
- success state
- error state
- retry where appropriate

Examples:

Booking failed:
"Unable to complete your booking. Please try again."

Payment failed:
"Payment could not be verified. Your booking has not been confirmed."

No availability:
"These dates are no longer available."

==================================================
19. ADMIN CONFIGURATION PAGE
==================================================

Create a dedicated Settings → Integrations page.

Show configuration status for:

Supabase
Email
Google Auth
Phone OTP
M-Pesa
Payment provider
SMS
WhatsApp

Show:
Connected
Not configured
Configuration required

Never expose secret values.

==================================================
20. COASTAL THEME CUSTOMIZATION
==================================================

Allow the admin to choose from several visual themes:

- Ocean Blue
- Tropical Sand
- Sunset Coast
- Deep Sea
- Minimal Coastal

The selected theme should affect:
- buttons
- accents
- backgrounds
- cards
- navigation
- subtle decorative elements

Store theme selection in admin settings.

==================================================
21. SEO
==================================================

Add:
- page titles
- meta descriptions
- Open Graph metadata
- proper headings
- descriptive URLs
- favicon
- sitemap-ready structure

==================================================
22. PERFORMANCE
==================================================

Optimize:
- images
- lazy loading
- code splitting
- database queries
- unnecessary re-renders

Do not load huge assets unnecessarily.

==================================================
23. PROJECT STRUCTURE
==================================================

Use a clean scalable structure such as:

src/
  components/
  pages/
  layouts/
  hooks/
  services/
  lib/
  integrations/
  types/
  utils/
  contexts/

Keep business logic out of UI components where possible.

==================================================
24. IMPORTANT DEVELOPMENT RULE
==================================================

Do not build a fake demo.

Build the actual application architecture.

If an external service requires credentials that are not available yet:
- create the integration interface
- create the service layer
- create environment variable placeholders
- create clear setup documentation
- gracefully disable the feature until configured

Do not replace real functionality with fake alerts.

==================================================
25. ENVIRONMENT VARIABLES
==================================================

Create a .env.example containing placeholders for things such as:

VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

EMAIL_PROVIDER_API_KEY=
EMAIL_FROM=

MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=

Never commit .env to GitHub.

==================================================
26. FINAL REQUIREMENT
==================================================

Before considering the project complete:

- test authentication
- test Google login configuration
- test phone OTP flow
- test property creation
- test image upload
- test property editing
- test publishing/unpublishing
- test availability
- test booking
- test prevention of double booking
- test payment architecture
- test booking confirmation
- test email architecture
- test admin dashboard
- test user dashboard
- test reviews
- test ratings
- test favourites
- test mobile responsiveness
- test authorization
- test Supabase RLS
- test error states

Create a README.md explaining:
- project setup
- Supabase setup
- database migration
- authentication setup
- environment variables
- payment integration
- email integration
- WhatsApp/SMS integration
- deployment
- admin setup

Most importantly:

DO NOT PRE-LIST ANY BNBs.

The admin/host must be the person who creates all properties through the admin dashboard.

The final product should feel like a real boutique coastal accommodation booking platform that is ready to hand over to the host, not a student mockup.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://serene-shore-bookings.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/69e3e99c-65dc-45d1-9c9e-39bc6b5ab62f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
