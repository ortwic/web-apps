// @firecms/core dependency tries to load *.css (@material-design-icons/font) 
// which will fail with node on server side!
export const prerender = false;
export const ssr = false;