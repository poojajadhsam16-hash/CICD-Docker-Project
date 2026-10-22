const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const server = require("./app");

let baseUrl;

before(async () => {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server.listening) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
});

test("health endpoint returns UP", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, "UP");
  assert.equal(body.application, "OpsPulse");
});

test("services endpoint returns four services", async () => {
  const response = await fetch(`${baseUrl}/api/services`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.count, 4);
  assert.equal(body.services.length, 4);
  assert.ok(body.services.every((service) =>
    ["Healthy", "Degraded", "Down"].includes(service.status)
  ));
});

test("incidents endpoint returns three incidents", async () => {
  const response = await fetch(`${baseUrl}/api/incidents`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.count, 3);
  assert.equal(body.incidents.length, 3);
  assert.ok(body.incidents.every((incident) =>
    incident.id && incident.title && incident.status
  ));
});

test("dashboard serves the OpsPulse HTML", async () => {
  const response = await fetch(`${baseUrl}/`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /OpsPulse/);
  assert.match(html, /Service Operations/);
  assert.match(html, /Incident register/);
});

test("unknown endpoint returns 404", async () => {
  const response = await fetch(`${baseUrl}/api/unknown`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.error, "Not found");
});

