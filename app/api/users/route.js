import fs from "fs"
import path from "path"

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

// GET - Fetch all users
export async function GET() {
  try {
    const users = readJson(usersFile)
    return Response.json(users)
  } catch (err) {
    console.error("Error reading users:", err)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Add new user
export async function POST(request) {
  try {
    const {
      name,
      email,
      passwordHash,
      role,
      regionId,
      salesTypeId, // Added salesTypeId parameter
      annualTarget,
      salesCounselorTarget,
      policySoldTarget,
      agencyCoopTarget,
    } = await request.json()

    if (!name || !email || !passwordHash || !role) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Load users
    const users = readJson(usersFile)

    // Check duplicate email
    if (users.find((u) => u.email === email)) {
      return Response.json({ error: "Email already exists" }, { status: 400 })
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
      salesTypeId: role === "RegionalUser" ? salesTypeId || null : null, // Added salesTypeId to user object
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
        return Response.json({ error: "annualTarget is required for RegionalUser" }, { status: 400 })
      }

      const salesTargets = readJson(salesTargetsFile)
      const newTargetId = salesTargets.length > 0 ? Math.max(...salesTargets.map((t) => t.targetId)) + 1 : 201

      newTarget = {
        targetId: newTargetId,
        salesRepId: newUserId,
        year: new Date().getFullYear(),
        premiumTarget: annualTarget,
        salesCounselorTarget: salesCounselorTarget || 0,
        policySoldTarget: policySoldTarget || 0,
        agencyCoopTarget: agencyCoopTarget || 0,
        createdBy: 1, // Default system admin
        createdAt: new Date().toISOString(),
        updatedAt: null,
      }

      salesTargets.push(newTarget)
      writeJson(salesTargetsFile, salesTargets)
    }

    return Response.json({ user: newUser, salesTarget: newTarget }, { status: 201 })
  } catch (err) {
    console.error("Error adding user:", err)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
