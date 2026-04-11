import { Resend } from "resend";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

const ADMIN_NOTIFICATION_EMAILS = [
  "diecastrs1@gmail.com",
  "rakuteninsi1@gmail.com",
];

export const notifyAdminsNewOrder = internalAction({
  args: {
    orderId: v.string(),
    customerEmail: v.string(),
    totalAmount: v.number(),
    itemCount: v.number(),
    isPreOrder: v.boolean(),
    items: v.array(
      v.object({
        name: v.string(),
        price: v.number(),
        quantity: v.number(),
      })
    ),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not set, skipping email notification");
      return;
    }

    const resend = new Resend(apiKey);
    const orderType = args.isPreOrder ? "Pre-Order" : "Order";
    const itemsList = args.items
      .map((item) => `&bull; ${item.name} &times; ${item.quantity} &mdash; &#8377;${item.price}`)
      .join("<br/>");

    await resend.emails.send({
      from: "DreamDiecast <orders@dreamdiecast.in>",
      to: ADMIN_NOTIFICATION_EMAILS,
      subject: `New ${orderType} — ₹${args.totalAmount} (${args.itemCount} item${args.itemCount > 1 ? "s" : ""})`,
      html: `
        <h2>New ${orderType} Received!</h2>
        <p><strong>Customer:</strong> ${args.customerEmail}</p>
        <p><strong>Total:</strong> &#8377;${args.totalAmount.toLocaleString()}</p>
        <p><strong>Items:</strong></p>
        <p>${itemsList}</p>
        <p><strong>Order ID:</strong> ${args.orderId}</p>
        <br/>
        <p><a href="https://dreamdiecast.in/admin/orders">View in Admin Dashboard &rarr;</a></p>
      `,
    });
  },
});

export const notifyAdminsBalancePayment = internalAction({
  args: {
    preOrderId: v.string(),
    productName: v.string(),
    customerName: v.string(),
    balanceAmount: v.number(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not set, skipping email notification");
      return;
    }

    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: "DreamDiecast <orders@dreamdiecast.in>",
      to: ADMIN_NOTIFICATION_EMAILS,
      subject: `Balance Payment Submitted — ${args.productName}`,
      html: `
        <h2>Balance Payment Submitted</h2>
        <p><strong>Customer:</strong> ${args.customerName}</p>
        <p><strong>Product:</strong> ${args.productName}</p>
        <p><strong>Amount:</strong> &#8377;${args.balanceAmount.toLocaleString()}</p>
        <p><strong>Pre-Order ID:</strong> ${args.preOrderId}</p>
        <br/>
        <p><a href="https://dreamdiecast.in/admin/orders">Verify in Admin Dashboard &rarr;</a></p>
      `,
    });
  },
});
