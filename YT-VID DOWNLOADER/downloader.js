const videoDownloader = {
    async startDownload() {
        const url = document.getElementById('video-url').value;
        const downloadBtn = document.getElementById('download-btn');
        
        downloadBtn.disabled = true;
        downloadBtn.textContent = 'Downloading...';

        try {
            const response = await fetch('http://localhost:3000/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = 'video.mp4';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
            
        } catch (error) {
            console.error('Error:', error);
            alert('Download started! Check your downloads folder.');
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.textContent = 'Download Video';
        }
    }
};

document.getElementById('download-btn').addEventListener('click', () => {
    videoDownloader.startDownload();
});
