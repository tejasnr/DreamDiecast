import { Resend } from "resend";
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set, skipping email");
    return null;
  }
  return new Resend(apiKey);
}

// Send order confirmation to user when admin verifies payment
export const sendOrderConfirmation = internalAction({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const resend = getResend();
    if (!resend) return;

    const order = await ctx.runQuery(internal.emails.getOrderForEmail, {
      orderId: args.orderId,
    });
    if (!order) return;

    const productList = order.items
      .map((i: any) => `${i.name} x${i.quantity}`)
      .join(", ");

    await resend.emails.send({
      from: "DreamDiecast <orders@dreamdiecast.in>",
      to: order.userEmail,
      subject: `Order Confirmed — #${(args.orderId as string).slice(-8)}`,
      html: `
        <h2>Your order has been confirmed!</h2>
        <p>Hi ${order.shippingDetails?.name || "there"},</p>
        <p>Your payment has been verified and your order is being processed.</p>
        <p><strong>Order ID:</strong> #${(args.orderId as string).slice(-8)}</p>
        <p><strong>Items:</strong> ${productList}</p>
        <p><strong>Total:</strong> ₹${order.totalAmount.toLocaleString()}</p>
        <br/>
        <p>Questions? Reach us on <a href="https://wa.me/919148724708">WhatsApp</a>.</p>
        <p>— DreamDiecast</p>
      `,
    });
  },
});

// Send pre-order confirmation to user when admin verifies deposit
export const sendPreOrderConfirmation = internalAction({
  args: { preOrderId: v.id("preOrders") },
  handler: async (ctx, args) => {
    const resend = getResend();
    if (!resend) return;

    const po = await ctx.runQuery(internal.emails.getPreOrderForEmail, {
      preOrderId: args.preOrderId,
    });
    if (!po || !po.email) return;

    await resend.emails.send({
      from: "DreamDiecast <orders@dreamdiecast.in>",
      to: po.email,
      subject: `Pre-Order Confirmed — ${po.productName}`,
      html: `
        <h2>Your pre-order has been confirmed!</h2>
        <p>Hi ${po.customerName},</p>
        <p>Your deposit for <strong>${po.productName}</strong> has been verified.</p>
        <p>We'll notify you as soon as the product arrives in stock.</p>
        <br/>
        <p>Questions? Reach us on <a href="https://wa.me/919148724708">WhatsApp</a>.</p>
        <p>— DreamDiecast</p>
      `,
    });
  },
});

// Send arrival notification to user when admin triggers it
export const sendPreOrderArrival = internalAction({
  args: { preOrderId: v.id("preOrders") },
  handler: async (ctx, args) => {
    const resend = getResend();
    if (!resend) return;

    const po = await ctx.runQuery(internal.emails.getPreOrderForEmail, {
      preOrderId: args.preOrderId,
    });
    if (!po || !po.email) return;

    const totalPrice = po.totalPrice ?? 0;
    const depositPaid = po.depositPaid ?? 0;
    const balanceDue = totalPrice - depositPaid + 100; // +100 shipping

    await resend.emails.send({
      from: "DreamDiecast <orders@dreamdiecast.in>",
      to: po.email,
      subject: `Your ${po.productName} Has Arrived! Pay Balance to Ship`,
      html: `
        <h2>Great news — your pre-order has arrived!</h2>
        <p>Hi ${po.customerName},</p>
        <p>Your <strong>${po.productName}</strong> is now in stock and ready to ship.</p>
        <p><strong>Balance Due:</strong> ₹${balanceDue.toLocaleString()} (includes ₹100 shipping)</p>
        <br/>
        <p><a href="https://dreamdiecast.in/garage/pre-orders" style="background:#F97316;color:white;padding:12px 24px;text-decoration:none;font-weight:bold;display:inline-block;">Pay Balance Now</a></p>
        <br/>
        <p>Questions? Reach us on <a href="https://wa.me/919148724708">WhatsApp</a>.</p>
        <p>— DreamDiecast</p>
      `,
    });
  },
});

