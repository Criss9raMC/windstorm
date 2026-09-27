const { getSession } = require('./_lib/session');

module.exports = async (req, res) => {
    const session = await getSession(req);

    if (!session) {
        res.status(200).json({ authenticated: false });
        return;
    }

    res.status(200).json({
        authenticated: true,
        user: {
            username: session.username,
            avatar: session.avatar,
            roleKey: session.role_key,
            roleLabel: session.role_label,
            roles: session.roles,
        },
    });
};
