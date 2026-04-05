const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Project = require('../models/Project');
const Bid = require('../models/Bid');
const User = require('../models/User');
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
      project:       req.body.project,
      projectName:   req.body.projectName,
      companyName:   req.body.companyName,
      contactPerson: req.body.contactPerson,
      emailAddress:  req.body.emailAddress,
      phone:         req.body.phone,
      bidIntent:     req.body.bidIntent,
      declineReason: req.body.declineReason,
      bidAmount:     req.body.bidAmount ? parseFloat(req.body.bidAmount) : 0,
      comments:      req.body.comments
    });
    const bid = await newBid.save();

    // 2. Send email notification
    try {
      const transporter = nodemailer.createTransport({
        host:   process.env.SMTP_HOST || 'smtp.gmail.com',
        port:   parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const notifyEmails = process.env.NOTIFY_EMAILS || 'estimating@kjrid.com';
      const intentLabel  = bid.bidIntent === 'yes'
        ? `YES — Will Bid${bid.bidAmount ? ' | Amount: $' + Number(bid.bidAmount).toLocaleString() : ''}`
        : `NO — Declining${bid.declineReason ? ' | Reason: ' + bid.declineReason : ''}`;

      // Build file attachments array from multer buffers
      const attachments = (req.files || []).map(f => ({
        filename:    f.originalname,
        content:     f.buffer,
        contentType: f.mimetype
      }));

      const mailOptions = {
        from:        `"KJR Bid System" <${process.env.SMTP_USER}>`,
        to:          notifyEmails,
        replyTo:     bid.emailAddress,
        subject:     `Bid Response: ${bid.projectName} — ${bid.companyName}`,
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
      host:   process.env.SMTP_HOST || 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT) || 587,
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
      filename:    f.originalname,
      content:     f.buffer,
      contentType: f.mimetype
    }));

    const mailOptions = {
      from:        `"KJR Form System" <${process.env.SMTP_USER}>`,
      to:          notifyEmails,
      replyTo:     req.body.Email || req.body.email || process.env.SMTP_USER,
      subject:     subject,
      html:        htmlBody,
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
// @desc    Register user (Sales or Grad)
router.post('/auth/register', async (req, res) => {
  const { loginType, email, username, password, companyName, instructorName } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    user = new User({
      loginType,
      email,
      username,
      password: hashedPassword,
      companyName: loginType === 'sales' ? companyName : '',
      instructorName: loginType === 'grad' ? instructorName : ''
    });
    
    await user.save();
    
    const payload = { user: { id: user.id, role: loginType } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, username: user.username, email: user.email, loginType }});
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user (Sales/Grad)
router.post('/auth/login', async (req, res) => {
  const { identifier, password, loginType } = req.body;
  try {
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { username: identifier }],
      loginType 
    });
    
    if (!user) {
      return res.status(400).json({ errors: [{ msg: 'Invalid Credentials for this account type' }] });
    }
    
    if (user.status !== 'active') {
      return res.status(403).json({ errors: [{ msg: 'Account is suspended or inactive' }] });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
    }
    
    const payload = { user: { id: user.id, role: user.loginType } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, username: user.username, email: user.email, loginType: user.loginType }});
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

module.exports = router;
