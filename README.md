# Scrapbook

Scrapbook is a high-performance, data-driven web application designed for organizing, annotating, and managing evidence documents. 

## Features

- **Document Management**: Manage multiple scrapbooks from a centralized sidebar.
- **Drag-and-Drop Assets**: Easily drop images and PDFs into your library to add them to your notebook.
- **AI Integrations**: Use Gemini, Groq, or Local (Ollama) providers to automatically analyze photos or improve your writing.
- **Concept Search**: Perform semantic vector search across all your documents (powered locally by transformers.js or via Gemini API).
- **Direct PDF Export**: Export your compiled scrapbook pages directly to PDF with accurate text layout and formatting.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to use the application.

## AI Configuration

To configure AI features, open the Settings modal from the sidebar. You can select your preferred AI provider:
- **Local (Ollama)**: No API key required, runs locally on port 11434.
- **Google Gemini**: Requires a Gemini API key.
- **Groq**: Requires a Groq API key.
