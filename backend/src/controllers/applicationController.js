import Project from "../models/Project.js";
import User from "../models/User.js";
import Application from "../models/Application.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const extractGroqResponseText = (json) => {
  return json?.choices?.[0]?.message?.content || null;
};

// Draft a polished project description using Groq Llama
export const draftProjectDescription = async (req, res) => {
  try {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const { rawInput } = req.body;
    if (!rawInput || !rawInput.trim()) {
      return res.status(400).json({ message: "Raw input is required to generate a draft." });
    }

    if (!GROQ_API_KEY) {
      return res.status(500).json({ message: "Groq API key is not configured on the server." });
    }

    const domainList = [
      "AI",
      "ML",
      "DL",
      "Computer Vision",
      "Cloud Computing",
      "Data Science",
      "Web Development",
      "Mobile App",
      "Robotics",
      "Cybersecurity",
      "Embedded Systems",
      "NLP",
      "Computer Graphics",
      "Other"
    ];

    const prompt = `You are an academic project drafting assistant for university faculty. Expand the professor's rough notes into a polished, professional project description suitable for a university course project listing. Use a clear academic tone, concise structure, and keep the text focused on the proposed project goals and outcomes. Infer relevant domains only from this list: ${domainList.join(", ")}. Return JSON only with exactly two fields: description and domains. description should be a clean paragraph. domains should be an array of the inferred domain names from the provided list. Do not include any additional text or explanation.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${GROQ_API_KEY}`
  },
  body: JSON.stringify({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: rawInput }
    ],
    temperature: 0.2,
    max_tokens: 400,
    response_format: { type: "json_object" }
  })
});

    const result = await response.json();

    console.log("Groq status:", response.status);
    console.log("Groq result:", JSON.stringify(result, null, 2));

    if (!response.ok) {
      const message = result?.error?.message || JSON.stringify(result);
      return res.status(500).json({ message: `AI draft request failed: ${message}` });
    }

    const text = extractGroqResponseText(result);
    if (!text) {
      return res.status(500).json({ message: "AI service returned an invalid response." });
    }

    let parsed;
    try {
      parsed = JSON.parse(text.trim());
    } catch (parseErr) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(500).json({ message: "AI response could not be parsed as JSON." });
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    const { description, domains } = parsed;
    if (!description || !Array.isArray(domains)) {
      return res.status(500).json({ message: "AI returned an unexpected draft format." });
    }

    return res.status(200).json({
      description: description.trim(),
      domains: domains.map((domain) => domain?.trim()).filter(Boolean)
    });
  } catch (error) {
    console.error("Draft AI error:", error);
    return res.status(500).json({ message: "Server error while drafting the project description." });
  }
};

// Add a new project
export const addProject = async(req,res) => {
    try {
        const {title, domain, description, students, status} = req.body;
        const professorUid = req.user._id.toString();

        if (!title || !description || !domain) {
            return res.status(400).json({message: "Title, Domain and Description are required"});
        }
        const domainArray = Array.isArray(domain) ? domain : [domain];

        const newProject = await Project.create({
            title, domain: domainArray, description, students: students || 1, status: status || "Ongoing", professorUid, enrolledStudents: []
        });
        res.status(201).json(newProject);
    } catch(error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// Get all projects
// Get all projects with Pagination and Filtering
export const getAllProjects = async (req, res) => {
    try {
        // 1. Get query parameters from the frontend URL (defaults to page 1, 9 items)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9; 
        const search = req.query.search || '';
        const domain = req.query.domain || '';

        // 2. Build the MongoDB Query Object
        const query = {};

        // If they selected a specific domain, filter by it
        if (domain && domain !== 'All Domains') {
            query.domain = domain;
        }

        // If they typed in a search term
        if (search) {
            // Smart Search: First, check if the search term matches any Professor's name
            const matchedProfessors = await User.find({
                role: "FACULTY",
                $or: [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');

            // Extract just their IDs (as strings, since professorUid is stored as a string)
            const matchedProfessorUids = matchedProfessors.map(prof => prof._id.toString());

            // Now, search for Projects where the Title OR Description OR Professor matches
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { professorUid: { $in: matchedProfessorUids } }
            ];
        }

        // 3. Calculate how many projects to skip based on the page number
        const skip = (page - 1) * limit;

        // 4. Fetch ONLY the specific page of projects from MongoDB
        const projects = await Project.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // 5. Get the total count for the frontend pagination math
        const totalProjects = await Project.countDocuments(query);
        const totalPages = Math.ceil(totalProjects / limit);

        // 6. Map Professor Names to the 9 fetched projects (Same as before)
        const professorUids = projects.map(p => p.professorUid);
        const professors = await User.find({ _id: { $in: professorUids } }).select('firstName lastName');

        const professorMap = {};
        professors.forEach(prof => {
            professorMap[prof._id.toString()] = `${prof.firstName} ${prof.lastName}`;
        });

        const projectsWithNames = projects.map(p => ({
            ...p,
            professorName: professorMap[p.professorUid] || "Unknown Professor"
        }));

        // Send back the projects AND the pagination data
        res.status(200).json({
            projects: projectsWithNames,
            currentPage: page,
            totalPages: totalPages,
            totalProjects: totalProjects
        });

    } catch (error) {
        console.error("Error fetching all projects:", error);
        res.status(500).json({ message: "Server error while fetching projects" });
    }
}

// Get projects for a professor
export const getProjects = async(req,res) => {
    try {
        const professorUid = req.user._id.toString();
        const projects = await Project.find({professorUid}).sort({createdAt: -1});
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};

// Get projects for a student
export const getStudentProjects = async(req,res) => {
    try {
        const studentUid = req.user._id.toString();
        const projects = await Project.find({enrolledStudents: studentUid}).sort({createdAt: -1});
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({message: "Server Error"});
    }
};

export const getProjectById = async (req, res) => {
    try {
        const projectId = req.params.id;
        
        // Find the project by its MongoDB _id
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ message: "Project not found." });
        }

        // Fetch the professor's name using their Mongo _id
        const professor = await User.findById(project.professorUid);
        
        // Convert the Mongoose document to a plain JavaScript object so we can append data
        const projectData = project.toObject();
        
        if (professor) {
            projectData.professorName = `${professor.firstName} ${professor.lastName}`;
        }

        res.status(200).json(projectData);
    } catch (error) {
        console.error("Error fetching project by ID:", error);
        
        // If the ID is completely invalid/malformed, Mongoose throws a CastError
        if (error.name === 'CastError') {
            return res.status(400).json({ message: "Invalid project ID format." });
        }
        
        res.status(500).json({ message: "Server error while fetching project details." });
    }
};

// Update a project (Edit details or change status to Completed)
export const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const professorUid = req.user._id.toString();

        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        // Security: Ensure only the professor who created it can edit it
        if (project.professorUid !== professorUid) {
            return res.status(403).json({ message: "Unauthorized to edit this project" });
        }

        const updatedProject = await Project.findByIdAndUpdate(id, req.body, { returnDocument: 'after' });        res.status(200).json(updatedProject);
    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({ message: "Server error updating project" });
    }
};

// Delete a project securely
export const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const professorUid = req.user._id.toString();

        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        // Security check
        if (project.professorUid !== professorUid) {
            return res.status(403).json({ message: "Unauthorized to delete this project" });
        }

        await Project.findByIdAndDelete(id);
        
        // Delete all applications associated with this project so they don't become ghost records!
        await Application.deleteMany({ projectId: id }); // <-- Now it just uses the model imported at the top

        res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ message: "Server error deleting project" });
    }
};