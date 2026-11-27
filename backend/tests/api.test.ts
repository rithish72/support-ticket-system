import request from "supertest";
import { app, bearer, clearDb, eventually, makeAdmin, register, startDb } from "./helpers";

let stopDb: () => Promise<void>;
beforeAll(async () => {
  stopDb = await startDb();
});
afterAll(async () => stopDb());
beforeEach(async () => clearDb());

const validTicket = { title: "Cannot log in", description: "The login page shows an error every time.", category: "Account" };

describe("auth", () => {
  it("registers, never exposes the password, and always creates role=user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Alice", email: "ALICE@test.com", password: "Password123", role: "admin" });
    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ email: "alice@test.com", role: "user" });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
    expect(res.headers["set-cookie"]?.[0]).toMatch(/HttpOnly/i);
  });

  it("rejects duplicate emails and weak passwords", async () => {
    await register("Alice", "alice@test.com");
    expect((await register("Alice2", "alice@test.com")).res.status).toBe(409);
    const weak = await request(app).post("/api/auth/register").send({ name: "Bob", email: "b@test.com", password: "short" });
    expect(weak.status).toBe(400);
    expect(weak.body.errors.length).toBeGreaterThan(0);
  });

  it("logs in with correct credentials only, and /me works with Bearer or cookie", async () => {
    await register("Alice", "alice@test.com");
    const bad = await request(app).post("/api/auth/login").send({ email: "alice@test.com", password: "wrong-pass1" });
    expect(bad.status).toBe(401);
    const ok = await request(app).post("/api/auth/login").send({ email: "alice@test.com", password: "Password123" });
    expect(ok.status).toBe(200);
    const me = await request(app).get("/api/auth/me").set(bearer(ok.body.data.token));
    expect(me.body.data.user.email).toBe("alice@test.com");
    const viaCookie = await request(app).get("/api/auth/me").set("Cookie", ok.headers["set-cookie"]);
    expect(viaCookie.status).toBe(200);
  });

  it("blocks NoSQL-injection style payloads and unauthenticated access", async () => {
    const inj = await request(app).post("/api/auth/login").send({ email: { $gt: "" }, password: { $gt: "" } });
    expect(inj.status).toBe(400);
    expect((await request(app).get("/api/tickets")).status).toBe(401);
    expect((await request(app).get("/api/tickets").set(bearer("garbage"))).status).toBe(401);
  });
});

describe("tickets (user)", () => {
  it("creates, lists, reads, edits and soft-deletes own tickets", async () => {
    const { token } = await register("Alice", "alice@test.com");
    const created = await request(app).post("/api/tickets").set(bearer(token)).send(validTicket);
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ status: "open", priority: "medium" });
    const id = created.body.data._id;

    const list = await request(app).get("/api/tickets?status=open&search=login").set(bearer(token));
    expect(list.body.data).toHaveLength(1);
    expect(list.body.pagination).toMatchObject({ total: 1, page: 1 });

    const edited = await request(app).patch(`/api/tickets/${id}`).set(bearer(token)).send({ title: "Cannot login at all" });
    expect(edited.body.data.title).toBe("Cannot login at all");

    expect((await request(app).patch(`/api/tickets/${id}`).set(bearer(token)).send({})).status).toBe(400);
    expect((await request(app).delete(`/api/tickets/${id}`).set(bearer(token))).status).toBe(200);
    expect((await request(app).get(`/api/tickets/${id}`).set(bearer(token))).status).toBe(404);
  });

  it("validates input and ignores unknown fields (mass assignment)", async () => {
    const { token } = await register("Alice", "alice@test.com");
    expect((await request(app).post("/api/tickets").set(bearer(token)).send({ title: "x" })).status).toBe(400);
    const res = await request(app)
      .post("/api/tickets")
      .set(bearer(token))
      .send({ ...validTicket, status: "closed", createdBy: "000000000000000000000000", assignedTo: "x" });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("open");
    expect((await request(app).get("/api/tickets/not-an-id").set(bearer(token))).status).toBe(400);
  });

  it("isolates users: nobody can read, edit, delete or comment on another user's ticket", async () => {
    const alice = await register("Alice", "alice@test.com");
    const bob = await register("Bob", "bob@test.com");
    const t = await request(app).post("/api/tickets").set(bearer(alice.token)).send(validTicket);
    const id = t.body.data._id;
    expect((await request(app).get(`/api/tickets/${id}`).set(bearer(bob.token))).status).toBe(404);
    expect((await request(app).patch(`/api/tickets/${id}`).set(bearer(bob.token)).send({ title: "hacked title" })).status).toBe(404);
    expect((await request(app).delete(`/api/tickets/${id}`).set(bearer(bob.token))).status).toBe(404);
    expect((await request(app).post(`/api/tickets/${id}/comments`).set(bearer(bob.token)).send({ message: "hi" })).status).toBe(404);
    expect((await request(app).get(`/api/tickets/${id}/activities`).set(bearer(bob.token))).status).toBe(404);
    expect((await request(app).get("/api/tickets").set(bearer(bob.token))).body.data).toHaveLength(0);
  });
});

