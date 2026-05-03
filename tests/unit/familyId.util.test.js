const test = require('node:test');
const assert = require('node:assert/strict');

const {
  MIN_LEN,
  MAX_LEN,
  generateFamilyId,
  validateUserProvidedFamilyId,
  resolveFamilyIdForRegistration
} = require('../../src/utils/familyId.util');

test('generateFamilyId returns fam- prefix and 24 hex chars', () => {
  const id = generateFamilyId();
  assert.match(id, /^fam-[a-f0-9]{24}$/);
});

test('validateUserProvidedFamilyId normalizes to lowercase slug', () => {
  assert.equal(validateUserProvidedFamilyId('  Family-Main  '), 'family-main');
});

test('validateUserProvidedFamilyId accepts minimum length slug', () => {
  assert.equal(validateUserProvidedFamilyId('abc'), 'abc');
});

test('validateUserProvidedFamilyId rejects slug shorter than minimum', () => {
  assert.throws(
    () => validateUserProvidedFamilyId('ab'),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.match(error.message, new RegExp(String.raw`${MIN_LEN}`));
      return true;
    }
  );
});

test('validateUserProvidedFamilyId rejects slug longer than maximum', () => {
  const tooLong = 'a'.repeat(MAX_LEN + 1);
  assert.throws(
    () => validateUserProvidedFamilyId(tooLong),
    (error) => {
      assert.equal(error.statusCode, 400);
      return true;
    }
  );
});

test('validateUserProvidedFamilyId rejects underscores and spaces', () => {
  assert.throws(
    () => validateUserProvidedFamilyId('family_main'),
    (error) => {
      assert.equal(error.statusCode, 400);
      return true;
    }
  );
});

test('validateUserProvidedFamilyId rejects double hyphen segments', () => {
  assert.throws(
    () => validateUserProvidedFamilyId('fam--ily'),
    (error) => {
      assert.equal(error.statusCode, 400);
      return true;
    }
  );
});

test('resolveFamilyIdForRegistration generates when input is undefined', () => {
  const id = resolveFamilyIdForRegistration(undefined);
  assert.match(id, /^fam-[a-f0-9]{24}$/);
});

test('resolveFamilyIdForRegistration generates when input is null', () => {
  const id = resolveFamilyIdForRegistration(null);
  assert.match(id, /^fam-[a-f0-9]{24}$/);
});

test('resolveFamilyIdForRegistration generates when input is blank string', () => {
  const id = resolveFamilyIdForRegistration('   ');
  assert.match(id, /^fam-[a-f0-9]{24}$/);
});

test('resolveFamilyIdForRegistration validates when input is non-empty', () => {
  assert.equal(resolveFamilyIdForRegistration('Shared-Home'), 'shared-home');
});
