// Generates docs/postman_collection.json  ->  node docs/build-postman.js
const fs = require("fs");
const J = { "Content-Type": "application/json" };
const req = (name, method, path, body, extra = {}) => ({
  name,
  event: extra.test ? [{ listen: "test", script: { type: "text/javascript", exec: extra.test } }] : undefined,
  request: {
    method,
    header: body ? [{ key: "Content-Type", value: "application/json" }] : [],
    url: { raw: `{{baseUrl}}${path}`, host: ["{{baseUrl}}"], path: path.replace(/^\//, "").split("?")[0].split("/"),
      query: path.includes("?") ? path.split("?")[1].split("&").map((kv) => ({ key: kv.split("=")[0], value: kv.split("=")[1] })) : undefined },
    body: body ? { mode: "raw", raw: JSON.stringify(body, null, 2) } : undefined,
    description: extra.desc,
  },
});
const saveToken = (v) => [`const d = pm.response.json().data; if (d && d.token) pm.collectionVariables.set("${v}", d.token);`];
const saveId = [`const d = pm.response.json().data; if (d && d._id) pm.collectionVariables.set("ticketId", d._id);`];

const collection = {
  info: { name: "Support Ticket API", schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    description: "Run in order: Auth > Tickets > Admin. Login requests store the JWT in {{userToken}} / {{adminToken}}. Create the admin first with `npm run create-admin`." },
  variable: [
    { key: "baseUrl", value: "http://localhost:5000/api" },
    { key: "userToken", value: "" }, { key: "adminToken", value: "" },
    { key: "ticketId", value: "" }, { key: "userId", value: "" }, { key: "notificationId", value: "" },
  ],
  item: [
    { name: "Health", item: [req("Health check", "GET", "/health")] },
    { name: "Auth", item: [
      req("Register", "POST", "/auth/register", { name: "Alice", email: "alice@example.com", password: "Password123" }, { test: saveToken("userToken") }),
      req("Login (user)", "POST", "/auth/login", { email: "alice@example.com", password: "Password123" }, { test: saveToken("userToken") }),
      req("Login (admin)", "POST", "/auth/login", { email: "admin@example.com", password: "ChangeThisPassword123!" }, { test: saveToken("adminToken") }),
      req("Me", "GET", "/auth/me"), req("Logout", "POST", "/auth/logout"),
    ]},
    { name: "Tickets (user token)", auth: "user", item: [
      req("Create ticket", "POST", "/tickets", { title: "Cannot log in", description: "The login page shows an error every time.", category: "Account", priority: "high" }, { test: saveId }),
      req("List my tickets (filter/search/paginate)", "GET", "/tickets?status=open&priority=high&search=login&page=1&limit=10&sortBy=createdAt&order=desc"),
      req("Get ticket", "GET", "/tickets/{{ticketId}}"),
      req("Edit ticket (only while open)", "PATCH", "/tickets/{{ticketId}}", { title: "Cannot log in on mobile" }),
      req("Delete ticket (only while open, soft delete)", "DELETE", "/tickets/{{ticketId}}"),
      req("Add comment", "POST", "/tickets/{{ticketId}}/comments", { message: "Any update on this?" }),
      req("List comments", "GET", "/tickets/{{ticketId}}/comments"),
      req("Activity log", "GET", "/tickets/{{ticketId}}/activities"),
    ]},
    { name: "Notifications (any token)", auth: "user", item: [
      req("List notifications", "GET", "/notifications?unread=true&page=1&limit=20"),
      req("Mark one read", "PATCH", "/notifications/{{notificationId}}/read"),
      req("Mark all read", "PATCH", "/notifications/read-all"),
    ]},
    { name: "Admin (admin token)", auth: "admin", item: [
      req("Dashboard stats", "GET", "/admin/dashboard"),
      req("List all tickets (filters)", "GET", "/admin/tickets?status=open&priority=high&createdBy={{userId}}&search=login&page=1&limit=10"),
      req("Ticket details + comments", "GET", "/admin/tickets/{{ticketId}}"),
      req("Update status", "PATCH", "/admin/tickets/{{ticketId}}/status", { status: "in_progress" }),
      req("Update priority", "PATCH", "/admin/tickets/{{ticketId}}/priority", { priority: "urgent" }),
      req("Assign ticket (null = unassign)", "PATCH", "/admin/tickets/{{ticketId}}/assign", { assigneeId: "<adminUserId>" }),
      req("Respond to any ticket", "POST", "/tickets/{{ticketId}}/comments", { message: "We are looking into this." }),
      req("List users", "GET", "/admin/users?search=alice&role=user"),
      req("Activate / deactivate user", "PATCH", "/admin/users/{{userId}}/status", { isActive: false }),
    ]},
  ],
};
// attach bearer auth per folder
for (const f of collection.item) {
  if (f.auth) f.auth = { type: "bearer", bearer: [{ key: "token", value: f.auth === "admin" ? "{{adminToken}}" : "{{userToken}}", type: "string" }] };
}
collection.item[1].item[3].request.auth = { type: "bearer", bearer: [{ key: "token", value: "{{userToken}}", type: "string" }] };
collection.item[1].item[4].request.auth = collection.item[1].item[3].request.auth;
fs.writeFileSync(__dirname + "/postman_collection.json", JSON.stringify(collection, null, 2));
console.log("postman_collection.json written");
