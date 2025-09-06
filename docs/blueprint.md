# **App Name**: AltID

## Core Features:

- Integration Button: A prominent "Verify with AltID" button is available for partner platforms. Clicking this initiates the identity verification process.
- Verification Flow: Users are guided through a secure and intuitive verification flow, ensuring ease of use throughout the process.
- Digital Signature Verification: The system checks the digital signature of the uploaded document using a set of three hardcoded public keys, rejecting files with invalid signatures.  The keys are included in the metadata of the signature
- Data Extraction and Age Check: The system extracts key information such as name and date of birth and includes a tool which verifies that the user meets the age requirement. If age text is available, it will be used.
- Live Selfie Verification: The user captures a live selfie which undergoes liveness detection and is then compared with the photo from their ID, requiring a 90% match confidence, using Python DeepFace.
- JWT Token Generation and Redirect: A secure, signed JWT token containing key details is generated and redirected back to the partner website upon successful verification.

## Style Guidelines:

- Primary color: A vibrant blue (#29ABE2) to convey trust, security, and innovation. This will serve as the main brand color and will be used in key UI elements.
- Background color: A light gray (#F5F5F5) to provide a clean and neutral backdrop, ensuring readability and focus on the content.
- Accent color: A contrasting orange (#FFA500) is used to highlight interactive elements and calls to action, guiding the user through the verification process.
- Font: 'Inter' (sans-serif) for body and headline text, to ensure a modern, readable and neutral user experience.
- Crisp and modern icons will represent each step or feature of the identity verification process. They will all share the blue primary color (#29ABE2).
- A clean, intuitive layout will guide users through each step of the identity verification process, minimizing friction.
- Subtle animations and transitions will provide feedback and enhance the user experience, such as loading animations, and progress indicators.