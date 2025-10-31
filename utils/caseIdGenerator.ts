// Function to generate a 6-digit, Luhn-compliant case ID.
// This ensures a degree of typo-resistance for manually entered IDs.
export function generateLuhnCaseId(): string {
  // Generate 5 random digits for the prefix
  const prefix = Math.floor(10000 + Math.random() * 90000).toString();
  let sum = 0;
  let isEven = false;

  // Luhn checksum calculation, iterating from right to left
  for (let i = prefix.length - 1; i >= 0; i--) {
    let digit = parseInt(prefix[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    isEven = !isEven;
  }

  const checksum = (10 - (sum % 10)) % 10;
  return prefix + checksum; // Returns a 6-digit Luhn-valid ID as a string
}
