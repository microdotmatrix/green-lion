export const prerender = false;

import type { APIRoute } from "astro";
import { CONTACT_EMAIL, RESEND_API_KEY } from "astro:env/server";
import { Resend } from "resend";

const resend = new Resend(RESEND_API_KEY);

interface FormData {
  sku: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  email: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = (await request.json()) as FormData;
    const { sku, name, description, quantity, unit_price, total_price, email } =
      data;

    const emailResponse = await resend.emails.send({
      from: "Green Lion <no-reply@greenlioninnovations.com>",
      to: [CONTACT_EMAIL],
      replyTo: email,
      subject: `Pricing Tool Submission - ${new Date().toLocaleDateString()}`,
      html: `
        <h2>Order Details</h2>
        <p><strong>SKU:</strong> ${sku}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Description:</strong> ${description}</p>
        <p><strong>Quantity:</strong> ${quantity}</p>
        <p><strong>Unit Price:</strong> $${unit_price.toFixed(2)}</p>
        <p><strong>Total Price:</strong> $${total_price.toFixed(2)}</p>
        <p><strong>Email:</strong> ${email}</p>
      `,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        id: emailResponse.id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};
