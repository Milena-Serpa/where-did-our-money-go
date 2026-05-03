const crypto = require('crypto');

const MIN_LEN = 3;
const MAX_LEN = 50;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function createValidationError(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

function generateFamilyId() {
  return `fam-${crypto.randomBytes(12).toString('hex')}`;
}

function validateUserProvidedFamilyId(raw) {
  const normalized = String(raw).trim().toLowerCase();
  if (normalized.length < MIN_LEN || normalized.length > MAX_LEN) {
    throw createValidationError(
      `familyId must be between ${MIN_LEN} and ${MAX_LEN} characters`
    );
  }
  if (!SLUG_PATTERN.test(normalized)) {
    throw createValidationError(
      'familyId must be a lowercase slug: letters, digits, and internal hyphens only'
    );
  }
  return normalized;
}

function resolveFamilyIdForRegistration(familyIdInput) {
  if (familyIdInput === undefined || familyIdInput === null) {
    return generateFamilyId();
  }
  if (typeof familyIdInput === 'string' && familyIdInput.trim() === '') {
    return generateFamilyId();
  }
  return validateUserProvidedFamilyId(familyIdInput);
}

module.exports = {
  MIN_LEN,
  MAX_LEN,
  generateFamilyId,
  validateUserProvidedFamilyId,
  resolveFamilyIdForRegistration
};
