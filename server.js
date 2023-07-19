const express = require('express');
const app = express();

const ttsApi = require('./routes/tts');

//middleware
app.use(express.json());

//routes
app.use('/tts', ttsApi);

app.listen(4000, '0.0.0.0', () => {
    console.log('server open');
});