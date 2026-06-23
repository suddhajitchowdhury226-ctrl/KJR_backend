const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Project = require('../models/Project');
const Bid = require('../models/Bid');
const User = require('../models/User');
const Product = require('../models/Product');
const PartInquiry = require('../models/PartInquiry');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');

// --- ADMIN AUTHENTICATION ---
// @route   POST api/admin/login
// @desc    Authenticate admin & get token
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const payload = { admin: { id: 1, role: 'superadmin' } };
      jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
    } else {
      return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- ADMIN: PROJECT ROUTES ---

// @route   POST api/projects
// @desc    Create a new project (full fields)
// @access  Private
router.post('/projects', auth, async (req, res) => {
  try {
    const newProject = new Project(req.body);
    const project = await newProject.save();
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/projects
// @desc    Get all active projects (public view for bid-projects.html)
// @access  Public
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find({ status: 'active' }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/projects
// @desc    Get all projects (including closed/draft) for admin
// @access  Private
router.get('/admin/projects', auth, async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/projects/:id
// @desc    Update a project status or details
// @access  Private
router.put('/projects/:id', auth, async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    project = await Project.findByIdAndUpdate(req.params.id, { $set: req.body, updatedAt: Date.now() }, { new: true });
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/projects/:id
// @desc    Delete a project
// @access  Private
router.delete('/projects/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    await project.deleteOne();
    res.json({ msg: 'Project removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// --- CONTRACTOR BID ROUTES ---

// Multer setup — memory storage so files can be emailed as attachments
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg', 'image/png'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// @route   POST api/bids
// @desc    Submit a bid — saves to DB + sends email notification with optional file attachments
// @access  Public
router.post('/bids', upload.array('documents', 5), async (req, res) => {
  try {
    // 1. Save bid to database
    const newBid = new Bid({
      project: req.body.project,
      projectName: req.body.projectName,
      companyName: req.body.companyName,
      contactPerson: req.body.contactPerson,
      emailAddress: req.body.emailAddress,
      phone: req.body.phone,
      bidIntent: req.body.bidIntent,
      declineReason: req.body.declineReason,
      bidAmount: req.body.bidAmount ? parseFloat(req.body.bidAmount) : 0,
      comments: req.body.comments
    });
    const bid = await newBid.save();

    // 2. Send email notification
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const notifyEmails = process.env.NOTIFY_EMAILS || 'estimating@kjrid.com';
      const intentLabel = bid.bidIntent === 'yes'
        ? `YES — Will Bid${bid.bidAmount ? ' | Amount: $' + Number(bid.bidAmount).toLocaleString() : ''}`
        : `NO — Declining${bid.declineReason ? ' | Reason: ' + bid.declineReason : ''}`;

      // Build file attachments array from multer buffers
      const attachments = (req.files || []).map(f => ({
        filename: f.originalname,
        content: f.buffer,
        contentType: f.mimetype
      }));

      const mailOptions = {
        from: `"KJR Bid System" <${process.env.SMTP_USER}>`,
        to: notifyEmails,
        replyTo: bid.emailAddress,
        subject: `Bid Response: ${bid.projectName} — ${bid.companyName}`,
        attachments,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background: #cc0000; color: white; padding: 1.4rem 2rem;">
              <h2 style="margin:0; font-size:1.3rem; font-weight:800;">New Bid Response Received</h2>
              <p style="margin:0.4rem 0 0; opacity:0.8; font-size:0.88rem;">KJR Interior Designs Inc. &mdash; Bid Management System</p>
            </div>
            <div style="padding: 1.75rem 2rem; background: #fff;">

              <h3 style="color:#cc0000; font-size:0.78rem; text-transform:uppercase; letter-spacing:0.08em; margin:0 0 0.75rem; border-bottom:1px solid #eee; padding-bottom:0.5rem;">Project</h3>
              <table style="width:100%; border-collapse:collapse; margin-bottom:1.5rem; font-size:0.9rem;">
                <tr style="background:#f9f9f9;"><td style="padding:0.6rem 0.8rem; font-weight:bold; color:#555; width:38%;">Project Name</td><td style="padding:0.6rem 0.8rem;">${bid.projectName}</td></tr>
              </table>

              <h3 style="color:#cc0000; font-size:0.78rem; text-transform:uppercase; letter-spacing:0.08em; margin:0 0 0.75rem; border-bottom:1px solid #eee; padding-bottom:0.5rem;">Bidder Information</h3>
              <table style="width:100%; border-collapse:collapse; margin-bottom:1.5rem; font-size:0.9rem;">
                <tr><td style="padding:0.6rem 0.8rem; font-weight:bold; color:#555; width:38%;">Company</td><td style="padding:0.6rem 0.8rem;">${bid.companyName}</td></tr>
                <tr style="background:#f9f9f9;"><td style="padding:0.6rem 0.8rem; font-weight:bold; color:#555;">Contact</td><td style="padding:0.6rem 0.8rem;">${bid.contactPerson}</td></tr>
                <tr><td style="padding:0.6rem 0.8rem; font-weight:bold; color:#555;">Email</td><td style="padding:0.6rem 0.8rem;"><a href="mailto:${bid.emailAddress}" style="color:#cc0000;">${bid.emailAddress}</a></td></tr>
                <tr style="background:#f9f9f9;"><td style="padding:0.6rem 0.8rem; font-weight:bold; color:#555;">Phone</td><td style="padding:0.6rem 0.8rem;">${bid.phone || 'Not provided'}</td></tr>
              </table>

              <h3 style="color:#cc0000; font-size:0.78rem; text-transform:uppercase; letter-spacing:0.08em; margin:0 0 0.75rem; border-bottom:1px solid #eee; padding-bottom:0.5rem;">Bid Response</h3>
              <table style="width:100%; border-collapse:collapse; margin-bottom:1.5rem; font-size:0.9rem;">
                <tr><td style="padding:0.6rem 0.8rem; font-weight:bold; color:#555; width:38%;">Intent</td><td style="padding:0.6rem 0.8rem; font-weight:700; color:${bid.bidIntent === 'yes' ? '#15803d' : '#cc0000'};">${intentLabel}</td></tr>
                ${bid.comments ? `<tr style="background:#f9f9f9;"><td style="padding:0.6rem 0.8rem; font-weight:bold; color:#555;">Comments</td><td style="padding:0.6rem 0.8rem;">${bid.comments}</td></tr>` : ''}
                ${attachments.length > 0 ? `<tr><td style="padding:0.6rem 0.8rem; font-weight:bold; color:#555;">Attachments</td><td style="padding:0.6rem 0.8rem;">${attachments.map(a => a.filename).join(', ')}</td></tr>` : ''}
              </table>

              <div style="background:#fff8f8; border-left:4px solid #cc0000; padding:1rem; border-radius:4px;">
                <strong>Reply to this email</strong> to respond directly to: <a href="mailto:${bid.emailAddress}" style="color:#cc0000;">${bid.emailAddress}</a>
              </div>
              <p style="color:#aaa; font-size:0.78rem; margin-top:1.5rem; border-top:1px solid #eee; padding-top:0.75rem;">
                KJR Website Bid System &bull; ID: ${bid._id} &bull; ${new Date().toLocaleString()}
              </p>

            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('Bid notification email sent to:', notifyEmails);
    } catch (emailErr) {
      // Bid saved — email failure is non-fatal
      console.error('Email send failed (bid saved to DB):', emailErr.message);
    }

    res.json({ success: true, bid });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});




// @route   GET api/admin/bids
// @desc    Get ALL bids across all projects (for admin overview)
// @access  Private
router.get('/admin/bids', auth, async (req, res) => {
  try {
    const bids = await Bid.find().sort({ createdAt: -1 });
    res.json(bids);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/bids/:projectId
// @desc    Get all bids for a specific project
// @access  Private
router.get('/admin/bids/:projectId', auth, async (req, res) => {
  try {
    const bids = await Bid.find({ project: req.params.projectId }).sort({ createdAt: -1 });
    res.json(bids);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   POST api/forms
// @desc    Generic form submission route (replaces FormSubmit)
// @access  Public
router.post('/forms', upload.any(), async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const notifyEmails = process.env.NOTIFY_EMAILS || 'estimating@kjrid.com';
    const subject = req.body._subject || 'New Form Submission';

    // Build HTML body from all form fields
    let htmlBody = '<div style="font-family: Arial, sans-serif;"><h2>' + subject + '</h2><table border="1" cellpadding="10" style="border-collapse: collapse;">';
    for (const key in req.body) {
      if (!key.startsWith('_')) {
        htmlBody += '<tr><td><strong>' + key + '</strong></td><td>' + req.body[key] + '</td></tr>';
      }
    }
    htmlBody += '</table></div>';

    const attachments = (req.files || []).map(f => ({
      filename: f.originalname,
      content: f.buffer,
      contentType: f.mimetype
    }));

    const mailOptions = {
      from: `"KJR Form System" <${process.env.SMTP_USER}>`,
      to: notifyEmails,
      replyTo: req.body.Email || req.body.email || process.env.SMTP_USER,
      subject: subject,
      html: htmlBody,
      attachments
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err) {
    console.error('Form submission failed:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});


// --- USER AUTH ROUTES ---
// @route   POST api/auth/register
// @desc    Register user
router.post('/auth/register', async (req, res) => {
  const { loginType, email, username, password, phone, companyName, instructorName } = req.body;
  const VALID_TYPES = ['sales_team', 'parts', 'bids', 'property', 'grad'];
  if (!VALID_TYPES.includes(loginType)) {
    return res.status(400).json({ errors: [{ msg: 'Invalid account type selected.' }] });
  }
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ errors: [{ msg: 'An account with this email already exists.' }] });
    }
    let userByUsername = await User.findOne({ username });
    if (userByUsername) {
      return res.status(400).json({ errors: [{ msg: 'Username is already taken.' }] });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      loginType,
      email,
      username,
      password: hashedPassword,
      phone: phone || '',
      companyName: loginType !== 'grad' ? (companyName || '') : '',
      instructorName: loginType === 'grad' ? (instructorName || '') : ''
    });

    await user.save();

    const payload = { user: { id: user.id, role: loginType } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, username: user.username, email: user.email, loginType } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user
router.post('/auth/login', async (req, res) => {
  const { identifier, password, loginType } = req.body;
  const VALID_TYPES = ['sales_team', 'parts', 'bids', 'property', 'grad'];
  if (!VALID_TYPES.includes(loginType)) {
    return res.status(400).json({ errors: [{ msg: 'Invalid account type selected.' }] });
  }
  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
      loginType
    });

    if (!user) {
      return res.status(400).json({ errors: [{ msg: 'No account found for this email/username and account type.' }] });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ errors: [{ msg: 'This account is suspended or inactive. Contact support.' }] });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: 'Incorrect password. Please try again.' }] });
    }

    const payload = { user: { id: user.id, role: user.loginType } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, username: user.username, email: user.email, loginType: user.loginType } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/admin/users
// @desc    Get all registered users for admin
router.get('/admin/users', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT MANAGEMENT ROUTES
// ─────────────────────────────────────────────────────────────────────────────

const multerProd = require('multer');
const path = require('path');

// Memory storage — image stored as base64 in DB for portability
const uploadProd = multerProd({
  storage: multerProd.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|avif/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype));
  }
});

// @route   GET api/admin/products  — all products (admin)
router.get('/admin/products', auth, async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: re }, { part: re }, { brand: re }, { category: re }];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(query)
    ]);
    res.json({ products, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   GET api/products  — active products (public)
router.get('/products', async (req, res) => {
  try {
    const { search, category, brand, vertical, page = 1, limit = 48 } = req.query;
    const query = { status: 'active' };
    if (category) query.category = category;
    if (brand) query.brand = new RegExp('^' + brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
    if (vertical) query.vertical = new RegExp('^' + vertical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: re }, { part: re }, { brand: re }, { category: re }];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(query)
    ]);
    res.json({ products, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), hasMore: skip + products.length < total });
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   GET api/categories-db  — distinct categories (public)
router.get('/categories-db', async (req, res) => {
  try {
    const cats = await Product.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 }, vertical: { $first: '$vertical' } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ total: await Product.countDocuments({ status: 'active' }), categories: cats.map(c => ({ name: c._id, count: c.count, vertical: c.vertical })) });
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   POST api/admin/products  — create product
router.post('/admin/products', auth, uploadProd.single('image'), async (req, res) => {
  try {
    const { name, part, category, brand, vertical, price, was, inStock, featured, status } = req.body;
    if (!name || !category) return res.status(400).json({ error: 'Name and category are required.' });

    let imgData = req.body.img || '';
    if (req.file) {
      imgData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const product = await new Product({
      name, part: part || '', category, brand: brand || '',
      vertical: vertical || '', price: price || '', was: was || '',
      img: imgData,
      inStock: inStock !== 'false',
      featured: featured === 'true',
      status: status || 'active'
    }).save();

    res.json({ success: true, product });
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   PUT api/admin/products/:id  — update product
router.put('/admin/products/:id', auth, uploadProd.single('image'), async (req, res) => {
  try {
    const prod = await Product.findById(req.params.id);
    if (!prod) return res.status(404).json({ error: 'Product not found' });

    const fields = ['name', 'part', 'category', 'brand', 'vertical', 'price', 'was', 'status'];
    fields.forEach(f => { if (req.body[f] !== undefined) prod[f] = req.body[f]; });
    if (req.body.inStock !== undefined) prod.inStock = req.body.inStock !== 'false';
    if (req.body.featured !== undefined) prod.featured = req.body.featured === 'true';

    if (req.file) {
      prod.img = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    } else if (req.body.img !== undefined) {
      prod.img = req.body.img;
    }

    prod.updatedAt = new Date();
    await prod.save();
    res.json({ success: true, product: prod });
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   DELETE api/admin/products/:id  — delete product
router.delete('/admin/products/:id', auth, async (req, res) => {
  try {
    const prod = await Product.findById(req.params.id);
    if (!prod) return res.status(404).json({ error: 'Product not found' });
    await prod.deleteOne();
    res.json({ success: true });
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   POST api/admin/products/bulk  — bulk import JSON array
router.post('/admin/products/bulk', auth, async (req, res) => {
  try {
    const items = req.body.products;
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'products array required' });

    const docs = items.map(p => ({
      name: p.name || 'Unnamed',
      part: p.part || '',
      category: p.category || 'Uncategorized',
      brand: p.brand || '',
      vertical: p.vertical || '',
      price: p.price || '',
      was: p.was || '',
      img: p.img || '',
      inStock: p.inStock !== false,
      featured: p.featured === true,
      status: p.status || 'active'
    }));

    const result = await Product.insertMany(docs, { ordered: false });
    res.json({ success: true, inserted: result.length });
  } catch (err) { console.error(err.message); res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PART INQUIRY ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// @route   POST api/inquiries
// @desc    Submit a part inquiry from Bunji chat (public)
router.post('/inquiries', async (req, res) => {
  try {
    const { query, name, email, phone } = req.body;
    if (!query || !name || !email) {
      return res.status(400).json({ error: 'query, name and email are required.' });
    }
    const inquiry = await new PartInquiry({
      query: query.trim(),
      name: name.trim(),
      email: email.trim(),
      phone: (phone || '').trim()
    }).save();

    // Non-fatal email notification
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      await transporter.sendMail({
        from: `"KJR Parts Bot" <${process.env.SMTP_USER}>`,
        to: process.env.NOTIFY_EMAILS || 'estimating@kjrid.com',
        replyTo: email.trim(),
        subject: `New Part Inquiry — "${query.trim()}" from ${name.trim()}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
            <div style="background:#cc0000;color:#fff;padding:1.2rem 1.75rem;">
              <h2 style="margin:0;font-size:1.2rem;font-weight:800;">New Part Inquiry — Bunji Chat</h2>
            </div>
            <div style="padding:1.5rem 1.75rem;background:#fff;">
              <table style="width:100%;border-collapse:collapse;font-size:.9rem;">
                <tr style="background:#f9f9f9;"><td style="padding:.6rem .8rem;font-weight:700;color:#555;width:35%;">Part / Product</td><td style="padding:.6rem .8rem;">${inquiry.query}</td></tr>
                <tr><td style="padding:.6rem .8rem;font-weight:700;color:#555;">Customer Name</td><td style="padding:.6rem .8rem;">${inquiry.name}</td></tr>
                <tr style="background:#f9f9f9;"><td style="padding:.6rem .8rem;font-weight:700;color:#555;">Email</td><td style="padding:.6rem .8rem;"><a href="mailto:${inquiry.email}" style="color:#cc0000;">${inquiry.email}</a></td></tr>
                <tr><td style="padding:.6rem .8rem;font-weight:700;color:#555;">Phone</td><td style="padding:.6rem .8rem;">${inquiry.phone || 'Not provided'}</td></tr>
                <tr style="background:#f9f9f9;"><td style="padding:.6rem .8rem;font-weight:700;color:#555;">Date</td><td style="padding:.6rem .8rem;">${new Date().toLocaleString()}</td></tr>
              </table>
              <p style="margin-top:1.25rem;font-size:.82rem;color:#aaa;border-top:1px solid #eee;padding-top:.75rem;">
                ID: ${inquiry._id} &bull; KJR Bunji Part Inquiry System
              </p>
            </div>
          </div>`
      });
    } catch (emailErr) {
      console.warn('Part inquiry email failed (inquiry saved):', emailErr.message);
    }

    res.json({ success: true, id: inquiry._id });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/inquiries   — all inquiries (admin)
router.get('/admin/inquiries', auth, async (req, res) => {
  try {
    const inquiries = await PartInquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/inquiries/:id   — update status / notes (admin)
router.put('/admin/inquiries/:id', auth, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const inq = await PartInquiry.findById(req.params.id);
    if (!inq) return res.status(404).json({ error: 'Inquiry not found' });
    if (status) inq.status = status;
    if (adminNotes !== undefined) inq.adminNotes = adminNotes;
    inq.updatedAt = new Date();
    await inq.save();
    res.json({ success: true, inquiry: inq });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/admin/inquiries/:id   — delete inquiry (admin)
router.delete('/admin/inquiries/:id', auth, async (req, res) => {
  try {
    const inq = await PartInquiry.findById(req.params.id);
    if (!inq) return res.status(404).json({ error: 'Inquiry not found' });
    await inq.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
