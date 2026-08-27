export const portfolioData = {
    info: {
        name: "Akurati Kaustiki",
        title: "Forward Deployed Engineer",
        subtitle: "AI/ML · Agentic Systems · M.Tech (AI & ML)",
        location: "India · open to relocation",
        photo: "assets/kaustiki.jpg",
        resume: "assets/akurati-kaustiki-resume.pdf",
        dissertation: "assets/akurati-kaustiki-mtech-dissertation.pdf",
        summary: "A Computer Science engineer working across AI and backend systems. I build LLM and agentic applications end to end — retrieval pipelines, evaluation harnesses, and the production services around them — and I learn by shipping real things for real users.",
        tagline: "I build AI systems that hold up in production."
    },

    contact: {
        email: "akuratikaustiki@gmail.com",
        phone: "+91 75501 69233",
        github: "https://github.com/kaustiki",
        githubLabel: "github.com/kaustiki",
        linkedin: "https://www.linkedin.com/in/akurati-kaustiki",
        linkedinLabel: "linkedin.com/in/akurati-kaustiki"
    },

    stats: [
        { value: "97.7%", label: "RLVS benchmark accuracy", note: "M.Tech dissertation, vs 91.03% prior SOTA" },
        { value: "9.51", label: "M.Tech CGPA", note: "BITS Pilani, AI & ML" },
        { value: "4", label: "Production systems shipped", note: "2026" }
    ],

    highlights: [
        "Problem-solving",
        "Communication",
        "Time management",
        "Hard work and dedication"
    ],

    skills: {
        "AI / ML": ["Machine Learning", "Deep Learning", "NLP", "LLMs", "RAG", "Agentic AI"],
        "Frameworks": ["PyTorch", "Scikit-learn", "LangGraph"],
        "Backend & APIs": ["FastAPI", "Flask", "SQLAlchemy", "Express"],
        "MLOps & Tools": ["Docker", "MLflow", "GitHub Actions", "Langfuse", "Braintrust"],
        "Data & Storage": ["PostgreSQL", "ChromaDB", "Alembic"],
        "Programming": ["Python", "Java", "C", "JavaScript"]
    },

    experience: [
        {
            company: "TinyMagiq",
            role: "Forward Deployed Engineer",
            dates: "March 2026 – Present",
            current: true,
            details: [
                "Agentic AI full-stack development — skill/command-based agents, tool integration, and agent workflows.",
                "Built and evaluated LLM/RAG agent workflows using LangGraph and Langfuse, integrating tools and retrieval pipelines into production-oriented AI applications.",
                "Contributed to Tiny Magiq's GenAI website (tinymagiq.com), working on an LLM-powered query engine and AI-driven web experience.",
                "Delivered a payment verification system for a transport-sector client, covering approval workflow, tamper detection and audit trail."
            ]
        },
        {
            company: "DigiYosha",
            role: "Web Designer and Content Strategist",
            dates: "January 2024 – March 2026",
            details: [
                "Worked as a no-code website designer.",
                "Built branding assets including banners, social media creatives, and visual identity elements.",
                "Assisted in content strategy planning for marketing, across web and social platforms.",
                "Collaborated directly with stakeholders to translate vague marketing requirements into concrete design and content solutions."
            ]
        },
        {
            company: "Tata Consultancy Services",
            role: "Assistant System Engineer",
            dates: "July 2022 – October 2023",
            location: "Chennai, Tamil Nadu",
            details: [
                "Trained in Java and networking fundamentals.",
                "Developed Python code based on project requirements.",
                "Performed machine learning (NLP) tasks to classify text.",
                "Created and Dockerised a FastAPI application performing OCR on images.",
                "Deployed solutions to a development environment on AWS.",
                "Worked on database connectivity and ORM tooling with SQLAlchemy.",
                "Created and exposed Flask APIs."
            ]
        }
    ],

    education: [
        {
            institution: "BITS Pilani (WILP)",
            degree: "M.Tech in Artificial Intelligence and Machine Learning",
            dates: "May 2024 – May 2026",
            cgpa: "9.51"
        },
        {
            institution: "MNM Jain Engineering College, Anna University",
            degree: "B.E. Computer Science and Engineering",
            dates: "June 2018 – April 2022",
            cgpa: "9.07"
        },
        {
            institution: "Vaels International School, Chennai",
            degree: "A Levels (equivalent to 12th Std.)",
            dates: "June 2017 – May 2018",
            marks: "74.8%",
            board: "Cambridge Assessment International Education — GCE"
        },
        {
            institution: "Vaels International School, Chennai",
            degree: "IGCSE (10th Std.)",
            dates: "April 2015 – November 2015",
            marks: "83.25%",
            board: "Cambridge International General Certificate of Secondary Education"
        }
    ],

    // category drives the project filter. Keep this list SHORT.
    categories: ["All", "LLM & Agents", "AI / ML", "Backend"],

    projects: [
        {
            id: "violence-detection",
            title: "Video Violence Detection",
            subtitle: "M.Tech dissertation · BITS Pilani",
            org: "Vasishta Nirman India Pvt. Ltd., Chennai",
            dates: "November 2024 – February 2026",
            category: "AI / ML",
            featured: true,
            description: "A deep-learning pipeline that watches CCTV footage and decides whether what it is seeing is violence — then explains why. Violence classification, weapon detection, scene-graph reasoning and action recognition run in parallel and feed a single interpretable threat score.",
            highlights: [
                "97.7% accuracy on the RLVS benchmark, beating the prior state of the art (91.03%).",
                "Quantified a 30.7 percentage-point domain gap — 97.7% on Western benchmarks collapses to 67% on Indian CCTV footage.",
                "Built a 676-image Indian weapon dataset across 3 classes, semi-automatically annotated with Grounding DINO.",
                "Showed one-stage detectors beat two-stage by 18% mAP@50 while training 8× faster."
            ],
            detail: [
                {
                    heading: "Violence classification",
                    body: "Three temporal architectures were compared. MobileNetV3-Large + BiLSTM + Attention won at 7.24M parameters — 97.73% test accuracy, 99.91% AUC-ROC and 23.08 ms inference, making it viable for real-time use. Trained on an NVIDIA Tesla T4 with 32-frame clips at 224×224."
                },
                {
                    heading: "The domain gap",
                    body: "This is the finding the work is really about. Models trained on Western datasets degrade badly on Indian footage — different violence patterns, clothing, environments and camera quality. Indian contexts also involve weapons (lathi, sickle, machete) absent from standard datasets like COCO. Domain-specific training on a curated Indian dataset recovered the loss; no amount of model sophistication compensated for a train/test distribution mismatch."
                },
                {
                    heading: "Weapon detection",
                    body: "YOLOv11, Roboflow 3.0 (YOLOv8s) and Faster R-CNN were compared on the custom dataset. Roboflow 3.0 was selected: best mAP@50 (0.4978), best precision (0.6114) and fastest training (9.76 min vs 80 min for Faster R-CNN). Per class — firearm 0.604, blunt weapon 0.499, bladed weapon 0.390."
                },
                {
                    heading: "Explainability",
                    body: "A scene graph layer extracts spatial relationships between detected people and weapons, with Farneback dense optical flow for motion. Empirical validation was honest about its limits: proximity alone does not discriminate violence (p = 0.5), so it is kept as a supplementary signal for operator context rather than a classifier."
                },
                {
                    heading: "Risk fusion",
                    body: "A deliberately rule-based scoring module aggregates spatial, motion and classification evidence into a 0–100 threat score across four levels. Rules were chosen over learned fusion for auditability — security operators must be able to see why an alert fired — and because no dataset exists that is large enough to learn robust fusion weights."
                }
            ],
            tech: ["PyTorch", "MobileNetV3", "BiLSTM", "Attention", "YOLOv11", "YOLOv8", "Faster R-CNN", "Grounding DINO", "X3D", "OpenCV", "Streamlit"],
            links: [{ label: "Read the dissertation (PDF)", href: "assets/akurati-kaustiki-mtech-dissertation.pdf" }]
        },
        {
            id: "tinymagiq-engine",
            title: "TinyMagiq Agentic Website Engine",
            subtitle: "Production · tinymagiq.com",
            org: "TinyMagiq",
            dates: "June 2026 – Present",
            category: "LLM & Agents",
            featured: true,
            description: "Not a chatbot and not a brochure. A visitor states an enterprise-AI problem in their own words; the engine interprets it, routes it through a domain ontology, locks one piece of supporting evidence, and writes a short plain-language response that moves them toward a real conversation.",
            highlights: [
                "Seven-layer architecture where each layer has exactly one job and no layer re-decides another's work.",
                "LLM where judgment is needed, deterministic rules where auditability is needed.",
                "A ~90 KB ontology owns all routing — no category-to-construct table is ever hard-coded.",
                "Same input produces the same route, every time."
            ],
            detail: [
                {
                    heading: "The pipeline",
                    body: "input → safety gate → Interpreter (LLM, understands the pain) → Planner (pure rules, decides the route) → Proof selector (pure rules, locks evidence) → Composer (LLM, writes five blocks) → response plus reply options."
                },
                {
                    heading: "Why the split matters",
                    body: "The Interpreter never routes, the Planner never writes prose, and the Composer never re-decides the route. The Express server holds no business logic at all. That separation is what makes the system testable — the two rule-based stages are deterministic and can be asserted against directly, so LLM non-determinism is confined to the two stages where it earns its place."
                },
                {
                    heading: "Ontology-driven routing",
                    body: "Routing maps live in the ontology as data, read at runtime. Routing is keyed on the problem the visitor describes, never on their job title — persona affects tone only."
                }
            ],
            tech: ["Node.js", "Express", "OpenAI SDK", "Anthropic SDK", "Ontology / knowledge graph", "PM2", "JSONL telemetry"],
            links: [{ label: "tinymagiq.com", href: "https://tinymagiq.com" }]
        },
        {
            id: "payment-verification",
            title: "Payment Verification System",
            subtitle: "Production · transport sector client",
            org: "TinyMagiq",
            dates: "August 2026",
            category: "Backend",
            featured: true,
            description: "Weekly payment runs were going to the bank with account numbers nobody had checked. This service verifies every row against an approved beneficiary master before the file is generated, and verifies the file again before it is uploaded — so a file altered in between is caught rather than paid.",
            highlights: [
                "Fuzzy name matching against an approved beneficiary master catches altered account numbers.",
                "Enforced separation of duties — the same person cannot both edit the approved list and approve payments from it.",
                "Byte-for-byte re-verification of the generated bank file closes the download-to-upload gap.",
                "Every override is recorded with a name and a written reason, and printed into the report."
            ],
            detail: [
                {
                    heading: "The actual risk",
                    body: "The gap being closed is small and specific: between generating a payment file and uploading it to the bank, the file sits on a desktop where it can be edited. Re-feeding the file into the checker before upload turns that from an act of trust into a check."
                },
                {
                    heading: "Approval workflow",
                    body: "Flagged rows must each be settled — propose a new beneficiary, propose an account correction, hold the payment, or pay anyway with a stated reason. Approval re-asks for the approver's password and TOTP code. Rows that resolve to nobody on the approved list are held back rather than paid, because the account number has no verified source."
                },
                {
                    heading: "Security",
                    body: "Argon2 password hashing, optional TOTP two-factor with printed recovery codes, signed sessions, forced password change on first sign-in, and a role model that refuses to let one account be both admin and approver."
                }
            ],
            tech: ["FastAPI", "Jinja2", "Argon2", "TOTP / pyotp", "rapidfuzz", "jellyfish", "openpyxl", "ReportLab", "pytest"]
        },
        {
            id: "weed-rag",
            title: "Weed Management RAG Chatbot",
            subtitle: "Retrieval-augmented Q&A for farmers",
            org: "TinyMagiq · FDE programme",
            dates: "May – June 2026",
            category: "LLM & Agents",
            featured: true,
            description: "Farmers misidentify noxious weeds because invasive species share traits — purple flower heads, rosettes, spines. This answers questions like “which thistle is this?” and “what is the treatment window for diffuse knapweed at rosette stage?” straight from a county weed-management guide.",
            highlights: [
                "Structure-aware chunking beat naive splitting: the source is a 4-column brochure where each column is one coherent topic.",
                "Chunks carry source, page, column and topic metadata, so every answer can cite where it came from.",
                "Built an LLM-as-judge evaluation harness rather than eyeballing outputs."
            ],
            detail: [
                {
                    heading: "Chunking decision",
                    body: "The guide is a four-column PDF read top-down, each column a single weed entry. Splitting by column rather than by character count keeps each chunk semantically whole. PyMuPDF was chosen over plain text extraction for its layout handling, since the guide contains herbicide tables."
                },
                {
                    heading: "Retrieval",
                    body: "OpenAI text-embedding-3-small — deliberately the small model, since the corpus is only ~24 chunks. Stored in ChromaDB, chosen over FAISS specifically because it stores document, embedding and metadata together, and the metadata is what makes citation possible."
                },
                {
                    heading: "Evaluation",
                    body: "A synthetic evaluation dataset plus an LLM-judge scoring pipeline, with Braintrust and autoevals for tracking. Also covered prompt chaining and observability."
                }
            ],
            tech: ["Python", "PyMuPDF", "ChromaDB", "OpenAI embeddings", "LangChain", "FastAPI", "React Router 7", "Braintrust", "autoevals"]
        },
        {
            id: "image-captioning",
            title: "Image Captioning",
            subtitle: "Capstone · IIIT Hyderabad & TalentSprint",
            dates: "November 2023 – February 2024",
            category: "AI / ML",
            description: "A multimodal captioning model — pre-trained CNN as the encoder, LSTM with attention as the decoder — generating natural-language descriptions of images.",
            tech: ["CNN", "LSTM", "Attention", "PyTorch"]
        },
        {
            id: "sentiment-analysis",
            title: "Sentiment Analysis on Amazon Reviews",
            subtitle: "Mini project",
            dates: "February – August 2021",
            category: "AI / ML",
            description: "Classical NLP pipeline classifying sentiment across Amazon product reviews.",
            tech: ["Machine Learning", "NLP", "Scikit-learn"]
        },
        {
            id: "ageing-signs",
            title: "Ageing Signs Detection",
            subtitle: "Project",
            dates: "April – May 2021",
            category: "AI / ML",
            description: "Object detection applied to identifying visible ageing signs in facial images.",
            tech: ["Machine Learning", "Object Detection"]
        }
    ],

    certifications: [
        {
            title: "PG Certification in Artificial Intelligence and Machine Learning",
            issuer: "IIIT Hyderabad & TalentSprint",
            dates: "June 2023 – February 2024"
        }
    ],

    internships: [
        { title: "Machine Learning with Python", company: "Verzeo", dates: "April – May 2021" },
        { title: "Mastering Python Programming", company: "Futuro Focus", dates: "January – February 2021" }
    ],

    finearts: {
        "Dance": ["Kuchipudi", "Bharathanatyam"],
        "Music": ["Carnatic Vocal", "Veena"],
        "Other": ["Kalari (Indian martial art)", "Chess"]
    }
};

window.portfolioData = portfolioData;
