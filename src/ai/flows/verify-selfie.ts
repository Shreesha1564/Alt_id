'use server';

/**
 * @fileOverview Flow for verifying a user's identity by comparing their live selfie with the photo from their ID.
 *
 * - verifySelfie - A function that handles the selfie verification process.
 * - VerifySelfieInput - The input type for the verifySelfie function.
 * - VerifySelfieOutput - The return type for the verifySelfie function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifySelfieInputSchema = z.object({
  selfieDataUri: z
    .string()
    .describe(
      "A photo of the user's live selfie, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  idPhotoDataUri: z
    .string()
    .describe(
      "A photo from the user's ID, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type VerifySelfieInput = z.infer<typeof VerifySelfieInputSchema>;

const VerifySelfieOutputSchema = z.object({
  matchConfidence: z
    .number()
    .describe(
      'The confidence level that the selfie matches the ID photo, as a percentage (0-100).'
    ),
  isMatch: z
    .boolean()
    .describe(
      'Whether the selfie is considered a match to the ID photo based on a 85% confidence threshold.'
    ),
  isLive: z
    .boolean()
    .describe(
      'Whether the selfie image appears to be a live person and not a photo of a screen or another photo.'
    ),
  livenessConfidence: z
    .number()
    .describe(
      'The confidence level that the selfie is from a live person, as a percentage (0-100).'
    ),
});
export type VerifySelfieOutput = z.infer<typeof VerifySelfieOutputSchema>;

export async function verifySelfie(input: VerifySelfieInput): Promise<VerifySelfieOutput> {
  return verifySelfieFlow(input);
}

const verifySelfiePrompt = ai.definePrompt({
  name: 'verifySelfiePrompt',
  input: {schema: VerifySelfieInputSchema},
  output: {schema: VerifySelfieOutputSchema},
  prompt: `You are an expert in forensic facial comparison and liveness detection.

1.  **Liveness Check**: Analyze the selfie image. Determine if it is a live person or a presentation attack (e.g., a photo of a photo, a picture on a screen). Look for signs like screen glare, borders of a phone, or unnatural flatness. Provide a liveness confidence score and set 'isLive' to true if confidence is high.

2.  **Facial Comparison**: Compare the live selfie with the photo from an ID card. Act as a forensic expert. Focus on stable facial features (e.g., distance between eyes, nose shape, jawline) and be tolerant of superficial differences (e.g., lighting, hairstyle, glasses, facial hair, expression). The ID photo might be older, so account for natural aging. Provide a match confidence score as a percentage from 0 to 100.

3.  **Final Decision**: A match confidence score of 85% or higher is considered a valid match. Set 'isMatch' to true only if the confidence score meets this threshold.

Selfie: {{media url=selfieDataUri}}
ID Photo: {{media url=idPhotoDataUri}}`,
});

const verifySelfieFlow = ai.defineFlow(
  {
    name: 'verifySelfieFlow',
    inputSchema: VerifySelfieInputSchema,
    outputSchema: VerifySelfieOutputSchema,
  },
  async input => {
    const {output} = await verifySelfiePrompt(input);
    return output!;
  }
);
