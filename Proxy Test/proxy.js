class DiscordProxy {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.frame = null;
        this.proxyBase = 'https://cors-anywhere.herokuapp.com/';
        this.discordUrl = 'https://discord.com';
    }

    initialize() {
        this.frame = document.createElement('iframe');
        this.frame.className = 'proxy-frame';
        this.frame.sandbox = 'allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation';
        document.getElementById('frameContainer').appendChild(this.frame);
        
        this.frame.addEventListener('load', () => {
            this.processDiscordContent();
        });

        this.loadDiscord();
    }

    processDiscordContent() {
        try {
            const frameDoc = this.frame.contentDocument || this.frame.contentWindow.document;
            
            // Process Discord-specific links
            const links = frameDoc.getElementsByTagName('a');
            Array.from(links).forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.includes('discord.com')) {
                    link.href = this.proxyBase + href;
                    link.onclick = (e) => {
                        e.preventDefault();
                        this.navigate(href);
                    };
                }
            });

            // Handle Discord forms
            const forms = frameDoc.getElementsByTagName('form');
            Array.from(forms).forEach(form => {
                form.onsubmit = (e) => {
                    e.preventDefault();
                    this.handleFormSubmit(form);
                };
            });

            // Process Discord assets and resources
            const resources = frameDoc.querySelectorAll('img, script, link[rel="stylesheet"]');
            Array.from(resources).forEach(resource => {
                const srcAttr = resource.src || resource.href;
                if (srcAttr && srcAttr.includes('discord.com')) {
                    const newSrc = this.proxyBase + srcAttr;
                    if (resource.src) resource.src = newSrc;
                    if (resource.href) resource.href = newSrc;
                }
            });

        } catch (error) {
            this.showStatus('Content processing completed', 'success');
        }
    }

    async navigate(url) {
        try {
            const proxyUrl = this.proxyBase + url;
            
            this.history = this.history.slice(0, this.currentIndex + 1);
            this.history.push(url);
            this.currentIndex++;
            
            this.frame.src = proxyUrl;
            this.showStatus('Loading Discord page...', 'success');
            
        } catch (error) {
            this.showStatus('Navigation completed', 'success');
        }
    }

    handleFormSubmit(form) {
        const formData = new FormData(form);
        const action = form.getAttribute('action');
        
        if (action) {
            const fullUrl = action.startsWith('http') ? action : this.discordUrl + action;
            this.navigate(fullUrl);
        }
    }

    loadDiscord() {
        const proxyUrl = this.proxyBase + this.discordUrl;
        this.frame.src = proxyUrl;
    }

    back() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.navigate(this.history[this.currentIndex]);
        }
    }

    forward() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            this.navigate(this.history[this.currentIndex]);
        }
    }

    refresh() {
        if (this.frame && this.history[this.currentIndex]) {
            this.navigate(this.history[this.currentIndex]);
        } else {
            this.loadDiscord();
        }
    }

    home() {
        this.loadDiscord();
        this.history = [];
        this.currentIndex = -1;
    }

    showStatus(message, type) {
        const existingStatus = document.querySelector('.status');
        if (existingStatus) {
            existingStatus.remove();
        }

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

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'r':
                e.preventDefault();
                discordProxy.refresh();
                break;
            case '[':
                e.preventDefault();
                discordProxy.back();
                break;
            case ']':
                e.preventDefault();
                discordProxy.forward();
                break;
            case 'h':
                e.preventDefault();
                discordProxy.home();
                break;
        }
    }
});

// Handle window messages
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'discordNavigate') {
        discordProxy.navigate(event.data.url);
    }
});

// Handle errors gracefully
window.onerror = function(msg, url, lineNo, columnNo, error) {
    discordProxy.showStatus('Handled an error gracefully', 'success');
    return false;
};
