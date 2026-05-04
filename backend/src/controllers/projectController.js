import Project from "../models/Project.js";
import User from "../models/User.js";

const GROQ_API_URL = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/responses";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const extractGroqResponseText = (json) => {
  if (!json) return null;
  if (typeof json.output_text === 'string') return json.output_text;
  if (typeof json.text === 'string') return json.text;
  const outputs = json.output || json.outputs || [];
  const items = Array.isArray(outputs) ? outputs : [outputs];
  for (const item of items) {
    if (typeof item === 'string') return item;
    if (item?.content) {
      const content = Array.isArray(item.content) ? item.content : [item.content];
      for (const piece of content) {
        if (typeof piece === 'string') return piece;
        if (piece?.text) return piece.text;
        if (typeof piece?.content === 'string') return piece.content;
      }
    }
  }
  return null;
};

// Draft a polished project description using Groq Llama
export const draftProjectDescription = async (req, res) => {
  try {
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

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        input: `${prompt}\n\nInput: ${rawInput}`,
        temperature: 0.2,
        max_output_tokens: 400
      })
    });

    const result = await response.json();
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
        const professorUid = req.user.firebaseUid;

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
export const getAllProjects = async(req,res) => {
    try {
        const projects = await Project.find().sort({createdAt: -1}).lean();
        const professorUids = projects.map(p => p.professorUid);
        const professors = await User.find({ firebaseUid: { $in: professorUids } }).select('firebaseUid firstName lastName');

        const professorMap = {};
        professors.forEach(prof => {
            professorMap[prof.firebaseUid] = `${prof.firstName} ${prof.lastName}`;
        });

        const projectsWithNames = projects.map(p => ({
            ...p,
            professorName: professorMap[p.professorUid] || "Professor"
        }));

        res.status(200).json(projectsWithNames);
    } catch(error) {
        res.status(500).json({message: "Server error"});
    }
}

// Get projects for a professor
export const getProjects = async(req,res) => {
    try {
        const professorUid = req.user.firebaseUid;
        const projects = await Project.find({professorUid}).sort({createdAt: -1});
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};

// Get projects for a student
export const getStudentProjects = async(req,res) => {
    try {
        const studentUid = req.user.firebaseUid;
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

        // Fetch the professor's name using their firebaseUid
        const professor = await User.findOne({ firebaseUid: project.professorUid });
        
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