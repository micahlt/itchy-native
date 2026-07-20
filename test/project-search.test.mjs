import assert from "node:assert/strict";
import test from "node:test";

import { searchForProjects } from "../utils/searchForProjects.ts";

test("looks up digit-only project queries by ID", async () => {
  const calls = [];
  const project = { id: 123456, title: "Project" };

  const results = await searchForProjects(
    " 123456 ",
    async (id) => {
      calls.push(["id", id]);
      return project;
    },
    async (query) => {
      calls.push(["name", query]);
      return [];
    },
  );

  assert.deepEqual(calls, [["id", "123456"]]);
  assert.deepEqual(results, [project]);
});

test("keeps text project queries on name search", async () => {
  const calls = [];
  const projects = [{ id: 654321, title: "Similar name" }];

  const results = await searchForProjects(
    "Similar name",
    async (id) => {
      calls.push(["id", id]);
      return {};
    },
    async (query) => {
      calls.push(["name", query]);
      return projects;
    },
  );

  assert.deepEqual(calls, [["name", "Similar name"]]);
  assert.deepEqual(results, projects);
});
