import type { APIRoute } from "astro";
import { ZAPIER_WEBHOOK_URL } from "astro:env/server";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => { 
  const data = await request.json();

  console.log("Submitting to Zapier:", data);

  try {
    await fetch(ZAPIER_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log("Webhook submission attempted");

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Submission error:", error);

    return new Response(error, {
      status: 500,
      statusText: "Submission failed"
    });
  }
}