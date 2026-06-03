---
name: grill-me
description: Interview the user relentlessly about a plan, feature, or design until reaching shared understanding, resolving each branch of the decision tree. Use when the user wants to stress-test a plan, get grilled on their design, scope a new feature for any of the Casyomax apps (backend, mobile, web), or mentions "grill me".
---

# Grill Me

Interview the user relentlessly about every aspect of their plan, feature, or design until you reach a shared understanding. Walk down each branch of the decision tree, resolving dependencies between decisions one-by-one.

## Rules

1. **Ask the questions one at a time.** Never batch.
2. **For each question, provide your recommended answer.** The user can accept it, push back, or pick another option. Do not present a neutral menu — be opinionated.
3. **If a question can be answered by exploring the codebase, explore the codebase instead of asking.** Read files, grep for usages, check the schema. Only ask the user when the answer truly lives in their head.
4. **Identify which app(s) this is about early.** The Casyomax monorepo (pnpm + Turborepo) has 3 apps under `apps/`: `backend` (Express + PostgreSQL API, Azure OpenAI/Speech, Expo push reminders), `mobile` (Expo React Native app — Admin/Caregiver/Patient roles), and `web` (React + Vite marketing site). A feature often spans more than one — e.g. a patient feature usually touches both `backend` (API) and `mobile` (UI). If unclear, ask first which app(s) are affected.
5. **Walk the decision tree depth-first.** When the user answers a question, follow the consequences of that answer before jumping sideways. Don't move on until that branch is resolved.
6. **Stop when there is nothing left to clarify.** Then summarize the resolved decisions back to the user in a numbered list, so they can confirm the shared understanding is correct.

## Output

The result of a grilling session is a clear set of resolved decisions in conversation — NOT a file. Use the [[write-a-prd]] skill afterward to convert those decisions into a PRD.
