import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' })); // Allow your frontend
app.use(express.json()); // Parse JSON request bodies

// Sample GET Endpoint
app.get('/api/services', (req, res) => {
    res.json([
        { id: 1, title: 'Motion Design & 3D', icon: '✨' },
        { id: 2, title: 'Web Development', icon: '💻' },
        { id: 3, title: 'Brand Identity', icon: '🔮' }
    ]);
});

// Sample POST Endpoint (e.g., contact form)
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    console.log('Received submission:', { name, email, message });
    res.status(201).json({ success: true, message: 'Message received!' });
});

app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
});
