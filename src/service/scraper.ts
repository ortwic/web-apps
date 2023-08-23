import axios, { AxiosResponse } from 'axios';
import { load } from 'cheerio';

interface PageConfig<T> {
    url: string;
    selector: string;
    toObject: (text: string) => T;
}

interface Logger {    
    clear(): void;
    debug(message?: any, ...optionalParams: any[]): void;
    error(message?: any, ...optionalParams: any[]): void;
    info(message?: any, ...optionalParams: any[]): void;
    log(message?: any, ...optionalParams: any[]): void;
    trace(message?: any, ...optionalParams: any[]): void;
    warn(message?: any, ...optionalParams: any[]): void;
    table(tabularData: any, properties?: ReadonlyArray<string>): void;
}

export async function scrapePages<T>(cfg: PageConfig<T>, logger: Logger = console): Promise<T[]> {
    async function loadPage(): Promise<AxiosResponse> {
        logger.info(`processing ${cfg.url}`);

        return await axios.get(cfg.url)
            .catch((reason) => {
                logger.error(`failed to get ${cfg.url}: ${reason}`);
                return { statusText: reason } as AxiosResponse;
            });
    }

    async function parsePage(data: string): Promise<T[]> {
        const $html = load(data);
        const values = $html(cfg.selector)
            .map(async (_, element) => cfg.toObject($html(element).text()))
            .get();
        return Promise.all(values);
    }

    const response = await loadPage();
    return response.data ? parsePage(response.data) : [];
}