describe("admin", () => {
  it("is forbidden for regular users", async () => {
    const { token } = await register("Alice", "alice@test.com");
    for (const path of ["/api/admin/tickets", "/api/admin/dashboard", "/api/admin/users"]) {
      expect((await request(app).get(path).set(bearer(token))).status).toBe(403);
    }
  });

  it("filters tickets, shows details with comments, and enforces status transitions", async () => {
    const alice = await register("Alice", "alice@test.com");
    const admin = await makeAdmin();
    const t1 = await request(app).post("/api/tickets").set(bearer(alice.token)).send({ ...validTicket, priority: "high" });
    await request(app).post("/api/tickets").set(bearer(alice.token)).send({ ...validTicket, title: "Another problem here" });
    const id = t1.body.data._id;

    const high = await request(app).get("/api/admin/tickets?priority=high").set(bearer(admin.token));
    expect(high.body.data).toHaveLength(1);
    expect(high.body.data[0].createdBy.email).toBe("alice@test.com");
    expect((await request(app).get("/api/admin/tickets?status=bogus").set(bearer(admin.token))).status).toBe(400);

    await request(app).post(`/api/tickets/${id}/comments`).set(bearer(admin.token)).send({ message: "Looking into it" });
    const detail = await request(app).get(`/api/admin/tickets/${id}`).set(bearer(admin.token));
    expect(detail.body.data.comments).toHaveLength(1);
    expect(detail.body.data.comments[0].userId.role).toBe("admin");

    const inProgress = await request(app).patch(`/api/admin/tickets/${id}/status`).set(bearer(admin.token)).send({ status: "in_progress" });
    expect(inProgress.status).toBe(200);
    await request(app).patch(`/api/admin/tickets/${id}/status`).set(bearer(admin.token)).send({ status: "closed" });
    const invalid = await request(app).patch(`/api/admin/tickets/${id}/status`).set(bearer(admin.token)).send({ status: "resolved" });
    expect(invalid.status).toBe(400); // closed -> resolved is not allowed
    expect((await request(app).patch(`/api/admin/tickets/${id}/priority`).set(bearer(admin.token)).send({ priority: "urgent" })).body.data.priority).toBe("urgent");
  });

  it("admin can view any ticket via the shared endpoint; user cannot edit once it is in progress", async () => {
    const alice = await register("Alice", "alice@test.com");
    const admin = await makeAdmin();
    const id = (await request(app).post("/api/tickets").set(bearer(alice.token)).send(validTicket)).body.data._id;
    expect((await request(app).get(`/api/tickets/${id}`).set(bearer(admin.token))).status).toBe(200);
    await request(app).patch(`/api/admin/tickets/${id}/status`).set(bearer(admin.token)).send({ status: "in_progress" });
    const edit = await request(app).patch(`/api/tickets/${id}`).set(bearer(alice.token)).send({ title: "Updated title now" });
    expect(edit.status).toBe(409);
  });

  it("can deactivate a user (and not themselves); deactivated users are locked out", async () => {
    const alice = await register("Alice", "alice@test.com");
    const admin = await makeAdmin();
    expect((await request(app).patch(`/api/admin/users/${admin.id}/status`).set(bearer(admin.token)).send({ isActive: false })).status).toBe(400);
    expect((await request(app).patch(`/api/admin/users/${alice.id}/status`).set(bearer(admin.token)).send({ isActive: false })).status).toBe(200);
    expect((await request(app).get("/api/auth/me").set(bearer(alice.token))).status).toBe(401);
  });
});

