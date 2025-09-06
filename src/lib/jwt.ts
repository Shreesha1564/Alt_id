// This is a simulation of JWT generation for demonstration purposes.
// In a real application, use a library like 'jsonwebtoken' or 'jose'
// and sign with a private key stored securely on the server.

function base64url(source: string) {
  // Encode in classical base64
  let encodedSource = btoa(source);

  // Remove padding equal characters
  encodedSource = encodedSource.replace(/=+$/, '');

  // Replace characters according to base64url specifications
  encodedSource = encodedSource.replace(/\+/g, '-');
  encodedSource = encodedSource.replace(/\//g, '_');

  return encodedSource;
}

export function createSimulatedJwt(payload: object, privateKey: string): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));

  // In a real scenario, this would be a cryptographic signature
  // using a library like crypto.subtle. Here we simulate it.
  const signature = base64url(`simulated-signature-with-key:${privateKey}`);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
