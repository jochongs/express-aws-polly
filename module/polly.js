require('dotenv').config();
const AWS = require('aws-sdk');

const Polly = new AWS.Polly({
    signatureVersionL: 'v4',
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

module.exports = Polly;