require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const SQLiteStoreFactory = require('better-sqlite3-session-store');

const db = require('../database/connection');
const { initializeDatabase } = require('../database/init');
const apiRoutes = require('../routes/api');
const { csrfProtection } = require('../middleware/auth');
const errorHandler = require('../middleware/errorHandler');

const app = express();
const SQLiteStore = SQLiteStoreFactory(session);

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = path.resolve(__dirname, '..');

initializeDatabase();

const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 200),
    standardHeaders: true,
    legacyHeaders: false
});

app.set('trust proxy', 1);

// Use Helmet but disable strict Content Security Policy so existing
// inline event handlers in the static HTML are not blocked.
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false
}));
app.use(compression());
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(csrfProtection);

app.use(session({
    name: 'ems.sid',
    secret: process.env.SESSION_SECRET || 'change-me-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 12
    },
    store: new SQLiteStore({
        client: db,
        expired: {
            clear: true,
            intervalMs: 15 * 60 * 1000
        }
    })
}));

app.use('/uploads', express.static(path.join(ROOT_DIR, 'uploads')));
// Prevent public access to sensitive directories and files
app.use((req, res, next) => {
    const forbiddenPrefixes = [
        '/database',
        '/db',
        '/data',
        '/scripts',
        '/models',
        '/services',
        '/controllers',
        '/middleware',
        '/server',
        '/.git',
        '/.env',
        '/package.json',
        '/package-lock.json'
    ];

    for (const p of forbiddenPrefixes) {
        if (req.path === p || req.path.startsWith(p + '/') || req.path === p + '.json') {
            return res.status(404).send('Not Found');
        }
    }

    // Block direct access to dotfiles
    if (req.path.includes('/.') || req.path.startsWith('.')) {
        return res.status(404).send('Not Found');
    }

    next();
});

app.use('/api', apiRoutes);

// Serve only the public assets directory for static files. This narrows
// what is directly web-accessible while keeping `/uploads` available.
const publicDir = path.join(ROOT_DIR, 'public');
if (require('fs').existsSync(publicDir)) {
    app.use(express.static(publicDir));
} else {
    // Fallback to serving the project root but with protection middleware above
    app.use(express.static(ROOT_DIR));
}

app.get('/', (_req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
