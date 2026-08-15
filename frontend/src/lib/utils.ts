interface TicketData {
  eventId: string
  userId: string
  attendeeName: string
  attendeeEmail: string
  attendeePhone: string
  ticketPrice: string
}

export async function createTicket(ticketData: TicketData): Promise<string> {
  const response = await fetch('/api/tickets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ticketData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create ticket')
  }

  const data = await response.json()
  return data.ticketId
}
