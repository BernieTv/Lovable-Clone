<img src="https://cdn.sanity.io/images/0ww2tgdo/production/06f36297ad99b0f4f963aa9c57468c4a4cd3c780-2560x1405.png?w=2000&fit=max&auto=format" alt="Project Banner" />

# 💖 Lovable Clone

Lovable Clone is your AI-powered sidekick 🤖✨ — built for speed 🚀, style 🎨, and total creativity 💡. Whether you’re shipping your next big project, experimenting with wild ideas, or just vibing with some clean code, this stack’s got you. Powered by **Next.js 15** + **React 19** with a fresh **AI-first toolchain**, it’s here to make dev life way smoother and more fun 😎. From auto-generating components to real-time previews and cloud sandboxes, Lovable Clone keeps you in the flow, no matter how chaotic your brain dump is.

---

## 🚀 Tech Stack

- **Framework:** Next.js 15 + React 19
- **Styling:** Tailwind v4 🎨 + [Shadcn/ui](https://ui.shadcn.com)
- **Type-Safe API:** [tRPC](https://trpc.io) 📡
- **Background Jobs:** [Inngest](https://www.inngest.com) 🔁
- **AI Agent Toolkit:** Inngest agent utilities 🤖
- **Auth & Billing:** [Clerk](https://clerk.dev) 🔐💳
- **Database:** Prisma ORM + [Neon](https://neon.tech) 🗄️
- **AI Model:** OpenAI 🧠
- **Execution:** [E2B Cloud Sandboxes](https://e2b.dev) 🖥️ + Docker 🐳

---

## ✨ Key Features

- 🧱 **AI-Powered Component & App Generation** – Build from prompts
- 🗂️ **Live Project Preview** – Share URLs instantly
- 🧪 **Preview + Code Explorer** – Toggle effortlessly
- 🔁 **Automated Background Jobs** – Async magic
- 🧠 **Agent Toolkit** – Workflow automation
- 🔐 **Secure Authentication** – Clerk-powered
- 💳 **Billing System** – Subscription-ready
- 📦 **Database Integration** – Prisma + Neon
- 🧾 **Credit System** – Track & manage usage

---

## 📂 Folder Structure

```
.
├── prisma/               # Database schema & migrations
├── public/               # Static assets
├── sandbox-templates/    # E2B/Docker sandbox configs
├── src/
│   ├── app/              # App routes & layouts
│   ├── components/       # UI & shared components
│   ├── config/           # App configuration
│   ├── hooks/            # Custom React hooks
│   ├── inngest/          # Inngest jobs & utilities
│   ├── lib/              # Utilities & services
│   ├── modules/          # Feature modules
│   ├── trpc/             # API routers & clients
│   └── types.ts          # Shared types
├── .env                  # Environment variables
├── next.config.ts        # Next.js config
├── package.json          # Dependencies & scripts
└── tsconfig.json         # TypeScript config
```

---

## 🔑 Environment Variables (`.env`)

```env
DATABASE_URL="*"

NEXT_PUBLIC_APP_URL="*"

OPENAI_API_KEY="*"
OPENAI_MODEL="gpt-4.1-mini"
OPENAI_BASE_URL="https://api.openai.com/v1/"

E2B_API_KEY="*"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="*"
CLERK_SECRET_KEY="*"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="*"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="*"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="*"
```

---

## 🛠️ Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/BernieTv/Lovable-Clone.git
cd Lovable-Clone
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Add Environment Variables

Fill in `.env` with your credentials (see above).

### 4️⃣ Run the Development Server

```bash
npm run dev
```

Then visit `http://localhost:3000` 🚀

---

## 💡 Ideal Use Cases

- **🧱 AI-Powered App & Component Generation** — spin up entire features from a single prompt and look like a coding wizard.
- **🗂️ Live Project Preview** — share your build-in-progress via instant URLs, because waiting is so last season.
- **🧪 Preview + Code Explorer Combo** — flip between visuals and code without breaking your flow.
- **🔁 Automated Background Jobs** — let async magic handle the grind while you focus on the glow-up.

---

## 📜 License

MIT License – free to use, remix, and ship 💌

---

> 💡 **Pro Tip:** Pair with your fave AI code assistant for _chef’s kiss_ productivity.
