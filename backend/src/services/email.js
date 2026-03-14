const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOrderConfirmation(user, order, items) {
  const itemRows = items.map(item => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #333;">${item.product.name}</td>
      <td style="padding:8px;border-bottom:1px solid #333;text-align:center;">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #333;text-align:right;">GHS ${parseFloat(item.unit_price).toFixed(2)}</td>
      <td style="padding:8px;border-bottom:1px solid #333;text-align:right;">GHS ${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</td>
    </tr>`).join('');

  await transporter.sendMail({
    from: `"CraftConnect" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: `Order Confirmation #${order.id.slice(0, 8).toUpperCase()}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1A1A25;color:#fff;padding:32px;border-radius:8px;">
        <h1 style="color:#D4A017;margin-bottom:4px;">CraftConnect</h1>
        <p style="color:#aaa;margin-top:0;">Authentic Ghanaian Crafts</p>
        <hr style="border-color:#333;"/>
        <h2>Order Confirmed! 🎉</h2>
        <p>Hi ${user.first_name || user.email}, your order has been placed successfully.</p>
        <p><strong>Receipt #:</strong> ${order.id.slice(0, 8).toUpperCase()}</p>
        <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
        <p><strong>Payment Method:</strong> ${order.payment_method}</p>
        <p><strong>Shipping to:</strong> ${order.shipping_address}${order.shipping_city ? ', ' + order.shipping_city : ''}</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0;">
          <thead>
            <tr style="background:#D4A017;color:#000;">
              <th style="padding:8px;text-align:left;">Item</th>
              <th style="padding:8px;text-align:center;">Qty</th>
              <th style="padding:8px;text-align:right;">Unit Price</th>
              <th style="padding:8px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding:12px 8px;text-align:right;font-weight:bold;">Total Amount:</td>
              <td style="padding:12px 8px;text-align:right;font-weight:bold;color:#D4A017;">GHS ${parseFloat(order.total_amount).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        <p style="color:#aaa;font-size:0.85rem;">Thank you for supporting Ghanaian artisans! 🏺</p>
      </div>`,
  });
}

async function sendBidConfirmation(user, auction, bidAmount) {
  await transporter.sendMail({
    from: `"CraftConnect" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: `Bid Placed — ${auction.product?.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1A1A25;color:#fff;padding:32px;border-radius:8px;">
        <h1 style="color:#D4A017;margin-bottom:4px;">CraftConnect</h1>
        <p style="color:#aaa;margin-top:0;">Authentic Ghanaian Crafts</p>
        <hr style="border-color:#333;"/>
        <h2>Bid Placed Successfully! 🔨</h2>
        <p>Hi ${user.first_name || user.email}, your bid has been recorded.</p>
        <p><strong>Item:</strong> ${auction.product?.name}</p>
        <p><strong>Your Bid:</strong> <span style="color:#D4A017;font-size:1.2rem;">GHS ${parseFloat(bidAmount).toFixed(2)}</span></p>
        <p><strong>Auction Ends:</strong> ${new Date(auction.end_time).toLocaleString()}</p>
        <p style="color:#aaa;font-size:0.85rem;">You'll be notified if you're outbid. Good luck! 🍀</p>
      </div>`,
  });
}

module.exports = { sendOrderConfirmation, sendBidConfirmation };
