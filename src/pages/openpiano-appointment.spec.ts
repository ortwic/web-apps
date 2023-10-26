import { describe, expect, it } from '@jest/globals';
import { OpenPianoAppointmentService } from './openpiano-appointment.config';

const service = new OpenPianoAppointmentService(new Date(2023, 8, 1));

describe('open piano module', () => {

  it('should parse appointment', () => {
    const result = service.toObject('Aug 19\nWien (AT) – Open Piano Sommerfest im lautlos.haus, 13:00-21:00');
    
    expect(result.start?.dateTime).toMatch('2023-08-19T13:00');
    expect(result.end?.dateTime).toMatch('2023-08-19T21:00');
    expect(result.location).toBe('Wien (AT) – Open Piano Sommerfest im lautlos.haus');
  });

  it('should parse appointment range', () => {
    const result = service.toObject('Aug 24-27\nKöln (D) – Schildergasse/Antoniterkirche, täglich 11:00-21:30, Achtung: am 24.08 erst ab 13Uhr!');
    
    expect(result.start?.dateTime).toMatch('2023-08-24T11:00');
    expect(result.end?.dateTime).toMatch('2023-08-27T21:30');
    expect(result.location).toBe('Köln (D) – Schildergasse/Antoniterkirche');
  });

  it('should parse appointment range over month', () => {
    const result = service.toObject('Aug 31 – Sept 03\nGraz (AT) – Franziskanerplatz, täglich 12:00-20:00');
    
    expect(result.start?.dateTime).toMatch('2023-08-31T12:00');
    expect(result.end?.dateTime).toMatch('2023-09-03T20:00');
    expect(result.location).toBe('Graz (AT) – Franziskanerplatz');
  });

  it('should parse appointment range over year', () => {
    const result = service.toObject('Dez 31 – Jän 03\nGraz (AT) – Franziskanerplatz, täglich 12:00-20:00');
    
    expect(result.start?.dateTime).toMatch('2023-12-31T12:00');
    expect(result.end?.dateTime).toMatch('2024-01-03T20:00');
    expect(result.location).toBe('Graz (AT) – Franziskanerplatz');
  });

  it('should parse appointment next year', () => {
    const result = service.toObject('Jän 19-20\nBludenz (AT) – Zimbapark, täglich 10:00-20:00');
    
    expect(result.start?.dateTime).toMatch('2024-01-19T10:00');
    expect(result.end?.dateTime).toMatch('2024-01-20T20:00');
    expect(result.location).toBe('Bludenz (AT) – Zimbapark');
  });
});