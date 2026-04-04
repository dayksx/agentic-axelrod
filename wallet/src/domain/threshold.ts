/** Matches `@dynamic-labs-wallet/core` ThresholdSignatureScheme string values. */
export const ThresholdScheme = {
  TWO_OF_TWO: "TWO_OF_TWO",
  TWO_OF_THREE: "TWO_OF_THREE",
  THREE_OF_FIVE: "THREE_OF_FIVE",
} as const;

export type ThresholdSchemeName =
  (typeof ThresholdScheme)[keyof typeof ThresholdScheme];
