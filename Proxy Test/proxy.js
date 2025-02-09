class DiscordProxy {
    constructor() {
        this.frame = null;
        this.proxyBase = 'https://api.allorigins.win/raw?url=';
        this.discordUrl = 'https://discord.com';
    }

    initialize() {
        this.frame = document.createElement('iframe');
        this.frame.className = 'proxy-frame';
        this.frame.sandbox = 'allow-same-origin allow-scripts allow-forms allow-popups';
        document.getElementById('frameContainer').appendChild(this.frame);
        this.loadDiscord();
    }

    loadDiscord() {
        const proxyUrl = this.proxyBase + encodeURIComponent(this.discordUrl);
        this.frame.src = proxyUrl;
    }
}

const discordProxy = new DiscordProxy();
discordProxy.initialize();
