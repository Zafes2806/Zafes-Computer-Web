require('./nodeCompatibility');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const config = require('../config/env');

let oAuth2Client;

function getOAuth2Client() {
    if (!config.email.isConfigured) {
        throw new Error('Cấu hình gửi email chưa đầy đủ');
    }

    if (!oAuth2Client) {
        oAuth2Client = new google.auth.OAuth2(
            config.email.clientId,
            config.email.clientSecret,
            config.email.redirectUri,
        );
        oAuth2Client.setCredentials({ refresh_token: config.email.refreshToken });
    }

    return oAuth2Client;
}

async function createEmailTransport() {
    const accessTokenResponse = await getOAuth2Client().getAccessToken();
    const accessToken = typeof accessTokenResponse === 'string'
        ? accessTokenResponse
        : accessTokenResponse?.token;

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: config.email.userEmail,
            clientId: config.email.clientId,
            clientSecret: config.email.clientSecret,
            refreshToken: config.email.refreshToken,
            accessToken,
        },
    });
}

module.exports = {
    createEmailTransport,
};