// Send balance request emails to all pending customers for a product
export const sendBalanceRequestEmail = action({
  args: { workosUserId: v.string(), productId: v.id("products") },
  handler: async (ctx, args) => {
    await ctx.runQuery(internal._utils.validateAdmin, {
      workosUserId: args.workosUserId,
    });
    const resend = getResend();

    const product = await ctx.runQuery(internal.emails.getProductForEmail, {
      productId: args.productId,
    });
    if (!product) throw new Error("Product not found");

    const preOrders = await ctx.runQuery(
      internal.emails.getBalancePendingPreOrders,
      { productId: args.productId }
    );

    let emailsSent = 0;
    let skipped = 0;
    let totalBalanceRequested = 0;

    for (const po of preOrders) {
      if (!po.email) {
        skipped++;
        continue;
      }

      const totalPrice = po.totalPrice;
      const depositPaid = po.depositPaid;
      const shipping = 100;
      const balanceDue = totalPrice - depositPaid + shipping;
      totalBalanceRequested += balanceDue;

      const paymentLink = `https://dreamdiecast.in/pay/${po._id}`;

      if (resend) {
        await resend.emails.send({
          from: "DreamDiecast <orders@dreamdiecast.in>",
          replyTo: "diecastrs1@gmail.com",
          to: po.email,
          subject: `Pay ₹${balanceDue.toLocaleString("en-IN")} to ship your ${product.name}`,
          html: buildBalanceRequestHTML({
            customerName: po.customerName,
            productName: product.name,
            totalPrice,
            depositPaid,
            shippingCharges: shipping,
            balanceDue,
            paymentLink,
          }),
        });
      }
      emailsSent++;
    }

    // Mark balanceRequestsSent on the product
    await ctx.runMutation(internal.emails.markBalanceRequestsSent, {
      productId: args.productId,
    });

    return { emailsSent, skipped, totalBalanceRequested };
  },
});

function buildBalanceRequestHTML(data: {
  customerName: string;
  productName: string;
  totalPrice: number;
  depositPaid: number;
  shippingCharges: number;
  balanceDue: number;
  paymentLink: string;
}): string {
  const fmt = (n: number) => n.toLocaleString("en-IN");
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="margin: 0 0 16px;">Pay ₹${fmt(data.balanceDue)} to ship your ${data.productName}</h2>
      <p>Hi ${data.customerName},</p>
      <p>Your <strong>${data.productName}</strong> has arrived and is ready to ship!</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-family: monospace; font-size: 14px;">
        <tr><td style="padding: 6px 0;">Total Price</td><td style="padding: 6px 0; text-align: right;">₹${fmt(data.totalPrice)}</td></tr>
        <tr><td style="padding: 6px 0;">Deposit Paid</td><td style="padding: 6px 0; text-align: right; color: #16a34a;">− ₹${fmt(data.depositPaid)}</td></tr>
        <tr><td style="padding: 6px 0;">Shipping</td><td style="padding: 6px 0; text-align: right;">₹${fmt(data.shippingCharges)}</td></tr>
        <tr style="border-top: 2px solid #ddd;"><td style="padding: 8px 0; font-weight: bold;">Balance Due</td><td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 16px;">₹${fmt(data.balanceDue)}</td></tr>
      </table>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${data.paymentLink}" style="background: #F97316; color: white; padding: 14px 32px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 14px;">Pay ₹${fmt(data.balanceDue)} →</a>
      </div>
      <p style="font-size: 12px; color: #888;">This link is unique to your order. Please do not share it.</p>
      <p style="margin-top: 24px;">Questions? Reach us on <a href="https://wa.me/919148724708">WhatsApp</a>.</p>
      <p>— DreamDiecast</p>
    </div>
  `;
}

// Internal queries used by the email actions above
import { internalMutation, internalQuery } from "./_generated/server";

export const getOrderForEmail = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orderId);
  },
});

export const getPreOrderForEmail = internalQuery({
  args: { preOrderId: v.id("preOrders") },
  handler: async (ctx, args) => {
    const po = await ctx.db.get(args.preOrderId);
    if (!po) return null;

    // Try to get email from user record if not on PO directly
    let email = po.customerEmail;
    if (!email && po.userId) {
      const user = await ctx.db.get(po.userId);
      email = user?.email;
    }

    return {
      customerName: po.customerName || po.name || "Customer",
      productName: po.productName || po.name || "Product",
      email,
      totalPrice: po.totalPrice ?? po.price ?? 0,
      depositPaid: po.depositPaid ?? po.depositAmount ?? 0,
    };
  },
});

export const getProductForEmail = internalQuery({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;
    return { name: product.name, brand: product.brand, scale: product.scale };
  },
});

export const getBalancePendingPreOrders = internalQuery({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const allPOs = await ctx.db
      .query("preOrders")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .collect();

    const eligible = allPOs.filter(
      (po) =>
        (po.status === "stock_arrived" || po.status === "deposit_verified") &&
        po.balancePaymentStatus !== "verified"
    );

    const results = [];
    for (const po of eligible) {
      let email = po.customerEmail;
      if (!email && po.userId) {
        const user = await ctx.db.get(po.userId);
        email = user?.email;
      }
      results.push({
        _id: po._id,
        customerName: po.customerName || po.name || "Customer",
        email,
        totalPrice: po.totalPrice ?? po.price ?? 0,
        depositPaid: po.depositPaid ?? po.depositAmount ?? 0,
      });
    }
    return results;
  },
});

export const markBalanceRequestsSent = internalMutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.productId, { balanceRequestsSent: true });
  },
});
