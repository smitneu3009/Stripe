import cors from "cors";
import express from "express";
import Stripe from "stripe";
import { v4 as uuidv4 } from "uuid";
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

// Initialize Stripe with your API key
const stripe = new Stripe(process.env.STRIPE_API_KEY);
const app = express();

// Middleware to parse JSON and handle CORS
app.use(express.json());
app.use(cors());

// Check if environment variables are loaded
console.log("Stripe API Key:", process.env.STRIPE_API_KEY);
console.log("Email User:", process.env.EMAIL_USER);
console.log("Email User:", process.env.EMAIL_PASS);
console.log("Port:", process.env.PORT || 8001);

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // or another email service
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS  // Your email password or app-specific password
    }
});

// Verify if Nodemailer is configured correctly
transporter.verify((error, success) => {
    if (error) {
        console.error("Error configuring Nodemailer:", error);
    } else {
        console.log("Nodemailer is configured and ready to send emails");
    }
});

// Simple test route
app.get("/", (req, res) => {
    res.send("This application is working");
});

// Payment route
app.post("/payment", async (req, res) => {
    const { product, token } = req.body;

    console.log("Product:", product);
    console.log("Token:", token);

    const idempotencyKey = uuidv4();

    try {
        console.log("Creating customer with email:", token.email);
        const customer = await stripe.customers.create({
            email: token.email,
            source: token.id
        });

        console.log("Customer created with ID:", customer.id);

        const charge = await stripe.charges.create({
            amount: product.price * 100, 
            currency: 'usd',
            customer: customer.id,
            receipt_email: token.email,
            description: `Purchase of ${product.name}`
        }, { idempotencyKey });

        console.log("Charge created successfully for:", product.name, "with amount:", product.price * 100);

        // Send a confirmation email with a detailed draft
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: token.email,
            subject: "Thank you for your purchase!",
            text: `Hello,\n\nMy name is Smit Patel. Thank you for your purchase of the ${product.name} service.\n\n` +
                  `Here are the details of your transaction:\n` +
                  `- Amount Charged: $${(product.price).toFixed(2)}\n` +
                  `- Service Purchased: ${product.name}\n` +
                  `- Transaction ID: ${charge.id}\n\n` +
                  `If you have any questions, feel free to reach out!\n\n` +
                  `Best regards,\nSmit Patel`
        };

        console.log("Sending confirmation email to:", token.email);
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
            } else {
                console.log("Email sent successfully: " + info.response);
            }
        });

        return res.status(200).json(charge);
    } catch (err) {
        console.error("Error during payment processing:", err);
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message
        });
    }
});

// Start the server
app.listen(process.env.PORT || 8001, () => {
    console.log(`Your application is running on ${process.env.PORT || 8001}`);
});
