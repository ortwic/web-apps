import { describe, expect, it } from '@jest/globals';
import { OpenPianoAppointmentService } from './openpiano-appointment.config';

const year = new Date().getFullYear();
const service = new OpenPianoAppointmentService(new Date(year, 8, 1));

describe('open piano module', () => {

  it('should parse appointment', () => {
    const result = service.toEvent('Aug 19\nWien (AT) – Open Piano Sommerfest im lautlos.haus, 13:00-21:00');
    
    expect(result.start?.dateTime).toMatch(year + '-08-19T13:00');
    expect(result.end?.dateTime).toMatch(year + '-08-19T21:00');
    expect(result.location).toBe('Wien (AT) – Open Piano Sommerfest im lautlos.haus');
  });

  it('should parse appointment range', () => {
    const result = service.toEvent('Aug 24-27\nKöln (D) – Schildergasse/Antoniterkirche, täglich 11:00-21:30, Achtung: am 24.08 erst ab 13Uhr!');
    
    expect(result.start?.dateTime).toMatch(year + '-08-24T11:00');
    expect(result.end?.dateTime).toMatch(year + '-08-27T21:30');
    expect(result.location).toBe('Köln (D) – Schildergasse/Antoniterkirche');
  });

  it('should parse appointment range over month', () => {
    const result = service.toEvent('Aug 31 – Sept 03\nGraz (AT) – Franziskanerplatz, täglich 12:00-20:00');
    
    expect(result.start?.dateTime).toMatch(year + '-08-31T12:00');
    expect(result.end?.dateTime).toMatch(year + '-09-03T20:00');
    expect(result.location).toBe('Graz (AT) – Franziskanerplatz');
  });

  it('should parse appointment range over year', () => {
    const result = service.toEvent('Dez 31 – Jän 03\nGraz (AT) – Franziskanerplatz, täglich 12:00-20:00');
    
    expect(result.start?.dateTime).toMatch(year + '-12-31T12:00');
    expect(result.end?.dateTime).toMatch((year + 1) + '-01-03T20:00');
    expect(result.location).toBe('Graz (AT) – Franziskanerplatz');
  });

  it('should parse appointment next year', () => {
    const result = service.toEvent('Jan 19-20\nBludenz (AT) – Zimbapark, täglich 10:00-20:00');
    
    expect(result.start?.dateTime).toMatch((year + 1) + '-01-19T10:00');
    expect(result.end?.dateTime).toMatch((year + 1) + '-01-20T20:00');
    expect(result.location).toBe('Bludenz (AT) – Zimbapark');
  });
});