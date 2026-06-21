const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Project = require('../models/Project');
const Bid = require('../models/Bid');
const User = require('../models/User');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Valid account types
const VALID_LOGIN_TYPES = ['sales_team', 'parts', 'bids', 'property', 'grad'];

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS API  (DB-driven via Product model)
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET api/products/search?q=&page=&limit=
router.get('/products/search', async (req, res) => {
  try {
    const q     = (req.query.q || '').trim();
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;
    if (!q) return res.json({ products: [], total: 0, page, pages: 0, hasMore: false });
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const query = { $or: [{ name: regex }, { part: regex }, { brand: regex }, { category: regex }, { vertical: regex }] };
    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(limit).lean(),
      Product.countDocuments(query)
    ]);
    res.json({ products, total, page, pages: Math.ceil(total / limit), hasMore: skip + products.length < total });
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   GET api/products/vertical/:vertical
router.get('/products/vertical/:vertical', async (req, res) => {
  try {
    const vertical = decodeURIComponent(req.params.vertical);
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;
    const query = { vertical: { $regex: new RegExp('^' + vertical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } };
    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(limit).lean(),
      Product.countDocuments(query)
    ]);
    res.json({ products, total, page, pages: Math.ceil(total / limit), hasMore: skip + products.length < total });
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   GET api/products/brand/:brand
router.get('/products/brand/:brand', async (req, res) => {
  try {
    const brand = decodeURIComponent(req.params.brand);
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;
    const query = { brand: { $regex: new RegExp('^' + brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } };
    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(limit).lean(),
      Product.countDocuments(query)
    ]);
    res.json({ products, total, page, pages: Math.ceil(total / limit), hasMore: skip + products.length < total });
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   GET api/products/:category
router.get('/products/:category', async (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category);
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find({ category }).skip(skip).limit(limit).lean(),
      Product.countDocuments({ category })
    ]);
    res.json({ products, total, page, pages: Math.ceil(total / limit), hasMore: skip + products.length < total });
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   GET api/categories
router.get('/categories', async (req, res) => {
  try {
    const agg = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, vertical: { $first: '$vertical' } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ total: await Product.countDocuments(), categories: agg.map(a => ({ name: a._id, count: a.count, vertical: a.vertical })) });
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN AUTHENTICATION
// ─────────────────────────────────────────────────────────────────────────────

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
  } catch (err) { console.error(err.message); res.status(500).send('Server error'); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT ROUTES
// ─────────────────────────────────────────────────────────────────────────────

router.post('/projects', auth, async (req, res) => {
  try {
    const project = await new Project(req.body).save();
    res.json(project);
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find({ status: 'active' }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

router.get('/admin/projects', auth, async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

router.put('/projects/:id', auth, async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    project = await Project.findByIdAndUpdate(req.params.id, { $set: req.body, updatedAt: Date.now() }, { new: true });
    res.json(project);
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

router.delete('/projects/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    await project.deleteOne();
    res.json({ msg: 'Project removed' });
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// ─────────────────────────────────────────────────────────────────────────────
// BID ROUTES
// ─────────────────────────────────────────────────────────────────────────────

const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg', 'image/png'
    ];
    cb(null, allowed.includes(file.mimetype));
  }
});

router.post('/bids', upload.array('documents', 5), async (req, res) => {
  try {
    const newBid = new Bid({
      project: req.body.project, projectName: req.body.projectName,
      companyName: req.body.companyName, contactPerson: req.body.contactPerson,
      emailAddress: req.body.emailAddress, phone: req.body.phone,
      bidIntent: req.body.bidIntent, declineReason: req.body.declineReason,
      bidAmount: req.body.bidAmount ? parseFloat(req.body.bidAmount) : 0,
      comments: req.body.comments
    });
    const bid = await newBid.save();

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      const notifyEmails = process.env.NOTIFY_EMAILS || 'estimating@kjrid.com';
      const intentLabel = bid.bidIntent === 'yes'
        ? `YES — Will Bid${bid.bidAmount ? ' | Amount: $' + Number(bid.bidAmount).toLocaleString() : ''}`
        : `NO — Declining${bid.declineReason ? ' | Reason: ' + bid.declineReason : ''}`;
      const attachments = (req.files || []).map(f => ({ filename: f.originalname, content: f.buffer, contentType: f.mimetype }));
      await transporter.sendMail({
        from: `"KJR Bid System" <${process.env.SMTP_USER}>`,
        to: notifyEmails, replyTo: bid.emailAddress,
        subject: `Bid Response: ${bid.projectName} — ${bid.companyName}`,
        attachments,
        html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
          <div style="background:#cc0000;color:white;padding:1.4rem 2rem;">
            <h2 style="margin:0;">New Bid Response — ${bid.projectName}</h2>
          </div>
          <div style="padding:1.75rem 2rem;">
            <p><strong>Company:</strong> ${bid.companyName}</p>
            <p><strong>Contact:</strong> ${bid.contactPerson}</p>
            <p><strong>Email:</strong> <a href="mailto:${bid.emailAddress}">${bid.emailAddress}</a></p>
            <p><strong>Phone:</strong> ${bid.phone || 'Not provided'}</p>
            <p><strong>Intent:</strong> <span style="color:${bid.bidIntent === 'yes' ? '#15803d' : '#cc0000'};font-weight:700;">${intentLabel}</span></p>
            ${bid.comments ? `<p><strong>Comments:</strong> ${bid.comments}</p>` : ''}
            <p style="color:#aaa;font-size:0.78rem;margin-top:1.5rem;">KJR Bid System &bull; ${new Date().toLocaleString()}</p>
          </div>
        </div>`
      });
      console.log('Bid email sent to:', notifyEmails);
    } catch (emailErr) {
      console.error('Bid email failed (bid saved):', emailErr.message);
    }

    res.json({ success: true, bid });
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

router.get('/admin/bids', auth, async (req, res) => {
  try {
    const bids = await Bid.find().sort({ createdAt: -1 });
    res.json(bids);
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

router.get('/admin/bids/:projectId', auth, async (req, res) => {
  try {
    const bids = await Bid.find({ project: req.params.projectId }).sort({ createdAt: -1 });
    res.json(bids);
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC FORM HANDLER
// ─────────────────────────────────────────────────────────────────────────────

router.post('/forms', upload.any(), async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    const notifyEmails = process.env.NOTIFY_EMAILS || 'estimating@kjrid.com';
    const subject = req.body._subject || 'New Form Submission';
    let htmlBody = '<div style="font-family:Arial,sans-serif;"><h2>' + subject + '</h2><table border="1" cellpadding="10" style="border-collapse:collapse;">';
    for (const key in req.body) {
      if (!key.startsWith('_')) htmlBody += '<tr><td><strong>' + key + '</strong></td><td>' + req.body[key] + '</td></tr>';
    }
    htmlBody += '</table></div>';
    const attachments = (req.files || []).map(f => ({ filename: f.originalname, content: f.buffer, contentType: f.mimetype }));
    await transporter.sendMail({
      from: `"KJR Form System" <${process.env.SMTP_USER}>`,
      to: notifyEmails,
      replyTo: req.body.Email || req.body.email || process.env.SMTP_USER,
      subject, html: htmlBody, attachments
    });
    res.json({ success: true });
  } catch (err) { console.error('Form submission failed:', err.message); res.status(500).json({ error: 'Server Error' }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// USER AUTH ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// @route   POST api/auth/register
router.post('/auth/register', async (req, res) => {
  const { loginType, email, username, password, phone, companyName, instructorName } = req.body;

  if (!VALID_LOGIN_TYPES.includes(loginType)) {
    return res.status(400).json({ errors: [{ msg: 'Invalid account type selected.' }] });
  }

  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ errors: [{ msg: 'An account with this email already exists.' }] });
    }
    if (await User.findOne({ username })) {
      return res.status(400).json({ errors: [{ msg: 'Username is already taken.' }] });
    }

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const user = await new User({
      loginType, email, username,
      password: hashedPassword,
      phone: phone || '',
      companyName:    loginType !== 'grad' ? (companyName    || '') : '',
      instructorName: loginType === 'grad' ? (instructorName || '') : ''
    }).save();

    const payload = { user: { id: user.id, role: loginType } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, username: user.username, email: user.email, loginType } });
    });
  } catch (err) { console.error(err.message); res.status(500).send('Server error'); }
});

// @route   POST api/auth/login
router.post('/auth/login', async (req, res) => {
  const { identifier, password, loginType } = req.body;

  if (!VALID_LOGIN_TYPES.includes(loginType)) {
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
      return res.status(403).json({ errors: [{ msg: 'This account is suspended or inactive. Please contact support.' }] });
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
  } catch (err) { console.error(err.message); res.status(500).send('Server error'); }
});

// @route   GET api/admin/users
router.get('/admin/users', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { console.error(err.message); res.status(500).send('Server error'); }
});

// @route   PUT api/admin/users/:id  (suspend / activate)
router.put('/admin/users/:id', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { status: req.body.status, updatedAt: Date.now() } },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) { console.error(err.message); res.status(500).send('Server error'); }
});

module.exports = router;
