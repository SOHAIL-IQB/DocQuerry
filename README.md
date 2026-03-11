# DocQuery AI

*AI-powered document question-answering system built with a state-of-the-art Retrieval Augmented Generation (RAG) architecture.*

Upload your documents and ask questions. The AI intelligently retrieves relevant information directly from your documents and generates precise, context-aware answers.

---

## Project Overview

DocQuery AI transforms static documents into an interactive knowledge base. The platform allows users to upload standard format documents (PDF, DOCX, TXT) which are securely parsed, split into structural chunks, and converted into multi-dimensional vector embeddings. 

When a user asks a question, the application uses its RAG architecture to perform a semantic vector search across their document library, retrieving the most highly relevant context chunks and injecting them into a strict LLM pipeline to generate accurate, hallucination-free answers.

## Key Features

- **Document Upload & Parsing**: Secure and efficient extraction of textual data from diverse file formats.
- **Retrieval-Augmented Generation (RAG)**: Strict querying pipelines bounding the AI exclusively to the provided context.
- **Vector Embeddings for Semantic Search**: High-dimensional content analysis matching semantic intent, not just keywords.
- **Multi-Document Selection**: Target one, multiple, or all documents simultaneously for grouped intelligent querying.
- **Chat-Based Interface**: A modern workspace utilizing markdown rendering and persistent conversation histories.
- **User Authentication**: Complete JWT-based registration, login, and secure user data isolation.
- **Asynchronous Processing**: Background pooling and staggered queues respecting AI tier rate limits to prevent freezing.
- **Modern Dashboard UI**: A rich, dynamic React single-page application with responsive layouts and dark-mode designs.

---

## Tech Stack

### Frontend
- **React 19** / **Vite**
- **Axios** (Data fetching)
- **React Router** (Navigation)
- **Lucide React** (Iconography)
- **Vanilla CSS** (Component-scoped styling)

### Backend
- **Node.js** / **Express.js**
- **MongoDB** / **Mongoose** (Relational & Vector Database)
- **JWT** & **Bcrypt.js** (Authentication & Cryptography)
- **Multer** (Multipart/form-data parsing)

### AI Components
- **Groq API** (For ultra-fast Answer Generation via `llama-3.1-8b-instant`)
- **Xenova Transformers** (Local Vector Embeddings via `all-MiniLM-L6-v2`)
- **Custom Text Chunking & Overlap Algorithms**

---

## Architecture Overview

The system strictly follows an advanced Retrieval-Augmented Generation workflow to ensure data privacy and accuracy:

1. **User uploads document**
2. **↓ Text extraction** executes via `pdf-parse` or `mammoth` based on MIME type.
3. **↓ Text chunking** splits data into 500-700 character boundaries with a 100 character overlap.
4. **↓ Embedding generation** translates chunks into dense floating-point vector arrays.
5. **↓ Vector storage** writes vectors to **MongoDB** mapped back to their parent Document IDs.
6. **↓ User asks a question** via the application workspace.
7. **↓ Vector search retrieves relevant chunks** comparing query intent against stored vectors.
8. **↓ Groq LLM generates the final answer** synthesizing the retrieved local components.

---

## Project Structure

```text
backend/
├── config/           # Database and environment configurations
├── controllers/      # Route logic and request handling
├── middleware/       # Authentication and file validation layers
├── models/           # Mongoose schemas (User, Document, Message, etc.)
├── routes/           # RESTful API endpoint definitions
├── services/         # Core business logic (RAG pipeline)
└── utils/            # Helper functions (extration, chunking, gemini API)

frontend/
└── src/
    ├── assets/       # Static branding and images
    ├── components/   # Reusable UI elements (layout, documents, common)
    ├── context/      # React functional state managers (AuthContext)
    ├── hooks/        # Custom React hooks (useChat)
    ├── pages/        # View-level route components (Dashboard, Settings, etc.)
    └── services/     # Frontend API interceptors
```

---

## Installation Guide

Follow these steps to spin up the DocQuery AI application locally.

### 1. Clone the repository
```bash
git clone https://github.com/SOHAIL-IQB/DocQuerry.git
cd DocQuerry
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Create Environment Variables
Navigate to the `backend` directory and duplicate the `.env.example` file to create a `.env` file:
```bash
cd backend
cp .env.example .env
```
Populate your new `.env` file with the required production constraints:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=a_secure_randomly_generated_string
GROQ_API_KEY=your_groq_api_key
```

### 5. Start the Application Environment
In the `backend` terminal:
```bash
npm run dev
```

Open a new terminal session, navigate to the `frontend` directory, and start the client:
```bash
cd frontend
npm run dev
```

*(By default, the Vite client will be accessible at `http://localhost:5173`)*

---

## Usage

1. **Register or Login**: Create a new account from the landing screen to generate your private workspace.
2. **Upload Documents**: Navigate to the Dashboard and drag-and-drop your reference materials to begin ingestion.
3. **Wait for Processing**: The backend will process your documents asynchronously in the background. Wait until their status changes to "Ready".
4. **Select Context**: In the Chat interface, use the dropdown filter to explicitly target an individual document, multiple documents, or your entire library at once.
5. **Ask Questions**: Send queries directly to the AI, and it will respond with precise, contextual answers synthesized distinctly from your targeted materials.

---

## Future Improvements

- **Streaming Responses**: Implement true chunk-by-chunk HTTP response streaming for real-time text generation effects.
- **Improved Document Summarization**: Expand the inference pipeline to summarize freshly uploaded documents for immediate metadata tagging.
- **Better Retrieval Ranking**: Implement cross-encoder reranking algorithms after the initial vector sweep to increase retrieval precision.
- **Advanced Analytics Dashboard**: Expose token-usage and generation timing metrics natively within the user dashboard.

---

## Author

**Sohail Iqbal**

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
