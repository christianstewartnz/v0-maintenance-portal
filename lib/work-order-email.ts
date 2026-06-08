import type { Contractor, WorkOrder, Project, WorkOrderItem } from "./types";

interface WorkOrderEmailData {
  workOrder: WorkOrder;
  contractor: Contractor;
  project: Pick<Project, "id" | "name">;
  items: WorkOrderItem[];
  accessUrl: string;
}

interface EmailContent {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function generateWorkOrderEmail(data: WorkOrderEmailData): EmailContent {
  const { workOrder, contractor, project, items, accessUrl } = data;

  const itemLines = items
    .map((wi) => {
      const item = wi.item;
      if (!item) return `- Item ${wi.itemId}`;
      const unit = item.unit ? `Unit ${item.unit.unitNumber}` : "Unknown Unit";
      const notes = item.otherNotes ? `\n  Other Notes: ${item.otherNotes}` : "";
      return `- [${unit}] ${item.title}: ${item.description}${notes}`;
    })
    .join("\n");

  const subject = `Work Order ${workOrder.reference} - ${project.name}`;

  const text = [
    `Work Order: ${workOrder.reference}`,
    `Project: ${project.name}`,
    `Contractor: ${contractor.name}`,
    "",
    workOrder.accessNotes ? `Access Notes:\n${workOrder.accessNotes}\n` : "",
    workOrder.messageBody ? `Message:\n${workOrder.messageBody}\n` : "",
    "Items:",
    itemLines,
    "",
    `Mark items as complete: ${accessUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Work Order ${workOrder.reference}</h2>
      <p><strong>Project:</strong> ${project.name}</p>
      <p><strong>Contractor:</strong> ${contractor.name}</p>
      ${workOrder.accessNotes ? `<p><strong>Access Notes:</strong><br/>${workOrder.accessNotes}</p>` : ""}
      ${workOrder.messageBody ? `<p><strong>Message:</strong><br/>${workOrder.messageBody}</p>` : ""}
      <h3>Items</h3>
      <ul>
        ${items
          .map((wi) => {
            const item = wi.item;
            if (!item) return `<li>Item ${wi.itemId}</li>`;
            const unit = item.unit ? `Unit ${item.unit.unitNumber}` : "Unknown Unit";
            const notesHtml = item.otherNotes
              ? `<p style="margin: 4px 0 0; font-size: 13px;"><strong>Other Notes:</strong> ${item.otherNotes}</p>`
              : "";
            return `<li><strong>[${unit}]</strong> ${item.title}: ${item.description}${notesHtml}</li>`;
          })
          .join("")}
      </ul>
      <br/>
      <a href="${accessUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">Mark items as complete</a>
    </div>
  `;

  return {
    to: contractor.email,
    subject,
    html,
    text,
  };
}

export async function sendWorkOrderEmail(emailContent: EmailContent): Promise<void> {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  // TODO: update from address to your verified sending domain
  await resend.emails.send({
    from: "noreply@yourdomain.com",
    to: emailContent.to,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });
}
