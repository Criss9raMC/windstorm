const crypto = require('crypto');
const { setCookie } = require('../_lib/cookies');

module.exports = async (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');

    setCookie(res, 'windstorm_oauth_state', state, { maxAge: 60 * 5 });

    const redirectUri = `https://${req.headers.host}/api/auth/callback`;

    const params = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'identify guilds.members.read',
        state,
        prompt: 'consent',
    });

    res.writeHead(302, { Location: `https://discord.com/oauth2/authorize?${params.toString()}` });
    res.end();
};
