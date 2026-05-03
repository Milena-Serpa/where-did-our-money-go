const {
  MIN_LEN,
  MAX_LEN,
  generateFamilyId,
  validateUserProvidedFamilyId,
  resolveFamilyIdForRegistration
} = require('../../src/utils/familyId.util');

describe('FamilyId Util', () => {
  it('should generate familyId with fam- prefix and 24 hex chars', () => {
    const id = generateFamilyId();
    expect(id).toMatch(/^fam-[a-f0-9]{24}$/);
  });

  describe('validateUserProvidedFamilyId', () => {
    it('should normalize to lowercase slug', () => {
      expect(validateUserProvidedFamilyId('  Family-Main  ')).toBe('family-main');
    });

    it('should accept minimum length slug', () => {
      expect(validateUserProvidedFamilyId('abc')).toBe('abc');
    });

    it('should reject slug shorter than minimum', () => {
      expect(() => validateUserProvidedFamilyId('ab')).toThrow(expect.objectContaining({
        statusCode: 400
      }));
    });

    it('should reject slug longer than maximum', () => {
      const tooLong = 'a'.repeat(MAX_LEN + 1);
      expect(() => validateUserProvidedFamilyId(tooLong)).toThrow(expect.objectContaining({
        statusCode: 400
      }));
    });

    it('should reject underscores and spaces', () => {
      expect(() => validateUserProvidedFamilyId('family_main')).toThrow(expect.objectContaining({
        statusCode: 400
      }));
    });

    it('should reject double hyphen segments', () => {
      expect(() => validateUserProvidedFamilyId('fam--ily')).toThrow(expect.objectContaining({
        statusCode: 400
      }));
    });
  });

  describe('resolveFamilyIdForRegistration', () => {
    it('should generate when input is undefined', () => {
      expect(resolveFamilyIdForRegistration(undefined)).toMatch(/^fam-[a-f0-9]{24}$/);
    });

    it('should generate when input is null', () => {
      expect(resolveFamilyIdForRegistration(null)).toMatch(/^fam-[a-f0-9]{24}$/);
    });

    it('should generate when input is blank string', () => {
      expect(resolveFamilyIdForRegistration('   ')).toMatch(/^fam-[a-f0-9]{24}$/);
    });

    it('should validate when input is non-empty', () => {
      expect(resolveFamilyIdForRegistration('Shared-Home')).toBe('shared-home');
    });
  });
});
