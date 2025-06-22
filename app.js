var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var upload = require('./middlewares/uploadMiddleware.js');
var session = require('express-session');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var productsRouter = require('./routes/products.js');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'M;gs7:e!9(M?Qbq&v8>vQvmcT^t{jENAO|>vf#[}FwNS+jV$}SU~]Wsqi7;W/l', // poné una clave secreta larga y única
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // nombre de la cookie de sesión
  cookie: {
    maxAge: 1000 * 60 * 60 * 4, // opcional: sesión dura 4 horas
    secure: false, // IMPORTANTE: debe ser false en desarrollo
    httpOnly: true,
    sameSite: 'lax' // opcional: ayuda a prevenir ataques CSRF
  }
}));

// Justo después de configurar las sesiones
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});


app.post('/upload', upload.single('productImage'), (req, res) => {
  const imageUrl = `/images/products/${req.file.filename}`;
  // Guardar imageUrl en BD o devolverlo al cliente
  res.json({ imageUrl });
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/products', productsRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
