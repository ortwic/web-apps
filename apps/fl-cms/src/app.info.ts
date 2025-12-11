import { name, author, version, description, keywords, license, funding, homepage, bugs } from '../package.json' with { type: 'json' };

export const APP_TITLE = `${name}`;
export const APP_AUTHOR = `${author}`;
export const APP_VERSION = `${version}`;
export const APP_DESCRIPTION = `${description}`;
export const APP_KEYWORDS= `${keywords}`;
export const APP_URL = `${homepage}`;
export const APP_ISSUES = `${bugs?.url}`;
export const APP_LICENSE = `${license}`;
export const APP_FUNDING = `${funding}`;