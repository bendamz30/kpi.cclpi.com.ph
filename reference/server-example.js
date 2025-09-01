// server.js
import express from "express"
import fs from "fs"
import path from "path"

const app = express()
app.use(express.json())

// File paths
const dataDir = path.join(process.cwd(), "data")
const usersFile = path.join(dataDir, "users.json")
const salesTargetsFile = path.join(dataDir, "salesTargets.json")

// Utility: read JSON file
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"))
}

// Utility: write JSON file
function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8")
}

// Add User API
app.post("/api/users", (req, res) => {
  try {
    const { name, email, passwordHash, role, regionId, annualTarget } = req.body

    if (!name || !email || !passwordHash || !role) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Load users
    const users = readJson(usersFile)

    // Check duplicate email
    if (users.find((u) => u.email === email)) {
      return res.status(400).json({ error: "Email already exists" })
    }

    // Auto-increment userId
    const newUserId = users.length > 0 ? Math.max(...users.map((u) => u.userId)) + 1 : 1

    // Create user object
    const newUser = {
      userId: newUserId,
      name,
      email,
      passwordHash,
      role,
      regionId: role === "RegionalUser" ? regionId || null : null,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    }

    // Push to users.json
    users.push(newUser)
    writeJson(usersFile, users)

    // If RegionalUser, also add a target
    let newTarget = null
    if (role === "RegionalUser") {
      if (!annualTarget) {
        return res.status(400).json({ error: "annualTarget is required for RegionalUser" })
      }

      const salesTargets = readJson(salesTargetsFile)
      const newTargetId = salesTargets.length > 0 ? Math.max(...salesTargets.map((t) => t.targetId)) + 1 : 201

      newTarget = {
        targetId: newTargetId,
        salesRepId: newUserId,
        year: new Date().getFullYear(),
        premiumTarget: annualTarget,
        salesCounselorTarget: 0,
        policySoldTarget: 0,
        agencyCoopTarget: 0,
        createdBy: 1, // Default system admin
        createdAt: new Date().toISOString(),
        updatedAt: null,
      }

      salesTargets.push(newTarget)
      writeJson(salesTargetsFile, salesTargets)
    }

    return res.status(201).json({ user: newUser, salesTarget: newTarget })
  } catch (err) {
    console.error("Error adding user:", err)
    return res.status(500).json({ error: "Internal server error" })
  }
})

// Start server
const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
