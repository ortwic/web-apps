import fs from 'fs'
import moment from 'moment';
import { inspect } from 'util';
import { scrapePages } from './service/scraper';
import { OpenPianoAppointmentService } from './pages/openpiano-appointment.config';

const openPianoConfig = new OpenPianoAppointmentService();

(async () => {
    try {
        const result = await scrapePages(openPianoConfig);
        const appointments = result.filter(a => a.startDate);

        fs.writeFile(`${moment().format('YYMMDD')}_openpiano.log`, inspect(appointments), (err) => console.error(err));
    } catch (error) {
        console.error(error);
    }
})();
