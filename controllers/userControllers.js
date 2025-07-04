const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { User } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');


// Carga los productos desde el archivo JSON
const dataPath = path.join(__dirname, '../data/users.json');

// Función para cargar los usuarios desde el archivo JSON
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
// Guarda los productos en el archivo JSON
const saveUsers = (users) => {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error al guardar users.json:', error);
    }
};

// Controlador de usuarios
let userController = {
    // Función para mostrar la lista de usuarios para el administrador
    adminList: async (req, res) => {
        const users = await User.findAll({
            order: [['id', 'DESC']],
            attributes: ['id', 'first_name', 'last_name', 'email', 'category', 'status',
                'birthdate', 'phone', 'profile_picture', 'created_at', 'updated_at'],
        });
        return res.render('users/adminUserList', {
            title: 'Administrar Usuarios',
            users
        });

    },
    // Función para mostrar el formulario de registro
    register: (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('users/register', {
                errors: errors.mapped(),
                oldData: req.body
            });
        }
        return res.render('users/register', {
            title: 'registro',
            error: null,
            oldData: {}
        });
    },

    // Función para registrar un nuevo usuario
    userRegister: async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('users/register', {
                title: 'Registro',
                errors: errors.mapped(),
                oldData: req.body
            });
        }

        try {
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
                agreeprivacy
            } = req.body;

            // Encriptar contraseña
            const hashedPassword = await bcrypt.hash(password, 10);

            // Crear usuario
            await User.create({
                first_name,
                last_name,
                email: email.toLowerCase(),
                password: hashedPassword,
                category: category || 'User',
                gender,
                status: status || 'active',
                birthdate: birthdate || null,
                phone: phone || null,
                agreeprivacy: agreeprivacy === 'on' || agreeprivacy === true,
                profile_picture: null
            });

            req.session.successMessage = 'Usuario registrado exitosamente';
            return res.redirect('/users/login');

        } catch (error) {
            console.error('❌ Error al registrar usuario:', error);
            return res.render('users/register', {
                title: 'registro',
                error: 'Error interno del servidor. Intenta nuevamente.',
                oldData: req.body
            });
        }
    },

    // Función para mostrar el formulario de login
    login: (req, res) => {
        return res.render('users/login', {
            title: 'Login',
            errors: {},
            oldData: {}
        });
    },
    // Función para manejar el login de un usuario
    userLogin: async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('users/login', {
                title: 'Login',
                errors: 'Credenciales inválidas',
                oldData: req.body
            });
        }

        const { email, password } = req.body;

        try {
            const user = await User.findOne({ where: { email } });

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.render('users/login', {
                    title: 'Login',
                    errors: {
                        email: { msg: 'Credenciales inválidas' }
                    },
                    oldData: req.body
                });
            }

            if (user.status !== 'active') {
                return res.render('users/login', {
                    title: 'Login',
                    errors: {
                        email: { msg: 'Cuenta inactiva. Contacta al administrador.' }
                    },
                    oldData: req.body
                });
            }

            req.session.user = {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                category: user.category
            };

            user.updated_at = new Date().toISOString();

            req.session.save((err) => {
                if (err) {
                    return res.render('users/login', {
                        title: 'Login',
                        errors: { general: { msg: 'Error al iniciar sesión' } },
                        oldData: req.body
                    });
                }

                return res.redirect('/users/profile');
            });

        } catch (error) {
            console.error('Error en login:', error);
            return res.render('users/login', {
                title: 'Login',
                errors: { general: { msg: 'Error interno del servidor' } },
                oldData: req.body
            });
        }
    },
    // Función para mostrar el perfil del usuario
    profile: async (req, res) => {
        if (!req.session?.user) {
            return res.redirect('/users/login');
        }

        const user = await User.findByPk(req.session.user.id);

        if (!user) {
            req.session.destroy();
            return res.redirect('/users/login');
        }

        function formatDate(date) {
            if (!date) return null;
            return new Date(date).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }

        const userData = {
            ...user.toJSON(),
            createdAtFormatted: formatDate(user.createdAt),   // <-- CAMBIO aquí
            updatedAtFormatted: formatDate(user.updatedAt),   // <-- Y aquí
            birthdateFormatted: formatDate(user.birthdate)
        };

        console.log('Datos del usuario:', userData);

        res.render('users/profile', {
            title: 'Perfil de Usuario',
            user: userData
        });
    },
    // Función para editar el perfil de un usuario
    profileEdit: async (req, res) => {
        const id = req.params.id;
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).send('Usuario no encontrado');
        }

        res.render('users/edit', {
            title: 'Editar Perfil',
            user
        });
    },
    // Función para editar el perfil de un usuario
    userProfile: async (req, res) => {
        const id = req.params.id;


        const user = await User.findByPk(id);

        if (user === -1) {
            return res.status(404).send('Usuario no encontrado');
        }

        if (req.file) {
            user.profile_picture = req.file.filename; // SOLO la imagen subida
        }


        // Actualizar campos editables
        user.first_name = req.body.first_name || user.first_name;
        user.last_name = req.body.last_name || user.last_name;
        user.email = req.body.email || user.email;
        user.gender = req.body.gender || user.gender;
        user.phone = req.body.phone || user.phone;
        user.birthdate = req.body.birthdate || user.birthdate;
        user.updated_at = new Date().toISOString();

        await user.save();

        // Actualizar también la sesión si corresponde
        if (req.session?.user && req.session.user.id === user.id) {
            req.session.user = {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                profile_picture: user.profile_picture
            };
        }
        req.session.save(() => {
            res.redirect('/users/profile');
        });

    },
    // Función para ver el perfil de un usuario específico
    profileView: async (req, res) => {
        const id = req.params.id;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).send('Usuario no encontrado');
        }

        res.render('users/profile', { user });
    },
    // Función para cambiar contraseña
    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword, confirmNewPassword } = req.body;
            const userId = req.session?.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Usuario no autenticado' });
            }

            if (!currentPassword || !newPassword || !confirmNewPassword) {
                return res.status(400).json({ error: 'Todos los campos son obligatorios' });
            }

            if (newPassword !== confirmNewPassword) {
                return res.status(400).json({ error: 'Las contraseñas nuevas no coinciden' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
            }

            const user = await User.findByPk(userId);

            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            // Verificar contraseña actual
            const currentPasswordMatch = await bcrypt.compare(currentPassword, user.password);
            if (!currentPasswordMatch) {
                return res.status(400).json({ error: 'Contraseña actual incorrecta' });
            }

            // Encriptar nueva contraseña
            const saltRounds = 10;
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

            // Actualizar contraseña
            user.password = hashedNewPassword;
            user.updated_at = new Date().toISOString();

            await user.save();

            res.redirect('/users/login');


        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    // Función para logout
    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error al cerrar sesión:', err);
                return res.redirect('/users/profile');
            }
            res.clearCookie('connect.sid'); // Nombre por defecto de la cookie de sesión
            res.redirect('/users/login');
        });
    },
    // Función para eliminar un usuario
    deleteUser: async (req, res) => {
        const id = req.params.id;
        const user = await User.findByPk(id);

        if (user === -1) {
            return res.status(404).send('User no encontrado');
        }

        await User.destroy({ where: { id } });

        return res.redirect('/users/admin');
    },
    // Mostrar Formulario de olvidar contraseña
    forgotPasswordForm: (req, res) => {
        res.render('users/forgotPassword', { error: null });
    },
    // Funcion para cambiar la contraseña (solo para el PROYECTO no IRL)
    handleForgotPasswordForm: async (req, res) => {
        const { email } = req.body;

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.render('users/forgotPassword', { error: 'Correo no encontrado' });
        }

        res.redirect(`/users/reset-password/${user.id}`);
    },
    // Formulario de nueva contraseña
    resetPasswordForm: (req, res) => {
        const { id } = req.params;
        res.render('users/resetPassword', { id, error: null });
    },
    // Procesar nueva contraseña
    resetPassword: async (req, res) => {
        const { id } = req.params;
        const { newPassword, confirmPassword } = req.body;

        if (!newPassword || !confirmPassword) {
            return res.render('users/resetPassword', { id, error: 'Todos los campos son obligatorios' });
        }

        if (newPassword !== confirmPassword) {
            return res.render('users/resetPassword', { id, error: 'Las contraseñas no coinciden' });
        }

        if (newPassword.length < 6) {
            return res.render('users/resetPassword', { id, error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).send('Usuario no encontrado');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        await user.save()

        res.redirect('/users/login');
    },
    // Listado para API (JSON)
    listApi: async (req, res) => {
        try {
            const users = await User.findAll({
                attributes: ['id', 'first_name', 'last_name', 'email'] // Sin campos sensibles
            });

            const usersList = users.map(user => ({
                id: user.id,
                name: `${user.first_name} ${user.last_name}`,
                email: user.email,
                detail: `/api/users/${user.id}`
            }));

            res.json({
                count: users.length,
                users: usersList
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener usuarios' });
        }
    },

    // Detalle para API (JSON)
    detailApi: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const user = await User.findByPk(id, {
                attributes: { exclude: ['password', 'category'] } // Excluir campos sensibles
            });

            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            // Construir nombre completo para consistencia
            const userData = user.toJSON();
            userData.name = `${userData.first_name} ${userData.last_name}`;

            // Opcional: si profile_picture es solo un nombre, concatenar URL base:
            if (userData.profile_picture && !userData.profile_picture.startsWith('http')) {
                userData.profile_picture = `${req.protocol}://${req.get('host')}/images/users/${userData.profile_picture}`;
            }

            res.json(userData);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener usuario' });
        }
    },

};

module.exports = userController;