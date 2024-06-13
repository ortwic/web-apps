
import { redirect, type Actions } from '@sveltejs/kit';

export const actions = {
	updateConfig: async ({ request, cookies }) => {
		const data = await request.formData();
		const config = `${data.get('config')}`.replace(/\s/g, '');
		cookies.set('firelighter-config', config, { path: '/' });
        
        redirect(302, '/');
	},
} satisfies Actions;