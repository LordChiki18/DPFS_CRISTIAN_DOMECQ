let userController = {
    register: (req, res) => {
        return res.render('users/register', { title: 'registro' });
    },
    login : (req, res) => {
        return res.render('users/login', { title: 'login' });
    }
}

module.exports = userController;