describe("comments", () => {
  it("lets the owner and admins comment; closed tickets block users but not admins", async () => {
    const alice = await register("Alice", "alice@test.com");
    const admin = await makeAdmin();
    const id = (await request(app).post("/api/tickets").set(bearer(alice.token)).send(validTicket)).body.data._id;

    const mine = await request(app).post(`/api/tickets/${id}/comments`).set(bearer(alice.token)).send({ message: "Any update?" });
    expect(mine.status).toBe(201);
    expect(mine.body.data.userId.email).toBe("alice@test.com");
    expect((await request(app).post(`/api/tickets/${id}/comments`).set(bearer(alice.token)).send({ message: "   " })).status).toBe(400);
    expect((await request(app).post(`/api/tickets/${id}/comments`).set(bearer(admin.token)).send({ message: "On it" })).status).toBe(201);

    await request(app).patch(`/api/admin/tickets/${id}/status`).set(bearer(admin.token)).send({ status: "closed" });
    expect((await request(app).post(`/api/tickets/${id}/comments`).set(bearer(alice.token)).send({ message: "more" })).status).toBe(400);
    expect((await request(app).post(`/api/tickets/${id}/comments`).set(bearer(admin.token)).send({ message: "closing note" })).status).toBe(201);

    const list = await request(app).get(`/api/tickets/${id}/comments`).set(bearer(alice.token));
    expect(list.body.count).toBe(3);
  });
});

describe("event-driven workflow", () => {
  it("writes the activity log and creates the right notifications", async () => {
    const alice = await register("Alice", "alice@test.com");
    const admin = await makeAdmin();
    const id = (await request(app).post("/api/tickets").set(bearer(alice.token)).send(validTicket)).body.data._id;

    // admin is notified of the new ticket
    await eventually(async () => {
      const n = await request(app).get("/api/notifications").set(bearer(admin.token));
      expect(n.body.unreadCount).toBe(1);
      expect(n.body.data[0].event).toBe("ticket.created");
    });

    await request(app).post(`/api/tickets/${id}/comments`).set(bearer(admin.token)).send({ message: "Working on it" });
    await request(app).patch(`/api/admin/tickets/${id}/status`).set(bearer(admin.token)).send({ status: "resolved" });

    await eventually(async () => {
      const acts = await request(app).get(`/api/tickets/${id}/activities`).set(bearer(alice.token));
      const events = acts.body.data.map((a: { event: string }) => a.event);
      expect(events).toEqual(expect.arrayContaining(["ticket.created", "ticket.comment_added", "ticket.status_changed", "ticket.resolved"]));
    });

    await eventually(async () => {
      const n = await request(app).get("/api/notifications").set(bearer(alice.token));
      const events = n.body.data.map((x: { event: string }) => x.event).sort();
      // reply + resolved (status_changed->resolved is deliberately not duplicated)
      expect(events).toEqual(["ticket.comment_added", "ticket.resolved"]);
      expect(n.body.unreadCount).toBe(2);
    });

    const all = await request(app).patch("/api/notifications/read-all").set(bearer(alice.token));
    expect(all.body.updated).toBe(2);
    expect((await request(app).get("/api/notifications?unread=true").set(bearer(alice.token))).body.data).toHaveLength(0);
    // other users' notifications are not accessible
    const adminNotif = (await request(app).get("/api/notifications").set(bearer(admin.token))).body.data[0];
    expect((await request(app).patch(`/api/notifications/${adminNotif._id}/read`).set(bearer(alice.token))).status).toBe(404);
  });

  it("serves dashboard statistics", async () => {
    const alice = await register("Alice", "alice@test.com");
    const admin = await makeAdmin();
    const id = (await request(app).post("/api/tickets").set(bearer(alice.token)).send({ ...validTicket, priority: "urgent" })).body.data._id;
    await request(app).post(`/api/tickets/${id}/comments`).set(bearer(admin.token)).send({ message: "hello" });
    await request(app).patch(`/api/admin/tickets/${id}/status`).set(bearer(admin.token)).send({ status: "resolved" });
    const res = await request(app).get("/api/admin/dashboard").set(bearer(admin.token));
    expect(res.body.data).toMatchObject({ totalUsers: 1, totalTickets: 1, resolvedTickets: 1, urgentTickets: 1 });
    expect(res.body.data.avgResolutionHours).not.toBeNull();
    expect(res.body.data.avgFirstResponseHours).not.toBeNull();
  });
});

describe("misc", () => {
  it("returns JSON 404s and 400 for malformed JSON", async () => {
    const nf = await request(app).get("/api/nope");
    expect(nf.status).toBe(404);
    expect(nf.body.success).toBe(false);
    const bad = await request(app).post("/api/auth/login").set("Content-Type", "application/json").send("{oops");
    expect(bad.status).toBe(400);
  });
});
