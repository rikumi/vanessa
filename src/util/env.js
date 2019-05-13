if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
}

if (!['development', 'prebuild', 'production'].includes(process.env.NODE_ENV)) {
    console.error('Vanessa Error: NODE_ENV should be one of "development", "prebuild", "production".');
    process.exit(1);
}

module.exports = process.env.NODE_ENV;