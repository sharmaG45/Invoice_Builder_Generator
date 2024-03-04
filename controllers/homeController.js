const User = require('../models/User')
const ProductItems = require('../models/product')
const fs = require('fs')
const pdf = require('pdf-creator-node');
const path = require('path');
const options = require('../helpers/options');
const validator = require('validator');

// General Rote

exports.indexView = (req, res) => {
    // const message = req.session.message;
    // req.session.message = null;
    res.render('layout/pages/home');
}

// Profile
exports.profileView = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.render('layout/pages/profile', { user });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).render('error', { errorMessage: 'Server Error' });
    }
}

// Dashboard
exports.dashboardView = async (req, res) => {
    try {
        // Retrieve user information from the session
        const user = await User.findById(req.session.userId);

        // Check if the user exists
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Check if the user is an admin
        if (user.role === 'admin') {
            // Render the admin dashboard view
            return res.render('layout/pages/admin/adminDashboard', { user });
        } else {
            // Render the user dashboard view
            return res.render('layout/pages/user/dashboard', { user });
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).render('error', { errorMessage: 'Server Error' });
    }
}

// User table
exports.tableView = async (req, res) => {
    try {
        let user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        if (user.role === 'admin') {
            user = await User.find({});
            res.render('layout/pages/admin/user_Details', { user });
        } else {
            user = [user];
            res.render('layout/pages/table', { user });
        }
    } catch (error) {
        console.error('Error fetching table data:', error);
        res.status(500).render('error', { errorMessage: 'Server Error' });
    }
}

// Product Table Views
exports.ProductTableView = async (req, res) => {
    try {
        let user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        let proUsers;
        if (user.role === 'user') {
            proUsers = await ProductItems.find({});
            res.render('layout/pages/product_table', { proUsers, user });
        } else {
            return res.status(403).send('Access denied'); // or handle unauthorized access appropriately
        }
    } catch (error) {
        console.error('Error fetching product table data:', error);
        res.status(500).render('error', { errorMessage: 'Server Error' });
    }
}

// Login
exports.signInViews = async (req, res) => {
    // Your code to handle sign-in view
    const message = req.session.message;
    req.session.message = null; // Clear the message from session after displaying it
    res.render('layout/pages/login', { message }); // Pass the message variable
};

exports.signInView = async (req, res) => {
    const { email, password } = req.body;
    // // Remove previous data from the database
    await ProductItems.deleteMany({});
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('layout/pages/login', { errorMessage: 'Invalid email or password' });
        }

        const isMatched = await user.comparePassword(password);
        if (!isMatched) {
            return res.status(403).json({ email: "Email and Password not matched" });
        }

        req.session.userId = user._id;
        req.session.user = user;
        req.session.save();

        let message;
        if (user.role === 'admin') {
            message = 'Welcome, Admin!';
            return res.render('layout/pages/admin/adminDashboard', { message });
        } else {
            message = 'Welcome, User!';
            return res.render('layout/pages/user/dashboard', { message });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).render('error', { errorMessage: 'Server Error' });
    }
}

// // const globalVariable=(req,res,next)=>{
// //     if(req.user){
// //         res.locals.globalVariable=req.user;
// //     }
// //     next();
// // }
// // module.exports={globalVariable}

// Logout route
exports.logoutView = async (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out', error: err.message });
        }
        const message = 'You have been successfully logged out.';
        res.render('layout/pages/login', { message });
    });
}

// Registration 
exports.signUpViews = async (req, res) => {
    // Your code to handle sign-in view
    const message = req.session.message;
    req.session.message = null; // Clear the message from session after displaying it
    res.render('layout/pages/register', { errorMessage: null });
};

exports.signUpView = async (req, res) => {
    const { name, phone, email, role, password } = req.body;

    try {
        // Validate email format
        if (!validator.isEmail(email)) {
            return res.status(400).render('layout/pages/register', { errorMessage: 'Invalid email format' });
        }

        // Validate password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).render('layout/pages/register', { errorMessage: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).render('layout/pages/register', { errorMessage: 'Email already exists' });
        }

        // If all validations pass, create a new user
        const newUser = new User({ name, phone, email, role, password });
        await newUser.save();
        req.session.userId = newUser._id;
        const message = 'Registration successful! Please log in.';
        res.render('layout/pages/login', { message: null });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).render('layout/pages/register', { errorMessage: 'Server Error' });
    }
}

// Add Items
exports.addItems = async (req, res) => {
    let user = await User.findById(req.session.userId);
    res.render('layout/pages/addItems', { req, user })
}

// Add Product
exports.addProduct = async (req, res) => {
    let user = await User.findById(req.session.userId);
    const { Company_name, Invoice_name, Unit, Quantity, Amount } = req.body;

    try {
        const product = new ProductItems({
            Company_name,
            Invoice_name,
            Unit,
            Quantity,
            Amount
        });

        await product.save();

        req.session.message = {
            type: 'success',
            message: 'Product added successfully'
        };
        res.redirect('/add', { user }); // Redirect to the addItems page after adding the product
    } catch (err) {
        console.error(err);
        req.session.message = {
            type: 'error',
            message: 'Error adding product'
        };
        res.status(500).redirect('/add'); // Redirect to the addItems page in case of an error
    }
}

