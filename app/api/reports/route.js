import { NextResponse } from "next/server"
import path from "path"
import { promises as fs } from "fs"

// Simple JSON store implementation for Next.js
class JsonStore {
  constructor(dataDir) {
    this.dataDir = dataDir
    this.locks = {}
  }

  filePath(name) {
    return path.join(process.cwd(), this.dataDir, name + ".json")
  }

  async read(name) {
    const fp = this.filePath(name)
    try {
      const raw = await fs.readFile(fp, "utf8")
      return JSON.parse(raw || "null")
    } catch (error) {
      if (error.code === "ENOENT") return null
      throw error
    }
  }

  async write(name, data) {
    const fp = this.filePath(name)
    const tmp = fp + ".tmp"
    const serialized = JSON.stringify(data, null, 2)

    this.locks[fp] = (this.locks[fp] || Promise.resolve())
      .then(() => {
        return fs.writeFile(tmp, serialized, "utf8").then(() => {
          return fs.rename(tmp, fp)
        })
      })
      .catch((err) => {
        return fs
          .unlink(tmp)
          .catch(() => {})
          .then(() => {
            throw err
          })
      })
    return this.locks[fp]
  }

  async pushAndWrite(name, transformFn) {
    const fp = this.filePath(name)
    this.locks[fp] = (this.locks[fp] || Promise.resolve())
      .then(() => {
        return fs.readFile(fp, "utf8").then((raw) => {
          let data = []
          try {
            data = JSON.parse(raw)
          } catch (error) {
            if (error.code !== "ENOENT") throw error
          }

          return transformFn(data).then((newData) => {
            const tmp = fp + ".tmp"
            return fs.writeFile(tmp, JSON.stringify(newData, null, 2), "utf8").then(() => {
              return fs.rename(tmp, fp).then(() => {
                return newData
              })
            })
          })
        })
      })
      .catch((err) => {
        const tmp = fp + ".tmp" // Declare tmp variable here
        return fs
          .unlink(tmp)
          .catch(() => {})
          .then(() => {
            throw err
          })
      })
    return this.locks[fp]
  }
}

const store = new JsonStore("data")

export async function GET() {
  try {
    const reports = (await store.read("salesReports")) || []
    return NextResponse.json(reports)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const payload = await request.json()

    // Validate required fields
    if (!payload.salesRepId || !payload.reportDate) {
      return NextResponse.json({ error: "salesRepId and reportDate required" }, { status: 400 })
    }

    // Verify salesRep exists
    const reps = (await store.read("salesRepresentatives")) || []
    const rep = reps.find((r) => r.salesRepId === payload.salesRepId)
    if (!rep) {
      return NextResponse.json({ error: "salesRep not found" }, { status: 400 })
    }

    // Create entry atomically
    const newEntry = await store.pushAndWrite("salesReports", async (reports) => {
      reports = reports || []

      // Prevent duplicate
      if (reports.find((r) => r.salesRepId === payload.salesRepId && r.reportDate === payload.reportDate)) {
        throw new Error("Report already exists for this date")
      }

      const maxId = reports.reduce((m, r) => Math.max(m, r.reportId || 0), 0)
      const id = maxId + 1

      const obj = {
        reportId: id,
        salesRepId: payload.salesRepId,
        reportDate: payload.reportDate,
        premiumActual: Number(payload.premiumActual || 0),
        salesCounselorActual: Number(payload.salesCounselorActual || 0),
        policySoldActual: Number(payload.policySoldActual || 0),
        agencyCoopActual: Number(payload.agencyCoopActual || 0),
        createdBy: 1, // TODO: get from auth
        createdAt: new Date().toISOString(),
        updatedAt: null,
      }

      reports.push(obj)
      return reports
    })

    return NextResponse.json(newEntry[newEntry.length - 1], { status: 201 })
  } catch (error) {
    if (error.message === "Report already exists for this date") {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 })
  }
}
