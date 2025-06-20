const fs = require('fs');
const path = require('path');

// Carga los productos desde el archivo JSON
const dataPath = path.join(__dirname, '../data/users.json');

const loadUsers = () => {
    try {
        let dataPath = path.join(__dirname, '../data/users.json');
        const jsonData = fs.readFileSync(dataPath, 'utf-8');
        return JSON.parse(jsonData);
    } catch (error) {
        console.error('Error al leer users.json:', error);
        return [];
    }
};

const saveUsers = (users) => {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error al guardar users.json:', error);
    }
};



let userController = {
    register: (req, res) => {
        return res.render('users/register', 
            {   title: 'registro',
                error: null,
                oldData: {}
         });
    },
    userRegister: (req, res) => {
        const {
            first_name,
            last_name,
            email,
            password,
            gender,
            category,
            status,
            birthdate,
            phone,
            agreeprivacy,
            createdAt,
            updatedAt
        } = req.body;

        // Verificación de campos obligatorios
        if (!first_name || !last_name || !email || !password || !agreeprivacy) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios',
                received_body: req.body
            });
        }

        if (req.body.email !== req.body.confirmEmail) {
            return res.render('users/register', {
                title: 'registro',
                error: 'Los correos no coinciden',
                oldData: req.body
            });
        }

        if (req.body.password !== req.body.confirmPassword) {
            return res.render('users/register', {
                title: 'registro',
                error: 'Las contraseñas no coinciden',
                oldData: req.body
            });
        }


        const users = loadUsers();

        const newUser = {
            id: users.length ? users[users.length - 1].id + 1 : 1,
            first_name,
            last_name,
            email,
            password,
            category: category || 'User',
            gender,
            status: status || 'Active',
            birthdate: birthdate || null,
            phone: phone || null,
            createdAt: createdAt || new Date().toISOString(),
            updatedAt: updatedAt || new Date().toISOString()
        };

        console.log('Nuevo usuario:', newUser);

        users.push(newUser);
        saveUsers(users); // Asegurate de que esta función guarda en `users.json`

        res.redirect('/users/login');
    },
    login: (req, res) => {
        return res.render('users/login', { title: 'login' });
    },
}

module.exports = userController;