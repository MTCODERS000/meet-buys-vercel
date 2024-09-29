const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'index.html'));
});

app.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'password.html'));
});

app.post('/checkPassword', (req, res) => {
    const { password } = req.body;
    if (password === 'nigga') {
        res.redirect('/uploadForm');
    } else {
        res.send('<h1>Access Denied</h1><p>Incorrect password.</p><a href="/">Go back</a>');
    }
});

app.get('/uploadForm', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'upload.html'));
});

app.post('/uploadProduct', (req, res) => {
    const { name, link, imageLink } = req.body;
    let imagePath;

    if (!name || !link) {
        return res.status(400).json({ message: 'Missing required fields (name, link)' });
    }

    if (imageLink) {
        imagePath = imageLink;
    } else if (req.body.image) {
        const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');
        imagePath = `/images/${name}.png`;

        fs.writeFile(path.join(__dirname, '../public', imagePath), imageBuffer, (err) => {
            if (err) return res.status(500).json({ message: 'Error saving image' });
        });
    } else {
        return res.status(400).json({ message: 'Please provide an image or link.' });
    }

    const newProductHTML = `
        <div class="product-item">
            <a href="${link}" target="_blank">
                <img src="${imagePath}" alt="${name}" />
                <p>${name}</p>
            </a>
        </div>
    `;

    const indexFilePath = path.join(__dirname, '../views', 'index.html');
    fs.readFile(indexFilePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Error reading index.html' });

        const insertPosition = data.lastIndexOf('</div> <!-- Close product-grid div -->');
        const updatedData = data.slice(0, insertPosition) + newProductHTML + data.slice(insertPosition);

        fs.writeFile(indexFilePath, updatedData, 'utf8', (err) => {
            if (err) return res.status(500).json({ message: 'Error updating index.html' });
            res.redirect('/');
        });
    });
});

module.exports.handler = serverless(app);
