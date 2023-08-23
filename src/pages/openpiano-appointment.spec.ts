import { describe, expect, it } from '@jest/globals';
import { OpenPianoAppointmentService } from './openpiano-appointment.config';

const service = new OpenPianoAppointmentService();

describe('open piano module', () => {

  it('should parse appointment', () => {
    const result = service.toObject('Aug 19\nWien (AT) – Open Piano Sommerfest im lautlos.haus, 13:00-21:00');
    
    expect(result.startDate).toBe('2023-08-19');
    expect(result.endDate).toBe('2023-08-19');
    expect(result.startTime).toBe('13:00');
    expect(result.endTime).toBe('21:00');
    expect(result.location).toBe('Wien (AT) – Open Piano Sommerfest im lautlos.haus');
  });

  it('should parse appointment range', () => {
    const result = service.toObject('Aug 24-27\nKöln (D) – Schildergasse/Antoniterkirche, täglich 11:00-21:30, Achtung: am 24.08 erst ab 13Uhr!');
    
    expect(result.startDate).toBe('2023-08-24');
    expect(result.endDate).toBe('2023-08-27');
    expect(result.startTime).toBe('11:00');
    expect(result.endTime).toBe('21:30');
    expect(result.location).toBe('Köln (D) – Schildergasse/Antoniterkirche');
  });

  it('should parse appointment range over month', () => {
    const result = service.toObject('Aug 31 – Sept 03\nGraz (AT) – Franziskanerplatz, täglich 12:00-20:00');
    
    expect(result.startDate).toBe('2023-08-31');
    expect(result.endDate).toBe('2023-09-03');
    expect(result.startTime).toBe('12:00');
    expect(result.endTime).toBe('20:00');
    expect(result.location).toBe('Graz (AT) – Franziskanerplatz');
  });

  it('should parse appointment range over year', () => {
    const result = service.toObject('Dez 31 – Jän 03\nGraz (AT) – Franziskanerplatz, täglich 12:00-20:00');
    
    expect(result.startDate).toBe('2023-12-31');
    expect(result.endDate).toBe('2024-01-03');
    expect(result.startTime).toBe('12:00');
    expect(result.endTime).toBe('20:00');
    expect(result.location).toBe('Graz (AT) – Franziskanerplatz');
  });
});