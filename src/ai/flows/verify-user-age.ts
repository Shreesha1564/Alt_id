'use server';

/**
 * @fileOverview A flow to verify user age based on extracted ID information or provided age text.
 *
 * - verifyUserAge - A function that verifies if the user meets the age requirements.
 * - VerifyUserAgeInput - The input type for the verifyUserAge function.
 * - VerifyUserAgeOutput - The return type for the verifyUserAge function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifyUserAgeInputSchema = z.object({
  dateOfBirth: z.string().optional().describe('The date of birth extracted from the user ID.'),
  ageText: z.string().optional().describe('The age text provided by the user.'),
  ageRequirement: z.number().describe('The minimum age required.'),
});
export type VerifyUserAgeInput = z.infer<typeof VerifyUserAgeInputSchema>;

const VerifyUserAgeOutputSchema = z.object({
  isEligible: z.boolean().describe('Whether the user meets the age requirement.'),
  age: z.number().optional().describe('The age of the user, if determinable.'),
  explanation: z.string().describe('The explanation of the age verification result.'),
});
export type VerifyUserAgeOutput = z.infer<typeof VerifyUserAgeOutputSchema>;

export async function verifyUserAge(input: VerifyUserAgeInput): Promise<VerifyUserAgeOutput> {
  return verifyUserAgeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyUserAgePrompt',
  input: {schema: VerifyUserAgeInputSchema},
  output: {schema: VerifyUserAgeOutputSchema},
  prompt: `You are an expert age verification assistant.  You will determine if the user meets the age requirement based on the information provided.

  The minimum age requirement is: {{{ageRequirement}}}

  {{#if dateOfBirth}}
  The user's date of birth is: {{{dateOfBirth}}}
  {{/if}}

  {{#if ageText}}
  The user's age text is: {{{ageText}}}
  {{/if}}

  Consider both date of birth and age text if available.  Calculate the user's age if possible. Return whether they are eligible or not, their age if determinable, and explain your reasoning.
`,
});

const verifyUserAgeFlow = ai.defineFlow(
  {
    name: 'verifyUserAgeFlow',
    inputSchema: VerifyUserAgeInputSchema,
    outputSchema: VerifyUserAgeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
