import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")

// Helper function to read JSON file
function readJsonFile(filename) {
  const filePath = path.join(DATA_DIR, filename)
  const data = fs.readFileSync(filePath, "utf8")
  return JSON.parse(data)
}

// Helper function to write JSON file
function writeJsonFile(filename, data) {
  const filePath = path.join(DATA_DIR, filename)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

export async function PUT(request, { params }) {
  try {
    const { userId } = params
    const userIdNum = Number.parseInt(userId)

    if (!userIdNum) {
      return Response.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const body = await request.json()
    const {
      name,
      email,
      passwordHash,
      role,
      regionId,
      salesTypeId,
      annualTarget,
      salesCounselorTarget,
      policySoldTarget,
      agencyCoopTarget,
    } = body

    const users = readJsonFile("users.json")
    const salesTargets = readJsonFile("salesTargets.json")
    const salesTypes = readJsonFile("salesTypes.json")

    const userIndex = users.findIndex((u) => u.userId === userIdNum)
    if (userIndex === -1) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    const emailExists = users.some((u) => u.email === email && u.userId !== userIdNum)
    if (emailExists) {
      return Response.json({ error: "Email already exists" }, { status: 400 })
    }

    if (salesTypeId && !salesTypes.some((st) => st.salesTypeId === salesTypeId)) {
      return Response.json({ error: "Invalid sales type ID" }, { status: 400 })
    }

    const currentTime = new Date().toISOString()
    users[userIndex] = {
      ...users[userIndex],
      name,
      email,
      passwordHash,
      role,
      regionId: regionId || null,
      salesTypeId: salesTypeId || null,
      updatedAt: currentTime,
    }

    if (role === "RegionalUser") {
      // Find existing sales target
      const targetIndex = salesTargets.findIndex((st) => st.salesRepId === userIdNum)

      if (targetIndex !== -1) {
        salesTargets[targetIndex] = {
          ...salesTargets[targetIndex],
          premiumTarget: annualTarget,
          salesCounselorTarget: salesCounselorTarget || 0,
          policySoldTarget: policySoldTarget || 0,
          agencyCoopTarget: agencyCoopTarget || 0,
          updatedAt: currentTime,
        }
      } else {
        const maxTargetId = Math.max(...salesTargets.map((st) => st.targetId), 200)
        const newTarget = {
          targetId: maxTargetId + 1,
          salesRepId: userIdNum,
          year: new Date().getFullYear(),
          premiumTarget: annualTarget,
          salesCounselorTarget: salesCounselorTarget || 0,
          policySoldTarget: policySoldTarget || 0,
          agencyCoopTarget: agencyCoopTarget || 0,
          createdBy: 1, // Assuming admin user ID is 1
          createdAt: currentTime,
          updatedAt: null,
        }
        salesTargets.push(newTarget)
      }
    } else {
      // Remove sales target if role is not RegionalUser
      const targetIndex = salesTargets.findIndex((st) => st.salesRepId === userIdNum)
      if (targetIndex !== -1) {
        salesTargets.splice(targetIndex, 1)
      }
    }

    writeJsonFile("users.json", users)
    writeJsonFile("salesTargets.json", salesTargets)

    return Response.json({
      message: "User updated successfully",
      user: users[userIndex],
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
