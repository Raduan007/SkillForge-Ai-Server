import Roadmap from "../models/Roadmap.js";
const CARD_FIELDS = "_id slug title shortDescription coverImage difficulty duration rating totalRatings category";
export class RoadmapService {
    /**
     * Fetch paginated and filtered roadmaps list from MongoDB.
     */
    static async getRoadmaps(params) {
        const { page, limit, search, category, difficulty, sort } = params;
        // 1. Build Query Filters
        const query = { isPublished: true };
        if (search) {
            query.title = { $regex: search, $options: "i" };
        }
        if (category) {
            const categoriesArray = category.split(",").filter(Boolean);
            if (categoriesArray.length > 0) {
                query.category = { $in: categoriesArray.map(c => new RegExp(`^${c}$`, "i")) };
            }
        }
        if (difficulty) {
            const difficultiesArray = difficulty.split(",").filter(Boolean);
            if (difficultiesArray.length > 0) {
                query.difficulty = { $in: difficultiesArray };
            }
        }
        // 2. Build Sort Criteria
        let sortCriteria = {};
        if (sort === "newest") {
            sortCriteria = { createdAt: -1 };
        }
        else if (sort === "oldest") {
            sortCriteria = { createdAt: 1 };
        }
        else if (sort === "highest-rated") {
            sortCriteria = { rating: -1, totalRatings: -1 };
        }
        else if (sort === "lowest-rated") {
            sortCriteria = { rating: 1, totalRatings: 1 };
        }
        else if (sort === "shortest-duration") {
            sortCriteria = { duration: 1 };
        }
        else if (sort === "longest-duration") {
            sortCriteria = { duration: -1 };
        }
        else if (sort === "alpha-asc") {
            sortCriteria = { title: 1 };
        }
        else if (sort === "alpha-desc") {
            sortCriteria = { title: -1 };
        }
        else {
            sortCriteria = { createdAt: -1 };
        }
        // 3. Perform Paginated Queries
        const skip = (page - 1) * limit;
        const [roadmaps, total] = await Promise.all([
            Roadmap.find(query).select(CARD_FIELDS).sort(sortCriteria).skip(skip).limit(limit).lean(),
            Roadmap.countDocuments(query),
        ]);
        return {
            roadmaps,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Fetch single roadmap details by slug.
     */
    static async getRoadmapBySlug(slug) {
        return Roadmap.findOne({ slug: slug.toLowerCase(), isPublished: true });
    }
    /**
     * Fetch single roadmap details by ID.
     */
    static async getRoadmapById(id) {
        return Roadmap.findById(id);
    }
    /**
     * Seed Mock Roadmaps database on connection if empty.
     */
    static async seedMockRoadmaps() {
        const count = await Roadmap.countDocuments();
        if (count > 0) {
            console.log("Roadmaps collection already populated with", count, "items. Skipping seed.");
            return;
        }
        console.log("Seeding mock career roadmaps database...");
        const seedData = [
            {
                title: "Frontend Developer Roadmap",
                slug: "rm-1",
                shortDescription: "Master HTML, CSS, JavaScript, React, Tailwind CSS, and state libraries to build interactive client web apps.",
                fullDescription: "Become a proficient frontend developer. This pathway guides you from absolute code layout structures up through configuring component architectures inside modern React systems. You will learn to write semantic HTML markup, manage complex typography variables, style layouts using CSS Grid and Flexbox, write asynchronous JS API requests, and optimize client-side bundle performance.",
                coverImage: "/careers/full-stack-developer.png",
                category: "Frontend",
                difficulty: "Beginner",
                duration: "6 Months",
                rating: 4.8,
                totalRatings: 1240,
                skills: ["HTML5 & DOM API", "CSS Grid & Flexbox", "ES6+ JavaScript & Promises", "React Functional Components", "Tailwind CSS Styling", "State Management (Zustand)", "Git & Git workflows", "Webpack & Vite bundlers"],
                learningOutcomes: [
                    "Build responsive, pixel-perfect websites conforming to Figma visual layouts.",
                    "Manage application states dynamically with Redux Toolkit or Zustand.",
                    "Configure, deploy, and inspect client-side bundles on hosting platforms.",
                    "Audit and optimize site performance score indicators to hit 95+ Lighthouse metrics."
                ],
                isFeatured: true,
                isPublished: true,
            },
            {
                title: "Backend API Engineer",
                slug: "rm-2",
                shortDescription: "Learn Node.js, Express, databases (SQL & NoSQL), API integrations, authorization systems, and server configurations.",
                fullDescription: "Construct resilient backends. This curriculum is designed to explore the server architectures that power modern web platforms. You will learn how to initialize server ports, map REST API routes, secure endpoints with JWT validations, construct database models, write queries, and dockerize systems to deploy onto cloud nodes.",
                coverImage: "/careers/data-scientist.png",
                category: "Backend",
                difficulty: "Intermediate",
                duration: "7 Months",
                rating: 4.9,
                totalRatings: 940,
                skills: ["Node.js & Express API", "SQL Databases (PostgreSQL)", "NoSQL Databases (MongoDB)", "RESTful API standards", "GraphQL schemas", "Authentication (JWT & cookies)", "Docker container engines", "Jest integration testing"],
                learningOutcomes: [
                    "Create scalable API backend microservices supporting high concurrency.",
                    "Implement secure, stateless authentication tokens and cookie schemes.",
                    "Design relational database schemas with complex joins and indexes.",
                    "Write integration test suites covering API router path scenarios."
                ],
                isFeatured: true,
                isPublished: true,
            },
            {
                title: "Data Science & AI Analyst",
                slug: "rm-3",
                shortDescription: "Explore datasets, construct statistics pipelines, clean data, and deploy deep learning models using Python and TensorFlow.",
                fullDescription: "Deep dive into data mining. You will study statistical mathematical paradigms, program complex pipelines, train neural networks, and extract patterns to drive corporate intelligence decisions.",
                coverImage: "/careers/data-scientist.png",
                category: "Data Science",
                difficulty: "Advanced",
                duration: "8 Months",
                rating: 4.9,
                totalRatings: 780,
                skills: ["Python (Pandas, NumPy)", "Data Cleaning & Wrangling", "Statistical calculations", "Scikit-Learn classifiers", "TensorFlow & PyTorch models", "SQL queries & aggregations", "Data Visualization", "Jupyter Labs workflows"],
                learningOutcomes: [
                    "Construct data wrangling scripts to clean and parse messy raw logs.",
                    "Train predictive machine learning classifiers to forecast metrics.",
                    "Evaluate model performance metrics (precision, recall, ROC-AUC).",
                    "Deploy model files behind API endpoints for client integrations."
                ],
                isFeatured: true,
                isPublished: true,
            },
            {
                title: "UI/UX Product Designer",
                slug: "rm-4",
                shortDescription: "Learn graphic fundamentals, conduct research user interviews, wireframe paths, and create design systems inside Figma.",
                fullDescription: "Design intuitive interfaces. This pathway guides you through graphic layouts, user interface typography, component layouts, wireframing prototypes, and performing usability testing with real users.",
                coverImage: "/careers/ui-ux-designer.png",
                category: "Design",
                difficulty: "Beginner",
                duration: "4 Months",
                rating: 4.7,
                totalRatings: 1120,
                skills: ["UX Research & personas", "Wireframing & Prototyping", "Design System guidelines", "Typography & color schemes", "Figma auto layouts", "Usability testing rules", "Visual hierarchy mapping", "Developer handoff pipelines"],
                learningOutcomes: [
                    "Conduct user research interviews and compile persona profiles.",
                    "Construct high-fidelity interactive visual prototypes in Figma.",
                    "Maintain scalable design systems using Figma variables and auto layouts.",
                    "Design visual guidelines for landing screens, checkout processes, and dashboards."
                ],
                isFeatured: true,
                isPublished: true,
            },
            {
                title: "Cloud & DevOps Architect",
                slug: "rm-5",
                shortDescription: "Implement continuous integrations pipelines, dockerize systems, and manage Kubernetes clusters on AWS cloud environments.",
                fullDescription: "Automate system operations. Learn to configure auto-scaling cloud compute clusters, trace performance logs, manage networks, and secure server accesses using modern automation script languages.",
                coverImage: "/careers/cloud-architect.png",
                category: "DevOps",
                difficulty: "Advanced",
                duration: "7 Months",
                rating: 4.9,
                totalRatings: 650,
                skills: ["AWS Cloud infrastructures", "Docker containerization", "Kubernetes cluster setups", "CI/CD (GitHub Actions)", "Terraform IaC scripts", "Linux server admin", "Prometheus & Grafana logging", "VPC & route routing configurations"],
                learningOutcomes: [
                    "Provision cloud resources dynamically using Terraform state files.",
                    "Configure automated pipelines to build, test, and host applications.",
                    "Deploy highly available, auto-scaling Kubernetes cluster structures.",
                    "Diagnose cluster bottlenecks using Grafana metrics dashboards."
                ],
                isFeatured: true,
                isPublished: true,
            },
            {
                title: "Full-Stack Software Engineer",
                slug: "rm-6",
                shortDescription: "Combine React frontend with Node.js backend. Learn to deploy complete full-stack apps.",
                fullDescription: "Master both client and server design. Connect frontend components with databases, secure routes, and deploy fully functional web solutions.",
                coverImage: "/careers/full-stack-developer.png",
                category: "Full Stack",
                difficulty: "Intermediate",
                duration: "9 Months",
                rating: 4.8,
                totalRatings: 830,
                skills: ["React & Next.js", "Express & Node.js", "MongoDB & Mongoose", "Relational database joins", "State management", "REST API integration", "Deployment pipelines", "JWT Authentication"],
                learningOutcomes: [
                    "Connect modern interactive frontends with fast API endpoints.",
                    "Deploy client-server bundles onto hosting platforms.",
                    "Integrate relational or document databases into user workflows.",
                    "Secure route panels from unauthenticated users."
                ],
                isFeatured: false,
                isPublished: true,
            },
            {
                title: "Mobile App Developer",
                slug: "rm-7",
                shortDescription: "Build high-performance iOS and Android mobile apps using React Native and Expo.",
                fullDescription: "Learn to design mobile interfaces, interact with device hardware APIs (camera, geolocation), manage offline caching storage, and compile packages for app stores.",
                coverImage: "/careers/ui-ux-designer.png",
                category: "Mobile",
                difficulty: "Intermediate",
                duration: "5 Months",
                rating: 4.6,
                totalRatings: 540,
                skills: ["React Native & Expo", "Mobile layouts styling", "Device storage (AsyncStorage)", "Geolocation & Camera access", "Navigation routers", "State management", "App store submission profiles", "Push notifications"],
                learningOutcomes: [
                    "Build cross-platform mobile apps for iOS and Android.",
                    "Integrate geolocation services and camera modules inside user flows.",
                    "Configure offline data synchronization using device local storage.",
                    "Publish beta builds using Expo Application Services."
                ],
                isFeatured: false,
                isPublished: true,
            },
            {
                title: "AI & Machine Learning Engineer",
                slug: "rm-8",
                shortDescription: "Master neural networks, computer vision, natural language processing, and generative AI integrations.",
                fullDescription: "Deep dive into artificial intelligence. Develop image recognition pipelines, fine-tune LLMs, design reinforcement models, and configure GPU-accelerated computing nodes.",
                coverImage: "/careers/data-scientist.png",
                category: "AI",
                difficulty: "Advanced",
                duration: "10 Months",
                rating: 4.9,
                totalRatings: 490,
                skills: ["Deep Learning models", "Computer Vision (OpenCV)", "Natural Language Processing", "Generative AI APIs", "Model fine-tuning pipelines", "Python & PyTorch", "GPU node configurations", "Hyperparameter tuning"],
                learningOutcomes: [
                    "Train convolutional neural networks to classify visual objects.",
                    "Fine-tune pre-trained models on localized corporate text formats.",
                    "Deploy server APIs returning AI outputs under 300ms latency.",
                    "Monitor GPU thermal load schedules during batch trainings."
                ],
                isFeatured: false,
                isPublished: true,
            },
            {
                title: "Cybersecurity Analyst",
                slug: "rm-9",
                shortDescription: "Audit network architectures, configure firewalls, identify vulnerabilities, and monitor server logs.",
                fullDescription: "Become an security investigator. Study cryptography principles, penetration testing methodologies, security information logs monitoring, and response procedures to protect assets.",
                coverImage: "/careers/cloud-architect.png",
                category: "Cybersecurity",
                difficulty: "Intermediate",
                duration: "8 Months",
                rating: 4.7,
                totalRatings: 320,
                skills: ["Penetration Testing methods", "Network security log auditing", "Firewall configurations", "Cryptographic standards", "Incident response maps", "Linux security rules", "OWASP Web Vulnerabilities", "Wireshark traffic filters"],
                learningOutcomes: [
                    "Audit network packages to diagnose potential breach vectors.",
                    "Identify and patch top OWASP web application vulnerability gaps.",
                    "Setup real-time server security notifications and alerts.",
                    "Create organizational disaster recovery response action playbooks."
                ],
                isFeatured: false,
                isPublished: true,
            },
            {
                title: "Technical Product Manager",
                slug: "rm-10",
                shortDescription: "Learn software architectures, map user stories, coordinate agile sprints, and read analytics dashboards.",
                fullDescription: "Coordinate technology teams. Bridge commercial strategy with code execution, manage engineering timelines, track product telemetry, and communicate technical updates to business boards.",
                coverImage: "/careers/ui-ux-designer.png",
                category: "Management",
                difficulty: "Beginner",
                duration: "5 Months",
                rating: 4.8,
                totalRatings: 610,
                skills: ["Product Telemetry scripts", "Agile & Kanban sprints", "Technical requirement mapping", "User story writing", "Data analytics dashboards", "API integration concepts", "System architecture diagrams", "Roadmap planning software"],
                learningOutcomes: [
                    "Formulate standard, developers-focused technical feature specs.",
                    "Measure and report product KPI improvements using Google Analytics.",
                    "Orchestrate development sprints using Jira project boards.",
                    "Draft clear, non-technical feature releases for client channels."
                ],
                isFeatured: false,
                isPublished: true,
            },
            {
                title: "Database Architect & Administrator",
                slug: "rm-11",
                shortDescription: "Design complex database schemas, optimize queries, manage database backups, and partition tables.",
                fullDescription: "Become a database administrator. Write complex SQL statements, configure replication logs, set up automated backup processes, and troubleshoot write/read lag bottlenecks.",
                coverImage: "/careers/data-scientist.png",
                category: "Databases",
                difficulty: "Advanced",
                duration: "6 Months",
                rating: 4.7,
                totalRatings: 280,
                skills: ["SQL optimization plans", "Database replication setup", "Partitioning & Sharding models", "Backup & Recovery scripts", "NoSQL db patterns", "Index design plans", "Access privileges control", "Database logging analytics"],
                learningOutcomes: [
                    "Write optimized SQL queries reducing latency by up to 50%.",
                    "Setup real-time data replication clusters ensuring zero data loss.",
                    "Write cron scripts to trigger and encrypt nightly system backups.",
                    "Diagnose slow query transactions using EXPLAIN ANALYZE logs."
                ],
                isFeatured: false,
                isPublished: true,
            },
            {
                title: "Technical Solutions Architect",
                slug: "rm-12",
                shortDescription: "Design enterprise cloud scaling layouts, map highly-available microservice divisions, and audit security compliance scopes.",
                fullDescription: "Model enterprise systems. Learn how to map high-level visual server layouts, coordinate migration pipelines, audit security parameters, and plan load-balancing architectures to host high-concurrency systems.",
                coverImage: "/careers/cloud-architect.png",
                category: "Solutions Architecture",
                difficulty: "Advanced",
                duration: "6 Months",
                rating: 4.8,
                totalRatings: 420,
                skills: ["System Architecture Design", "Microservices Design", "Cloud Infrastructure (AWS/GCP)", "Enterprise Database Sharding", "Network Latency Optimizations", "High-Availability Deployments", "Regulatory Compliance (GDPR/HIPAA)", "Load Balancing & Caching Strategies"],
                learningOutcomes: [
                    "Draft visual blueprints representing scalable microservice architectures.",
                    "Design multi-region cloud cluster maps to guarantee 99.99% uptime.",
                    "Implement relational database sharding configurations to handle high volumes.",
                    "Optimize data caching schemes using Redis to lower latency metrics."
                ],
                isFeatured: false,
                isPublished: true,
            }
        ];
        await Roadmap.insertMany(seedData);
        console.log("Successfully seeded 12 mock career roadmaps into MongoDB!");
    }
    /**
     * Fetch only featured career roadmaps. Limit to 4 items, sorted by rating descending.
     * Returns lightweight card data only.
     */
    static async getFeaturedRoadmaps() {
        return Roadmap.find({ isPublished: true, isFeatured: true })
            .sort({ rating: -1, totalRatings: -1 })
            .limit(4)
            .select(CARD_FIELDS)
            .lean();
    }
    /**
     * Fetch top 8 highest-rated roadmaps, sorted by rating descending.
     * Returns lightweight card data only.
     */
    static async getPopularRoadmaps() {
        return Roadmap.find({ isPublished: true })
            .sort({ rating: -1, totalRatings: -1 })
            .limit(8)
            .select(CARD_FIELDS)
            .lean();
    }
    /**
     * Fetch 8 most recently created roadmaps, sorted by createdAt descending.
     * Returns lightweight card data only.
     */
    static async getLatestRoadmaps() {
        return Roadmap.find({ isPublished: true })
            .sort({ createdAt: -1 })
            .limit(8)
            .select(CARD_FIELDS)
            .lean();
    }
    /**
     * Retrieve unique, alphabetically sorted categories of published roadmaps from MongoDB.
     */
    static async getCategories() {
        const categories = await Roadmap.distinct("category", { isPublished: true });
        return categories.sort((a, b) => a.localeCompare(b));
    }
    /**
     * Create and register a new career roadmap in MongoDB.
     * Generates a unique, URL-friendly slug based on the title.
     */
    static async createRoadmap(input) {
        const { title, shortDescription, fullDescription, coverImage, category, difficulty, duration, rating } = input;
        // 1. Generate slug base
        const baseSlug = title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
        // 2. Ensure slug uniqueness in database
        let uniqueSlug = baseSlug;
        let counter = 1;
        while (await Roadmap.findOne({ slug: uniqueSlug })) {
            uniqueSlug = `${baseSlug}-${counter}`;
            counter++;
        }
        // 3. Save roadmap to database
        const newRoadmap = await Roadmap.create({
            title,
            slug: uniqueSlug,
            shortDescription,
            fullDescription,
            coverImage,
            category,
            difficulty,
            duration,
            rating: rating || 4.5,
            isFeatured: false,
            isPublished: true,
        });
        return newRoadmap;
    }
    /**
     * Delete a career roadmap by ID from MongoDB.
     */
    static async deleteRoadmap(id) {
        return Roadmap.findByIdAndDelete(id);
    }
}
