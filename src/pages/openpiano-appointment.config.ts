import { calendar_v3 as C3 } from 'googleapis';
import { date } from '../service/logger';

const anyDash = /\s?\p{Dash}\s?/u;
const anyMonth = [ "Jän", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez" ];
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
    readonly currentMonth: number;
    readonly currentYear: number;

    constructor(now = new Date()) {
        this.currentMonth = now.getMonth();
        this.currentYear = now.getFullYear();
    }

    private parseDateSpan = (text: string) => {
        const dates = text.split(anyDash);
        const [ startMonth, startDay ] = parseDate(dates[0]);
        const [ endMonth, endDay ] = parseDate(dates[1]);
        const startYear = startMonth && +startMonth < +this.currentMonth 
            ? this.currentYear + 1 : this.currentYear;
        const endYear = endMonth && +endMonth < +this.currentMonth 
            ? this.currentYear + 1 : startYear;
        return [ 
            `${startYear}-${startMonth}-${startDay}`, 
            `${endYear}-${endMonth || startMonth}-${endDay || startDay}`
        ];
    };

    toObject(text: string): C3.Schema$Event {
        const [h4, p] = text.split('\n');
        if (h4 && p) {
            const [ startDate, endDate ] = this.parseDateSpan(h4);
            const [ startTime, endTime ] = parseTimeSpan(p);
            const location = parseLocation(p) ?? '';
            
            return { 
                summary: `OpenPiano ${this.currentYear}`,
                description: `${text}\n\n${this.url}\nSync: ${date}`,
                location, 
                start: {
                    dateTime: `${startDate}T${startTime}:00`,
                    timeZone: 'Europe/Vienna'
                },
                end: {
                    dateTime: `${endDate}T${endTime}:00`,
                    timeZone: 'Europe/Vienna'
                }
            };
        }

        return {};
    }
}