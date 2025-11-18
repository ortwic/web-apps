## Roadmap of features

### MVP
- [x] Init sveltekit project
- [x] Manage custom firebase configs (localstorage)
- [x] Firestore access
- [x] Manage collections in overall schema 
  - [x] Easy creation of subcollection
  - [ ] Test depth of more than two layers
- [ ] Manage properties of collections 
  - [x] Load templates
  - [x] JSON support as MVP
  - [ ] GUI for managing properties 
- [x] Edit contents
  - [x] Integration of Markdown editor
  - [x] Breadcrumb for better navigation
  - [x] Other UI-Components for better UX
- [x] Manage storage contents
- [x] Emulator support for testing
- [ ] Svelte 5 Migration
- [ ] Bugfixing and refactorings
- [ ] Maybe SvelteKit...

### Interop
- [ ] Connect with firebase and retrieve project configs
- [ ] Use custom auth claims to get access to foreign projects
  - [Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
  - [Custom Tokens](https://firebase.google.com/docs/auth/admin/create-custom-tokens)