// Delete user data
exports.deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            req.session.message = {
                type: 'error',
                message: "User not found"
            };
            return res.render("layout/pages/admin/user_details");
        }

        req.session.message = {
            type: 'success',
            message: "User deleted successfully!"
        };
        res.render("layout/pages/admin/user_details", { user: deletedUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Update the user data
exports.updateUser = async (req, res) => {
    try {
        const id = req.params.id;
        const updatedUser = await User.findByIdAndUpdate(id, {
            name: req.body.name,
            phone: req.body.phone,
            email: req.body.email,
        });

        if (!updatedUser) {
            req.session.message = {
                type: 'error',
                message: "User not found"
            };
            return res.redirect("/");
        }

        req.session.message = {
            type: 'success',
            message: "User updated successfully!"
        };
        res.redirect('/');
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Edit the user data
exports.editUser = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);
        if (!user) {
            req.session.message = {
                type: 'error',
                text: "User not found"
            };
            return res.redirect("/");
        }
        // Pass the message variable to the template
        const message = req.session.message;
        req.session.message = null; // Clear the message from session
        res.render('layout/pages/update', { user: user, message: message });
    } catch (error) {
        console.error(error);
        req.session.message = {
            type: 'error',
            text: "An error occurred while fetching user data"
        };
        res.redirect("/");
    }
}

// Update the Product data
exports.updateProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const updatedUser = await ProductItems.findByIdAndUpdate(id, {
            Invoice_name: req.body.Invoice_name,
            Unit: req.body.Unit,
            Quantity: req.body.Quantity,
            Amount: req.body.Amount,
        });

        if (!updatedUser) {
            req.session.message = {
                type: 'error',
                message: "User not found"
            };
            return res.redirect("/");
        }

        req.session.message = {
            type: 'success',
            message: "User updated successfully!"
        };
        res.redirect('/');
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Edit the user data
exports.editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await ProductItems.findById(id);
        if (!user) {
            req.session.message = {
                type: 'error',
                text: "User not found"
            };
            return res.redirect("/");
        }
        // Pass the message variable to the template
        const message = req.session.message;
        req.session.message = null; // Clear the message from session
        res.render('layout/pages/updateProduct', { proUser: user, message: message });
    } catch (error) {
        console.error(error);
        req.session.message = {
            type: 'error',
            text: "An error occurred while fetching user data"
        };
        res.redirect("/");
    }
}


// Generate the PDF
exports.generatePdf = async (req, res) => {
    try {
        // Assuming ProductItems is a mongoose model, you need to fetch the data from the database
        const productItems = await ProductItems.find({});
        const user = await User.findById(req.session.userId);

        // Generate a random invoice number
        const invoiceNumber = Math.floor(Math.random() * 1000000);

        const html = fs.readFileSync(path.join(__dirname, '../views/layout/pages/template.html'), 'utf-8');
        const filename = invoiceNumber + '_doc' + '.pdf';
        let array = [];

        productItems.forEach(d => {
            const prod = {
                Serial_no: null, // Serial number will be set later
                name: d.Company_name,
                invoice: invoiceNumber, // Use the randomly generated invoice number
                unit: d.Unit,
                quantity: d.Quantity,
                price: d.Amount,
                total: d.Quantity * d.Amount,
                // imgurl: d.imgurl
            }
            array.push(prod);
        });

        // Check for uniqueness of invoice number
        const invoiceNumbers = new Set();
        let isUnique = true;
        productItems.forEach(item => {
            if (invoiceNumbers.has(item.Invoice_name)) {
                isUnique = false;
                return;
            }
            invoiceNumbers.add(item.Invoice_name);
        });

        if (!isUnique) {
            throw new Error('Invoice numbers are not unique');
        }

        // Adding serial number for each product
        let serialNumber = 1;
        array.forEach(product => {
            product.Serial_no = serialNumber++;
        });

        let subtotal = 0;
        array.forEach(i => {
            subtotal += i.total
        });
        const tax = (subtotal * 20) / 100;
        const grandtotal = subtotal - tax;
        const obj = {
            prodlist: array,
            subtotal: subtotal,
            tax: tax,
            gtotal: grandtotal
        }

        const document = {
            html: html,
            data: {
                products: obj,
                InvoiceNo: invoiceNumber, // Pass invoice number to HTML template
                generatedBy: user.name // Assuming user has a name property
            },
            path: './docs/' + filename
        }
        await pdf.create(document, options); // Await the creation of the PDF

        const filepath = path.join(__dirname, '../docs', filename); // Adjust the file path

        // Set Content-Disposition header to force download
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.sendFile(filepath);
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).send("Error generating PDF");
    }
}
