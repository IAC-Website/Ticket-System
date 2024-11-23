const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const Guest = require('./models/EventGuest'); // Import the Guest model
const nodemailer = require('nodemailer');
const cors = require('cors'); // Import CORS
const app = express();
app.use(bodyParser.json());

// Middleware
app.use(express.json());
app.use(cors()); // Use CORS before defining your routes

// MongoDB connection
mongoose.connect(`mongodb+srv://muhammadasadkpr:LAqmALAdgjEO9t7d@cluster0.vlqao.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB...', err));




    // Configure your email transport (using a sample Gmail configuration)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
port: 45,
secure: true, 
requireTLS: false,
logger: true,
debug: true,
    auth: {
        user: 'muhammadasadkpr@gmail.com', // Replace with your email
        pass: 'rfqlomkgktpvlsnc'   // Replace with your email password or app password
    },
    // logger: true,
});






// Routes
// app.post('/api/guests', async (req, res) => {
//     const { name, email, isIacStudent, rollNo, cnic } = req.body;

//     try {
//         // Generate a unique QR code using email and timestamp
//         const qrData = `${email}-${Date.now()}`;
//         const qrCode = await QRCode.toDataURL(qrData);

//         // Create a new guest
//         const newGuest = new Guest({
//             name,
//             email,
//             isIacStudent,
//             rollNo: isIacStudent ? rollNo : null,
//             cnic: !isIacStudent ? cnic : null,
//             qrCode
//         });

//         // Save to database
//         await newGuest.save();

//         const mailOptions = {
//             from: 'University Of Asad Akmal', // Replace with your email
//             to: email,
//             subject: 'Your Event Ticket with QR Code',
//             html: `<h1>Event Ticket</h1>
//                    <p>Dear ${name},</p>
//                    <p>Thank you for registering. Please find your ticket attached below.</p>
//                    <img src="cid:logo" alt="Logo" style="width: 400px; height: 200px;" />
//                    <img src="cid:qrcode" alt="QR Code" style="width: 200px; height: 200px;" />
//                    <p>Present this QR code at the event.</p>`,
//             attachments: [
//                 {
//                     filename: 'logo.png',
//                     path: 'https://iac.edu.pk/wp-content/uploads/2024/02/logo.png',
//                     cid: 'logo' // Use 'cid' to embed the logo image
//                 },
//                 {
//                     filename: 'ticket.png',
//                     content: qrCode.split(',')[1],
//                     encoding: 'base64',
//                     cid: 'qrcode' // Use 'cid' to embed the QR code image
//                 }
//             ]
//         };
        



//         // Send the email
//         await transporter.sendMail(mailOptions);

//         // Send response with QR code
//         res.status(201).json({
//             message: 'Guest created successfully and ticket sent via email',
//             guest: newGuest
//         });
//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).json({ error: 'Failed to create guest or send email' });
//     }
// });

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
            from: 'Institute for Art & Culture (IAC)', // Replace with your email
            to: email,
            subject: 'Your Event Ticket with QR Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
                    <div style="background-color: #0044cc; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px;">Event Ticket</h1>
                        <p style="margin: 5px 0; font-size: 16px;">Institute for Art & Culture (IAC)</p>
                    </div>
                    <div style="padding: 20px; text-align: center;">
                        <p style="font-size: 18px; color: #333;">Dear <strong>${name}</strong>,</p>
                         ${rollNo ? `<p style="font-size: 18px; color: #333;">Roll Number: <strong>${rollNo}</strong></p>` : ''}
                ${cnic ? `<p style="font-size: 18px; color: #333;">CNIC: <strong>${cnic}</strong></p>` : ''}
                        <p style="font-size: 16px; color: #555;">Thank you for registering. Below is your ticket:</p>
                        <div style="margin: 20px 0;">
                            <img src="cid:logo" alt="Logo" style="width: 300px; height: 150px; margin-bottom: 20px;" />
                            <img src="cid:qrcode" alt="QR Code" style="width: 150px; height: 150px;" />
                        </div>
                        <p style="font-size: 14px; color: #777;">Please present this ticket with the QR code at the event.</p>
                    </div>
                    <div style="background-color: #f9f9f9; padding: 10px 20px; text-align: center; border-top: 1px solid #ddd;">
                        <p style="font-size: 12px; color: #999;">For any inquiries, contact us at <a href="mailto:support@university.com" style="color: #0044cc;">support@university.com</a>.</p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: 'logo.png',
                    path: 'https://iac.edu.pk/wp-content/uploads/2024/02/logo.png',
                    cid: 'logo' // Embed the logo
                },
                {
                    filename: 'ticket.png',
                    content: qrCode.split(',')[1],
                    encoding: 'base64',
                    cid: 'qrcode' // Embed the QR code
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
