import { Resend } from "resend";
import { internalAction } from "./_generated/server";
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

// Internal queries used by the email actions above
import { internalQuery } from "./_generated/server";

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
