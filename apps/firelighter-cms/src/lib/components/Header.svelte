<header>
    <nav>
        <svg viewBox="0 0 2 3" aria-hidden="true">
            <path d="M0,0 L1,2 C1.5,3 1.5,3 2,3 L2,0 Z" />
        </svg>
        <div class="menu-content">
            <slot />
        </div>
        <svg viewBox="0 0 2 3" aria-hidden="true">
            <path d="M0,0 L0,3 C0.5,3 0.5,3 1,2 L2,0 Z" />
        </svg>
    </nav>
</header>

<style>
    header {
        text-align: center;
    }

    nav {
        display: flex;
        justify-content: center;
        --background: var(--color-bg-0);
    }

    .menu-content {
        height: 3em;
        background: var(--background);
        background-size: contain;
    }

    svg {
        width: 2em;
        height: 3em;
        display: block;
    }

    path {
        fill: var(--background);
    }
</style>
