const child_process = require("child_process")
const fs = require("fs")
const path = require("path")
const getArgList = require("./get-arg-list")

const downloadwebsocat = require("./download-websocat")

module.exports.create = async (config) => {
  const websocatPath = await downloadwebsocat()
  const argList = await getArgList(config)

  console.log(`${websocatPath} ${argList.join(" ")}`)
  const proc = child_process.spawn(websocatPath, argList, {
    shell: true,
  })
  proc.stdout.on("data", (data) => {
    console.log(`websocat stdout: ${data}`)
  })
  proc.stderr.on("data", (data) => {
    console.log(`websocat stderr: ${data}`)
  })

  let isClosed = false
  proc.on("close", (code) => {
    isClosed = true
  })

  await new Promise((resolve, reject) => {
    const processCloseTimeout = setTimeout(() => {
      if (isClosed) {
        reject("websocat didn't start properly")
      } else {
        reject(`websocat didn't respond`)
        proc.kill("SIGINT")
      }
    }, 5000) // 500ms to wait for start

    async function checkIfRunning() {
      setTimeout(() => {
        if (!isClosed) {
          clearTimeout(processCloseTimeout)
          resolve()
        }
      }, 500)
    }
    checkIfRunning()
  })

  return {
    proc,
    stop: async () => {
      proc.kill("SIGINT")
    },
  }
}
