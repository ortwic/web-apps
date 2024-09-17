import { describe, it, expect } from 'vitest';
import { getInitials } from './string.helper';

describe.only('test getInitials() helper func', () => {

    it.only('should return initials', () => {
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