const { clearCookie } = require('../_lib/cookies');
const { destroySession, COOKIE_NAME } = require('../_lib/session');

module.exports = async (req, res) => {
    await destroySession(req);
    clearCookie(res, COOKIE_NAME);
    res.writeHead(302, { Location: '/staff/' });
    res.end();
};
