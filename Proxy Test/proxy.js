class DiscordProxy {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.frame = null;
        this.proxyServer = 'https://raw.githubusercontent.com/Web-Games-Online/Web-Games-Online.github.io/refs/heads/main/Proxy%20Test/server.js';  // Replace with your proxy server
        this.discordBaseUrl = 'https://discord.com';
    }

    initialize() {
        this.frame = document.createElement('iframe');
        this.frame.className = 'proxy-frame';
        this.frame.sandbox = 'allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-modals';
        document.getElementById('frameContainer').appendChild(this.frame);
        
        // Navigate to Discord login by default
        this.navigate('/login');
    }

    async navigate(path) {
        if (!this.frame) this.initialize();
        
        try {
            const fullUrl = this.discordBaseUrl + path;
            const response = await fetch(this.proxyServer, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Target-URL': fullUrl
                },
                credentials: 'include'
            });

            const content = await response.text();
            
            this.history.push(path);
            this.currentIndex++;
            
            const frameDoc = this.frame.contentDocument || this.frame.contentWindow.document;
            frameDoc.open();
            frameDoc.write(this.modifyDiscordContent(content));
            frameDoc.close();
            
            this.showStatus('Discord loaded successfully', 'success');
            
        } catch (error) {
            this.showStatus('Connection error', 'error');
        }
    }

    modifyDiscordContent(content) {
        // Modify Discord's content to work through the proxy
        return content
            .replace(/discord\.com/g, window.location.host)
            .replace(/api\/v\d+/g, this.proxyServer + '/api')
            .replace(/cdn\.discordapp\.com/g, this.proxyServer + '/cdn');
    }

    showStatus(message, type) {
        const status = document.createElement('div');
        status.className = `status ${type}`;
        status.textContent = message;
        document.body.appendChild(status);
        setTimeout(() => status.remove(), 3000);
    }
}

// Initialize Discord proxy
const discordProxy = new DiscordProxy();
discordProxy.initialize();
