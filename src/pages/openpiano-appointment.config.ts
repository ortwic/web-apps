import { Appointment } from '../model/appointment.model';

const anyDash = /\s?\p{Dash}\s?/u;
const anyMonth = [ "Jän", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez" ];
const currentYear = new Date().getFullYear();
const leading0 = (n?: number) => (n ? `${n}`.padStart(2, '0') : undefined);

const parseDate = (text: string) => {
    if (text) {
        // consider 'Sep' to be 'Sept'
        const dateMatch = text.match(`(${anyMonth.join('|')})?[t]?\\s?(\\d{2})`);
        if (dateMatch) {
            const month = dateMatch[1] ? anyMonth.indexOf(dateMatch[1]) + 1 : undefined;
            return [ 
                leading0(month), 
                dateMatch[2] 
            ];
        }
    }
    return [];
};

const parseDateSpan = (text: string) => {
    const dates = text.split(anyDash);
    const [ startMonth, startDay ] = parseDate(dates[0]);
    const [ endMonth, endDay ] = parseDate(dates[1]);
    const endYear = startMonth && endMonth && +startMonth > +endMonth 
        ? currentYear + 1 : currentYear;
    return [ 
        `${currentYear}-${startMonth}-${startDay}`, 
        `${endYear}-${endMonth || startMonth}-${endDay || startDay}`
    ];
};

const parseTimeSpan = (text: string) => {
    const timeMatch = text.match(/\b\d{2}:\d{2}-\d{2}:\d{2}\b/)?.at(0);
    const times = timeMatch?.split(anyDash) ?? ['', ''];
    return [ times[0], times[1] ];
};

const parseLocation = (text: string) => (text.match(/\b(\D+ \(\w+\) – .+?),\s/)?.at(-1));

/**
 <div class="et_pb_text_inner">
    <h4>Aug 09-10</h4>
    <p>München (D) – Karlsplatz, täglich 12:00-19:30</p>
  </div>
 <div class="et_pb_text_inner">
    <h4>Aug 31 – Sept 03</h4>
    <p>Graz (AT) – Franziskanerplatz, täglich 12:00-20:00</p>
  </div>
 */
export class OpenPianoAppointmentService {
    readonly url = 'https://openpianoforrefugees.com/standorte/#termine';
    readonly selector = 'div.et_pb_text_inner';

    toObject(text: string): Appointment {
        const [h4, p] = text.split('\n');
        if (h4 && p) {
            const [ startDate, endDate ] = parseDateSpan(h4);
            const [ startTime, endTime ] = parseTimeSpan(p);
            const location = parseLocation(p);
            
            return { startDate, endDate, startTime, endTime, location, text };
        }

        return { text } as Appointment;
    }
}