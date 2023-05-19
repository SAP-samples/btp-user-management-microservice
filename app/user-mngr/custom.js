const appRouter = require('@sap/approuter');
const router = appRouter();

router.first.use(
    function customMiddleware(req, res, next) {
        req.headers["x-custom-host"] = process.env.TENANT_HOST;
        next();
    });

router.start();