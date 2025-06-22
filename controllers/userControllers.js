const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

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
    adminList: (req, res) => {
        const users = loadUsers();
        return res.render('users/adminUserList', {
            title: 'Lista de Usuarios',
            users: users
        });
    },
    // Función para mostrar el formulario de registro
    register: (req, res) => {
        return res.render('users/register',
            {
                title: 'registro',
                error: null,
                oldData: {}
            });
    },
    // Función para registrar un nuevo usuario
    userRegister: async (req, res) => {
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

            // Verificar que los emails coincidan
            if (req.body.email !== req.body.confirmEmail) {
                return res.render('users/register', {
                    title: 'registro',
                    error: 'Los correos no coinciden',
                    oldData: req.body
                });
            }

            // Verificar que las contraseñas coincidan
            if (req.body.password !== req.body.confirmPassword) {
                return res.render('users/register', {
                    title: 'registro',
                    error: 'Las contraseñas no coinciden',
                    oldData: req.body
                });
            }

            // Validar longitud mínima de contraseña
            if (password.length < 6) {
                return res.render('users/register', {
                    title: 'registro',
                    error: 'La contraseña debe tener al menos 6 caracteres',
                    oldData: req.body
                });
            }

            const users = loadUsers();

            // Verificar si el email ya existe
            const existingUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());
            if (existingUser) {
                return res.render('users/register', {
                    title: 'registro',
                    error: 'El email ya está registrado',
                    oldData: req.body
                });
            }

            // Encriptar la contraseña
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const newUser = {
                id: users.length ? users[users.length - 1].id + 1 : 1,
                first_name,
                last_name,
                email: email.toLowerCase(),
                password: hashedPassword,
                category: category || 'User',
                gender,
                status: status || 'active',
                birthdate: birthdate || null,
                phone: phone || null,
                profile_picture: null,
                agreePrivacy: agreeprivacy === 'on' || agreeprivacy === true,
                created_at: createdAt || new Date().toISOString(),
                updated_at: updatedAt || new Date().toISOString()
            };

            console.log('Nuevo usuario creado:', {
                ...newUser,
                password: '[PROTECTED]'
            });

            users.push(newUser);
            saveUsers(users);

            // Opcional: Establecer mensaje de éxito en session
            req.session && (req.session.successMessage = 'Usuario registrado exitosamente');

            res.redirect('/users/login');

        } catch (error) {
            console.error('Error al registrar usuario:', error);
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
            error: null
        });
    },
    // Función para manejar el login de un usuario
    userLogin: async (req, res) => {
        try {
            const { email, password } = req.body;

            console.log('=== DEBUG LOGIN ===');
            console.log('Email recibido:', email);
            console.log('Session ID:', req.sessionID);

            if (!email || !password) {
                return res.render('users/login', {
                    title: 'Login',
                    error: 'Email y contraseña son obligatorios'
                });
            }

            const users = loadUsers();
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

            if (!user) {
                console.log('Usuario no encontrado');
                return res.render('users/login', {
                    title: 'Login',
                    error: 'Credenciales inválidas'
                });
            }

            // Verificar contraseña con bcrypt
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                console.log('Contraseña incorrecta');
                return res.render('users/login', {
                    title: 'Login',
                    error: 'Credenciales inválidas'
                });
            }

            // Verificar si el usuario está activo
            if (user.status !== 'active') {
                console.log('Usuario inactivo');
                return res.render('users/login', {
                    title: 'Login',
                    error: 'Cuenta inactiva. Contacta al administrador.'
                });
            }

            // Login exitoso - guardar en session
            console.log('Login exitoso, guardando en session...');

            // FORZAR la creación de la sesión
            req.session.user = {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                category: user.category
            };

            console.log('Session después del login:', req.session.user);

            // Actualizar última conexión
            user.updated_at = new Date().toISOString();

            // IMPORTANTE: Guardar la sesión antes de redireccionar
            req.session.save((err) => {
                if (err) {
                    console.error('Error al guardar sesión:', err);
                    return res.render('users/login', {
                        title: 'Login',
                        error: 'Error al iniciar sesión'
                    });
                }

                console.log('Sesión guardada exitosamente');
                console.log('Redireccionando...');

                // Redireccionar según el rol
                if (user.category === 'Admin') {
                    res.redirect('/users/profile');
                } else {
                    res.redirect('/users/profile');
                }
            });

        } catch (error) {
            console.error('Error en login:', error);
            return res.render('users/login', {
                title: 'Login',
                error: 'Error interno del servidor'
            });
        }
    },
    // Función para mostrar el perfil del usuario
    profile: (req, res) => {
        console.log('=== DEBUG PROFILE ===');
        console.log('Session ID:', req.sessionID);
        console.log('Session completa:', req.session);
        console.log('Session user:', req.session?.user);

        // Verificar que la sesión existe
        if (!req.session) {
            console.log('No hay sesión');
            return res.redirect('/users/login');
        }

        // Verificar que el usuario existe en la sesión
        if (!req.session.user) {
            console.log('No hay usuario en sesión');
            return res.redirect('/users/login');
        }

        const users = loadUsers();
        const fullUser = users.find(u => u.id === req.session.user.id);

        if (!fullUser) {
            console.log('Usuario no encontrado en archivo');
            req.session.destroy(); // Limpiar sesión corrupta
            return res.redirect('/users/login');
        }

        console.log('Mostrando perfil para:', fullUser.email);

        res.render('users/profile', {
            title: 'Perfil de Usuario',
            user: fullUser
        });
    },
    // Función para editar el perfil de un usuario
    profileEdit: (req, res) => {
        const id = req.params.id;
        const allUsers = loadUsers();
        const user = allUsers.find(u => String(u.id) === String(id));

        if (!user) {
            return res.status(404).send('Usuario no encontrado');
        }

        res.render('users/edit', {
            title: 'Editar Perfil',
            user
        });
    },
    // Función para editar el perfil de un usuario
    userProfile: (req, res) => {
        const id = req.params.id;

        // Validar que el usuario logueado solo acceda a su propio perfil
        if (!req.session.user || String(req.session.user.id) !== String(id)) {
            return res.status(403).send('No autorizado para editar este perfil');
        }


        const allUsers = loadUsers();
        const index = allUsers.findIndex(u => String(u.id) === String(id));

        if (index === -1) {
            return res.status(404).send('Usuario no encontrado');
        }

        const user = allUsers[index];

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

        // Guardar cambios
        saveUsers(allUsers);

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
    profileView: (req, res) => {
        const id = req.params.id;
        const users = loadUsers(); // o como estés cargando usuarios
        const user = users.find(u => u.id == id);

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

            const users = loadUsers();
            const user = users.find(u => u.id === userId);

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

            saveUsers(users);

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
    deleteUser: (req, res) => {
        const id = req.params.id;
        const allUsers = loadUsers();
        const index = allUsers.findIndex(u => String(u.id) === String(id));

        if (index === -1) {
            return res.status(404).send('User no encontrado');
        }

        allUsers.splice(index, 1);
        saveUsers(allUsers);

        return res.redirect('/users/admin');
    },
    forgotPasswordForm: (req, res) => {
        res.render('users/forgotPassword', { error: null });
    },
    handleForgotPasswordForm: (req, res) => {
        const { email } = req.body;
        const users = loadUsers();
        const user = users.find(u => u.email === email);

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

        const users = loadUsers();
        const user = users.find(u => String(u.id) === String(id));

        if (!user) {
            return res.status(404).send('Usuario no encontrado');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        saveUsers(users);

        res.redirect('/users/login');
    }
};

module.exports = userController;