// Function to handle successful scan
const qrCodeSuccessCallback = (decodedText, decodedResult) => {
    console.log("Scanned QR Code:", decodedText, decodedResult);
    
    // Extract the ID from the URL
    const id = extractIdFromQRCode(decodedText);

    // Make an API call to validate the ID
    if (id) {
        console.log('Extracted ID:', id);

        fetch(`http://localhost:5000/api/guests/validate/${encodeURIComponent(id)}`, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            if (data.message || data.error) {
                 // Display an alert with data.message or data.error
                 alert(data.message || `Error: ${data.error}`);
                // Display the response under the QR code reader
                document.getElementById('result-message').textContent = data.message || `Error: ${data.error}`;
                document.getElementById('result-email').textContent = data.guest ? `Email: ${data.guest.email}` : '';
                document.getElementById('result-name').textContent = data.guest ? `Name: ${data.guest.name}` : '';
                document.getElementById('result-used-status').textContent = data.guest ? `Already Used: ${data.guest.isUsed ? 'Yes' : 'No'}` : '';
                
                // Show the result section
                document.getElementById('result').style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error validating ID:', error);
            alert('Failed to validate ID.');
        });
    } else {
        alert('Invalid QR code data. Could not extract ID.');
    }
};

// Function to extract ID from the scanned QR code
function extractIdFromQRCode(decodedText) {
    try {
        // Assuming the QR code data is a URL like "http://localhost:3000/verify-qr/6735a452e19d1c0434dc8f11"
        const url = new URL(decodedText);
        const pathSegments = url.pathname.split('/');
        // Get the last segment from the URL path
        return pathSegments[pathSegments.length - 1];
    } catch (error) {
        // If the QR code content is not a valid URL, return the entire text assuming it's the ID
        return decodedText.trim();
    }
}

// Configuration for the QR scanner
const config = { fps: 10, qrbox: { width: 250, height: 250 } };

// Initialize the QR code reader
const html5QrCode = new Html5Qrcode("my-qr-reader");

// Start the scanner with the environment (back camera) preference
html5QrCode.start(
    { facingMode: "environment" },
    config,
    qrCodeSuccessCallback

).catch(err => {
    console.error('Failed to start QR scanner:', err);
});
