const { S3Client } = require("@aws-sdk/client-s3");
require('dotenv').config();

const s3Acc1 = new S3Client({
    region: "auto",
    endpoint: process.env.CF_ENDPOINT_ACC1,
    credentials: { accessKeyId: process.env.CF_ACCESS_KEY_ACC1, secretAccessKey: process.env.CF_SECRET_KEY_ACC1 }
});

const s3Acc3 = new S3Client({
    region: "auto",
    endpoint: process.env.CF_ENDPOINT_ACC3,
    credentials: { accessKeyId: process.env.CF_ACCESS_KEY_ACC3, secretAccessKey: process.env.CF_SECRET_KEY_ACC3 }
});

module.exports = { s3Acc1, s3Acc3 };