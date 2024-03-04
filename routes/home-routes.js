module.exports = app => {
    const express = require('express')
    const router = express.Router();
    const { isAuthenticated } = require('../middleware/auth.controller')
    const users = require('../controllers/homeController')

    // Public Routes
    router.get('/', users.indexView);
    router.get('/register', users.signUpViews);
    router.post('/register', users.signUpView);
    router.get('/login', users.signInViews);
    router.post('/login', users.signInView);
    router.use(isAuthenticated)

    // // Protected Routes
    router.get('/logout', users.logoutView);
    router.get('/dashboard', isAuthenticated, users.dashboardView);
    router.get('/profile', isAuthenticated, users.profileView);
    router.get('/table', isAuthenticated, users.tableView);
    router.get('/product_table', isAuthenticated, users.ProductTableView);
    router.get('/updateProduct/:id', isAuthenticated, users.editProduct);
    router.post('/updateProduct/:id', isAuthenticated, users.updateProduct);
    router.get('/update/:id', isAuthenticated, users.editUser);
    router.post('/update/:id', isAuthenticated, users.updateUser);
    router.post('/delete/:id', isAuthenticated, users.deleteUser);
    router.get('/add', isAuthenticated, users.addItems);
    router.post('/add', isAuthenticated, users.addProduct);
    router.get('/download', isAuthenticated, users.generatePdf);

    app.use("/", router)
}