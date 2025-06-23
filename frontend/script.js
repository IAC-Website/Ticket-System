let scanLock = false;

// Extract ID from decoded QR URL or raw ID
function extractIdFromQRCode(decodedText) {
    try {
        const url = new URL(decodedText);
        const pathSegments = url.pathname.split('/');
        return pathSegments[pathSegments.length - 1];
    } catch (error) {
        return decodedText.trim();
    }
}

// Handle scan success
const qrCodeSuccessCallback = (decodedText, decodedResult) => {
    if (scanLock) return;
    scanLock = true; // lock scan

    console.log("Scanned QR Code:", decodedText);

    const id = extractIdFromQRCode(decodedText);

    if (id) {
        fetch(`http://localhost:5000/api/guests/validate/${encodeURIComponent(id)}`)
            .then(response => response.json())
            .then(data => {
                // Show result
                alert(data.message || `Error: ${data.error}`);

                document.getElementById('result-message').textContent = data.message || `Error: ${data.error}`;
                document.getElementById('result-email').textContent = data.guest ? `Email: ${data.guest.email}` : '';
                document.getElementById('result-name').textContent = data.guest ? `Name: ${data.guest.name}` : '';
                document.getElementById('result-used-status').textContent = data.guest ? `Already Used: ${data.guest.isUsed ? 'Yes' : 'No'}` : '';
                document.getElementById('result').style.display = 'block';

                // Unlock scan after small delay
                setTimeout(() => {
                    scanLock = false;
                }, 3000);
            })
            .catch(error => {
                console.error('Error validating ID:', error);
                alert('Failed to validate QR code.');
                scanLock = false;
            });
    } else {
        alert('Invalid QR code data.');
        scanLock = false;
    }
};

// Start scanner
const html5QrCode = new Html5Qrcode("my-qr-reader");

const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 }
};

html5QrCode
    .start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
    .catch(err => {
        console.error("QR Scanner Error:", err);
        alert("Unable to access camera. Please check permissions.");
    });
