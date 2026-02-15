# SignFlow — E-Signature Platform

A modern, full-stack electronic signature application built with **Next.js 16**, **Supabase**, and **PDF.js**. Upload PDFs, place signature fields, share signing links, and track document status — all in a sleek, responsive interface.

> **⚠️ Demo Application** — This project is for portfolio / educational purposes only. All data is automatically wiped on a daily schedule. Do **not** upload sensitive or legally-binding documents.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **PDF Upload & Viewer** | Upload any PDF and render it client-side with PDF.js |
| ✍️ **Drag-to-Place Fields** | Add signature, text, date, initials, and checkbox fields |
| 🔗 **Secure Signing Links** | Generate unique, tokenized links for each signer |
| 🖊️ **Draw-to-Sign** | Signers draw their signature on an HTML5 canvas |
| ❌ **Decline Flow** | Signers can decline with an optional reason |
| 📊 **Dashboard** | Real-time status cards (Draft / Awaiting / Completed / Declined) |
| 📝 **Audit Trail** | Every action is logged with IP, user-agent, and timestamp |
| 🔒 **Auth** | Email/password authentication via Supabase Auth |
| 🌗 **Dark Mode** | Full dark-mode support via `next-themes` |

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + Row Level Security)
- **PDF Rendering**: [PDF.js](https://mozilla.github.io/pdf.js/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: TypeScript

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm or pnpm
- A [Supabase](https://supabase.com/) project

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/signflow.git
cd signflow
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-side only) |

### 4. Set Up the Database

Run the following SQL in your Supabase SQL Editor to create the required tables:

- `documents` — stores document metadata and file data
- `signers` — stores signer info and signing tokens
- `signature_fields` — stores field positions and values
- `audit_logs` — records all signing activity

> Refer to the Supabase dashboard or project documentation for the full schema.

### 5. Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── documents/send/   # Send document & generate signing links
│   │   └── sign/             # Sign & decline endpoints
│   ├── auth/                 # Login, sign-up, callback pages
│   ├── dashboard/            # Main dashboard & document editor
│   └── sign/[token]/         # Public signing page
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   ├── dashboard-nav.tsx     # Navigation bar
│   ├── dashboard-document-list.tsx
│   ├── document-editor.tsx   # Core document editing interface
│   ├── pdf-viewer.tsx        # PDF rendering component
│   └── data-disclaimer-dialog.tsx
├── lib/
│   ├── supabase/             # Supabase client (server & client)
│   ├── types.ts              # TypeScript type definitions
│   └── utils.ts              # Utility functions
└── public/
```

---

## 📜 Legal

> **DISCLAIMER**: This software is provided **"as-is"** without warranty of any kind. See [DISCLAIMER.md](./DISCLAIMER.md) for the full legal disclaimer.

This project is licensed under the **MIT License** — see [LICENSE](./LICENSE) for details.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📬 Contact

**Vyom Sagar** — [vyomsagar123@gmail.com](mailto:vyomsagar123@gmail.com)

Project Link: [https://github.com/<your-username>/signflow](https://github.com/<your-username>/signflow)
