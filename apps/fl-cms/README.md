<a name="readme-top"></a>

# 🔥 Firelighter CMS 🔥

A lean CMS for [Firebase](https://firebase.google.com/) simular to [FireCMS](https://app.firecms.co).

# Getting Started

## Prerequisites

You should install [nodejs](https://nodejs.org) and [pnpm](https://pnpm.io). I'd recommend [Visual Studio Code](https://code.visualstudio.com) for developing.

You need some Firebase project to work with and the corresponding Firebase config in JSON format like this:

```js
const firebaseConfig = {
    apiKey: 'AIzaSy...DGo4k',
    authDomain: 'myapp-project-123.firebaseapp.com',
    databaseURL: 'https://myapp-project-123.firebaseio.com',
    projectId: 'myapp-project-123',
    storageBucket: 'myapp-project-123.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:ec2e...94d0',
    measurementId: 'G-12345'
};
```

## Installation

_Below is an example of how you can instruct your audience on installing and setting up your app. This template doesn't rely on any external dependencies or services._

1. Clone the repo
    ```sh
    git clone https://github.com/ortwic/firelighter-cms.git
    ```
2. Install NPM packages
    ```sh
    pnpm install
    ```
3. Start app in debug mode
    ```js
    pnpm dev
    ```

## Testing

_If you'd like to debug tests, start the **JavaScript Debug Terminal** and execute `pnpm test:debug`._

<p align="right">(<a href="#readme-top">back to top</a>)</p>

# Contributing

Really? This project is very small yet. Contact me if you really desire...

<p align="right">(<a href="#readme-top">back to top</a>)</p>
