const videoDownloader = {
    init() {
        this.urlInput = document.getElementById('video-url');
        this.qualitySelect = document.getElementById('quality');
        this.downloadButton = document.getElementById('download-btn');
        this.progressBar = document.querySelector('.progress-fill');
        this.progressContainer = document.querySelector('.progress');
        this.messageContainer = document.querySelector('.message-container');
        this.bindEvents();
    },

    bindEvents() {
        this.downloadButton.addEventListener('click', () => this.startDownload());
        this.urlInput.addEventListener('input', () => this.validateUrl());
    },

    validateUrl() {
        const url = this.urlInput.value;
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        const isValid = youtubeRegex.test(url);
        this.downloadButton.disabled = !isValid;
        return isValid;
    },

    async startDownload() {
        if (!this.validateUrl()) {
            this.showMessage('Please enter a valid YouTube URL', 'error');
            return;
        }

        const url = this.urlInput.value;
        const quality = this.qualitySelect.value;
        
        this.showProgress();
        
        try {
            const response = await fetch('http://localhost:3000/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, quality })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            await this.downloadFile(blob);
            this.showMessage('Download completed successfully!', 'success');

        } catch (error) {
            console.error('Download error:', error);
            this.showMessage('Download failed. Please try again.', 'error');
        } finally {
            this.hideProgress();
        }
    },

    downloadFile(blob) {
        return new Promise((resolve) => {
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `video-${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                window.URL.revokeObjectURL(downloadUrl);
                document.body.removeChild(a);
                resolve();
            }, 100);
        });
    },

    showProgress() {
        this.progressContainer.style.display = 'block';
        this.downloadButton.disabled = true;
        this.progressBar.style.width = '0%';
    },

    updateProgress(percent) {
        this.progressBar.style.width = `${percent}%`;
    },

    hideProgress() {
        this.progressContainer.style.display = 'none';
        this.downloadButton.disabled = false;
        this.progressBar.style.width = '0%';
    },

    showMessage(message, type) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;
        this.messageContainer.appendChild(messageElement);
        
        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    },

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }
};

// Initialize the downloader when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    videoDownloader.init();
});

export default videoDownloader;
