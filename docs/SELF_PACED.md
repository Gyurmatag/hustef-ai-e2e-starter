# Doing the workshop on your own

The workshop ran with a facilitator in Budapest on 6 October 2026. Everything you need still runs without one: this repo, the companion app (https://hustef.shiwa.io), Gremlin Bank (https://gremlin.shiwa.io) and the slides. This page lists what you do differently. In the room the six labs took four and a half hours; plan a day, or split it after Lab 3.

## 1. Set up

1. Check the prerequisites: [PREREQUISITES.md](PREREQUISITES.md). You need an AI coding agent with MCP support, and a GitHub account for your fork (Labs 3 and 6).
2. Clone this repo and run the setup script: [Quick start](../README.md#quick-start).
3. Join the companion app at https://hustef.shiwa.io/join with the code `HUSTEF26`. Put your personal token into `.env` (`HUSTEF_TOKEN=...`) and set `AI_TOOL` to your tool.
4. Set `GREMLIN_RELEASE=1` in `.env` (section 2 explains why).
5. Run `npm run doctor` until everything is green.
6. Open your AI tool in this folder and follow its setup card: https://hustef.shiwa.io/setup.

The companion app works as it did on the day: lab texts with answer boxes, achievements, hints and checkpoints are all open.

## 2. Gremlin Bank releases: you switch them

On the day the facilitator moved Gremlin Bank from release 1 to releases 2 and 3 for everyone. Now the shared release stays on 3 (the companion app shows it at the top), and you pin the release each lab needs:

| Labs | Release | In `.env` | In the agent's browser |
|---|---|---|---|
| Labs 1 to 3 | 1 | `GREMLIN_RELEASE=1` | https://gremlin.shiwa.io/release/1 |
| Lab 4, steps 1 to 3 | 2 | `GREMLIN_RELEASE=2` | https://gremlin.shiwa.io/release/2 |
| Lab 4 step 4 to Lab 6 | 3 | `GREMLIN_RELEASE=3` | https://gremlin.shiwa.io/release/3 |

- `.env` pins the release for the tests, and for the planner, generator and healer, which work in the tests' browser. After you change it, quit your AI tool and open it again: its test tools read `.env` only when they start. `npx playwright test` in a terminal reads it on every run.
- The agent's own browser (the `playwright` MCP server and the Playwright CLI) does not read `.env`. Open the `/release/N` address in it: that pins the release in that browser for 24 hours and then shows the sign-in page. https://gremlin.shiwa.io/release/reset removes the pin.
- GitHub Actions (Lab 6): a run you start by hand takes the release as an input. Runs that a push or a pull request starts test the shared release, 3.

## 3. What changes in each lab

The lab texts mark every change with an **On your own** box. Read the labs in the companion app, which has the answer boxes; `labs/` in this repo has the same texts.

| Lab | Without a facilitator |
|---|---|
| [Lab 1: First drive](../labs/lab-1/README.md) | Pin release 1: in `.env`, and in both browsers by opening `/release/1` instead of `/login`. Compare your own MCP and CLI numbers with slides 21 and 22. |
| [Lab 2: Explore and plan](../labs/lab-2/README.md) | Nothing changes. |
| [Lab 3: Generate and review](../labs/lab-3/README.md) | Nothing changes. |
| [Lab 4: Heal](../labs/lab-4/README.md) | You ship the releases: `GREMLIN_RELEASE=2` in step 1 and `3` in step 4, each time followed by a restart of your AI tool. |
| [Lab 5: Where agents break](../labs/lab-5/README.md) | Nothing changes. Keep release 3. |
| [Lab 6: CI/CD and audit trail](../labs/lab-6/README.md) | Type `3` as the workflow's release. The review in steps 3 and 4 needs a second GitHub account, for example a colleague's. Alone, the pull request stays blocked and "Four eyes" stays locked. |

Stuck, or want to skip a lab? Every lab ends with a checkpoint branch, `lab-1-done` to `lab-6-done`, as on the day.

## 4. Talks, exercises and the end of the day

- **Talks:** the slides are at https://hustef.shiwa.io/slides (PowerPoint for the web, with pptx and PDF downloads), in the order of the [agenda](AGENDA.md).
- **Decision framework:** the scenario cards on the Framework page work alone.
- **Strategy canvas:** there are no teams after the day. The Strategy page lists the nine canvas sections; write them for the scenario closest to your work. "Strategist" needs a team, so it stays locked.
- **Quiz** and **Monday plan:** in the companion app, as on the day. [MONDAY.md](MONDAY.md) and [PORTING.md](PORTING.md) help you take the patterns to your own project.

## 5. When something does not work

- Every lab has hints, open in the companion app.
- Setup and network problems: [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
- If your network blocks gremlin.shiwa.io, a phone hotspot is the quickest way around it. The local fallback on the setup cards needs the gremlin-bank repository, which is private.
