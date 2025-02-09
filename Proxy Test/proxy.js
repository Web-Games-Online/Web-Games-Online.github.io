class ProxyHistory {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.frame = null;
        this.proxyBase = 'https://cors-anywhere.herokuapp.com/';
    }

    initialize() {
        this.frame = document.createElement('iframe');
        this.frame.className = 'proxy-frame';
        this.frame.sandbox = 'allow-same-origin allow-scripts allow-forms allow-popups';
        document.getElementById('frameContainer').appendChild(this.frame);
        
        this.frame.addEventListener('load', () => {
            try {
                this.processIframeContent();
            } catch (error) {
                this.showStatus('Error processing page content', 'error');
            }
        });
    }

    processIframeContent() {
        const frameDoc = this.frame.contentDocument || this.frame.contentWindow.document;
        
        const links = frameDoc.getElementsByTagName('a');
        for (let link of links) {
            const href = link.getAttribute('href');
            if (href) {
                if (href.startsWith('http')) {
                    link.href = this.proxyBase + href;
                } else if (href.startsWith('/')) {
                    const baseUrl = this.getCurrentBaseUrl();
                    link.href = this.proxyBase + baseUrl + href;
                }
                
                link.onclick = (e) => {
                    e.preventDefault();
                    this.navigate(link.href);
                };
            }
        }
    }

    getCurrentBaseUrl() {
        const currentUrl = this.history[this.currentIndex];
        if (!currentUrl) return '';
        const url = new URL(currentUrl.replace(this.proxyBase, ''));
        return url.origin;
    }

    async navigate(url) {
        if (!this.frame) this.initialize();
        
        try {
            const cleanUrl = url.replace(this.proxyBase, '');
            const proxyUrl = this.proxyBase + cleanUrl;
            
            this.history = this.history.slice(0, this.currentIndex + 1);
            this.history.push(proxyUrl);
            this.currentIndex++;
            
            this.frame.src = proxyUrl;
            this.showStatus('Loading website...', 'success');
            
            document.getElementById('urlInput').value = cleanUrl;
        } catch (error) {
            this.showStatus('Error loading page: ' + error.message, 'error');
        }
    }

    back() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.frame.src = this.history[this.currentIndex];
        }
    }

    forward() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            this.frame.src = this.history[this.currentIndex];
        }
    }

    refresh() {
        if (this.frame && this.history[this.currentIndex]) {
            this.frame.src = this.history[this.currentIndex];
        }
    }

    home() {
        document.getElementById('urlInput').value = '';
        if (this.frame) {
            this.frame.src = 'about:blank';
        }
    }

    showStatus(message, type) {
        const status = document.createElement('div');
        status.className = `status ${type}`;
        status.textContent = message;
        document.body.appendChild(status);
        setTimeout(() => status.remove(), 3000);
    }
}

const proxyHistory = new ProxyHistory();

function loadUrl() {
    const url = document.getElementById('urlInput').value;
    if (url) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            proxyHistory.navigate('https://' + url);
        } else {
            proxyHistory.navigate(url);
        }
    } else {
        proxyHistory.showStatus('Please enter a valid URL', 'error');
    }
}

document.getElementById('urlInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loadUrl();
    }
});
