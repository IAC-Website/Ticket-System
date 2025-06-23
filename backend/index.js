const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const Guest = require('./models/EventGuest'); // Import the Guest model
const nodemailer = require('nodemailer');
const cors = require('cors'); // Import CORS
const app = express();
app.use(bodyParser.json());
const dotenv = require('dotenv')
dotenv.config()

// Middleware
app.use(express.json());
app.use(cors()); // Use CORS before defining your routes


// MongoDB connection
mongoose.connect(process.env.MONGODB_LINK, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB...', err));




// Configure your email transport (using a sample Gmail configuration)
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     host: 'smtp.gmail.com',
//     port: 465, // ✅ correct SSL port
//     secure: true, // true for port 465, false for 587
//     auth: {
//         user: process.env.GMAIL,           // ✅ Your Gmail address
//         pass: process.env.GMAIL_PASSWORD   // ✅ App password (NOT your Gmail login password)
//     },
//     logger: true,
//     debug: true
// });

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,        // ✅ Change to 587
    secure: false,    // ✅ Must be false for 587
    auth: {
      user: process.env.GMAIL,
      pass: process.env.GMAIL_PASSWORD
    }
  });

// Routes
app.post('/api/guests', async (req, res) => {
    const { name, email, isIacStudent, rollNo, cnic } = req.body;

    try {
        // Create a new guest first without QR code
        const newGuest = new Guest({
            name,
            email,
            isIacStudent,
            rollNo: isIacStudent ? rollNo : null,
            cnic: !isIacStudent ? cnic : null,
            isUsed: false // Initialize isUsed as false
        });

        // Save to database to get the generated ID
        await newGuest.save();

        // Generate a unique QR code using the user's ID
        const qrData = newGuest._id.toString();
        const qrCode = await QRCode.toDataURL(qrData);

        // Update the guest with the generated QR code
        newGuest.qrCode = qrCode;
        await newGuest.save();

        const mailOptions = {
            from: 'Institute for Art & Culture (IAC)',
            to: email,
            subject: 'Your Event Ticket with QR Code',
            html: `
              <div style="font-family: 'Segoe UI', Tahoma, sans-serif; background-color: #111; padding: 20px; text-align: center; color: #fff;">
                <!-- Ticket Box -->
                <div style="max-width: 400px; margin: auto; background: linear-gradient(135deg, #1f1f1f, #2c2c2c); border: 2px dashed #ff00ff; border-radius: 12px; padding: 20px; box-shadow: 0 0 20px rgba(255, 0, 255, 0.3); text-align: left;">
                  
                  <!-- Logo -->
                  <div style="text-align: center; margin-bottom: 10px;">
                    <img src="cid:logo" alt="IAC Logo" style="width: 100px; height: auto;" />
                  </div>
          
                  <!-- Title -->
                  <h2 style="text-align: center; color: #ff00ff;">🎧 BAZMORA 2025</h2>
          
                  <!-- Info -->
                  <div style="font-size: 14px; line-height: 1.7; margin-bottom: 20px;">
                    <p><strong style="color:#ccc;">Name:</strong> ${name}</p>
                    ${rollNo ? `<p><strong style="color:#ccc;">Roll No/CNIC:</strong> ${rollNo}</p>` : ''}
                    ${cnic ? `<p><strong style="color:#ccc;">CNIC:</strong> ${cnic}</p>` : ''}
                    <p><strong style="color:#ccc;">Date:</strong> 24 June 2025</p>
                    <p><strong style="color:#ccc;">Time:</strong> 6:00 PM</p>
                    <p><strong style="color:#ccc;">Venue:</strong> IAC Amphitheatre
</p>
                  </div>
          
                  <!-- QR Code -->
                  <div style="text-align: center; margin-bottom: 15px;">
                    <img src="cid:qrcode" alt="QR Code" style="width: 120px; height: 120px; border-radius: 8px; background: #fff; padding: 5px;" />
                  </div>
          
                  <!-- Ticket Number -->
                  <div style="text-align: right; font-size: 12px; color: #aaa;">
                    Ticket #: AUTO-GEN
                  </div>
                </div>
          
                <!-- ✅ Note Outside the Ticket -->
                <div style="max-width: 400px; margin: 15px auto 0; background: #222; color: #ffc; padding: 12px 20px; border-left: 4px solid #ff00ff; border-radius: 6px; font-size: 13px; text-align: left;">
                  <strong>Note:</strong> Student Card is compulsory for every students.<br />
                
                  
                </div>
          
                <!-- Footer -->
                <p style="font-size: 12px; color: #aaa; margin-top: 20px;">For support, email <a href="mailto:support@university.com" style="color: #ff00ff;">support@university.com</a>.</p>
              </div>
            `,
            attachments: [
              {
                filename: 'logo.png',
                path: 'https://iac.edu.pk/wp-content/uploads/2024/02/logo.png',
                cid: 'logo'
              },
              {
                filename: 'ticket.png',
                content: qrCode.split(',')[1],
                encoding: 'base64',
                cid: 'qrcode'
              }
            ]
          };
          
          

        // Send the email
        await transporter.sendMail(mailOptions);

        // Send response with QR code
        res.status(201).json({
            message: 'Guest created successfully and ticket sent via email',
            guest: newGuest
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to create guest or send email' });
    }
});




// API to get all guests
app.get('/api/guests', async (req, res) => {
    try {
        const guests = await Guest.find();
        res.json(guests);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/api/guests/validate/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Find the guest by ID
        const guest = await Guest.findById(id);

        if (!guest) {
            return res.status(404).json({ error: 'QR code not found' });
        }

        if (guest.isUsed) {
            return res.status(400).json({
                message: 'QR code already used',
                guest: {
                    name: guest.name,
                    email: guest.email,
                    isUsed: guest.isUsed
                }
            });
        }

        // Mark QR code as used
        guest.isUsed = true;
        await guest.save();

        // Return guest info and validation status
        res.status(200).json({
            message: 'QR code validated successfully',
            guest: {
                name: guest.name,
                email: guest.email,
                isUsed: guest.isUsed
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'QR code validation failed' });
    }
});


// Server setup
const PORT = process.env.SERVER_POST || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
