import { describe, it, expect } from 'vitest';
import { getInitials, isRelativeUrl, normalizePath } from './string.helper';

describe('test getInitials() helper func', () => {
    it('should return initials', () => {
        const wa = getInitials('Why-App-0815');
        expect(wa).equals('WA');

        const ya = getInitials('Y--App-0815');
        expect(ya).equals('YA');

        const ld = getInitials('Lo_Dash_0815');
        expect(ld).equals('LD');

        const ra = getInitials('Random');
        expect(ra).equals('RA');
    });
});

describe('isRelativeUrl', () => {
  it('should return true for relative URLs', () => {
    expect(isRelativeUrl('/path/to/file')).toBe(true);
    expect(isRelativeUrl('./path/to/file')).toBe(true);
    expect(isRelativeUrl('../path/to/file')).toBe(true);
  });

  it('should return false for absolute URLs', () => {
    expect(isRelativeUrl('http://example.com')).toBe(false);
    expect(isRelativeUrl('https://example.com')).toBe(false);
    expect(isRelativeUrl('data:image/png;base64,iVBORw0KGg...')).toBe(false);
  });

  it('should return false for null or undefined values', () => {
    expect(isRelativeUrl(null)).toBe(false);
    expect(isRelativeUrl(undefined)).toBe(false);
  });
});

describe('normalizePath', () => {
  it('should remove duplicate slashes and trim the path', () => {
    expect(normalizePath('/path//with///duplicate///slashes')).toBe('/path/with/duplicate/slashes');
    expect(normalizePath('  /path/with/slashes  ')).toBe('/path/with/slashes');
    expect(normalizePath('')).toBe('');
    expect(normalizePath('   ')).toBe('');
    expect(normalizePath(' / ')).toBe('/'); // empty string after trim
    expect(normalizePath(' /path/with/slashes/ ')).toBe('/path/with/slashes/'); // trailing slash
    expect(normalizePath(' /path/with/slashes/ ')).toBe('/path/with/slashes/'); // leading and trailing slash
  });

  it('should return the original path if it is already normalized', () => {
    expect(normalizePath('/path/with/slashes')).toBe('/path/with/slashes');
    expect(normalizePath('path/with/slashes')).toBe('path/with/slashes');
    expect(normalizePath('/path/with/slashes/')).toBe('/path/with/slashes/');
  });

  it('should return undefined if the path undefined', () => {
    expect(normalizePath(undefined)).toBeUndefined();
  });
});