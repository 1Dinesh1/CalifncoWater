
# Califnco Water

A mobile shopping experience and web-based admin dashboard for water purification products, customer orders, service bookings, and dealer management.

<p align="center">
  <a href="https://califnco-water-admin.vercel.app/">
    <strong>Open Admin Dashboard →</strong>
  </a>
</p>

## Overview

**Califnco Water** is a product catalogue and order management application built with React Native and Expo, supported by Firebase services and a separate React-based administration dashboard.

The mobile app allows customers to explore water purification products, manage a shopping cart, place cash-on-delivery orders, book services, and apply to become dealers. Approved dealers can access wholesale pricing and submit bulk orders.

The admin dashboard provides a central interface for reviewing orders, managing service requests, and processing dealer applications.

This project brings together mobile development, authentication, cloud data management, role-based access control, and administrative workflows in one system.

## Key Features

### Customer Mobile App

- **Product catalogue** — Browse water purification products with product images, prices, search, and category filtering.
- **Shopping cart** — Add products, adjust quantities, and review order totals.
- **Customer accounts** — Register, sign in, and sign out using Firebase Authentication.
- **Order placement** — Submit orders with customer, contact, and delivery details using cash on delivery.
- **My Orders** — View order history associated with the signed-in customer.
- **Service booking** — Request installation, repair, or maintenance services with preferred dates and time slots.
- **Account management** — Access account details, customer navigation, and dealership application status.
- **Dealer applications** — Submit business details and track application status.
- **Wholesale pricing** — Approved dealers receive eligible wholesale prices and can identify wholesale orders.
- **Mobile navigation** — Dedicated Home, My Orders, Services, and Account navigation.
- **Theme preferences** — Light, dark, and system appearance options.
- **Product image viewing** — View product images with zoom and full-screen support.

### Admin Dashboard

The separate web dashboard is built with React and Vite and is deployed on Vercel.

- **Operational overview** — View order, revenue, and service-related metrics.
- **Order management** — Search orders, filter by status, inspect order items, and update order status.
- **Service management** — Review service requests, customer contact details, addresses, and requested work.
- **Dealers Desk** — Search dealer applications, filter by application status, and review business details.
- **Dealer approval workflow** — Approve or reject dealer applications through the administration interface.
- **Access control** — Uses Firebase Authentication and Firestore-based administrator authorization.
- **Responsive interface** — Designed for use across different screen sizes.

### Automation

The `automation/` directory contains scripts for preparing promotional content and testing an Instagram publishing workflow.

- AI-assisted caption generation.
- AI-assisted promotional image generation.
- Instagram publishing workflow scripts.
- Dry-run testing to validate the workflow without publishing a live post.

**Note:** Automation scripts may require additional credentials and configuration. A successful dry run does not mean a live Instagram post has been published.

## Technology Stack

| Area | Technologies |
|---|---|
| Mobile application | React Native, Expo |
| Language | JavaScript |
| Admin dashboard | React, Vite |
| Authentication | Firebase Authentication |
| Cloud database | Cloud Firestore |
| Deployment | Vercel |
| Automation | Node.js scripts |
| Version control | Git, GitHub |

## Application Architecture

```text
CalifncoWater/
│
├── App.js                  # Mobile application entry point
├── index.js                # Expo entry point
├── src/
│   ├── components/         # Reusable mobile UI components
│   ├── screens/            # Application screens
│   ├── theme/              # Theme and appearance settings
│   ├── utils/              # Shared utility functions
│   └── firebase.js         # Firebase initialization
│
├── admin-web/              # React + Vite admin dashboard
├── automation/             # Promotional content and workflow scripts
├── assets/                 # Application assets
├── firestore.rules         # Firestore security rules
├── firestore.rules.proposed
├── PROJECT_STATUS.md       # Detailed implementation status
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/)
- npm
- [Expo Go](https://expo.dev/go) on a compatible mobile device, or an Android emulator
- Access to the required Firebase project configuration

### 1. Clone the repository

```bash
git clone https://github.com/1Dinesh1/CalifncoWater.git
cd CalifncoWater
```

### 2. Install mobile app dependencies

```bash
npm install
```

### 3. Configure Firebase

Configure the Firebase project settings required by the application. The mobile Firebase initialization is located in:

```text
src/firebase.js
```

Ensure Firebase Authentication and Cloud Firestore are configured for the features you want to test. Do not commit private keys, service-account credentials, or secret environment files.

### 4. Start the mobile application

```bash
npx expo start
```

Follow the Expo CLI instructions to launch the app in Expo Go or an available emulator.

Other available commands:

```bash
npm run android
npm run ios
npm run web
```

These commands depend on the required platform tools being installed and supported by the project configuration.

## Admin Dashboard

The admin application is maintained separately in `admin-web/`.

For its dependencies, Firebase configuration, local development, and deployment instructions, see:

[`admin-web/README.md`](admin-web/README.md)

Live dashboard: https://califnco-water-admin.vercel.app/

Administrative data access depends on the Firebase administrator configuration and the security rules deployed to the Firebase project.

## Automation

The automation scripts are located in:

```text
automation/
```

Review `automation/README.md` for workflow-specific setup and configuration.

To run the configured Instagram workflow in dry-run mode from the project root:

```bash
npm run instagram:preview
```

The dry-run workflow is intended for validation and should not be treated as confirmation of a live publication.

Never commit API keys, access tokens, passwords, or private configuration files.

## Security Considerations

- Use Firebase Authentication for customer and administrator sign-in.
- Enforce authorization through Firestore security rules, not only through UI visibility.
- Restrict customers to their own account-related records and orders.
- Allow wholesale pricing only for approved dealers.
- Protect administrator privileges and validate permitted database updates.
- Review and deploy the appropriate Firestore security rules in the Firebase Console before relying on cloud workflows in production.
- Keep credentials and local environment files out of version control.

## Project Status

Califnco Water is an actively developed project. Core catalogue functionality has been verified, while some authentication, checkout, service booking, and dealer workflows still require additional manual verification on a device and against the configured Firebase environment.

For the latest implementation notes, completed milestones, and known limitations, see [`PROJECT_STATUS.md`](PROJECT_STATUS.md).

## License

This repository includes an MIT license. See [`LICENSE`](LICENSE) for the license text.
