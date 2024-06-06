const express = require('express');
const axios = require('axios');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const User = require('./models/User');
const Order = require('./models/Order'); // Import Order model
require('dotenv').config(); 
const PORT = 3000;
const app = express();

mongoose.connect('mongodb+srv://sejimonro:duncO1p75KIpwQlA@exodes.j3067c8.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB', err);
});

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || 'your_discord_client_id';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'your_discord_client_secret';

app.listen(PORT, () => {
    console.log(`App started on port ${PORT}`);
});

app.get('/auth/discord', async (req, res) => {
    const code = req.query.code;
    const params = new URLSearchParams();
    params.append('client_id', DISCORD_CLIENT_ID);
    params.append('client_secret', DISCORD_CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', "http://localhost:3000/auth/discord");

    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', params);
        const { access_token, token_type } = tokenResponse.data;

        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                authorization: `${token_type} ${access_token}`
            }
        });

        const { username, email, avatar, id: discordId } = userResponse.data;

        let user = await User.findOne({ discordId });

        if (!user) {
            user = new User({
                username,
                email,
                discordId,
                avatar
            });
            await user.save();

            const order = new Order({
                userId: user._id,
                totalOrders: 0, // default value
                pending: 0, // default value
                successful: 0, // default value
                canceled: 0 // default value
            });
            await order.save();
        }

        req.session.user = user;
        res.redirect('/dashboard');
    } catch (error) {
        console.log('Error', error);
        return res.send('Some error occurred!');
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get user data
app.get('/api/user', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.session.user._id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const { username, email, avatar, balance, accountType, verified, banned, loginDate } = user;
    const avatarUrl = `https://cdn.discordapp.com/avatars/${user.discordId}/${avatar}.png`;
    res.json({ username, email, avatarUrl, balance, accountType, verified, banned, loginDate });
});

// API endpoint to get order details
app.get('/api/orders', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const orders = await Order.findOne({ userId: req.session.user._id });
    if (!orders) {
        return res.status(404).json({ message: 'Orders not found' });
    }

    const { totalOrders, pending, successful, canceled } = orders;
    res.json({ totalOrders, pending, successful, canceled });
});

// Serve the dashboard page
app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Serve the landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
