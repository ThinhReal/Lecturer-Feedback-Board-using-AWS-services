# Lecturer Feedback Board

A small Next.js (App Router) app for submitting and browsing feedback about lecturers. Data is persisted in Amazon DynamoDB.

## Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS v4
- Amazon DynamoDB via `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb`

## Prerequisites

- Node.js 18.18+ (or any version supported by Next.js 16)
- An AWS account with a DynamoDB table:
  - **Table name:** `LecturerFeedback`
  - **Partition key:** `id` (String)
- An IAM user/role with `dynamodb:Scan`, `dynamodb:PutItem`, and `dynamodb:DeleteItem` on that table

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` in the project root:

   ```bash
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## API

All endpoints live under `app/api/feedback/route.ts`.

| Method | Path                      | Description                            |
| ------ | ------------------------- | -------------------------------------- |
| GET    | `/api/feedback`           | List all feedback (newest first)       |
| POST   | `/api/feedback`           | Create feedback `{ name, message }`    |
| DELETE | `/api/feedback?id=<uuid>` | Delete a feedback item by `id`         |

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — run ESLint
