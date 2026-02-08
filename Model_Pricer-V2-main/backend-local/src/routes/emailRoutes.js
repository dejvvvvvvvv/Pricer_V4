// Email API Routes
import { Router } from 'express';
import { sendEmail, getEmailLog } from '../email/emailService.js';
import { renderTemplate, listTemplates } from '../email/templateRenderer.js';

const router = Router();

// GET /api/email/templates — list available templates
router.get('/templates', (req, res) => {
  res.json({ ok: true, templates: listTemplates() });
});

// POST /api/email/preview — render template preview
router.post('/preview', (req, res) => {
  try {
    const { templateId, data } = req.body;
    const html = renderTemplate(templateId, data || {});
    res.json({ ok: true, html });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// POST /api/email/send — send a test email
router.post('/send', async (req, res) => {
  try {
    const { to, subject, templateId, data, providerConfig } = req.body;
    const result = await sendEmail({ to, subject, templateId, data, providerConfig });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/email/log — get recent email log
router.get('/log', (req, res) => {
  res.json({ ok: true, log: getEmailLog() });
});

export default router;
