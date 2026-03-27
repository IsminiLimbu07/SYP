import express from 'express';
import { sql } from '../config/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/payment/initiate
router.post('/initiate', authenticateToken, async (req, res) => {
  try {
    const { campaign_id, amount, donor_name } = req.body;

    if (!campaign_id || !amount || amount < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'campaign_id and amount (min Rs. 10) are required' 
      });
    }

    console.log('💳 Payment initiate:', { campaign_id, amount });

    const campaign = await sql`SELECT * FROM campaigns WHERE campaign_id = ${campaign_id}`;
    if (campaign.length === 0) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    // Create pending donation
    const donation = await sql`
      INSERT INTO campaign_donations (campaign_id, donor_id, donor_name, amount, status)
      VALUES (${campaign_id}, ${req.user.user_id}, ${donor_name || 'Anonymous'}, ${amount}, 'pending')
      RETURNING *
    `;

    const donationId = donation[0].donation_id;
    const amountInPaisa = amount * 100;

    console.log('💾 Donation created:', donationId);

    // Call Khalti
    const khaltiResponse = await fetch(`${process.env.KHALTI_BASE_URL}/epayment/initiate/`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        return_url: `https://syp-cuwh.onrender.com/api/payment/callback`,
        website_url: `https://syp-cuwh.onrender.com`,
        amount: amountInPaisa,
        purchase_order_id: `DONATION_${donationId}_${Date.now()}`,
        purchase_order_name: `Donation for ${campaign[0].patient_name}`,
        customer_info: {
          name: donor_name || req.user.full_name || 'Donor',
          email: req.user.email,
          phone: '9800000000',
        },
      }),
    });

    const khaltiData = await khaltiResponse.json();

    if (!khaltiResponse.ok || !khaltiData.pidx) {
      await sql`DELETE FROM campaign_donations WHERE donation_id = ${donationId}`;
      console.error('❌ Khalti failed:', khaltiData);
      return res.status(400).json({ 
        success: false, 
        message: khaltiData.detail || 'Khalti payment failed'
      });
    }

    // Save pidx
    await sql`
      UPDATE campaign_donations 
      SET transaction_id = ${khaltiData.pidx}
      WHERE donation_id = ${donationId}
    `;

    console.log('✅ Khalti initiated:', khaltiData.pidx);

    res.status(200).json({
      success: true,
      data: {
        pidx: khaltiData.pidx,
        payment_url: khaltiData.payment_url,
        donation_id: donationId,
      },
    });
  } catch (error) {
    console.error('❌ Initiate error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/payment/callback
router.get('/callback', async (req, res) => {
  try {
    const { pidx, status } = req.query;

    console.log('📍 Callback:', { status });

    if (status === 'Completed') {
      await sql`UPDATE campaign_donations SET status = 'completed' WHERE transaction_id = ${pidx}`;
      res.send('<h2>✅ Payment Successful!</h2><p>Close this and return to app.</p>');
    } else {
      res.send('<h2>Payment Status: ' + status + '</h2>');
    }
  } catch (error) {
    console.error('❌ Callback error:', error);
    res.send('<h2>Error</h2>');
  }
});

// POST /api/payment/verify
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { pidx } = req.body;

    if (!pidx) {
      return res.status(400).json({ success: false, message: 'pidx required' });
    }

    console.log('🔍 Verifying:', pidx);

    const khaltiResponse = await fetch(`${process.env.KHALTI_BASE_URL}/epayment/lookup/`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pidx }),
    });

    const khaltiData = await khaltiResponse.json();

    console.log('📊 Khalti status:', khaltiData.status);

    if (khaltiData.status === 'Completed') {
      const updated = await sql`
        UPDATE campaign_donations
        SET status = 'completed'
        WHERE transaction_id = ${pidx}
        RETURNING *
      `;

      console.log('✅ Verified & completed');

      return res.status(200).json({
        success: true,
        verified: true,
        data: {
          status: 'completed',
          amount: khaltiData.total_amount / 100,
          donation: updated[0],
        },
      });
    } else {
      return res.status(200).json({
        success: false,
        verified: false,
        data: { status: khaltiData.status },
      });
    }
  } catch (error) {
    console.error('❌ Verify error:', error.message);
    res.status(500).json({ success: false, verified: false, message: error.message });
  }
});

export default router;