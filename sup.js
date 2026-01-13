function submitTicket(event) {
    event.preventDefault();

    const ticket = {
        id: "TCK" + Date.now(),
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        contact: document.getElementById("contact").value,
        category: document.getElementById("category").value,
        priority: document.getElementById("priority").value,
        description: document.getElementById("description").value,
        date: document.getElementById("date").value,
        status: "Open"
    };

    let tickets = JSON.parse(localStorage.getItem("tickets")) || [];
    tickets.push(ticket);
    localStorage.setItem("tickets", JSON.stringify(tickets));

    document.getElementById("successMsg").innerText =
        `Ticket ${ticket.id} created successfully!`;
    document.getElementById("successMsg").style.display = "block";

    event.target.reset();
}
