# AES-256-GCM × DCT Watermarking

A browser-based tool for embedding an encrypted text message into an image using discrete cosine transform (DCT) coefficient modulation. The application uses AES-256-GCM to encrypt the message before it is embedded, and the encrypted content can be extracted in the browser with the same password.

## Features

- Hide encrypted text inside PNG, JPEG, or WebP images
- Encrypt messages with AES-256-GCM
- Extract messages from watermarked images
- Generate a downloadable PNG
- Preview the original, watermarked, and extraction-source images
- Run entirely in the browser
- Display operation timing and status notifications

## How It Works

1. The user supplies a password and a text message.
2. The message is sealed with AES-256-GCM using Web Crypto APIs.
3. The encrypted bytes are embedded into DCT coefficients in the selected image.
4. The image is returned as a PNG.
5. The encrypted bytes can later be extracted from an image.
6. The bytes are decrypted with the supplied password.

## Privacy and Security

- Encryption and watermark processing happen locally in the browser.
- The application does not explicitly upload selected images or messages to a server.
- The password is used for both encryption and decryption.
- Losing the password or using the wrong password prevents successful recovery.
- AES-256-GCM authenticates the encrypted payload, helping detect incorrect passwords or altered payloads.

A password should be sufficiently unique and secret. This project is intended as a demonstration and should not be considered a professional digital-rights-management system.

## Limitations

- Images may lose or alter embedded data after screenshotting, resizing, cropping, recompression, filtering, or significant visual editing.
- Browser and canvas support may affect supported image formats.
- JPEG compression and some image processing operations can reduce extraction reliability.
- Embedding payloads is limited by image dimensions and available DCT blocks.
- A successful extraction attempt is not a guarantee that the image or payload is authentic.

## Requirements

- Node.js 18 or newer
- npm
- A modern browser with Web Crypto API support

## Getting Started

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite.

### Create a production build

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Available Scripts

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start the Vite development server    |
| `npm run build`        | Build the application for production |
| `npm run preview`      | Preview the production build         |
| `npm run lint`         | Run ESLint                           |
| `npm run format`       | Format project files with Prettier   |
| `npm run format:check` | Check formatting with Prettier       |

## Usage

### Embed a message

1. Enter a password.
2. Select an image.
3. Enter the message to hide.
4. Select **Embed**.
5. Download the resulting PNG.

### Extract a message

1. Enter the password used when embedding.
2. Use the generated watermarked image or select another image.
3. Select **Extract**.
4. Review the recovered message or the failure status.

A message may fail to recover if the password is incorrect, the image has been modified, or no valid watermark is present.

## Technology

- React
- Vite
- Tailwind CSS
- Web Crypto API
- Canvas Image Processing
- Discrete Cosine Transform
- React Hot Toast
- ESLint
- Prettier

## Project Structure

```text
src/
├── components/   # Image picker, preview, and section components
├── hooks/        # React hooks for inputs and object URLs
├── styles/       # Application styles
├── utils/        # DCT, encryption, and watermark utilities
├── App.jsx       # Main application UI and workflow
└── index.jsx     # React entry point
```
