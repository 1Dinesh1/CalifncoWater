
# CalifncoWater

A mobile application for browsing and purchasing water-related products, with customer and dealer experiences and administrative management.

## Overview

CalifncoWater is built with React Native and Expo. The project focuses on providing a convenient mobile shopping experience, including product browsing, image viewing, cart management, and account features.

## Features

- Customer authentication and account management
- Product catalogue and product image viewing
- Image zoom and full-screen image viewing
- Shopping cart functionality
- Dark mode with Light, Dark, and System preferences
- Customer and dealer experiences
- Referral code functionality
- Animated interface elements

> Feature availability may depend on the current application build and account role.

## Technology Stack

- **Mobile:** React Native, Expo
- **Language:** JavaScript
- **Backend and data:** Firebase services, where configured
- **Version control:** Git and GitHub

## Project Structure

```text
CalifncoWater/
├── App.js
├── src/
│   ├── components/
│   ├── theme/
│   └── utils/
├── automation/
├── firestore.rules
├── PROJECT_STATUS.md
└── README.md
```

The exact structure may vary as development continues.

## Getting Started

### Prerequisites

- Node.js and npm
- Expo development environment
- Android device or emulator
- Required Firebase configuration, if applicable

### Installation

Clone the repository:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd CalifncoWater
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npx expo start
```

Follow the Expo instructions to open the application on a device or emulator.

## Testing

Test the application on a supported device and verify authentication, role-based navigation, product browsing, cart operations, and account preferences.

## Project Status

This project is under development. Refer to `PROJECT_STATUS.md` for implementation notes and known limitations.

## Security

Do not commit API secrets, service-account credentials, private keys, or local environment files. Review Firebase configuration and security rules before deployment.

## Author

Developed as part of the CalifncoWater project.
