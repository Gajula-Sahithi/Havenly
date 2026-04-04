const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  try {
    const apiDir = fs.readdirSync(__dirname);
    const rootDir = fs.readdirSync(path.join(__dirname, '..'));
    let backendDir = [];
    try {
      backendDir = fs.readdirSync(path.join(__dirname, '../backend'));
    } catch (e) {
      backendDir = ['NOT_FOUND'];
    }
    
    res.status(200).json({ 
      success: true, 
      dirname: __dirname,
      apiDir,
      rootDir,
      backendDir,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
};
