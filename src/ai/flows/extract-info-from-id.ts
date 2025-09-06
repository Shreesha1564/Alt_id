'use server';
/**
 * @fileOverview Extracts information such as name and date of birth from an ID document.
 *
 * - extractInfoFromId - A function that handles the information extraction process.
 * - ExtractInfoFromIdInput - The input type for the extractInfoFromId function.
 * - ExtractInfoFromIdOutput - The return type for the extractInfoFromId function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractInfoFromIdInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an ID document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  ageText: z.string().optional().describe('Text specifically mentioning the age of the user, if available.'),
});
export type ExtractInfoFromIdInput = z.infer<typeof ExtractInfoFromIdInputSchema>;

const ExtractInfoFromIdOutputSchema = z.object({
  name: z.string().describe('The full name of the user.'),
  dateOfBirth: z.string().optional().describe('The date of birth of the user in ISO format (YYYY-MM-DD).'),
  age: z.number().optional().describe('The age of the user, if date of birth is not present.'),
  ageVerified: z.boolean().describe('Whether the user meets the minimum age requirement, which is 18.'),
});
export type ExtractInfoFromIdOutput = z.infer<typeof ExtractInfoFromIdOutputSchema>;

export async function extractInfoFromId(input: ExtractInfoFromIdInput): Promise<ExtractInfoFromIdOutput> {
  return extractInfoFromIdFlow(input);
}

const extractInfoFromIdPrompt = ai.definePrompt({
  name: 'extractInfoFromIdPrompt',
  input: {schema: ExtractInfoFromIdInputSchema},
  output: {schema: ExtractInfoFromIdOutputSchema},
  prompt: `You are an expert in extracting information from identity documents. Today's date is {{currentTime}}. Extract the name and date of birth from the following document. Handle various date formats (like DD-MM-YYYY, MM/DD/YYYY, YYYY-MM-DD).

If a date of birth is present, calculate the person's current age and verify if they are at least 18 years old. Set ageVerified to true only if they are 18 or older.

If an ageText field is available, verify age based on this value instead of the date of birth.

Photo: {{media url=photoDataUri}}

Age Text: {{{ageText}}}

Ensure that the date of birth is formatted as YYYY-MM-DD.`,
});

const extractInfoFromIdFlow = ai.defineFlow(
  {
    name: 'extractInfoFromIdFlow',
    inputSchema: ExtractInfoFromIdInputSchema,
    outputSchema: ExtractInfoFromIdOutputSchema,
  },
  async input => {
    const {output} = await extractInfoFromIdPrompt({
        ...input,
        currentTime: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
    });
    return output!;
  }
);
