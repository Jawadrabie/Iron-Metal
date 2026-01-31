const path = require("path")
const { getDefaultConfig } = require("expo/metro-config")

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, "..")
const config = getDefaultConfig(projectRoot)

config.watchFolders = [path.join(workspaceRoot, "public")]

config.resolver.nodeModulesPaths = [
  path.join(projectRoot, "node_modules"),
  path.join(workspaceRoot, "node_modules"),
  path.join(projectRoot, "node_modules", "react-native", "node_modules"),
]
config.resolver.disableHierarchicalLookup = true

module.exports = config
