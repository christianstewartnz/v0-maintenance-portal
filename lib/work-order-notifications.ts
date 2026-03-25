export async function notifyWorkOrderCompleted(workOrder: {
  reference: string;
  id: string;
}, contractor: {
  name: string;
}): Promise<void> {
  // Placeholder for internal notification when contractor confirms a Work Order complete.
  // Wire to email delivery, Slack, or webhook in a future phase.
  console.log(
    `[Notification] Contractor ${contractor.name} has completed Work Order ${workOrder.reference}. View details.`
  );
}

export async function notifyItemCompleted(workOrderReference: string, itemTitle: string, contractorName: string): Promise<void> {
  // Placeholder for per-item completion event.
  console.log(
    `[Notification] Item "${itemTitle}" marked complete by ${contractorName} on Work Order ${workOrderReference}.`
  );
}
