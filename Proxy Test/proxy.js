class ProxyHistory {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.frame = null;
        this.proxyBase = 'https://cors-anywhere.herokuapp.com/';
        this.defaultHeaders = {
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': window.location.origin
        };
    }

    initialize() {
        this.frame = document.createElement('iframe');
        this.frame.className = 'proxy-frame';
        this.frame.sandbox = 'allow-same-origin allow-scripts allow-forms allow-popups allow-presentation';
        document.getElementById('frameContainer').appendChild(this.frame);
        
        this.frame.addEventListener('load', () => {
            this.processIframeContent();
        });
    }

    async processIframeContent() {
        try {
            const frameDoc = this.frame.contentDocument || this.frame.contentWindow.document;
            
            // Process all links
            const links = frameDoc.getElementsByTagName('a');
            Array.from(links).forEach(link => {
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
            });

            // Process all forms
            const forms = frameDoc.getElementsByTagName('form');
            Array.from(forms).forEach(form => {
                const action = form.getAttribute('action');
                if (action) {
                    if (action.startsWith('http')) {
                        form.action = this.proxyBase + action;
                    } else if (action.startsWith('/')) {
                        const baseUrl = this.getCurrentBaseUrl();
                        form.action = this.proxyBase + baseUrl + action;
                    }
                }
            });

            // Process all images
            const images = frameDoc.getElementsByTagName('img');
            Array.from(images).forEach(img => {
                const src = img.getAttribute('src');
                if (src && src.startsWith('http')) {
                    img.src = this.proxyBase + src;
                }
            });

        } catch (error) {
            this.showStatus('Error processing content', 'error');
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
            
            const response = await fetch(proxyUrl, {
                headers: this.defaultHeaders,
                credentials: 'omit'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const content = await response.text();
            
            this.history = this.history.slice(0, this.currentIndex + 1);
            this.history.push(proxyUrl);
            this.currentIndex++;
            
            const frameDoc = this.frame.contentDocument || this.frame.contentWindow.document;
            frameDoc.open();
            frameDoc.write(content);
            frameDoc.close();
            
            document.getElementById('urlInput').value = cleanUrl;
            this.showStatus('Website loaded successfully', 'success');
            
        } catch (error) {
            this.showStatus(`Failed to load: ${error.message}`, 'error');
        }
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
        }
    }

    home() {
        document.getElementById('urlInput').value = '';
        if (this.frame) {
            this.frame.src = 'about:blank';
            this.history = [];
            this.currentIndex = -1;
        }
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

const proxyHistory = new ProxyHistory();

function loadUrl() {
    const url = document.getElementById('urlInput').value.trim();
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

// Handle window messages
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'proxyNavigate') {
        proxyHistory.navigate(event.data.url);
    }
});
