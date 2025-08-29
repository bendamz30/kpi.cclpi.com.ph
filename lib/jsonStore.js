const fs = require("fs")
const path = require("path")

class JsonStore {
  constructor(dataDir) {
    this.dataDir = dataDir
    this.locks = {} // per-file promise chain
  }

  filePath(name) {
    return path.join(this.dataDir, name + ".json")
  }

  // Reads JSON file; returns array/object
  async read(name) {
    const fp = this.filePath(name)
    if (!fs.existsSync(fp)) return null
    const raw = await fs.promises.readFile(fp, "utf8")
    return JSON.parse(raw || "null")
  }

  // Writes data atomically: write tmp then rename
  async write(name, data) {
    const fp = this.filePath(name)
    const tmp = fp + ".tmp"
    const serialized = JSON.stringify(data, null, 2)
    // queue writes per file to avoid concurrent clashes
    this.locks[fp] = (this.locks[fp] || Promise.resolve())
      .then(async () => {
        await fs.promises.writeFile(tmp, serialized, "utf8")
        await fs.promises.rename(tmp, fp)
      })
      .catch((err) => {
        // ensure tmp cleaned if error
        try {
          if (fs.existsSync(tmp)) fs.unlinkSync(tmp)
        } catch (e) {}
        throw err
      })
    return this.locks[fp]
  }

  async pushAndWrite(name, transformFn) {
    // convenience to load -> modify -> save with locking
    const fp = this.filePath(name)
    this.locks[fp] = (this.locks[fp] || Promise.resolve()).then(async () => {
      let data = []
      if (fs.existsSync(fp)) {
        data = JSON.parse(await fs.promises.readFile(fp, "utf8"))
      }
      const newData = await transformFn(data)
      const tmp = fp + ".tmp"
      await fs.promises.writeFile(tmp, JSON.stringify(newData, null, 2), "utf8")
      await fs.promises.rename(tmp, fp)
      return newData
    })
    return this.locks[fp]
  }
}

module.exports = JsonStore
